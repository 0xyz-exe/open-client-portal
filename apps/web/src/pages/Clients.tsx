import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Globe, 
  KeyRound, 
  CheckCircle2, 
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Header } from '../components/Header';
import { apiRequest, Client } from '../lib/api';

export const Clients: React.FC = () => {
  const { orgName } = useOutletContext<{ orgName: string }>();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [inviteModalData, setInviteModalData] = useState<any | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');

  const loadClients = () => {
    setLoading(true);
    apiRequest<Client[]>(`/clients?search=${encodeURIComponent(search)}`)
      .then(res => setClients(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClients();
  }, [search]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify({
          name,
          company,
          email,
          phone,
          billing_address: billingAddress,
          notes,
          portal_enabled: true
        })
      });
      setShowAddModal(false);
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setBillingAddress('');
      setNotes('');
      loadClients();
    } catch (err: any) {
      alert(err.message || 'Error creating client');
    }
  };

  const handleInviteToPortal = async (clientId: number, clientEmail: string) => {
    try {
      const res = await apiRequest<any>(`/clients/${clientId}/invite-portal?contact_email=${encodeURIComponent(clientEmail)}`, {
        method: 'POST'
      });
      setInviteModalData(res);
      loadClients();
    } catch (err: any) {
      alert(err.message || 'Error inviting client');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header 
        title="Client CRM & Directory" 
        subtitle="Manage client accounts, contacts, and dedicated portal access"
        orgName={orgName}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients by name, company, email..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        </div>

        {/* Clients Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">Client Name & Company</th>
                  <th className="px-6 py-4">Contact Details</th>
                  <th className="px-6 py-4">Currency</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Portal Access</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-100 text-sm">{c.name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{c.company || 'Individual Client'}</div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {c.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.portal_enabled ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Portal</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Disabled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleInviteToPortal(c.id, c.email)}
                        className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        <KeyRound className="w-3 h-3 text-indigo-400" />
                        <span>Generate Login</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Client Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <h3 className="text-base font-bold text-white">Add New Client Account</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Company / Organization</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Primary Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@company.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Billing Address</label>
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Street, City, State, ZIP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Key account details or payment terms..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
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
                    Save Client
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Portal Credentials Generated Modal */}
        {inviteModalData && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Client Portal Access Enabled</h3>
                  <p className="text-xs text-slate-400">Credentials generated for secure portal login</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs mb-5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Portal URL:</span>
                  <span className="font-mono text-indigo-400 font-semibold">{inviteModalData.credentials?.login_url || '/portal'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Username / Email:</span>
                  <span className="font-mono text-slate-200">{inviteModalData.credentials?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Temporary Password:</span>
                  <span className="font-mono text-amber-400 font-bold">{inviteModalData.credentials?.temporary_password}</span>
                </div>
              </div>

              <button
                onClick={() => setInviteModalData(null)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl transition"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
