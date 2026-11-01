"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, 
  User as UserIcon, // FIX: Renamed to UserIcon to avoid "Illegal constructor" error
  ChevronLeft, 
  Loader2, 
  ShieldCheck, 
  UserCog, 
  Crown, 
  Lock 
} from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '../../lib/config';

export default function NodeAuthorityManager() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNodes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/node-directory`, { withCredentials: true });
      setNodes(res.data);
    } catch (e) { 
        console.error("Authority sync failed"); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchNodes(); }, []);

  const changeRole = async (userId: string, role: string) => {
    const actionLabel = role === 'ADMIN' ? 'ELEVATE' : 'DEMOTE';
    if (!confirm(`Are you sure you want to ${actionLabel} this node to ${role}?`)) return;
    
    try {
      await axios.patch(`${API_URL}/api/admin/users/${userId}/role`, { role }, { withCredentials: true });
      alert("Grid Authority Synchronized.");
      fetchNodes(); 
    } catch (e) { 
        alert("Permission Denied: Only a Super Admin can modify node roles."); 
    }
  };

  if (loading) return (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Accessing Directory...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans text-slate-900">
      <header className="max-w-5xl mx-auto flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
            <Link href="/" className="p-3 bg-slate-900 rounded-2xl text-white hover:bg-indigo-600 transition-all shadow-xl">
                <ChevronLeft size={24}/>
            </Link>
            <div>
                <h1 className="text-3xl font-black uppercase italic leading-none">Node <span className="text-indigo-600 not-italic">Authority</span></h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Permission & Role Hierarchy Manager</p>
            </div>
        </div>
        <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-400">
            Total Active Nodes: <span className="text-indigo-600">{nodes.length}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="p-8">Contributor Identity</th>
              <th className="p-8">Grid Permission</th>
              <th className="p-8 text-right">Modify Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {nodes.map(n => (
              <tr key={n.id} className="hover:bg-slate-50/50 transition-colors group">
                {/* 1. IDENTITY */}
                <td className="p-8">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${n.role.includes('ADMIN') ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            {/* FIX: Using UserIcon component here */}
                            {n.role === 'SUPER_ADMIN' ? <Crown size={20}/> : n.role === 'ADMIN' ? <ShieldCheck size={20}/> : <UserIcon size={20}/>}
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase text-slate-900 leading-none mb-1.5">{n.firstName} {n.lastName}</p>
                            <p className="text-[10px] text-slate-400 font-mono italic">{n.email}</p>
                        </div>
                    </div>
                </td>

                {/* 2. ROLE BADGE */}
                <td className="p-8">
                  <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] border ${
                    n.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-600 border-purple-200' :
                    n.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-600 border-indigo-200' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {n.role.replace('_', ' ')}
                  </span>
                </td>

                {/* 3. ADAPTIVE ACTIONS */}
                <td className="p-8 text-right">
                  <div className="flex justify-end gap-2">
                    {n.role === 'WORKER' && (
                        <button 
                            onClick={() => changeRole(n.id, 'ADMIN')}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100"
                        >
                            Elevate to Admin
                        </button>
                    )}

                    {n.role === 'ADMIN' && (
                        <button 
                            onClick={() => changeRole(n.id, 'WORKER')}
                            className="px-6 py-2.5 border border-red-200 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                        >
                            Demote to Worker
                        </button>
                    )}

                    {n.role === 'SUPER_ADMIN' && (
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-300 tracking-widest italic pr-4">
                            <Lock size={12}/> Immutable Root Access
                        </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}