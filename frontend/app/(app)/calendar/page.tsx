

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Modal from '@/components/ui/modal';
import Caption from '@/components/ui/caption';
import { meetingApi } from '@/lib/api';
import { Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  description: string;
  created_at: string;
  scheduled_at?: string | null;
  duration_minutes?: number | null;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '09:00',
    duration: 30,
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = () => {
    meetingApi
      .list()
      .then((data) => setMeetings(Array.isArray(data) ? (data as Meeting[]) : []))
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  };

  const openCreateModal = (prefillDate?: Date) => {
    setFormData({
      title: '',
      description: '',
      date: prefillDate ? prefillDate.toISOString().split('T')[0] : '',
      time: '09:00',
      duration: 30,
    });
    setShowCreateModal(true);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setCreating(true);
    try {
      let scheduledAtIso: string | undefined;
      if (formData.date) {
        scheduledAtIso = new Date(`${formData.date}T${formData.time || '09:00'}`).toISOString();
      }
      await meetingApi.create(formData.title, formData.description, scheduledAtIso, formData.duration);
      setShowCreateModal(false);
      fetchMeetings();
    } catch (error) {
      console.error('Failed to create meeting:', error);
    } finally {
      setCreating(false);
    }
  };

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
      if (d.getFullYear() === viewDate.getFullYear() && d.getMonth() === viewDate.getMonth()) {
        const day = d.getDate();
        map[day] = map[day] || [];
        map[day].push(m);
      }
    });
    return map;
  }, [meetings, viewDate]);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();

  const changePeriod = (direction: 1 | -1) => {
    const next = new Date(viewDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() + direction);
    else if (viewMode === 'week') next.setDate(next.getDate() + direction * 7);
    else next.setDate(next.getDate() + direction);
    setViewDate(next);
  };

  const upcoming = useMemo(() => {
    const now = new Date();
    return meetings
      .filter((m) => m.scheduled_at && new Date(m.scheduled_at) >= now)
      .sort((a, b) => new Date(a.scheduled_at as string).getTime() - new Date(b.scheduled_at as string).getTime())
      .slice(0, 6);
  }, [meetings]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(viewDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [viewDate]);

  const meetingsForDate = (date: Date) =>
    meetings.filter((m) => isSameDay(effectiveDate(m), date));

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

  const periodLabel =
    viewMode === 'month'
      ? monthLabel
      : viewMode === 'week'
        ? `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : viewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

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
            <Button variant="primary" onClick={() => openCreateModal()}>
              <Plus className="w-4 h-4" />
              New Meeting
            </Button>
          </div>
        }
      />

      <main className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => changePeriod(-1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <h2 className="text-lg font-bold text-slate-900 w-48 text-center">{periodLabel}</h2>
                <button onClick={() => changePeriod(1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${viewMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <button onClick={() => setViewDate(new Date())} className="text-sm font-medium text-blue-600 hover:text-blue-700 px-2">
                  Today
                </button>
              </div>
            </div>

            {/* MONTH VIEW */}
            {viewMode === 'month' && (
              <>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
                  {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => (
                    <button
                      key={idx}
                      disabled={day === null}
                      onClick={() => {
                        if (!day) return;
                        openCreateModal(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
                      }}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative ${day === null
                        ? 'cursor-default'
                        : isToday(day)
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                        }`}
                    >
                      {day && (
                        <>
                          <span>{day}</span>
                          {meetingsByDay[day] && (
                            <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday(day) ? 'bg-white' : 'bg-blue-500'}`} />
                          )}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* WEEK VIEW */}
            {viewMode === 'week' && (
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((date) => {
                  const dayMeetings = meetingsForDate(date);
                  const todayFlag = isSameDay(date, today);
                  return (
                    <div key={date.toISOString()} className="min-h-[160px] flex flex-col">
                      <button
                        onClick={() => openCreateModal(date)}
                        className={`text-center pb-2 mb-2 border-b-2 ${todayFlag ? 'border-blue-600' : 'border-slate-100'}`}
                      >
                        <p className="text-xs text-slate-400">{WEEKDAYS[date.getDay()]}</p>
                        <p className={`text-sm font-semibold ${todayFlag ? 'text-blue-600' : 'text-slate-900'}`}>
                          {date.getDate()}
                        </p>
                      </button>
                      <div className="space-y-1 flex-1">
                        {dayMeetings.map((m) => (
                          <div key={m.id} className="text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-1 truncate">
                            {m.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* DAY VIEW */}
            {viewMode === 'day' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-500">
                    {meetingsForDate(viewDate).length} meeting(s) on this day
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => openCreateModal(viewDate)}>
                    <Plus className="w-3.5 h-3.5" />
                    Add for this day
                  </Button>
                </div>
                {meetingsForDate(viewDate).length === 0 ? (
                  <p className="text-sm text-slate-400 py-12 text-center">
                    No meetings scheduled for {WEEKDAYS_FULL[viewDate.getDay()]}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {meetingsForDate(viewDate).map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{m.title}</p>
                          <p className="text-xs text-slate-400">
                            {m.scheduled_at &&
                              new Date(m.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {formatDuration(m.duration_minutes) && ` · ${formatDuration(m.duration_minutes)}`}
                          </p>
                        </div>
                        <Button variant="primary" size="sm" loading={joiningId === m.id} onClick={() => handleJoin(m.id)}>
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Upcoming meetings sidebar */}
        <div>
          <Card>
            <h2 className="font-bold text-slate-900 mb-4">Upcoming Meetings</h2>

            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-slate-400">No scheduled meetings yet. Create one to see it here.</p>
            ) : (
              <div className="space-y-4">
                {upcoming.map((m) => {
                  const date = new Date(m.scheduled_at as string);
                  return (
                    <div key={m.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 text-xs font-bold">
                          {date.getDate()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">{m.title}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                            <span>{date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
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
                      <Button variant="primary" size="sm" fullWidth loading={joiningId === m.id} onClick={() => handleJoin(m.id)}>
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

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Meeting"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateMeeting} loading={creating}>Create Meeting</Button>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="What is this meeting about?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Date"
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration</label>
            <select
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
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