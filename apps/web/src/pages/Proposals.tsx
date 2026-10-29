import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Copy, 
  Send, 
  Trash2,
  X
} from 'lucide-react';
import { Header } from '../components/Header';
import { apiRequest, Proposal } from '../lib/api';

export const Proposals: React.FC = () => {
  const { orgName } = useOutletContext<{ orgName: string }>();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [clientId, setClientId] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [items, setItems] = useState([
    { description: 'Initial Discovery & Architecture', quantity: 1, unit_price: 5000 }
  ]);

  const loadProposals = () => {
    setLoading(true);
    Promise.all([
      apiRequest<Proposal[]>('/proposals'),
      apiRequest<any[]>('/clients')
    ]).then(([props, cls]) => {
      setProposals(props);
      setClients(cls);
      if (cls.length > 0) setClientId(cls[0].id);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 1000 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    setItems(updated);
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/proposals', {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          title,
          description,
          tax_rate: parseFloat(taxRate) || 0,
          discount_amount: parseFloat(discountAmount) || 0,
          items: items.map(it => ({
            description: it.description,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price)
          }))
        })
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      loadProposals();
    } catch (err: any) {
      alert(err.message || 'Error creating proposal');
    }
  };

  const handleSendProposal = async (proposalId: number) => {
    try {
      await apiRequest(`/proposals/${proposalId}/send`, { method: 'POST' });
      loadProposals();
    } catch (err: any) {
      alert(err.message || 'Error sending proposal');
    }
  };

  const copyPublicLink = (token: string) => {
    const url = `${window.location.origin}/proposal/${token}`;
    navigator.clipboard.writeText(url);
    alert('Public client review URL copied to clipboard:\n' + url);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header 
        title="Proposals & Electronic Contracts" 
        subtitle="Itemized project scope, tax calculations, and auditable client digital signatures"
        orgName={orgName}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Total Active Proposals: <span className="font-bold text-slate-200">{proposals.length}</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Draft New Proposal</span>
          </button>
        </div>

        {/* Proposals Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">Proposal Number & Scope</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sign-Off Record</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {proposals.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-indigo-400 text-xs">{p.proposal_number}</div>
                      <div className="text-slate-200 text-sm font-semibold mt-0.5">{p.title}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">
                      {p.client_name || 'Client Account'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-100 text-sm">
                      ${Number(p.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'accepted'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : p.status === 'sent' || p.status === 'viewed'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.status === 'accepted' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.accepted_by_name ? (
                        <div>
                          <div className="text-slate-200 font-semibold">{p.accepted_by_name}</div>
                          <div className="text-[10px] text-emerald-400">
                            Signed on {new Date(p.accepted_at || '').toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Awaiting signature</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {p.status === 'draft' && (
                        <button
                          onClick={() => handleSendProposal(p.id)}
                          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send</span>
                        </button>
                      )}
                      <button
                        onClick={() => copyPublicLink(p.public_token)}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition"
                      >
                        <Copy className="w-3 h-3 text-indigo-400" />
                        <span>Share Link</span>
                      </button>
                      <a
                        href={`/proposal/${p.public_token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] font-semibold px-2 py-1.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Proposal Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <h3 className="text-base font-bold text-white">Create Itemized Proposal</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProposal} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Target Client *</label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.company || 'Client'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Proposal Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Platform Architecture & Build"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Project Scope & Terms</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the deliverables and warranty terms..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Line Items Builder */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-200">Itemized Scope & Pricing</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <input
                          type="text"
                          required
                          value={it.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="Service description"
                          className="flex-1 bg-transparent border-0 text-xs text-slate-200 focus:outline-none"
                        />
                        <input
                          type="number"
                          required
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 text-center focus:outline-none"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-xs">$</span>
                          <input
                            type="number"
                            required
                            value={it.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            placeholder="Unit Price"
                            className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 text-right focus:outline-none"
                          />
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition"
                  >
                    Create Proposal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
