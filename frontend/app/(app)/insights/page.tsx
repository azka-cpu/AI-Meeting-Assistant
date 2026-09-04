

'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/card';
import Caption from '@/components/ui/caption';
import { meetingApi, dashboardApi, WeeklyActivity } from '@/lib/api';
import {
  Clock,
  CheckSquare,
  Brain,
  FileText,
  Sparkles,
  FileBarChart,
  Download,
  Share2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface Meeting {
  id: string;
  title: string;
  created_at: string;
  status?: string;
}

export default function InsightsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSaved, setTimeSaved] = useState('0h');
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);

  useEffect(() => {
    Promise.all([meetingApi.list(), dashboardApi.getStats()])
      .then(([meetingsData, stats]) => {
        setMeetings(Array.isArray(meetingsData) ? (meetingsData as Meeting[]) : []);
        setTimeSaved(`${stats.time_saved_hours}h`);
        setWeeklyActivity(stats.weekly_activity || []);
      })
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, []);

  const totalMeetings = meetings.length;
  const completedMeetings = meetings.filter((m) => m.status === 'completed').length;

  const monthLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <Header
        title="AI Insights"
        subtitle="Understand your meetings, drive better decisions"
        rightAction={
          <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-600">
            {monthLabel}
          </span>
        }
      />

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Clock className="w-5 h-5" />} iconBg="bg-blue-100 text-blue-600" label="Time Saved" value={loading ? '—' : timeSaved} />
          <StatCard icon={<CheckSquare className="w-5 h-5" />} iconBg="bg-emerald-100 text-emerald-600" label="Total Meetings" value={loading ? '—' : String(totalMeetings)} />
          <StatCard icon={<Brain className="w-5 h-5" />} iconBg="bg-purple-100 text-purple-600" label="Completed" value={loading ? '—' : String(completedMeetings)} />
          <StatCard icon={<FileText className="w-5 h-5" />} iconBg="bg-amber-100 text-amber-600" label="In Progress" value={loading ? '—' : String(totalMeetings - completedMeetings)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card hover>
              <div className="flex items-start justify-between mb-1">
                <h2 className="font-bold text-slate-900">Meeting Activity</h2>
                <Caption color="purple" className="hidden md:block">
                  Insights turn meetings into impact
                </Caption>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Meetings created per week (last 6 weeks)
              </p>

              {loading ? (
                <p className="text-sm text-slate-400">Loading...</p>
              ) : weeklyActivity.length === 0 ? (
                <p className="text-sm text-slate-400 py-12 text-center">
                  Not enough data yet to show a trend.
                </p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyActivity}>
                      <defs>
                        <linearGradient id="lineFade" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="week_label"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="meetings"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#2563eb' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card hover>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h2 className="font-bold text-slate-900">AI Generated Insights</h2>
              </div>
              <p className="text-sm text-slate-400">
                Coming soon — this section will surface topic trends and
                patterns once meeting transcripts have been analyzed.
              </p>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card hover>
              <h2 className="font-bold text-slate-900 mb-1">Recent Activity</h2>
              <p className="text-sm text-slate-500 mb-4">Your latest meetings</p>

              {loading ? (
                <p className="text-sm text-slate-400">Loading...</p>
              ) : meetings.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">
                  No meetings yet — insights will appear here once you have
                  some.
                </p>
              ) : (
                <div className="space-y-3">
                  {meetings.slice(0, 8).map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <p className="text-sm font-medium text-slate-900 truncate max-w-xs">{m.title}</p>
                      <span className="text-xs text-slate-400">
                        {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card hover>
              <h2 className="font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <QuickActionRow icon={<FileBarChart className="w-4 h-4" />} iconBg="bg-blue-50 text-blue-600" label="View All Summaries" desc="Access meeting takeaways" />
                <QuickActionRow icon={<Download className="w-4 h-4" />} iconBg="bg-emerald-50 text-emerald-600" label="Export Insights" desc="Download reports" />
                <QuickActionRow icon={<Share2 className="w-4 h-4" />} iconBg="bg-purple-50 text-purple-600" label="Share Insights" desc="Keep your team informed" />
              </div>
            </Card>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Turn Conversations Into Greater Possibilities
            </h2>
            <p className="text-slate-600 text-sm">
              MeetMate AI helps you learn, summarize and act on what matters most.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Caption color="blue" className="hidden lg:block">
              Good meetings, brighter teams!
            </Caption>
            <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
              Upgrade to Unlock More Insights
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function QuickActionRow({ icon, iconBg, label, desc }: { icon: React.ReactNode; iconBg: string; label: string; desc: string }) {
  return (
    <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </button>
  );
}
