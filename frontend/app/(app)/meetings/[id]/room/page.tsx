

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authApi, aiApi, meetingApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import {
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    PhoneOff,
    AlertCircle,
    Link2,
    Check,
} from 'lucide-react';

interface CurrentUser {
    id: string;
    name: string;
    email: string;
}

interface RemotePeer {
    peerId: string;
    peerName: string;
    stream: MediaStream | null;
}

interface CaptionEntry {
    speaker: string;
    text: string;
    id: string;
}

const STUN_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000').replace(
    /^http/,
    'ws'
);

function describeMediaError(err: unknown): string {
    if (err instanceof DOMException) {
        switch (err.name) {
            case 'NotFoundError':
            case 'DevicesNotFoundError':
                return 'No camera or microphone was found on this device. Connect one and reload, or check if another app is using it.';
            case 'NotAllowedError':
            case 'PermissionDeniedError':
                return 'Camera/microphone access was blocked. Click the camera icon in your browser\u2019s address bar and allow access, then reload.';
            case 'NotReadableError':
            case 'TrackStartError':
                return 'Your camera or microphone is already in use by another app (e.g. Zoom, Teams). Close it and reload.';
            default:
                return `Media error: ${err.message || err.name}`;
        }
    }
    return 'Could not access camera/microphone.';
}

