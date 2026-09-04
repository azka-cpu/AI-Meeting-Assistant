

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Modal from '@/components/ui/modal';
import Caption from '@/components/ui/caption';
import { meetingApi } from '@/lib/api';
import {
    Plus,
    Star,
    Users,
    Zap,
    BarChart3,
    Play,
    MoreVertical,
    Clock,
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

type TabKey = 'all' | 'favorites' | 'shared';

export default function MeetingsPage() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 30,
    });

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const data = await meetingApi.list();
            setMeetings(Array.isArray(data) ? (data as Meeting[]) : []);
        } catch (error) {
            console.error('Failed to load meetings:', error);
            setMeetings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        setCreating(true);
        try {
            let scheduledAtIso: string | undefined;
            if (formData.date) {
                const timePart = formData.time || '09:00';
                scheduledAtIso = new Date(`${formData.date}T${timePart}`).toISOString();
            }

            const newMeeting = await meetingApi.create(
                formData.title,
                formData.description,
                scheduledAtIso,
                formData.duration
            );

            if (newMeeting && typeof newMeeting === 'object') {
                setMeetings((prev) => [newMeeting as Meeting, ...prev]);
                setFormData({ title: '', description: '', date: '', time: '', duration: 30 });
                setShowCreateModal(false);
            }
        } catch (error) {
            console.error('Failed to create meeting:', error);
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

    const formatDuration = (minutes?: number | null) => {
        if (!minutes) return null;
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m ? `${h}h ${m}m` : `${h}h`;
    };

    return (
        <>
            <Header
                title="Meetings"
                subtitle="Your meetings, all in one place"
                rightAction={
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4" />
                        New Meeting
                    </Button>
                }
            />

            <main className="p-8">
                <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
                    {([
                        { key: 'all', label: 'All Meetings' },
                        { key: 'favorites', label: 'Favorites' },
                        { key: 'shared', label: 'Shared with me' },
                    ] as { key: TabKey; label: string }[]).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="py-24 text-center text-slate-400 text-sm">
                        Loading meetings...
                    </div>
                ) : meetings.length === 0 ? (
                    <Card className="text-center py-16">

                        <img src="/illustrations/meetings-empty.svg"
                            alt="" className="w-64 h-40 mx-auto mb-6" />

                        <Caption color="purple" className="mb-1">
                            Small meetings, big possibilities
                        </Caption>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">
                            No meetings yet
                        </h2>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                            Create your first meeting to get started with AI-powered
                            insights.
                        </p>
                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                            <Plus className="w-4 h-4" />
                            Create Your First Meeting
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-left">
                            <FeatureBlurb
                                icon={<Zap className="w-5 h-5" />}
                                iconBg="bg-amber-50 text-amber-500"
                                title="Automatic Summaries"
                                desc="Get clear, concise summaries of your meetings"
                            />
                            <FeatureBlurb
                                icon={<Users className="w-5 h-5" />}
                                iconBg="bg-blue-50 text-blue-500"
                                title="Action Items"
                                desc="Never miss important follow-ups again"
                            />
                            <FeatureBlurb
                                icon={<BarChart3 className="w-5 h-5" />}
                                iconBg="bg-purple-50 text-purple-500"
                                title="Better Collaboration"
                                desc="Turn conversations into real progress"
                            />
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {meetings.map((meeting) => (
                            <Card key={meeting.id} hover interactive>
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-slate-900">
                                        {meeting.title}
                                    </h3>
                                    <button className="text-slate-400 hover:text-amber-400">
                                        <Star className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                    {meeting.description}
                                </p>

                                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                                    <span>
                                        {formatDate(meeting.scheduled_at || meeting.created_at)}
                                    </span>
                                    {formatDuration(meeting.duration_minutes) && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(meeting.duration_minutes)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">
                                        {meeting.scheduled_at ? 'Scheduled' : 'No date set'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/meetings/${meeting.id}/room`}>
                                            <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">
                                                <Play className="w-3 h-3" />
                                                Join
                                            </button>
                                        </Link>
                                        <button className="text-slate-400 hover:text-slate-600">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <Modal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Meeting"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleCreateMeeting} loading={creating}>
                            Create Meeting
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleCreateMeeting} className="space-y-4">
                    <Input
                        label="Meeting Title"
                        placeholder="Product Roadmap Discussion"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Description
                        </label>
                        <textarea
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="What is this meeting about?"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            type="date"
                            label="Date (optional)"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                        <Input
                            type="time"
                            label="Time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            disabled={!formData.date}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Duration
                        </label>
                        <select
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.duration}
                            onChange={(e) =>
                                setFormData({ ...formData, duration: Number(e.target.value) })
                            }
                        >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={90}>1.5 hours</option>
                            <option value={120}>2 hours</option>
                        </select>
                    </div>
                </form>
            </Modal>
        </>
    );
}

function FeatureBlurb({
    icon,
    iconBg,
    title,
    desc,
}: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    desc: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                {icon}
            </div>
            <div>
                <p className="font-semibold text-slate-900 text-sm">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
        </div>
    );
}
