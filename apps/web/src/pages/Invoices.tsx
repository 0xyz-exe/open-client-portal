import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Receipt, 
  Plus, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  CreditCard, 
  Send, 
  Trash2,
  X,
  Printer
} from 'lucide-react';
import { Header } from '../components/Header';
import { apiRequest, Invoice } from '../lib/api';

export const Invoices: React.FC = () => {
  const { orgName } = useOutletContext<{ orgName: string }>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);

  // Form State
  const [clientId, setClientId] = useState<number>(1);
  const [dueDate, setDueDate] = useState('2026-11-30');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { description: 'Sprint 1 Development & Token Spec', quantity: 1, unit_price: 15000 }
  ]);

  // Payment Form
  const [payAmount, setPayAmount] = useState('5000');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payRef, setPayRef] = useState('');

  const loadInvoices = () => {
    setLoading(true);
    Promise.all([
      apiRequest<Invoice[]>('/invoices'),
      apiRequest<any[]>('/clients')
    ]).then(([invs, cls]) => {
      setInvoices(invs);
      setClients(cls);
      if (cls.length > 0) setClientId(cls[0].id);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 2500 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    setItems(updated);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          due_date: new Date(dueDate).toISOString(),
          notes,
          items: items.map(it => ({
            description: it.description,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price)
          }))
        })
      });
      setShowAddModal(false);
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Error creating invoice');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;
    try {
      await apiRequest(`/invoices/${selectedInvoiceForPay.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(payAmount),
          payment_method: payMethod,
          transaction_reference: payRef
        })
      });
      setSelectedInvoiceForPay(null);
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    }
  };

  const handleSendInvoice = async (invoiceId: number) => {
    try {
      await apiRequest(`/invoices/${invoiceId}/send`, { method: 'POST' });
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Error sending invoice');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header 
        title="Invoices, Billing & Payments" 
        subtitle="Issue sequential invoices, record payments, and track balances"
        orgName={orgName}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Total Invoices: <span className="font-bold text-slate-200">{invoices.length}</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Invoice</span>
          </button>
        </div>

        {/* Invoices Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">Invoice # & Client</th>
                  <th className="px-6 py-4">Issue / Due Date</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Paid Amount</th>
                  <th className="px-6 py-4">Balance Due</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-indigo-400 text-xs">{inv.invoice_number}</div>
                      <div className="text-slate-200 text-sm font-semibold mt-0.5">{inv.client_name || 'Client Account'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div>Issued: {new Date(inv.issue_date).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-500">Due: {new Date(inv.due_date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-100 text-sm">
                      ${Number(inv.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-emerald-400 text-xs">
                      ${Number(inv.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-400 text-xs">
                      ${Number(inv.balance_due).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : inv.status === 'partially_paid'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {inv.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                        {inv.status !== 'paid' && <Clock className="w-3 h-3" />}
                        <span>{inv.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {inv.status === 'draft' && (
                        <button
                          onClick={() => handleSendInvoice(inv.id)}
                          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send</span>
                        </button>
                      )}
                      {Number(inv.balance_due) > 0 && (
                        <button
                          onClick={() => {
                            setSelectedInvoiceForPay(inv);
                            setPayAmount(inv.balance_due.toString());
                          }}
                          className="inline-flex items-center gap-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Record Pay</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Record Payment Modal */}
        {selectedInvoiceForPay && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">Record Client Payment</h3>
                  <p className="text-xs text-indigo-400 font-mono mt-0.5">{selectedInvoiceForPay.invoice_number}</p>
                </div>
                <button onClick={() => setSelectedInvoiceForPay(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    Balance Due: ${Number(selectedInvoiceForPay.balance_due).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="bank_transfer">Wire / ACH Bank Transfer</option>
                    <option value="credit_card">Corporate Credit Card (Stripe)</option>
                    <option value="check">Check / Cheque</option>
                    <option value="cash">Direct Cash / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Reference / Transaction ID</label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. WIRE-981023 or TXN-49102"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceForPay(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition"
                  >
                    Confirm & Reconcile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Generate Invoice Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <h3 className="text-base font-bold text-white">Generate Sequential Invoice</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Select Client *</label>
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">Payment Due Date *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Invoice Notes / Instructions</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Net 14 days wire transfer..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Line items builder */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-200">Invoice Items</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Line</span>
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
                          placeholder="Line item description"
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
                    Issue Invoice
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
