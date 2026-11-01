"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, XCircle, CheckCircle2, ChevronLeft, 
  Loader2, Camera, Search, RotateCcw, UserCircle, 
  ShieldAlert, UserX, Trash2, FileText, UserSquare2 
} from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '../../lib/config';

export default function BiometricAudit() {
  const [allNodes, setAllNodes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/node-directory`, { withCredentials: true });
      setAllNodes(res.data);
    } catch (e) { 
      console.error("Directory sync failed:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDecision = async (userId: string, status: 'VERIFIED' | 'SUSPENDED') => {
    const confirmMsg = status === 'SUSPENDED' 
      ? "🚨 PERMANENT TERMINATION: Suspend this node for biometric fraud? This is non-reversible."
      : "Authorize this node for production access?";

    if (!confirm(confirmMsg)) return;

    try {
      await axios.patch(`${API_URL}/api/admin/users/${userId}/status`, { status }, { withCredentials: true });
      alert(`Node updated to ${status}`);
      fetchData();
    } catch (e) { 
      alert("Update failed."); 
    }
  };

  const triggerReverify = async (userId: string) => {
    if (!confirm("FORCE RE-SCAN? This locks the dashboard until a new biometric pulse is captured.")) return;
    try {
      await axios.patch(`${API_URL}/api/admin/users/${userId}/request-reverify`, {}, { withCredentials: true });
      alert("Re-verification protocol activated.");
      fetchData();
    } catch (e) { 
      alert("Request failed."); 
    }
  };

  const purgeNode = async (userId: string, name: string) => {
    const confirmation = prompt(
      `⚠️ PERMANENT DELETION ⚠️\n\nThis will permanently erase ${name} and ALL associated data from the database. This action CANNOT be undone.\n\nType PURGE in all caps to confirm:`
    );

    if (confirmation !== 'PURGE') return;

   try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}/purge`, { withCredentials: true });
      alert("Node permanently purged from the grid.");
      fetchData();
    } catch (e) {
      alert("Purge failed. Check server logs.");
    }
  };

  // Filters
  const pending = allNodes.filter(u => u.status === 'PENDING_VERIFICATION');
  const incomplete = allNodes.filter(u => u.status === 'UNVERIFIED'); 
  const verified = allNodes.filter(u => 
    u.status === 'VERIFIED' && 
    (u.email.toLowerCase().includes(search.toLowerCase()) || u.firstName.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40}/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans text-slate-900">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-16">
        <div className="flex items-center gap-6">
          <Link href="/" className="p-3 bg-slate-900 rounded-2xl text-white hover:bg-indigo-600 transition-all shadow-xl"><ChevronLeft size={24}/></Link>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight italic leading-none">Biometric <span className="text-indigo-600 not-italic">Audit</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Fraud Prevention & Identity Desk</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-24">
        
        {/* SECTION 1: PENDING IDENTITY PACKAGES (THE 3-STEP REVIEW) */}
        <section>
            <div className="flex items-center gap-3 mb-10">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_orange]"/>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Unresolved Identity Packages ({pending.length})</h2>
            </div>

            {pending.length > 0 ? (
                <div className="grid grid-cols-1 gap-10">
                    {pending.map((u) => (
                        <div key={u.id} className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm hover:shadow-2xl transition-all relative group">
                            
                            {/* THREE-PANE IDENTITY VIEWER */}
                            <div className="grid md:grid-cols-3 gap-6 mb-10">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2"><FileText size={12}/> ID Front</label>
                                    <div className="aspect-video bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-200 shadow-inner">
                                        <img src={u.workerProfile?.governmentIdFrontUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="ID Front" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2"><FileText size={12}/> ID Back</label>
                                    <div className="aspect-video bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-200 shadow-inner">
                                        <img src={u.workerProfile?.governmentIdBackUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="ID Back" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2 ml-2"><UserSquare2 size={12}/> Face Pulse</label>
                                    <div className="aspect-video bg-slate-100 rounded-[2rem] overflow-hidden border-2 border-indigo-100 shadow-inner">
                                        <img src={u.workerProfile?.faceVerificationUrl} className="w-full h-full object-cover" alt="Face Scan" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                                <div className="text-center md:text-left">
                                    <p className="font-black uppercase text-xl text-slate-900 tracking-tight leading-none">{u.firstName} {u.lastName}</p>
                                    <p className="text-xs font-mono text-slate-400 mt-2">{u.email}</p>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => handleDecision(u.id, 'VERIFIED')} 
                                        className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                    >
                                        <ShieldCheck size={18}/> Authorize Node
                                    </button>
                                    <button 
                                        onClick={() => handleDecision(u.id, 'SUSPENDED')} 
                                        className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                                    >
                                        <UserX size={18}/> Reject Fraud
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 bg-white border border-dashed border-slate-200 rounded-[3rem] text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Identity Queue Empty</p>
                </div>
            )}
        </section>

        {/* SECTION: INCOMPLETE ACCOUNTS */}
        <section className="mb-20">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-2 h-2 bg-slate-400 rounded-full"/>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Inactive / Incomplete Nodes ({incomplete.length})</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {incomplete.map((u) => (
                    <div key={u.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] flex justify-between items-center shadow-sm hover:border-red-200 transition-all">
                        <div>
                            <p className="font-black uppercase text-xs text-slate-900">{u.firstName} {u.lastName}</p>
                            <p className="text-[9px] font-mono text-slate-400">{u.email}</p>
                        </div>
                        <button onClick={() => purgeNode(u.id, `${u.firstName} ${u.lastName}`)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
        </section>

        {/* SECTION 2: THE DIRECTORY */}
        <section className="pt-10 border-t border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-indigo-600" size={20}/>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Fleet Identity Management</h2>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                    <input 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter Nodes..." 
                        className="bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold outline-none focus:border-indigo-500 transition-all w-full md:w-80 shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400">
                            <th className="px-10 py-6 text-[9px] font-black uppercase tracking-widest">Node Contributor</th>
                            <th className="px-6 py-6 text-[9px] font-black uppercase tracking-widest text-center">Status</th>
                            <th className="px-10 py-6 text-[9px] font-black uppercase tracking-widest text-right">Emergency Protocols</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {verified.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-all group">
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100"><UserCircle size={22}/></div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-slate-900 leading-none mb-1">{u.firstName} {u.lastName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 leading-none">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-center">
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[8px] font-black uppercase tracking-widest">Identity Secured</span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => triggerReverify(u.id)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:bg-amber-500 hover:text-white transition-all flex items-center gap-2"><RotateCcw size={12}/> Re-Scan</button>
                                        <button onClick={() => handleDecision(u.id, 'SUSPENDED')} className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 text-[8px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"><UserX size={12}/> Terminate</button>
                                        <button onClick={() => purgeNode(u.id, `${u.firstName} ${u.lastName}`)} className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-[8px] font-black uppercase tracking-widest hover:bg-red-900 transition-all flex items-center gap-2 shadow-sm"><Trash2 size={12}/> Purge</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
      </main>
    </div>
  );
}