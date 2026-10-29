import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileCheck2, 
  FileText, 
  Receipt, 
  FolderLock, 
  ShieldCheck, 
  LogOut,
  ExternalLink
} from 'lucide-react';
import { getStoredUser, removeAuthToken } from '../lib/api';

interface SidebarProps {
  currentOrgName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentOrgName }) => {
  const user = getStoredUser();

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
    { name: 'Clients (CRM)', path: '/app/clients', icon: Users },
    { name: 'Projects & Tasks', path: '/app/projects', icon: Briefcase },
    { name: 'Deliverables', path: '/app/deliverables', icon: FileCheck2 },
    { name: 'Proposals', path: '/app/proposals', icon: FileText },
    { name: 'Invoices & Payments', path: '/app/invoices', icon: Receipt },
    { name: 'Documents Hub', path: '/app/documents', icon: FolderLock },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-100 tracking-tight text-base block leading-none">OpenPortal</span>
            <span className="text-[10px] text-indigo-400 font-medium tracking-wide uppercase mt-1 block">Agency Workspace</span>
          </div>
        </div>

        {/* Active Organization Pill */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Organization</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium text-slate-200 truncate">{currentOrgName || 'Vortex Creative Agency'}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer & Switch to Client Portal */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <a 
          href="/portal" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-950/50 border border-indigo-800/40 hover:bg-indigo-900/40 transition"
        >
          <span className="flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Client Portal View</span>
          </span>
          <span className="text-[10px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300">Preview</span>
        </a>

        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Staff User'}</div>
              <div className="text-[10px] text-slate-500 capitalize">{user?.global_role || 'Agency Member'}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
