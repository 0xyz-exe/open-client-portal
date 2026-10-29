import React, { useState, useEffect } from 'react';
import { Bell, Search, Building2, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  orgName?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, orgName }) => {
  const [unreadCount, setUnreadCount] = useState(2);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, title: 'Deliverable Approved', message: 'David Vance approved "Design System & Component Library V1.0".', is_read: false },
    { id: 2, title: 'Invoice Paid', message: 'Acme Corp paid $15,000.00 for INV-202610-0001.', is_read: false }
  ]);

  useEffect(() => {
    apiRequest<any[]>('/dashboard/notifications')
      .then(res => {
        if (res && res.length > 0) {
          setNotifications(res);
          setUnreadCount(res.filter(n => !n.is_read).length);
        }
      })
      .catch(() => {});
  }, []);

  const markAllRead = () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-slate-100 tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search projects, clients, invoices..."
            className="w-64 bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Organization Tag */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs font-medium text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>{orgName || 'Vortex Creative Agency'}</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-900"></span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">Notifications</span>
                <button onClick={markAllRead} className="text-[11px] text-indigo-400 hover:underline">Mark all read</button>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto mt-2">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{n.title}</div>
                      <div className="text-[11px] text-slate-400 leading-snug mt-0.5">{n.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
