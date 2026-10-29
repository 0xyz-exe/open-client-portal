import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FolderLock, 
  UploadCloud, 
  FileText, 
  Download, 
  Eye, 
  EyeOff, 
  Search, 
  X
} from 'lucide-react';
import { Header } from '../components/Header';
import { apiRequest, DocumentFile, getAuthToken, getActiveOrgId } from '../lib/api';

export const Documents: React.FC = () => {
  const { orgName } = useOutletContext<{ orgName: string }>();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('contracts');
  const [isClientVisible, setIsClientVisible] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const loadDocs = () => {
    setLoading(true);
    apiRequest<DocumentFile[]>(`/documents?category=${category}`)
      .then(docs => setDocuments(docs))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocs();
  }, [category]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', selectedCategory);
    formData.append('is_client_visible', isClientVisible.toString());
    formData.append('file', file);

    const token = getAuthToken();
    const orgId = getActiveOrgId();

    try {
      const res = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(orgId ? { 'X-Organization-Id': orgId } : {})
        },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      setShowUploadModal(false);
      setTitle('');
      setFile(null);
      loadDocs();
    } catch (err: any) {
      alert(err.message || 'Error uploading file');
    }
  };

  const categories = [
    { id: 'all', name: 'All Files' },
    { id: 'contracts', name: 'Legal & Contracts' },
    { id: 'deliverables', name: 'Deliverables & Assets' },
    { id: 'invoices', name: 'Billing & Invoices' },
    { id: 'general', name: 'Briefs & General' },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header 
        title="Documents & Secure File Storage" 
        subtitle="S3 and local storage vault with tenant and client visibility policies"
        orgName={orgName}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto w-full sm:w-auto">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  category === c.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Document</span>
          </button>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => (
            <div key={doc.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950 text-indigo-400 border border-slate-800 px-2.5 py-0.5 rounded-full">
                    {doc.category}
                  </span>
                  {doc.is_client_visible ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-medium" title="Client can view & download">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Client Visible</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium" title="Agency staff confidential">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Internal Only</span>
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{doc.title}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{doc.file_name}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                </span>
                <a
                  href={`/api/v1/documents/${doc.id}/download`}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                >
                  <Download className="w-3 h-3 text-indigo-400" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <h3 className="text-base font-bold text-white">Upload Secure File</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Executed Master Services Agreement"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">File Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="contracts">Legal & Contracts</option>
                    <option value="deliverables">Deliverables & Assets</option>
                    <option value="invoices">Billing & Invoices</option>
                    <option value="general">Briefs & General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select File *</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="clientVisible"
                    checked={isClientVisible}
                    onChange={(e) => setIsClientVisible(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="clientVisible" className="text-xs text-slate-300 font-medium">
                    Authorize client portal access to this file
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition"
                  >
                    Upload Document
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
