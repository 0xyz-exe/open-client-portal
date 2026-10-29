import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FileCheck2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  MessageSquare,
  X
} from 'lucide-react';
import { Header } from '../components/Header';
import { apiRequest, Project } from '../lib/api';

export const Deliverables: React.FC = () => {
  const { orgName } = useOutletContext<{ orgName: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form
  const [projectId, setProjectId] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const loadDeliverables = () => {
    setLoading(true);
    apiRequest<Project[]>('/projects')
      .then(projs => {
        setProjects(projs);
        if (projs.length > 0) setProjectId(projs[0].id);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeliverables();
  }, []);

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/projects/${projectId}/deliverables`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          file_url: fileUrl
        })
      });
      setShowSubmitModal(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      loadDeliverables();
    } catch (err: any) {
      alert(err.message || 'Error submitting deliverable');
    }
  };

  // Flatten deliverables
  const allDeliverables: any[] = [];
  projects.forEach(p => {
    (p.deliverables || []).forEach(d => {
      allDeliverables.push({
        ...d,
        projectName: p.name,
        clientName: p.client_name
      });
    });
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header 
        title="Deliverables & Formal Approvals" 
        subtitle="Manage client sign-offs, feedback loops, and deliverable reviews"
        orgName={orgName}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Total Deliverables: <span className="font-bold text-slate-200">{allDeliverables.length}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Deliverable for Review</span>
          </button>
        </div>

        {/* Deliverables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allDeliverables.map((deliv) => (
            <div key={deliv.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    {deliv.clientName || 'Acme Global'}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    deliv.status === 'approved' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : deliv.status === 'rejected'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {deliv.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                    {deliv.status === 'rejected' && <XCircle className="w-3 h-3" />}
                    {deliv.status === 'pending_review' && <Clock className="w-3 h-3" />}
                    <span>{deliv.status.replace('_', ' ')}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5">{deliv.title}</h3>
                <div className="text-xs text-slate-400 font-medium mb-3">Project: {deliv.projectName}</div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {deliv.description || 'No description provided.'}
                </p>

                {deliv.client_feedback && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-4">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Client Feedback Remark</span>
                    </div>
                    <p className="text-xs text-slate-400 italic">"{deliv.client_feedback}"</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  Submitted {new Date(deliv.created_at).toLocaleDateString()}
                </span>
                {deliv.file_url && (
                  <a
                    href={deliv.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <span>Inspect Deliverable</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Deliverable Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <h3 className="text-base font-bold text-white">Submit Deliverable for Client Review</h3>
                <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitDeliverable} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Project *</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.client_name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Deliverable Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. High-Fidelity Figma Prototype V2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">External File / Asset URL</label>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://figma.com/file/... or https://github.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description & Verification Notes</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Highlight what changed and what specifically needs client approval..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition"
                  >
                    Submit to Client
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
