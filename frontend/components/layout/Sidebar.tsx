

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Calendar,
  CalendarDays,
  Sparkles,
  Mic,
  BookOpen,
  Settings,
  Crown,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { authApi } from '@/lib/api';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/meetings', label: 'Meetings', icon: Calendar },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/insights', label: 'AI Insights', icon: Sparkles },
  { href: '/voice', label: 'Voice Assistant', icon: Mic },
  { href: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

type FetchState = 'loading' | 'loaded' | 'failed';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>('loading');

  useEffect(() => {
    authApi
      .me()
      .then((data) => {
        setUser(data as CurrentUser);
        setFetchState('loaded');
      })
      .catch(() => {
        setUser(null);
        setFetchState('failed');
      });
  }, []);

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  const nameDisplay =
    fetchState === 'loading'
      ? 'Loading...'
      : fetchState === 'failed'
        ? 'Not signed in'
        : user?.name || 'User';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-white leading-tight">
            Meet<span className="text-blue-400">Mate</span>
          </p>
          <p className="text-xs text-slate-400 leading-tight">
            AI Meeting Assistant
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Card */}
      <div className="mx-4 mb-4 p-4 rounded-xl bg-slate-800 border border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
        </div>
        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
          Get more insights, longer recordings and advanced AI features.
        </p>
        <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
          Upgrade Now <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* User Profile */}
      <div className="border-t border-slate-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {fetchState === 'loaded' ? initial : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {nameDisplay}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {fetchState === 'loaded' ? user?.email : ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