export default function MeetingRoomPage() {
    const params = useParams();
    const router = useRouter();
    const meetingId = params.id as string;

    const [user, setUser] = useState<CurrentUser | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remotePeers, setRemotePeers] = useState<Record<string, RemotePeer>>({});
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [captions, setCaptions] = useState<CaptionEntry[]>([]);
    const [connectionState, setConnectionState] = useState<
        'connecting' | 'connected' | 'error'
    >('connecting');
    const [mediaError, setMediaError] = useState('');
    const [leaving, setLeaving] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
    const localStreamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const tearingDownRef = useRef(false);

    useEffect(() => {
        authApi
            .me()
            .then((data) => setUser(data as CurrentUser))
            .catch(() => setUser(null));

        // Register as a participant even if this page was reached via a
        // direct link (not the Join button on Meetings/Calendar, which
        // already calls this). Without this, someone who joins by
        // pasting a meeting URL never gets a Participant row, so the
        // meeting would never show up in THEIR meetings list afterward
        // (list_meetings returns creator + participant meetings only).
        // A 409 here just means they're already a participant — ignore it.
        meetingApi.join(meetingId).catch(() => { });
    }, [meetingId]);

    useEffect(() => {
        if (!user) return;

        let cancelled = false;

        async function getMediaWithFallback(): Promise<MediaStream> {
            // Attempt 1: video + audio
            try {
                return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } catch (err) {
                console.warn('video+audio getUserMedia failed, trying audio-only:', err);
            }

            // Attempt 2: audio-only (common case: no camera present)
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                setCamOn(false);
                return stream;
            } catch (err) {
                // Neither worked — surface the real reason to the user
                throw err;
            }
        }

        async function setup() {
            try {
                const stream = await getMediaWithFallback();
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                localStreamRef.current = stream;
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                connectSignaling(stream);
                startTranscriptionLoop(stream);
            } catch (err) {
                console.error('Failed to get camera/mic:', err);
                setMediaError(describeMediaError(err));
                setConnectionState('error');
            }
        }

        setup();

        return () => {
            cancelled = true;
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    function cleanup() {
        tearingDownRef.current = true;
        wsRef.current?.close();
        Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
        peerConnectionsRef.current = {};
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        recorderRef.current?.stop();
    }

    const connectSignaling = useCallback(
        (stream: MediaStream) => {
            const token = auth.getToken();
            if (!token) {
                setConnectionState('error');
                return;
            }

            const ws = new WebSocket(`${WS_URL}/ws/webrtc/${meetingId}?token=${token}`);
            wsRef.current = ws;

            ws.onopen = () => setConnectionState('connected');
            ws.onerror = () => setConnectionState('error');

            ws.onmessage = async (event) => {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case 'room-state': {
                        for (const peer of msg.peers) {
                            await createPeerConnection(peer.peer_id, peer.peer_name, stream, true);
                        }
                        break;
                    }
                    case 'peer-joined': {
                        setRemotePeers((prev) => ({
                            ...prev,
                            [msg.peer_id]: { peerId: msg.peer_id, peerName: msg.peer_name, stream: null },
                        }));
                        break;
                    }
                    case 'peer-left': {
                        peerConnectionsRef.current[msg.peer_id]?.close();
                        delete peerConnectionsRef.current[msg.peer_id];
                        setRemotePeers((prev) => {
                            const next = { ...prev };
                            delete next[msg.peer_id];
                            return next;
                        });
                        break;
                    }
                    case 'offer': {
                        const pc = await createPeerConnection(msg.from, msg.fromName || 'Guest', stream, false);
                        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        wsRef.current?.send(
                            JSON.stringify({ type: 'answer', target: msg.from, sdp: answer })
                        );
                        break;
                    }
                    case 'answer': {
                        const pc = peerConnectionsRef.current[msg.from];
                        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                        break;
                    }
                    case 'ice-candidate': {
                        const pc = peerConnectionsRef.current[msg.from];
                        if (pc && msg.candidate) {
                            try {
                                await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
                            } catch (err) {
                                console.error('Failed to add ICE candidate:', err);
                            }
                        }
                        break;
                    }
                    case 'transcript': {
                        setCaptions((prev) => [
                            ...prev.slice(-4),
                            { id: crypto.randomUUID(), speaker: msg.speaker, text: msg.text },
                        ]);
                        break;
                    }
                }
            };
        },
        [meetingId]
    );

    async function createPeerConnection(
        peerId: string,
        peerName: string,
        stream: MediaStream,
        isInitiator: boolean
    ): Promise<RTCPeerConnection> {
        if (peerConnectionsRef.current[peerId]) {
            return peerConnectionsRef.current[peerId];
        }

        const pc = new RTCPeerConnection(STUN_SERVERS);
        peerConnectionsRef.current[peerId] = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                wsRef.current?.send(
                    JSON.stringify({
                        type: 'ice-candidate',
                        target: peerId,
                        candidate: event.candidate,
                    })
                );
            }
        };

        pc.ontrack = (event) => {
            setRemotePeers((prev) => ({
                ...prev,
                [peerId]: { peerId, peerName, stream: event.streams[0] },
            }));
        };

        if (isInitiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            wsRef.current?.send(
                JSON.stringify({ type: 'offer', target: peerId, sdp: offer })
            );
        }

        return pc;
    }

    function startTranscriptionLoop(stream: MediaStream) {
        if (!user) return;

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            console.warn('No audio track available — live transcription disabled for this session.');
            return;
        }

        const audioOnlyStream = new MediaStream(audioTracks);
        const recorder = new MediaRecorder(audioOnlyStream, { mimeType: 'audio/webm' });
        recorderRef.current = recorder;

        recorder.ondataavailable = async (event) => {
            if (event.data.size < 2000) return;
            if (tearingDownRef.current) {
                // This is the final flush chunk fired by recorder.stop()
                // during leave/unmount — the page is about to navigate away,
                // so this upload would just race the navigation and abort
                // with a confusing "Failed to fetch". Skip it; losing the
                // last ~8s of audio right as someone leaves is an acceptable
                // trade-off.
                return;
            }

            const formData = new FormData();
            formData.append('audio', event.data, 'chunk.webm');
            formData.append('user_id', user.id);
            formData.append('speaker_name', user.name);

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                await fetch(`${API_URL}/api/meetings/${meetingId}/transcribe`, {
                    method: 'POST',
                    headers: { ...auth.getAuthHeader() },
                    body: formData,
                });
            } catch (err) {
                if (!tearingDownRef.current) {
                    console.error('Transcription upload failed:', err);
                }
            }
        };

        recorder.start(8000);
    }

    function copyInviteLink() {
        const url = `${window.location.origin}/meetings/${meetingId}/room`;
        navigator.clipboard.writeText(url).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    }

    function toggleMic() {
        localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
        setMicOn((v) => !v);
    }

    function toggleCam() {
        localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
        setCamOn((v) => !v);
    }

    async function leaveCall() {
        setLeaving(true);
        cleanup();

        try {
            await aiApi.summary(meetingId);
        } catch (err) {
            console.warn('Summary generation skipped or failed:', err);
        }

        router.push(`/meetings/${meetingId}`);
    }

    const peerList = Object.values(remotePeers);

    if (connectionState === 'error' && mediaError) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
                    <h1 className="text-white font-bold text-lg mb-2">Camera/Microphone Error</h1>
                    <p className="text-slate-400 text-sm mb-6">{mediaError}</p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => router.push('/meetings')}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg"
                        >
                            Back to Meetings
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            <div className="px-6 py-3 flex items-center justify-between text-sm text-slate-400">
                <span>Meeting Room</span>
                <div className="flex items-center gap-4">
                    <button
                        onClick={copyInviteLink}
                        className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                    >
                        {linkCopied ? (
                            <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">Link copied!</span>
                            </>
                        ) : (
                            <>
                                <Link2 className="w-4 h-4" />
                                <span>Copy invite link</span>
                            </>
                        )}
                    </button>
                    <span
                        className={
                            connectionState === 'connected'
                                ? 'text-emerald-400'
                                : connectionState === 'error'
                                    ? 'text-red-400'
                                    : 'text-amber-400'
                        }
                    >
                        {connectionState === 'connected'
                            ? '● Connected'
                            : connectionState === 'error'
                                ? '● Connection error'
                                : '● Connecting...'}
                    </span>
                </div>
            </div>

            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
                <VideoTile
                    stream={localStream}
                    label={`${user?.name || 'You'} (You)`}
                    muted
                    videoOff={!camOn}
                />
                {peerList.map((peer) => (
                    <VideoTile
                        key={peer.peerId}
                        stream={peer.stream}
                        label={peer.peerName}
                        muted={false}
                        videoOff={!peer.stream}
                    />
                ))}
            </div>

            {captions.length > 0 && (
                <div className="px-6 pb-4 space-y-1">
                    {captions.map((c) => (
                        <p key={c.id} className="text-sm text-slate-300 bg-slate-800/70 rounded-lg px-3 py-1.5 inline-block">
                            <span className="font-semibold text-blue-400">{c.speaker}:</span> {c.text}
                        </p>
                    ))}
                </div>
            )}

            <div className="px-6 py-5 flex items-center justify-center gap-4 border-t border-slate-800">
                <button
                    onClick={toggleMic}
                    className={`flex items-center gap-2 px-4 py-3 rounded-full transition-colors ${micOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                >
                    {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    <span className="text-sm font-medium hidden sm:inline">
                        {micOn ? 'Mute' : 'Unmute'}
                    </span>
                </button>
                <button
                    onClick={toggleCam}
                    className={`flex items-center gap-2 px-4 py-3 rounded-full transition-colors ${camOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                >
                    {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    <span className="text-sm font-medium hidden sm:inline">
                        {camOn ? 'Stop Video' : 'Start Video'}
                    </span>
                </button>
                <button
                    onClick={leaveCall}
                    disabled={leaving}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-60"
                >
                    <PhoneOff className="w-5 h-5" />
                    <span className="text-sm">Leave Meeting</span>
                </button>
            </div>

            {leaving && (
                <div className="fixed inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-50">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-white font-medium">Generating meeting summary...</p>
                    <p className="text-slate-400 text-sm mt-1">This only takes a few seconds</p>
                </div>
            )}
        </div>
    );
}

function VideoTile({
    stream,
    label,
    muted,
    videoOff,
}: {
    stream: MediaStream | null;
    label: string;
    muted: boolean;
    videoOff: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center min-h-[240px]">
            {videoOff || !stream ? (
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold">
                    {label.charAt(0).toUpperCase()}
                </div>
            ) : (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className="w-full h-full object-cover"
                />
            )}
            <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                {label}
            </span>
        </div>
    );
}