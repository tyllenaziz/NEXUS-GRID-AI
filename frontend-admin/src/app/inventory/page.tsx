"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, ChevronLeft, Package, Search, Filter, Database } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '../../lib/config';
export default function TaskInventory() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/all-tasks`, { withCredentials: true });
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleDelete = async (task: any) => {
    // /all-tasks includes _count.submissions — use it to tailor the warning
    // so admins know up front whether worker progress is at stake.
    const submissionCount = task._count?.submissions || 0;
    const hasSubmissions = submissionCount > 0;

    const confirmMsg = hasSubmissions
      ? `⚠️ This task has ${submissionCount} active submission${submissionCount === 1 ? '' : 's'}. Deleting it will also wipe all worker progress for this task. Proceed?`
      : "Confirm Delete: This task will be removed from all worker dashboards. Proceed?";

    if (!confirm(confirmMsg)) return;

    try {
      await axios.delete(`${API_URL}/api/admin/tasks/${task.id}`, { withCredentials: true });
      alert("Task successfully purged.");
      fetchTasks(); // Refresh the list
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      alert(serverMessage || "Failed to delete task. Please check server logs.");
    }
  };

  const filteredTasks = filter === 'ALL' ? tasks : tasks.filter(t => t.type === filter);

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="bg-slate-900 p-2.5 rounded-2xl text-white hover:bg-orange-600 transition-colors">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">Task <span className="text-orange-600">Inventory</span></h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Database Management</p>
            </div>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
             {['ALL', 'PREFERENCE_RANKING', 'TEXT_CLASSIFICATION', 'SENTIMENT_ANALYSIS', 'FACT_CHECKING'].map((t) => (
                <button 
                  key={t} 
                  onClick={() => setFilter(t)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filter === t ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  {t.replace('_ANALYSIS', '').replace('_RANKING', '').replace('TEXT_', '')}
                </button>
             ))}
          </div>
        </header>

        {loading ? (
            <div className="py-20 text-center text-slate-400 font-bold animate-pulse">Querying Database...</div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Type / Label</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Project</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Pay Rate</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Created</th>
                  <th className="p-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6">
                        <span className="text-[10px] font-black text-indigo-500 uppercase block mb-1">{task.type.replace('_', ' ')}</span>
                        <span className="font-bold text-slate-800">{task.title}</span>
                    </td>
                    <td className="p-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                           <Database size={12}/> {task.project?.name || "Unassigned"}
                        </div>
                    </td>
                    <td className="p-6">
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-black">${parseFloat(task.payRate).toFixed(2)}</span>
                    </td>
                    <td className="p-6 text-xs text-slate-400 font-medium">
                        {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-6 text-right">
                       <button 
                         onClick={() => handleDelete(task)}
                         className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        >
                         <Trash2 size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTasks.length === 0 && (
                <div className="py-20 text-center">
                    <Package size={48} className="mx-auto text-slate-200 mb-4"/>
                    <p className="text-slate-400 font-medium italic">No tasks found in this category.</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}