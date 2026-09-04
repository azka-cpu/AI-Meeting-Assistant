'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, Sun } from 'lucide-react';
import { authApi } from '@/lib/api';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export default function Header({ title, subtitle, rightAction }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    authApi
      .me()
      .then((data) => setUser(data as CurrentUser))
      .catch(() => setUser(null));
  }, []);

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Search or Title */}
        <div className="flex-1 max-w-xl">
          {title ? (
            <div>
              <h1 className="text-xl font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search meetings, participants, or insights..."
                className="w-full pl-10 pr-16 py-2.5 bg-slate-100 border border-transparent rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                Ctrl + K
              </kbd>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-6">
          {rightAction}

          <button className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <Sun className="w-4 h-4 text-slate-600" />
          </button>

          <button className="relative w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <Bell className="w-4 h-4 text-slate-600" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {initial}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-slate-900 leading-tight">
                  {user?.name || 'Loading...'}
                </p>
                <p className="text-xs text-green-500 flex items-center gap-1 leading-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Online
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Settings
                </a>
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Profile
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
