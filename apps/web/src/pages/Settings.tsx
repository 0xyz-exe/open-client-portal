import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Settings as SettingsIcon, Building2, Lock, Save, CheckCircle2 } from 'lucide-react';
import { Header } from '../components/Header';
import { apiRequest } from '../lib/api';

export const Settings: React.FC = () => {
  const { orgName } = useOutletContext<{ orgName: string }>();
  const [name, setName] = useState(orgName);
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savedOrg, setSavedOrg] = useState(false);
  const [savedPass, setSavedPass] = useState(false);

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/organization', {
        method: 'PUT',
        body: JSON.stringify({ name, currency, timezone })
      });
      setSavedOrg(true);
      setTimeout(() => setSavedOrg(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      setCurrentPassword('');
      setNewPassword('');
      setSavedPass(true);
      setTimeout(() => setSavedPass(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error changing password');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header 
        title="Organization & Account Settings" 
        subtitle="Manage workspace parameters, default currency, and account credentials"
        orgName={orgName}
      />

      <main className="p-8 max-w-4xl w-full mx-auto space-y-8">
        {/* Organization Profile Settings */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Organization Configuration</h2>
              <p className="text-xs text-slate-400">Settings applicable to client proposals and invoices</p>
            </div>
          </div>

          {savedOrg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Organization settings saved successfully.</span>
            </div>
          )}

          <form onSubmit={handleUpdateOrg} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Agency Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Default Billing Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="IDR">IDR (Rp)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Workspace Changes</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <Lock className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Security & Password</h2>
              <p className="text-xs text-slate-400">Update your account credentials</p>
            </div>
          </div>

          {savedPass && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Password updated successfully.</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition"
            >
              <Save className="w-3.5 h-3.5 text-indigo-400" />
              <span>Change Password</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
