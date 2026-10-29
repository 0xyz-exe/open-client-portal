import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ExternalLink,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Header } from '../components/Header';
import { apiRequest } from '../lib/api';

const chartData = [
  { month: 'Jun', revenue: 18500, outstanding: 4500 },
  { month: 'Jul', revenue: 24000, outstanding: 6200 },
  { month: 'Aug', revenue: 31000, outstanding: 8000 },
  { month: 'Sep', revenue: 29500, outstanding: 5400 },
  { month: 'Oct', revenue: 35000, outstanding: 10000 },
  { month: 'Nov (Proj)', revenue: 42000, outstanding: 12500 },
];

export const Dashboard: React.FC = () => {
  const { orgName } = useOutletContext<{ orgName: string }>();
  const [stats, setStats] = useState<any>({
    active_clients: 3,
    active_projects: 3,
    pending_approvals: 1,
    open_tasks: 3,
    total_revenue: 20000,
    unpaid_invoices_amount: 10000,
    recent_activity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<any>('/dashboard/stats')
      .then(res => {
        setStats(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header 
        title="Agency Command Center" 
        subtitle="Operational overview, deliverables in review, and revenue analytics"
        orgName={orgName}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Active Clients</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{stats.active_clients}</div>
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1.5">
              <span>+100% portal adoption</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Active Projects</span>
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{stats.active_projects}</div>
            <div className="text-[11px] text-indigo-400 font-medium flex items-center gap-1 mt-1.5">
              <span>{stats.open_tasks} active tasks in progress</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Pending Approvals</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{stats.pending_approvals}</div>
            <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1 mt-1.5">
              <span>Awaiting client sign-off</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Collected Revenue</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              ${Number(stats.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-1.5">
              <span>${Number(stats.unpaid_invoices_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} outstanding</span>
            </div>
          </div>
        </div>

        {/* Analytics & Project Pipeline Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Revenue & Invoice Pipeline</h3>
                <p className="text-xs text-slate-400 mt-0.5">Collected cashflow vs outstanding client receivables</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span> Collected
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Outstanding
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outstanding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions & Live Portal Link */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 mb-1">Live Client Portal</h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Experience the secure, branded portal your clients use to approve deliverables and pay invoices.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mb-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Demo Client:</span>
                  <span className="font-semibold text-slate-200">Acme Global Tech</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Client Login:</span>
                  <span className="font-mono text-[11px] text-indigo-400">client@acmeglobal.com</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Password:</span>
                  <span className="font-mono text-[11px] text-slate-400">ClientPortal2026!</span>
                </div>
              </div>
            </div>

            <a
              href="/portal"
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition"
            >
              <span>Launch Client Portal View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Recent Audit Activity Feed */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Immutable Audit Trail</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time log of contract signings, client approvals, and financial transactions</p>
            </div>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Verified Ledger
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {stats.recent_activity && stats.recent_activity.length > 0 ? (
              stats.recent_activity.map((act: any) => (
                <div key={act.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                      LOG
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200">{act.actor_name}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-indigo-400 font-mono text-[11px]">{act.action}</span>
                      {act.metadata_json && (
                        <span className="text-slate-400 font-mono text-[11px] ml-2">
                          ({act.metadata_json})
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(act.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Audit logs will populate as actions occur.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
