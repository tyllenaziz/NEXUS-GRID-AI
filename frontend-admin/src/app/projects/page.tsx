"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FolderOpen, ChevronLeft, Loader2, 
  Play, Pause, Archive, Plus, Hash, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '../../lib/config';

export default function ProjectList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/projects`, { withCredentials: true });
      setProjects(res.data);
    } catch (err) { 
      console.error("Fetch failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  /**
   * ACTION: Update Project Status (Pause/Active/Archive)
   */
  const handleStatusUpdate = async (id: string, status: string) => {
    if (!id) {
      alert("❌ System Error: This project has no unique ID. Please use the Delete button to remove it.");
      return;
    }

    try {
      const res = await axios.patch(`${API_URL}/api/admin/projects/${id}/status`, { status }, { withCredentials: true });
      if (res.data.success) {
          alert(`Success: Domain status synchronized to ${status}`);
          fetchProjects(); // Refresh the list to update colors
      }
    } catch (err) { 
      alert("Status update failed. Check backend connectivity."); 
    }
};

  /**
   * ACTION: Permanent Delete
   */
  const handleDelete = async (id: string, name: string) => {
    // If the ID is completely missing from the database record
    if (!id) {
        alert("Corrupted Data: This project record is missing its ID. Please recreate a new project with a unique Reference ID.");
        return;
    }

    const confirmPurge = confirm(`⚠️ PERMANENT PURGE: Are you sure you want to delete "${name}"? \n\nThis will remove the project and its chat channel. This cannot be undone.`);
    
    if (!confirmPurge) return;

    try {
      await axios.delete(`${API_URL}/api/admin/projects/${id}`, { withCredentials: true });
      alert("Project mapping purged successfully.");
      fetchProjects();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Purge failed.";
      alert(msg + " (Ensure the project has 0 tasks before deleting)");
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Accessing Grid Mapping...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-slate-900 p-3 rounded-2xl text-white hover:bg-indigo-600 transition-all shadow-lg">
            <ChevronLeft size={20}/>
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tight italic">Project <span className="text-indigo-600 not-italic">Mapping</span></h1>
        </div>
        <Link href="/projects/new" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">
            <Plus size={16}/> New Project Architect
        </Link>
      </header>

      <main className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Project Name / Reference</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Current Status</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Chat Channel</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Inventory</th>
              <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((p) => (
              <tr key={p.id || p.name} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><FolderOpen size={18}/></div>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-900 leading-none mb-1.5">{p.name}</p>
                      <p className="text-[9px] font-mono text-slate-400 tracking-tighter uppercase">{p.id || "ID_MISSING"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                    p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Hash size={12}/>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{p.name.toUpperCase().replace(/\s+/g, '_')}</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-[11px] font-black text-slate-600">{p._count?.tasks || 0} Tasks</td>
                <td className="px-8 py-6 text-right space-x-2">
                  
                  {/* PAUSE / PLAY */}
                  <button 
                    onClick={() => handleStatusUpdate(p.id, p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')} 
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
                    title="Toggle Status"
                  >
                    {p.status === 'ACTIVE' ? <Pause size={14}/> : <Play size={14}/>}
                  </button>
                  
                  {/* ARCHIVE */}
                  <button 
                    onClick={() => handleStatusUpdate(p.id, 'COMPLETED')} 
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Archive Project"
                  >
                    <Archive size={14}/>
                  </button>

                  {/* DELETE */}
                  <button 
                    onClick={() => handleDelete(p.id, p.name)} 
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Delete Project"
                  >
                    <Trash2 size={14}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}