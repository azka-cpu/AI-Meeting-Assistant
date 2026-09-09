

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Caption from '@/components/ui/caption';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { meetingApi, dashboardApi, authApi } from '@/lib/api';
import {
  Plus,
  Clock,
  CheckCircle2,
  Users,
  Link as LinkIcon,
  UploadCloud,
  ChevronRight,
  Play,
  MoreVertical,
  Star,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  description: string;
  created_at: string;
  duration_minutes?: number | null;
  status?: string;
}

interface DashboardStats {
  timeSaved: string;
  timeSavedChange: number;
  completedRate: string;
  completedChange: number;
  totalParticipants: string;
  participantsChange: number;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

// Pulls a meeting ID out of either a full room-link URL or a raw ID
// typed/pasted directly.
function extractMeetingId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Matches ".../meetings/<id>/room" or ".../meetings/<id>"
  const match = trimmed.match(/\/meetings\/([a-zA-Z0-9-]+)/);
  if (match) return match[1];

  // Otherwise assume they pasted just the raw ID
  return trimmed;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    timeSaved: '0h',
    timeSavedChange: 0,
    completedRate: '0%',
    completedChange: 0,
    totalParticipants: '0',
    participantsChange: 0,
  });

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    authApi.me().then((data) => setUser(data as CurrentUser)).catch(() => setUser(null));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [meetingsData, statsData] = await Promise.all([
        meetingApi.list(),
        dashboardApi.getStats(),
      ]);

      if (Array.isArray(meetingsData)) {
        setMeetings(meetingsData.slice(0, 5) as Meeting[]);
      }

      setStats({
        timeSaved: `${statsData.time_saved_hours}h`,
        timeSavedChange: statsData.time_saved_change,
        completedRate: `${statsData.completed_rate}%`,
        completedChange: statsData.completed_change,
        totalParticipants: String(statsData.total_participants),
        participantsChange: statsData.participants_change,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');

    const meetingId = extractMeetingId(joinInput);
    if (!meetingId) {
      setJoinError('Please paste a valid meeting link or ID.');
      return;
    }

    setJoining(true);
    try {
      await meetingApi.join(meetingId);
      router.push(`/meetings/${meetingId}/room`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not join that meeting. Check the link and try again.';
      setJoinError(msg);
      setJoining(false);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return '—';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <>
      <Header />

      <main className="p-8">
        {/* Welcome Banner */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Good to see you, {firstName}! 👋
            </h1>
            <p className="text-slate-500">
              Your AI meeting assistant is ready to boost your productivity
            </p>
          </div>
          <div className="text-right">
            <Caption color="blue" className="mb-2 hidden md:block">
              Smarter meetings, brighter outcomes
            </Caption>
            <Link
              href="/meetings"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Meeting
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard icon={<Clock className="w-5 h-5" />} iconBg="bg-blue-100 text-blue-600" label="Time Saved" value={stats.timeSaved} change={stats.timeSavedChange} changeSuffix="h vs last month" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-emerald-100 text-emerald-600" label="Meetings Completed" value={stats.completedRate} change={stats.completedChange} changeSuffix="pts vs last month" />
          <StatCard icon={<Users className="w-5 h-5" />} iconBg="bg-purple-100 text-purple-600" label="Total Participants" value={stats.totalParticipants} change={stats.participantsChange} changeSuffix="% vs last month" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LinkIcon className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold">Join Meeting</p>
                <p className="text-sm text-blue-100">
                  Enter a meeting link to join instantly
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>

          <button className="flex items-center justify-between bg-white border border-slate-200 hover:border-purple-300 rounded-xl p-5 transition-colors">
            <div className="flex items-center gap-3">
              <UploadCloud className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <p className="font-semibold text-slate-900">Upload Recording</p>
                <p className="text-sm text-slate-500">Get AI summary & insights</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Recent Meetings */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Meetings</h2>
            <Link
              href="/meetings"
              className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading meetings...
            </div>
          ) : meetings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-500 mb-4">No meetings yet</p>
              <Link
                href="/meetings"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Your First Meeting
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="pl-6 pr-2 py-3 w-8"></th>
                    <th className="px-2 py-3 w-8"></th>
                    <th className="px-2 py-3 font-medium">Date</th>
                    <th className="px-2 py-3 font-medium">Title</th>
                    <th className="px-2 py-3 font-medium">Duration</th>
                    <th className="px-2 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting) => (
                    <tr key={meeting.id} className="border-b border-slate-50 last:border-0">
                      <td className="pl-6 pr-2 py-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-blue-600"
                          checked={selected.has(meeting.id)}
                          onChange={() => toggleSelected(meeting.id)}
                        />
                      </td>
                      <td className="px-2 py-4">
                        <button
                          onClick={() => toggleFavorite(meeting.id)}
                          className={
                            favorites.has(meeting.id)
                              ? 'text-amber-400'
                              : 'text-slate-300 hover:text-amber-400'
                          }
                        >
                          <Star
                            className="w-4 h-4"
                            fill={favorites.has(meeting.id) ? 'currentColor' : 'none'}
                          />
                        </button>
                      </td>
                      <td className="px-2 py-4 text-slate-600 whitespace-nowrap">
                        {formatDate(meeting.created_at)}
                      </td>
                      <td className="px-2 py-4">
                        <p className="font-medium text-slate-900">{meeting.title}</p>
                        <p className="text-slate-400 text-xs truncate max-w-xs">
                          {meeting.description}
                        </p>
                      </td>
                      <td className="px-2 py-4 text-slate-500 whitespace-nowrap">
                        {formatDuration(meeting.duration_minutes)}
                      </td>
                      <td className="px-2 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          {meeting.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/meetings/${meeting.id}`}>
                            <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium hover:bg-slate-50">
                              <Play className="w-3 h-3" />
                              View
                            </button>
                          </Link>
                          <button className="text-slate-400 hover:text-slate-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Turn Conversations into Real Progress
          </h2>
          <p className="text-slate-600 mb-4 max-w-lg">
            MeetMate helps you capture, summarize and act on what matters — so
            you can focus on what&apos;s next.
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Learn More <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Join Meeting Modal */}
      <Modal
        open={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          setJoinInput('');
          setJoinError('');
        }}
        title="Join a Meeting"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowJoinModal(false);
                setJoinInput('');
                setJoinError('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleJoinByLink} loading={joining}>
              Join
            </Button>
          </>
        }
      >
        <form onSubmit={handleJoinByLink} className="space-y-3">
          <Input
            label="Meeting Link or ID"
            placeholder="Paste a link like .../meetings/abc123/room"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
            autoFocus
          />
          {joinError && <p className="text-sm text-red-500">{joinError}</p>}
        </form>
      </Modal>
    </>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  change,
  changeSuffix,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  change: number;
  changeSuffix: string;
}) {
  const isPositive = change >= 0;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {change !== 0 && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'
              }`}
          >
            {isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {Math.abs(change)}
            {changeSuffix.startsWith('%') ? '%' : ''}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {change !== 0 && <p className="text-xs text-slate-400">{changeSuffix.trim()}</p>}
      </div>
    </div>
  );
}
