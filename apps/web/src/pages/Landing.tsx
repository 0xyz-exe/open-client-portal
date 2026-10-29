import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight, 
  Receipt, 
  FolderLock, 
  FileText, 
  Terminal, 
  Globe2, 
  Layers, 
  Sparkles 
} from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-800/80 px-8 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">OpenPortal</span>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase block -mt-1">Self-Hosted Engine</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#architecture" className="hover:text-white transition">Architecture</a>
          <a href="#security" className="hover:text-white transition">Multi-Tenant Security</a>
          <a href="#pricing" className="hover:text-white transition">Open Source</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            to="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 transition"
          >
            Sign In
          </Link>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 transition active:scale-95"
          >
            <span>Live Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-16 pb-24 w-full">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modern Self-Hosted Alternative to HoneyBook & Copilot</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
            Your clients. Your projects. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200">
              Your infrastructure.
            </span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-8">
            The free, open-source client portal and CRM built for freelancers, software agencies, and studios. Deliver projects, share files, get client approvals, and collect payments on your own terms.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-xl shadow-xl shadow-indigo-600/25 transition"
            >
              <Briefcase className="w-4 h-4" />
              <span>Explore Agency Workspace</span>
            </Link>
            <Link
              to="/portal"
              className="inline-flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-semibold px-6 py-3.5 rounded-xl transition"
            >
              <Users className="w-4 h-4" />
              <span>View Client Portal</span>
            </Link>
          </div>

          {/* Quick Stats / Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-xs text-slate-400 mt-1">Open Source & Self-Hosted</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-2xl font-bold text-white">Zero</div>
              <div className="text-xs text-slate-400 mt-1">Mandatory Cloud Subscriptions</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-2xl font-bold text-white">Strict</div>
              <div className="text-xs text-slate-400 mt-1">Multi-Tenant Data Isolation</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-2xl font-bold text-white">Docker</div>
              <div className="text-xs text-slate-400 mt-1">1-Command Production Deploy</div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <section id="features" className="mt-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Complete Freelancer & Agency Operating System</h2>
            <p className="text-slate-400 text-sm mt-2">Everything you need to run high-value client projects without 6 different SaaS subscriptions.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">CRM & Client Accounts</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Centralized directory of individual and corporate clients, contact records, billing info, and 1-click portal credentials generation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Projects, Milestones & Kanban</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Track project health, progress bars, milestone deadlines, and task boards with granular visibility toggles for client transparency.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Deliverables & Approvals</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Submit design assets, code repos, and prototypes for formal client review with immutable approval audit trails and feedback threads.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Itemized Proposals & Contracts</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Generate clean scoped proposals with automated tax and discount math. Clients can review and digitally sign via public links.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Invoicing & Balance Reconciliation</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sequential invoice numbering, decimal arithmetic, manual and wire payment logging, partial payments, and overdue tracking.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
                <FolderLock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Private File Hub & Privacy Controls</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Store contracts and deliverables securely on local storage or S3. Strictly enforce internal vs client-visible discussions.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Docker CTA */}
        <section className="mt-28 p-10 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white">Deploy In 60 Seconds with Docker</h2>
            <p className="text-slate-400 text-sm mt-3 mb-6">Run your own independent client portal with full data ownership. No telemetry, no lock-in.</p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left font-mono text-xs text-slate-300 flex items-center justify-between">
              <code>docker compose up -d</code>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded">Quick Start</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-8 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <div>© 2026 Open Client Portal. Licensed under MIT.</div>
        <div className="flex items-center gap-6 mt-4 sm:mt-0">
          <a href="#features" className="hover:text-slate-300">Docs</a>
          <a href="#security" className="hover:text-slate-300">Security</a>
          <a href="#privacy" className="hover:text-slate-300">Privacy</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-300">GitHub</a>
        </div>
      </footer>
    </div>
  );
};
