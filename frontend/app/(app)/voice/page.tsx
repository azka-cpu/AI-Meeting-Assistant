

'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/card';
import { voiceApi } from '@/lib/api';
import { Mic, Square, AlertCircle, User, Sparkles } from 'lucide-react';

interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

type RecordingState = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking';

function describeMediaError(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotFoundError':
        return 'No microphone was found on this device.';
      case 'NotAllowedError':
        return 'Microphone access was blocked. Allow it in your browser settings and reload.';
      case 'NotReadableError':
        return 'Your microphone is already in use by another app.';
      default:
        return `Microphone error: ${err.message || err.name}`;
    }
  }
  return 'Could not access your microphone.';
}

export default function VoiceAssistantPage() {
  const [state, setState] = useState<RecordingState>('idle');
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    // Stop any mic stream if the page is left mid-recording
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      window.speechSynthesis?.cancel();
    };
  }, []);

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        handleRecordingComplete();
      };

      recorder.start();
      setState('recording');
    } catch (err) {
      setError(describeMediaError(err));
      setState('idle');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleRecordingComplete = async () => {
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

    if (audioBlob.size < 1000) {
      setState('idle');
      setError('Recording was too short — try holding it a bit longer.');
      return;
    }

    setState('transcribing');
    try {
      const text = await voiceApi.transcribe(audioBlob);

      if (!text.trim()) {
        setState('idle');
        setError("Couldn't hear anything clearly — try again.");
        return;
      }

      const userTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        role: 'user',
        text,
      };
      setConversation((prev) => [...prev, userTurn]);

      setState('thinking');
      const { reply } = await voiceApi.chat(text);

      const assistantTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: reply,
      };
      setConversation((prev) => [...prev, assistantTurn]);

      speak(reply);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setState('idle');
    }
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setState('idle');
      return;
    }
    setState('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleMicClick = () => {
    if (state === 'idle') {
      startRecording();
    } else if (state === 'recording') {
      stopRecording();
    }
  };

  const statusLabel: Record<RecordingState, string> = {
    idle: 'Tap to speak',
    recording: 'Listening... tap to stop',
    transcribing: 'Transcribing...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
  };

  const micDisabled = state === 'transcribing' || state === 'thinking' || state === 'speaking';

  return (
    <>
      <Header title="Voice Assistant" subtitle="Talk to your AI meeting assistant" />

      <main className="p-8 max-w-3xl mx-auto">
        <Card className="text-center py-12 mb-6">
          <button
            onClick={handleMicClick}
            disabled={micDisabled}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4
              transition-all disabled:opacity-50 disabled:cursor-not-allowed
              ${state === 'recording'
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {state === 'recording' ? (
              <Square className="w-8 h-8 text-white" fill="currentColor" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
          <p className="text-slate-600 font-medium">{statusLabel[state]}</p>

          {error && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </Card>

        {conversation.length > 0 && (
          <Card>
            <h2 className="font-bold text-slate-900 mb-4">Conversation</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversation.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex gap-3 ${turn.role === 'user' ? '' : 'flex-row-reverse text-right'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${turn.role === 'user'
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-purple-100 text-purple-600'
                      }`}
                  >
                    {turn.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${turn.role === 'user'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-blue-50 text-slate-700'
                      }`}
                  >
                    {turn.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </Card>
        )}
      </main>
    </>
  );
}
