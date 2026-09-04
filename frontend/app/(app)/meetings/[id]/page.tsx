

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { meetingApi, aiApi, MeetingSummaryData } from '@/lib/api';
import {
    ArrowLeft,
    Sparkles,
    CheckSquare,
    MessageSquare,
    Clock,
    Video,
} from 'lucide-react';

interface Meeting {
    id: string;
    title: string;
    description: string;
    created_at: string;
    scheduled_at?: string | null;
    duration_minutes?: number | null;
    status?: string;
}

export default function MeetingDetailsPage() {
    const params = useParams();
    const meetingId = params.id as string;

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [summary, setSummary] = useState<MeetingSummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [genError, setGenError] = useState('');
    const [hasNoTranscript, setHasNoTranscript] = useState(false);

    const loadMeeting = useCallback(async () => {
        try {
            setLoading(true);
            const meetingData = await meetingApi.get(meetingId);
            setMeeting(meetingData as Meeting);
        } catch (error) {
            console.error('Failed to load meeting:', error);
        } finally {
            setLoading(false);
        }
    }, [meetingId]);

    useEffect(() => {
        loadMeeting();
    }, [loadMeeting]);

    // Try to fetch/generate the summary once the meeting itself has
    // loaded. This one call does both jobs — see aiApi.summary() docs.
    useEffect(() => {
        if (!meeting) return;

        aiApi
            .summary(meetingId)
            .then((result) => setSummary(result))
            .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : '';
                if (msg.toLowerCase().includes('no transcript')) {
                    setHasNoTranscript(true);
                }
            });
    }, [meeting, meetingId]);

    const handleGenerate = async () => {
        setGenerating(true);
        setGenError('');
        try {
            const result = await aiApi.summary(meetingId);
            setSummary(result);
            setHasNoTranscript(false);
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Failed to generate summary. Please try again.';
            setGenError(msg);
            if (msg.toLowerCase().includes('no transcript')) {
                setHasNoTranscript(true);
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        setGenError('');
        try {
            const result = await aiApi.summary(meetingId, true);
            setSummary(result);
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Failed to regenerate summary. Please try again.';
            setGenError(msg);
        } finally {
            setRegenerating(false);
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });

    if (loading) {
        return (
            <>
                <Header title="Meeting Details" />
                <main className="p-8 text-center text-slate-400 text-sm">Loading...</main>
            </>
        );
    }

    if (!meeting) {
        return (
            <>
                <Header title="Meeting Details" />
                <main className="p-8 text-center text-slate-500">Meeting not found.</main>
            </>
        );
    }

    return (
        <>
            <Header
                title={meeting.title}
                subtitle={formatDate(meeting.scheduled_at || meeting.created_at)}
                rightAction={
                    <div className="flex items-center gap-3">
                        <Link
                            href="/meetings"
                            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                        <Link href={`/meetings/${meetingId}/room`}>
                            <Button variant="primary" size="sm">
                                <Video className="w-4 h-4" />
                                Rejoin Call
                            </Button>
                        </Link>
                    </div>
                }
            />

            <main className="p-8 max-w-4xl space-y-6">
                <Card>
                    <p className="text-slate-600">{meeting.description || 'No description.'}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                        {meeting.duration_minutes && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {meeting.duration_minutes} min
                            </span>
                        )}
                        <Badge variant={meeting.status === 'completed' ? 'success' : 'primary'}>
                            {meeting.status || 'active'}
                        </Badge>
                    </div>
                </Card>

                {!summary ? (
                    <Card className="text-center py-10">
                        <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                        <h2 className="font-bold text-slate-900 mb-1">
                            {hasNoTranscript ? 'Nothing to summarize yet' : 'No summary yet'}
                        </h2>
                        <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                            {hasNoTranscript
                                ? 'This meeting has no recorded transcript. Join the call and talk for a bit, then come back here.'
                                : 'Generate an AI summary from this meeting\u2019s recorded transcript.'}
                        </p>
                        {genError && !hasNoTranscript && (
                            <p className="text-sm text-red-500 mb-3">{genError}</p>
                        )}
                        {!hasNoTranscript && (
                            <Button variant="primary" onClick={handleGenerate} loading={generating}>
                                <Sparkles className="w-4 h-4" />
                                Generate Summary
                            </Button>
                        )}
                    </Card>
                ) : (
                    <>
                        <Card>
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                <h2 className="font-bold text-slate-900">AI Summary</h2>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{summary.summary}</p>

                            {summary.key_topics.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {summary.key_topics.map((topic, i) => (
                                        <Badge key={i} variant="info">
                                            {topic}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {genError && (
                                <p className="text-sm text-red-500 mt-4">{genError}</p>
                            )}

                            <div className="mt-4">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleRegenerate}
                                    loading={regenerating}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Regenerate
                                </Button>
                            </div>
                        </Card>

                        {summary.decisions.length > 0 && (
                            <Card>
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                                    <h2 className="font-bold text-slate-900">Decisions Made</h2>
                                </div>
                                <ul className="space-y-2">
                                    {summary.decisions.map((d, i) => (
                                        <li key={i} className="text-sm text-slate-700 flex gap-2">
                                            <span className="text-emerald-500 mt-0.5">•</span>
                                            {d}
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}

                        {summary.action_items.length > 0 && (
                            <Card>
                                <div className="flex items-center gap-2 mb-3">
                                    <MessageSquare className="w-5 h-5 text-amber-500" />
                                    <h2 className="font-bold text-slate-900">Action Items</h2>
                                </div>
                                <ul className="space-y-2">
                                    {summary.action_items.map((a, i) => (
                                        <li key={i} className="text-sm text-slate-700 flex gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            {a}
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}
                    </>
                )}
            </main>
        </>
    );
}
