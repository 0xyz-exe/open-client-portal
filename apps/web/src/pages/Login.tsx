import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Mail, Sparkles, Building2, UserCircle2 } from 'lucide-react';
import { apiRequest, setAuthToken, setStoredUser, setActiveOrgId } from '../lib/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [roleTab, setRoleTab] = useState<'agency' | 'client'>('agency');
  const [email, setEmail] = useState('owner@vortexagency.io');
  const [password, setPassword] = useState('AgencyOwner2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillAgencyDemo = () => {
    setRoleTab('agency');
    setEmail('owner@vortexagency.io');
    setPassword('AgencyOwner2026!');
    setError(null);
  };

  const fillClientDemo = () => {
    setRoleTab('client');
    setEmail('client@acmeglobal.com');
    setPassword('ClientPortal2026!');
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<{ access_token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      setAuthToken(data.access_token);
      setStoredUser(data.user);

      if (data.user.global_role === 'client') {
        navigate('/portal');
      } else {
        // Fetch agency org
        try {
          const orgs = await apiRequest<any[]>('/auth/organizations');
          if (orgs && orgs.length > 0) {
            setActiveOrgId(orgs[0].id.toString());
          }
        } catch (err) {
          // ignore
        }
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">OpenPortal</span>
          </Link>
          <p className="text-xs text-slate-400">Self-Hosted Client Workspace for Agencies & Freelancers</p>
        </div>

        {/* Quick Demo Pre-Fill Banner */}
        <div className="mb-6 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs text-indigo-300 font-medium">Quick Demo Access</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillAgencyDemo}
              className="text-[11px] font-semibold bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 px-2.5 py-1 rounded-md transition"
            >
              Agency Staff
            </button>
            <button
              type="button"
              onClick={fillClientDemo}
              className="text-[11px] font-semibold bg-violet-600/40 hover:bg-violet-600/60 text-violet-200 px-2.5 py-1 rounded-md transition"
            >
              Client Portal
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-7">
          {/* Tab selector */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl mb-6">
            <button
              type="button"
              onClick={fillAgencyDemo}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
                roleTab === 'agency'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Agency Team</span>
            </button>
            <button
              type="button"
              onClick={fillClientDemo}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
                roleTab === 'client'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCircle2 className="w-3.5 h-3.5" />
              <span>Client Portal</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <span className="text-[11px] text-slate-500">Secure Vault</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : `Sign In to ${roleTab === 'agency' ? 'Agency Workspace' : 'Client Portal'}`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <span className="text-xs text-slate-500">New Agency Owner? </span>
            <Link to="/register" className="text-xs font-semibold text-indigo-400 hover:underline">
              Initialize New Organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
