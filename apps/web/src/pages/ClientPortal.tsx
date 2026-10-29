import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Download, 
  Receipt, 
  Briefcase, 
  ExternalLink, 
  MessageSquare, 
  CreditCard,
  LogOut
} from 'lucide-react';
import { apiRequest, getStoredUser, removeAuthToken } from '../lib/api';

export const ClientPortal: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMap, setFeedbackMap] = useState<Record<number, string>>({});
  const [submittingReview, setSubmittingReview] = useState<number | null>(null);

  const user = getStoredUser();

  const loadPortalData = () => {
    setLoading(true);
    apiRequest<any>('/dashboard/client-portal')
      .then(res => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const handleReviewDeliverable = async (deliverableId: number, status: 'approved' | 'rejected') => {
    setSubmittingReview(deliverableId);
    try {
      await apiRequest(`/projects/deliverables/${deliverableId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          feedback: feedbackMap[deliverableId] || (status === 'approved' ? 'Approved by client.' : 'Changes requested.')
        })
      });
      loadPortalData();
    } catch (err: any) {
      alert(err.message || 'Error reviewing deliverable');
    } finally {
      setSubmittingReview(null);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 bg-slate-900/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white">Client Portal</span>
            <span className="text-[10px] text-violet-400 font-semibold tracking-wider uppercase block -mt-0.5">
              {data?.client_name || 'Acme Global Technologies'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-7 h-7 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center font-bold text-xs">
              {user?.full_name ? user.full_name[0] : 'C'}
            </div>
            <span className="font-medium hidden sm:inline">{user?.full_name || 'David Vance'}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto p-8 w-full space-y-8">
        {/* Welcome Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-indigo-950/60 border border-violet-900/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dedicated Partner Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.full_name || 'David'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Track project development milestones, review and approve creative deliverables, and manage invoices securely.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center min-w-[120px]">
              <div className="text-xl font-bold text-white">{data?.active_projects_count || 1}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Active Projects</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center min-w-[120px]">
              <div className="text-xl font-bold text-amber-400">{data?.pending_approvals_count || 1}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Pending Approval</div>
            </div>
          </div>
        </div>

        {/* Deliverables Awaiting Sign-Off */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">Deliverables Awaiting Your Approval</h2>
            </div>
            <span className="text-xs text-amber-400 font-medium">Requires Action</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.deliverables_pending && data.deliverables_pending.length > 0 ? (
              data.deliverables_pending.map((d: any) => (
                <div key={d.id} className="p-6 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending Sign-Off
                      </span>
                      {d.file_url && (
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                        >
                          <span>Inspect Prototype</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mb-1.5">{d.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">{d.description}</p>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Approval Feedback Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Looks great, approved for Sprint 3 implementation..."
                        value={feedbackMap[d.id] || ''}
                        onChange={(e) => setFeedbackMap({ ...feedbackMap, [d.id]: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleReviewDeliverable(d.id, 'approved')}
                      disabled={submittingReview === d.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Deliverable</span>
                    </button>
                    <button
                      onClick={() => handleReviewDeliverable(d.id, 'rejected')}
                      disabled={submittingReview === d.id}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold transition disabled:opacity-50"
                    >
                      Request Changes
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 md:col-span-2">
                All submitted deliverables have been approved. You are completely up to date!
              </div>
            )}
          </div>
        </section>

        {/* Active Projects & Client-Visible Tasks */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Active Projects & Sprint Milestones</h2>
          </div>

          <div className="space-y-6">
            {data?.projects?.map((p: any) => (
              <div key={p.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">Sprint Completion:</span>
                    <span className="text-sm font-bold text-indigo-400">{p.progress}%</span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" style={{ width: `${p.progress}%` }}></div>
                </div>

                {/* Client Visible Tasks */}
                <div>
                  <div className="text-xs font-bold text-slate-300 mb-2.5">Client-Visible Progress Checklist:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {p.tasks?.map((t: any) => (
                      <div key={t.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${t.status === 'done' ? 'text-emerald-400' : 'text-slate-600'}`} />
                          <span className={t.status === 'done' ? 'line-through text-slate-500 truncate' : 'text-slate-200 truncate'}>
                            {t.title}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                          t.status === 'done' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Invoices & Billing Instructions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Invoices & Statements</h2>
            </div>
            {data?.outstanding_balance > 0 && (
              <span className="text-xs font-bold text-amber-400">
                Outstanding Balance: ${Number(data.outstanding_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Paid Amount</th>
                  <th className="px-6 py-4">Balance Due</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Payment Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {data?.invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                      {inv.invoice_number}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(inv.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-100">
                      ${Number(inv.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-400">
                      ${Number(inv.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-400">
                      ${Number(inv.balance_due).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {inv.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{inv.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 text-[11px]">
                      {inv.payment_terms || 'Wire transfer to agency operating account'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};
