import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Clock, 
  DollarSign, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ArrowRight,
  X
} from 'lucide-react';
import { Header } from '../components/Header';
import { apiRequest, Project, Task } from '../lib/api';

export const Projects: React.FC = () => {
  const { orgName } = useOutletContext<{ orgName: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'kanban'>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  // New Project Form
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [clientId, setClientId] = useState<number>(1);
  const [budget, setBudget] = useState('15000');
  const [clients, setClients] = useState<any[]>([]);

  // New Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskVisible, setTaskVisible] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiRequest<Project[]>('/projects'),
      apiRequest<any[]>('/clients')
    ]).then(([projs, cls]) => {
      setProjects(projs);
      setClients(cls);
      if (projs.length > 0 && selectedProjectId === null) {
        setSelectedProjectId(projs[0].id);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectName,
          description: projectDesc,
          client_id: clientId,
          budget: parseFloat(budget) || 0,
          status: 'in_progress',
          priority: 'high'
        })
      });
      setShowAddProject(false);
      setProjectName('');
      setProjectDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating project');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      await apiRequest(`/projects/${selectedProjectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: taskTitle,
          priority: taskPriority,
          is_client_visible: taskVisible,
          status: 'todo'
        })
      });
      setShowAddTask(false);
      setTaskTitle('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating task');
    }
  };

  const handleMoveTask = async (task: Task, nextStatus: string) => {
    try {
      await apiRequest(`/projects/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error moving task');
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const kanbanColumns = [
    { id: 'todo', title: 'To Do', color: 'border-slate-700' },
    { id: 'in_progress', title: 'In Progress', color: 'border-indigo-500/50' },
    { id: 'in_review', title: 'In Review', color: 'border-amber-500/50' },
    { id: 'done', title: 'Completed', color: 'border-emerald-500/50' },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header 
        title="Projects & Kanban Boards" 
        subtitle="Sprint progress, client-facing milestones, and delivery tracking"
        orgName={orgName}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* View Switcher & Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Projects List
            </button>
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'kanban' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive Kanban
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'kanban' && (
              <button
                onClick={() => setShowAddTask(true)}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add Task</span>
              </button>
            )}
            <button
              onClick={() => setShowAddProject(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </div>

        {/* View Mode: Projects List */}
        {activeTab === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div key={p.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                      {p.client_name || 'Enterprise Client'}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      p.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{p.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {p.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Progress</span>
                      <span className="font-bold text-indigo-400">{p.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${p.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>${Number(p.budget).toLocaleString()}</span>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setActiveTab('kanban');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <span>Open Kanban</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Kanban Board View */
          <div className="space-y-4">
            {/* Project Picker dropdown */}
            <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs font-semibold text-slate-400">Active Board:</span>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.client_name})</option>
                ))}
              </select>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {kanbanColumns.map((col) => {
                const colTasks = selectedProject?.tasks?.filter(t => t.status === col.id) || [];
                return (
                  <div key={col.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col min-h-[480px]">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-200 tracking-tight">{col.title}</span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {colTasks.map((t) => (
                        <div key={t.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              t.priority === 'urgent' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                            }`}>
                              {t.priority}
                            </span>
                            {t.is_client_visible ? (
                              <span title="Client Visible Task" className="text-emerald-400">
                                <Eye className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span title="Private Agency Only Task" className="text-slate-500">
                                <EyeOff className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-semibold text-slate-200 leading-snug">{t.title}</div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px]">
                            {col.id === 'todo' && (
                              <button
                                onClick={() => handleMoveTask(t, 'in_progress')}
                                className="text-indigo-400 hover:underline font-semibold"
                              >
                                Start →
                              </button>
                            )}
                            {col.id === 'in_progress' && (
                              <button
                                onClick={() => handleMoveTask(t, 'in_review')}
                                className="text-amber-400 hover:underline font-semibold"
                              >
                                Send to Review →
                              </button>
                            )}
                            {col.id === 'in_review' && (
                              <button
                                onClick={() => handleMoveTask(t, 'done')}
                                className="text-emerald-400 hover:underline font-semibold"
                              >
                                Complete ✓
                              </button>
                            )}
                            {col.id === 'done' && (
                              <span className="text-emerald-400 font-semibold text-[10px]">Verified ✓</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Project Modal */}
        {showAddProject && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <h3 className="text-base font-bold text-white">Create New Project</h3>
                <button onClick={() => setShowAddProject(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Next-Gen Mobile Storefront"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Client *</label>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Total Project Budget ($)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="25000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Scope & Description</label>
                  <textarea
                    rows={3}
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Key deliverables and sprint objectives..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition"
                  >
                    Launch Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <h3 className="text-base font-bold text-white">Add Kanban Task</h3>
                <button onClick={() => setShowAddTask(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Implement Webhook Handler"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="visibleToggle"
                    checked={taskVisible}
                    onChange={(e) => setTaskVisible(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="visibleToggle" className="text-xs text-slate-300 font-medium">
                    Visible to Client on their Portal
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition"
                  >
                    Add Task
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
