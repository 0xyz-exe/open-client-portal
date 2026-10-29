import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Proposal } from '../lib/api';

export const PublicProposal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState('');
  const [signatureText, setSignatureText] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProposal = () => {
    setLoading(true);
    fetch(`/api/v1/proposals/public/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Proposal not found');
        return res.json();
      })
      .then(data => {
        setProposal(data);
        if (data.accepted_by_name) setSignerName(data.accepted_by_name);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProposal();
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName) return;
    setAccepting(true);
    try {
      const res = await fetch(`/api/v1/proposals/public/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted_by_name: signerName,
          signature_data: signatureText || `Signed digitally by ${signerName} via Open Client Portal`
        })
      });
      if (!res.ok) throw new Error('Failed to record signature');
      loadProposal();
    } catch (err: any) {
      alert(err.message || 'Error accepting proposal');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-center justify-center text-xs">
        Loading electronic proposal...
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-rose-400 font-bold mb-2">Proposal Link Expired or Not Found</div>
        <p className="text-xs text-slate-400 mb-4">Please verify the link provided by your agency partner.</p>
        <Link to="/" className="text-indigo-400 text-xs font-semibold hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 py-12 px-6 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-12 space-y-8">
        {/* Proposal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block">Open Client Portal</span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase block">
                Official Agency Statement of Work
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-sm font-bold text-indigo-400">{proposal.proposal_number}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Issued: {new Date(proposal.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Scope Title */}
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Prepared For: {proposal.client_name || 'Client Partner'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {proposal.title}
          </h1>
          {proposal.description && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-3">
              {proposal.description}
            </p>
          )}
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Deliverable Specification</th>
                <th className="px-5 py-3.5 text-center">Qty</th>
                <th className="px-5 py-3.5 text-right">Unit Rate</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {proposal.items.map((it) => (
                <tr key={it.id}>
                  <td className="px-5 py-3.5 font-medium text-slate-200">{it.description}</td>
                  <td className="px-5 py-3.5 text-center text-slate-400">{it.quantity}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-300">${Number(it.unit_price).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-100">${Number(it.total_price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pricing Totals */}
          <div className="p-5 bg-slate-950/90 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-200">${Number(proposal.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {Number(proposal.tax_amount) > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Tax ({proposal.tax_rate}%):</span>
                <span className="font-mono text-slate-200">${Number(proposal.tax_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {Number(proposal.discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Courtesy Discount:</span>
                <span className="font-mono">-${Number(proposal.discount_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
              <span>Total Project Investment:</span>
              <span className="font-mono text-indigo-400">${Number(proposal.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {proposal.currency}</span>
            </div>
          </div>
        </div>

        {/* Digital Signature Section */}
        <div className="pt-6 border-t border-slate-800">
          {proposal.status === 'accepted' ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Proposal Formally Accepted & Executed</span>
              </div>
              <p className="text-xs text-slate-300">
                Authorized Signatory: <strong className="text-white">{proposal.accepted_by_name}</strong>
              </p>
              <div className="text-[11px] text-slate-400 font-mono">
                Timestamp: {new Date(proposal.accepted_at || '').toUTCString()}
              </div>
            </div>
          ) : (
            <form onSubmit={handleAccept} className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Client Acceptance & Electronic Signature</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                By entering your full name and submitting this agreement, you authorize the project scope and terms described above.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. David Vance, VP of Product"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Signature Notation (Optional)</label>
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="e.g. Authorized on behalf of Acme Global Technologies"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                disabled={accepting}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <span>{accepting ? 'Recording Signature...' : 'Accept & Sign Proposal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
