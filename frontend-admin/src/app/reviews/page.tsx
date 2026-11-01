"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ChevronLeft, ShieldCheck, XCircle, Star, 
  AlertTriangle, Eye, Clock, MessageSquare, 
  Flag, CheckCircle2, ShieldAlert, Zap, Loader2, UserX,
  Users, Activity, UserCircle, RefreshCcw
} from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '../../lib/config';
export default function ReviewConsole() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  // 1. DATA ACQUISITION
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, nodeRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/all-submissions`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/node-directory`, { withCredentials: true })
      ]);
      setSubmissions(subRes.data);
      setNodes(nodeRes.data);
    } catch (err) {
      console.error("Management sync failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. AUDIT LOGIC
  const handleReview = async (id: string, score: number, status: string, isRedFlag = false) => {
    const feedback = prompt(`Audit Feedback for ${status}:`);
    if (feedback === null) return;

    try {
      await axios.post(`${API_URL}/api/admin/review`, {
        submissionId: id, score, status, feedback, isRedFlag
      }, { withCredentials: true });
      
      alert("✅ Audit Finalized.");
      fetchData();
      setSelectedSub(null);
    } catch (err) { 
      alert("❌ Audit sync failed."); 
    }
  };

  // 3. GOVERNANCE LOGIC
  const handleStatusUpdate = async (workerId: string, status: string) => {
    if (!workerId) return alert("System Error: Reference ID Missing.");

    const confirmMsg = status === 'SUSPENDED' 
        ? "🚨 PERMANENT TERMINATION: This node will be locked out and pending funds voided. Proceed?" 
        : `Restore node status to VERIFIED?`;

    if (!confirm(confirmMsg)) return;

   try {
      await axios.patch(`${API_URL}/api/admin/users/${workerId}/status`, { status }, { withCredentials: true });
      alert(`Node updated to ${status}`);
      fetchData();
    } catch (err) {
      alert("Status update failed.");
    }
  };

  const handleIssueWarning = async (workerId: string) => {
    if (!confirm("Issue compliance warning? Node access is automatically gated at 3 warnings.")) return;
    try {
      await axios.post(`${API_URL}/api/admin/users/${workerId}/warn`, {}, { withCredentials: true });
      alert("Warning transmitted and logged.");
      fetchData();
    } catch (err) {
      alert("Warning transmission failed.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 md:p-12 font-sans" suppressHydrationWarning>
      
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-slate-900 p-2.5 rounded-2xl text-white hover:bg-indigo-600 transition-all shadow-lg">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight leading-none italic">Quality <span className="text-indigo-600 text-not-italic">Audit</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Precision Verification Console</p>
          </div>
        </div>
        <div className="flex gap-4">
            <StatsBadge label="Pending Review" value={submissions.filter(s => s.status === 'PENDING').length} color="text-indigo-600" />
            <StatsBadge label="Gated Nodes" value={nodes.filter(n => n.status === 'UNDER_REVIEW' || n.status === 'SUSPENDED').length} color="text-red-500" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-12 gap-8 mb-20">
        
        {/* SUBMISSION QUEUE (LEFT) */}
        <div className="col-span-12 lg:col-span-5 space-y-4 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2 px-4"><Activity size={14}/> Active Audit Stream</h2>
            {submissions.map((s) => (
                <button 
                    key={s.id} 
                    onClick={() => setSelectedSub(s)}
                    className={`w-full text-left p-6 rounded-[2.5rem] border transition-all flex justify-between items-center group ${selectedSub?.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                >
                    <div className="flex gap-4 items-center">
                        <div className={`p-3 rounded-xl ${selectedSub?.id === s.id ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
                            {s.isSuspicious ? <AlertTriangle size={18} className="text-amber-500 animate-pulse"/> : <Clock size={18}/>}
                        </div>
                        <div>
                            <div className={`text-xs font-black uppercase tracking-tight ${selectedSub?.id === s.id ? 'text-white' : 'text-slate-900'}`}>{s.worker.firstName} {s.worker.lastName}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest ${selectedSub?.id === s.id ? 'text-indigo-100' : 'text-slate-400'}`}>{s.task.title}</div>
                        </div>
                    </div>
                    {s.status !== 'PENDING' && <CheckCircle2 size={18} className="text-emerald-400"/>}
                </button>
            ))}
        </div>

        {/* AUDIT WORKSPACE (RIGHT) */}
        <div className="col-span-12 lg:col-span-7">
            {selectedSub ? (
                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm sticky top-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission ID</span>
                            <h2 className="text-xs font-mono font-bold text-slate-900">{selectedSub.id}</h2>
                        </div>
                        <div className="text-right">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Worker Accuracy</span>
                             <span className="text-xs font-black text-indigo-600">{selectedSub.worker.accuracyScore?.toFixed(1) || '0.0'} / 5.0</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 italic text-slate-700 leading-relaxed text-sm font-medium">
                        <div className="text-[10px] not-italic font-black text-indigo-600 uppercase mb-4 tracking-widest flex items-center gap-2"><MessageSquare size={14}/> Node Justification</div>
                        "{selectedSub.answers?.justification || "No text provided."}"
                    </div>

                    {/* ACTION PANEL */}
                    <div className="pt-8 border-t border-slate-100">
                        <div className="text-center mb-8">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assign Quality Rating</div>
                             <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button 
                                        key={star} 
                                        onClick={() => handleReview(selectedSub.id, star, 'APPROVED')} 
                                        className="p-2 text-slate-200 hover:text-amber-400 transition-all hover:scale-125"
                                    >
                                        <Star fill="currentColor" size={36}/>
                                    </button>
                                ))}
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button onClick={() => handleReview(selectedSub.id, 1, 'REJECTED_REVISION_NEEDED', true)} className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-red-50 text-red-600 font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                <Flag size={16}/> Low Effort / Revise
                            </button>
                            <button onClick={() => handleReview(selectedSub.id, 1, 'REJECTED_PERMANENT', false)} className="flex items-center justify-center gap-3 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                                <XCircle size={16}/> Permanent Deny
                            </button>
                        </div>

                        {/* GOVERNANCE ACTIONS */}
                        <div className="pt-8 border-t border-slate-100">
                             <div className="flex items-center gap-2 mb-6">
                                <ShieldAlert size={14} className="text-red-500" />
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Node Compliance Control</label>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <button onClick={() => handleStatusUpdate(selectedSub.worker.id, 'UNDER_REVIEW')} className="py-4 rounded-xl bg-amber-50 text-amber-600 font-black uppercase text-[8px] tracking-widest hover:bg-amber-600 hover:text-white transition-all border border-amber-200">
                                    Hold Node
                                </button>
                                <button onClick={() => handleIssueWarning(selectedSub.worker.id)} className="py-4 rounded-xl bg-orange-50 text-orange-600 font-black uppercase text-[8px] tracking-widest hover:bg-orange-600 hover:text-white transition-all border border-orange-200">
                                    Issue Warning
                                </button>
                                <button onClick={() => handleStatusUpdate(selectedSub.worker.id, 'SUSPENDED')} className="py-4 rounded-xl bg-red-600 text-white font-black uppercase text-[8px] tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-100">
                                    <UserX size={12}/> Suspend Node
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-[600px] bg-white border border-slate-200 border-dashed rounded-[3rem] flex flex-col items-center justify-center text-slate-300">
                    <Zap size={48} className="mb-4 opacity-10 animate-pulse"/>
                    <p className="font-black uppercase text-[10px] tracking-[0.4em]">Select a transmission to audit</p>
                </div>
            )}
        </div>
      </main>

      {/* COMPLIANCE & NODE DIRECTORY SECTION (SPREADSHEET DESIGN) */}
      <section className="max-w-7xl mx-auto pt-20 border-t border-slate-200">
          <div className="flex items-center justify-between mb-8">
              <div>
                  <h2 className="text-xl font-black uppercase tracking-tight italic">Node <span className="text-red-600 not-italic">Intervention</span> Queue</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Showing only accounts requiring manual oversight or terminated nodes.</p>
              </div>
              <div className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  <Activity size={14} className="text-amber-400 animate-pulse"/>
                  {nodes.filter(n => n.status !== 'VERIFIED').length} Flagged Nodes
              </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Contributor</th>
                          <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Current Status</th>
                          <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Warnings</th>
                          <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Accuracy</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Emergency Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {nodes
                          .filter(node => node.status === 'UNDER_REVIEW' || node.status === 'SUSPENDED') 
                          .map((node) => (
                          <tr key={node.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${node.status === 'SUSPENDED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                          {node.firstName[0]}{node.lastName[0]}
                                      </div>
                                      <div>
                                          <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1.5">{node.firstName} {node.lastName}</p>
                                          <p className="text-[10px] font-bold text-slate-400 leading-none">{node.email}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-6">
                                  <span className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                      node.status === 'SUSPENDED' 
                                      ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-100' 
                                      : 'bg-amber-100 text-amber-600 border-amber-200'
                                  }`}>
                                      {node.status.replace('_', ' ')}
                                  </span>
                              </td>
                              <td className="px-6 py-6">
                                  <div className={`flex items-center gap-2 text-xs font-black ${node.workerProfile?.warningCount >= 2 ? 'text-red-500' : 'text-slate-600'}`}>
                                      <AlertTriangle size={14} className={node.workerProfile?.warningCount >= 2 ? 'animate-pulse' : 'opacity-20'}/>
                                      {node.workerProfile?.warningCount || 0} / 3
                                  </div>
                              </td>
                              <td className="px-6 py-6">
                                  <div className="flex items-center gap-2">
                                      <Star size={12} className="text-amber-400 fill-amber-400"/>
                                      <span className="text-xs font-black text-slate-900">{node.workerProfile?.accuracyScore?.toFixed(1) || '0.0'}</span>
                                  </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                      <button 
                                          onClick={() => handleStatusUpdate(node.id, 'VERIFIED')}
                                          className="px-5 py-2.5 rounded-xl border border-slate-200 text-[8px] font-black uppercase tracking-widest text-slate-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all flex items-center gap-2"
                                      >
                                          <RefreshCcw size={10}/> Restore
                                      </button>
                                      {node.status !== 'SUSPENDED' && (
                                          <button 
                                              onClick={() => handleStatusUpdate(node.id, 'SUSPENDED')}
                                              className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 text-[8px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                                          >
                                              <UserX size={10}/> Terminate
                                          </button>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      ))}

                      {/* EMPTY STATE */}
                      {nodes.filter(n => n.status === 'UNDER_REVIEW' || n.status === 'SUSPENDED').length === 0 && (
                          <tr>
                              <td colSpan={5} className="px-8 py-24 text-center">
                                  <div className="flex flex-col items-center gap-4">
                                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-inner">
                                          <ShieldCheck size={32}/>
                                      </div>
                                      <div className="space-y-1">
                                          <p className="text-[10px] font-black uppercase text-slate-900 tracking-[0.4em]">Grid Status: Stable</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No nodes currently require manual intervention</p>
                                      </div>
                                  </div>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </section>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function StatsBadge({ label, value, color }: any) {
    return (
        <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm min-w-[140px]">
            <span className="text-[10px] font-black text-slate-400 uppercase block tracking-widest mb-1">{label}</span>
            <span className={`text-xl font-black ${color}`}>{value}</span>
        </div>
    );
}