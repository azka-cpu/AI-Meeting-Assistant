
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Caption from '@/components/ui/caption';
import { meetingApi } from '@/lib/api';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  Mail,
  Bell,
  Share2,
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  description: string;
  created_at: string;
  scheduled_at?: string | null;
  duration_minutes?: number | null;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type ViewMode = 'month' | 'week' | 'day';

function effectiveDate(m: Meeting): Date {
  return new Date(m.scheduled_at || m.created_at);
}

function formatDuration(minutes?: number | null) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return mm ? `${h}h ${mm}m` : `${h}h`;
}

function relativeTime(target: Date): string {
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
  if (diffDays >= 7 && diffDays < 14) return 'In 1 week';
  if (diffDays >= 14 && diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`;
  if (diffDays >= 30) return `In ${Math.floor(diffDays / 30)} month(s)`;
  return 'Past';
}

export default function CalendarPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    meetingApi
      .list()
      .then((data) => setMeetings(Array.isArray(data) ? (data as Meeting[]) : []))
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, []);

  const monthLabel = viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [viewDate]);

  const meetingsByDay = useMemo(() => {
    const map: Record<number, Meeting[]> = {};
    meetings.forEach((m) => {
      const d = effectiveDate(m);
      if (
        d.getFullYear() === viewDate.getFullYear() &&
        d.getMonth() === viewDate.getMonth()
      ) {
        const day = d.getDate();
        map[day] = map[day] || [];
        map[day].push(m);
      }
    });
    return map;
  }, [meetings, viewDate]);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    viewDate.getMonth() === today.getMonth() &&
    viewDate.getFullYear() === today.getFullYear();

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const upcoming = useMemo(() => {
    const now = new Date();
    return meetings
      .filter((m) => m.scheduled_at && new Date(m.scheduled_at) >= now)
      .sort(
        (a, b) =>
          new Date(a.scheduled_at as string).getTime() -
          new Date(b.scheduled_at as string).getTime()
      )
      .slice(0, 6);
  }, [meetings]);

  const handleJoin = async (id: string) => {
    setJoiningId(id);
    try {
      await meetingApi.join(id);
      router.push(`/meetings/${id}/room`);
    } catch (error) {
      console.error('Failed to join meeting:', error);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <>
      <Header
        title="Calendar"
        subtitle="Plan, organize, and never miss an important meeting"
        rightAction={
          <div className="flex items-center gap-4">
            <Caption color="purple" className="hidden lg:block">
              Good people, greater impact
            </Caption>
            <Button variant="primary">
              <Plus className="w-4 h-4" />
              New Meeting
            </Button>
          </div>
        }
      />

      <main className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeMonth(-1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <h2 className="text-lg font-bold text-slate-900 w-40 text-center">
                  {monthLabel}
                </h2>
                <button
                  onClick={() => changeMonth(1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${viewMode === mode
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setViewDate(new Date())}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 px-2"
                >
                  Today
                </button>
              </div>
            </div>

            {viewMode !== 'month' ? (
              <div className="py-16 text-center text-sm text-slate-400">
                {viewMode === 'week' ? 'Week' : 'Day'} view is coming soon —
                switch back to Month view for now.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
                  {WEEKDAYS.map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative ${day === null
                        ? ''
                        : isToday(day)
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                        }`}
                    >
                      {day && (
                        <>
                          <span>{day}</span>
                          {meetingsByDay[day] && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday(day) ? 'bg-white' : 'bg-blue-500'
                                }`}
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Quick Actions — UI placeholders, not wired to real
              external calendar sync yet */}
          <Card>
            <h2 className="font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction
                icon={<CalendarIcon className="w-4 h-4" />}
                iconBg="bg-blue-50 text-blue-600"
                label="Sync with Google Calendar"
              />
              <QuickAction
                icon={<Mail className="w-4 h-4" />}
                iconBg="bg-sky-50 text-sky-600"
                label="Import from Outlook"
              />
              <QuickAction
                icon={<Bell className="w-4 h-4" />}
                iconBg="bg-amber-50 text-amber-600"
                label="Set Reminders"
              />
              <QuickAction
                icon={<Share2 className="w-4 h-4" />}
                iconBg="bg-purple-50 text-purple-600"
                label="Share Calendar"
              />
            </div>
          </Card>
        </div>

        {/* Upcoming meetings sidebar */}
        <div>
          <Card>
            <h2 className="font-bold text-slate-900 mb-4">Upcoming Meetings</h2>

            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-slate-400">
                No scheduled meetings yet. Create a meeting with a date to
                see it here.
              </p>
            ) : (
              <div className="space-y-4">
                {upcoming.map((m) => {
                  const date = new Date(m.scheduled_at as string);
                  return (
                    <div
                      key={m.id}
                      className="pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 text-xs font-bold">
                          {date.getDate()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {m.title}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                            <span>
                              {date.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                            {formatDuration(m.duration_minutes) && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {formatDuration(m.duration_minutes)}
                              </span>
                            )}
                          </p>
                          <span className="inline-block mt-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {relativeTime(date)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        loading={joiningId === m.id}
                        onClick={() => handleJoin(m.id)}
                      >
                        Join
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}

function QuickAction({
  icon,
  iconBg,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
}) {
  return (
    <button className="flex items-center gap-2.5 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </button>
  );
}
