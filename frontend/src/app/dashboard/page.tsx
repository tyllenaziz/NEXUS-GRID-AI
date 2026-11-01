"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CheckCircle, Star, Zap,
  Layers, Type, MessageSquare, ShieldCheck,
  AlertTriangle, RefreshCcw,
  Clock, Camera, FileText, Lock, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { API_URL } from '@/lib/config';

// Lazy-load the webcam/face-scan module
const FaceVerificationModule = dynamic(() => import('@/components/FaceVerificationModule'), {
  loading: () => (
    <div className="h-screen bg-black flex items-center justify-center text-white">
        Loading Security Module...
    </div>
  ),
  ssr: false
});

type DocType = 'NDA' | 'CONTRACT';

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [rejectedTasks, setRejectedTasks] = useState<any[]>([]);
  const [queueCounts, setQueueCounts] = useState<any>({});
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);

  // LOGIC GATE: Onboarding = ID + Legal. Fully Cleared = Onboarding + Assessment.
  const isOnboarded = userData?.status === 'VERIFIED' && userData?.signedNDA && userData?.signedContract;
  const isFullyCleared = isOnboarded && userData?.passedAssessment;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Trigger the "Sweet Congratulations" message the first time they pass
  useEffect(() => {
    if (isFullyCleared && !localStorage.getItem('congratsShown')) {
        setShowCongrats(true);
    }
  }, [isFullyCleared]);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users/me`, { withCredentials: true });
      setUserData(res.data);

      const [histRes, countsRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/api/users/history`, { withCredentials: true }),
        axios.get(`${API_URL}/api/users/task-counts`, { withCredentials: true }),
        axios.get(`${API_URL}/api/users/active-projects`, { withCredentials: true }),
      ]);

      const revisions = histRes.data.filter((s: any) => s.status.includes('REJECTED'));
      setRejectedTasks(revisions);
      setQueueCounts(countsRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        console.error("Sync Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (docType: DocType) => {
    try {
      await axios.post(`${API_URL}/api/users/legal/sign`, { docType }, { withCredentials: true });
      await fetchDashboardData();
      setActiveDoc(null);
    } catch (e) {
      alert("Signing failed. Please try again.");
    }
  };

  const startSession = async (type: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/users/tasks/next/${type}`, { withCredentials: true });
      router.push(`/dashboard/tasks/${res.data.id}`);
    } catch (err) {
      alert("Queue is currently being replenished. Check back shortly.");
    }
  };

  if (loading || !userData) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#050505]">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
            <div className="text-indigo-500 font-black uppercase tracking-[0.4em] text-[10px]">Synchronizing Node...</div>
        </div>
    </div>
  );

  const queues = [
    { id: 'PREFERENCE_RANKING', name: 'Preference Ranking', icon: <Layers size={20}/>, color: 'text-indigo-400' },
    { id: 'FACT_CHECKING', name: 'Fact Checking', icon: <ShieldCheck size={20}/>, color: 'text-blue-400' },
    { id: 'TEXT_CLASSIFICATION', name: 'Text Classification', icon: <Type size={20}/>, color: 'text-emerald-400' },
    { id: 'SENTIMENT_ANALYSIS', name: 'Sentiment Analysis', icon: <MessageSquare size={20}/>, color: 'text-amber-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-12">

      {/* 1. TOP HEADER & GLOBAL ANALYTICS — Always Visible */}
      <div className="mb-2 flex justify-between items-end">
        <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">Dashboard <span className="text-indigo-500">Overview</span></h1>
            <p className="text-slate-500 dark:text-gray-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-indigo-500"/> Contributor: {userData.firstName} {userData.lastName}
            </p>
        </div>
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 px-6 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">Stream Status: Operational</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard title="Total Earnings" value={`$${userData.finance.totalEarned}`} icon={<Zap size={20}/>} />
        <StatCard title="Pending Credit" value={`$${userData.finance.pending}`} icon={<Clock size={20}/>} />
        
        {/* Quality Analytics Card */}
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] shadow-xl ring-1 ring-indigo-500/40 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-[0.2em]">Accuracy Analytics</span>
                <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={12} fill={star <= Math.round(userData.workerProfile?.accuracyScore || 0) ? "#f59e0b" : "none"} className={star <= Math.round(userData.workerProfile?.accuracyScore || 0) ? "text-amber-500" : "text-slate-300 dark:text-gray-700"} />
                    ))}
                </div>
            </div>
            <div className="flex items-baseline gap-3 mb-6">
                <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {userData.workerProfile?.accuracyScore?.toFixed(1) || '0.0'}
                </div>
                <div className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest italic">Precision Grade</div>
            </div>
            <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((rating) => {
                    const count = userData.starBreakdown?.[rating] || 0;
                    const totalReviews = Object.values(userData.starBreakdown || {}).reduce((a: number, b: number) => a + b, 0) || 1;
                    const percentage = (Number(count) / Number(totalReviews)) * 100;
                    return (
                        <div key={rating} className="flex items-center gap-3">
                            <span className="text-[8px] font-black text-slate-500 dark:text-gray-500 w-4">{rating}★</span>
                            <div className="flex-1 h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 dark:text-gray-700 w-4 text-right">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* 2. THE SECURITY GATE LOGIC */}
      {!isFullyCleared ? (
        /* --- GATED VIEW: Urgent Protocols & Checklist --- */
        <div className="space-y-12">
            <section className="bg-red-500/[0.04] border border-red-500/20 rounded-[2.5rem] p-8 space-y-5">
                <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-500"/>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Security Protocol Pending — Complete Requirements to Unlock Production</h2>
                </div>
                <div className="flex flex-wrap gap-4">
                    {userData.status === 'UNVERIFIED' && <UrgentProtocolButton label="Complete Biometric Scan" icon={<Camera size={16}/>} action={() => setShowFaceModal(true)} />}
                    {!userData.signedNDA && <UrgentProtocolButton label="Review & Sign NDA" icon={<FileText size={16}/>} action={() => setActiveDoc('NDA')} />}
                    {!userData.signedContract && <UrgentProtocolButton label="Review & Sign Contract" icon={<ShieldCheck size={16}/>} action={() => setActiveDoc('CONTRACT')} />}
                    {isOnboarded && !userData.passedAssessment && <UrgentProtocolButton label="Begin Qualification Assessment" icon={<Zap size={16}/>} action={() => router.push('/dashboard/assessment')} />}
                </div>
            </section>

            <div className="max-w-3xl mx-auto py-12 text-center space-y-12">
                <header>
                    <Lock size={48} className="mx-auto text-slate-300 mb-6" />
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Security Clearance <span className="text-indigo-500">Required</span></h2>
                </header>
                <div className="grid gap-4">
                    <ChecklistItem label="Identity Verification" desc="Facial pulse and Government ID verification" status={userData.status === 'VERIFIED'} action={userData.status === 'UNVERIFIED' ? () => setShowFaceModal(true) : undefined} />
                    <ChecklistItem label="Legal Protocols (NDA/Contract)" desc="Counter-signing the NDA and Contributor Contract" status={userData.signedNDA && userData.signedContract} action={!userData.signedNDA ? () => setActiveDoc('NDA') : !userData.signedContract ? () => setActiveDoc('CONTRACT') : undefined} />
                    <ChecklistItem label="Qualification Assessment" desc="Demonstrate 70% accuracy on standard tasks" status={userData.passedAssessment} action={isOnboarded ? () => router.push('/dashboard/assessment') : undefined} locked={!isOnboarded} />
                </div>
            </div>
        </div>
      ) : showCongrats ? (
        /* --- 3. SWEET CONGRATULATIONS SCREEN --- */
        <div className="max-w-4xl mx-auto py-24 text-center bg-indigo-600 rounded-[4rem] shadow-2xl shadow-indigo-500/40 space-y-8 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-black/20">
                <Sparkles size={48} className="text-indigo-600 animate-pulse" />
            </div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">Identity Confirmed. <br/>Grid Access <span className="text-indigo-200">Authorized.</span></h2>
            <p className="text-indigo-100 font-bold uppercase tracking-widest text-[10px] max-w-md mx-auto leading-relaxed">
                Welcome to the NexusGrid Elite. You have successfully bypassed all security protocols and demonstrated peak compliance accuracy. Production streams are now online.
            </p>
            <button 
                onClick={() => { setShowCongrats(false); localStorage.setItem('congratsShown', 'true'); }}
                className="bg-white text-indigo-600 px-12 py-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all scale-110 shadow-xl"
            >
                Initialize Task Streams
            </button>
        </div>
      ) : (
        /* --- 4. PRODUCTION VIEW (The Task Board) --- */
        <div className="grid grid-cols-12 gap-12 animate-in fade-in duration-700">
            {/* Work Streams */}
<div className="col-span-12 lg:col-span-8 space-y-6">
    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-gray-600 px-2 italic">Active Work Streams</h2>
    
    <div className="space-y-6">
        {/* We only map over the hardcoded 'queues' now */}
        {queues.map((q) => {
            // Check if work is available AND the project isn't paused in the DB
            const canEnter = (queueCounts[q.id]?.count || 0) > 0 && queueCounts[q.id]?.status === 'ACTIVE';
            
            return (
                <div key={q.id} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] flex justify-between items-center hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group relative overflow-hidden shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className={`p-5 bg-slate-100 dark:bg-white/5 rounded-2xl ${q.color} group-hover:scale-110 transition-transform`}>{q.icon}</div>
                        <div>
                            <h3 className="font-black text-xl tracking-tight text-slate-900 dark:text-white uppercase">{q.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Instant Credit</span>
                                <span className="text-slate-300 dark:text-gray-800">•</span>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                    queueCounts[q.id]?.status === 'PAUSED' ? 'text-amber-500' :
                                    queueCounts[q.id]?.status === 'COMPLETED' ? 'text-blue-500' : 'text-slate-400'
                                }`}>
                                  {
                                    (queueCounts[q.id]?.count || 0) > 0 ? "Stream Active" :
                                    queueCounts[q.id]?.status === 'PAUSED' ? "Project Paused" :
                                    queueCounts[q.id]?.status === 'COMPLETED' ? "Domain Finalized" : "Replenishing"
                                  }
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="text-right">
                            <span className="text-[9px] font-black text-slate-500 dark:text-gray-500 uppercase block tracking-widest mb-1 italic">Base Rate</span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                ${queueCounts[q.id]?.payRate || "0.00"}
                            </span>
                        </div>

                        <button
                            onClick={() => startSession(q.id)}
                            disabled={!canEnter}
                            className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl
                                ${canEnter 
                                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-indigo-600 hover:text-white' 
                                  : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-700 cursor-not-allowed opacity-50'}`}
                        >
                            {
                              (queueCounts[q.id]?.count || 0) > 0 ? "Enter Queue" : 
                              queueCounts[q.id]?.status === 'PAUSED' ? "Paused" : "Locked"
                            }
                        </button>
                    </div>
                </div>
            );
        })}
    </div>
</div>

            {/* Revision Sidebar */}
            <div className="col-span-12 lg:col-span-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-6 ml-2 flex items-center gap-2">
                    <AlertTriangle size={14}/> Quality Revision Needed ({rejectedTasks.length})
                </h2>
                <div className="bg-red-500/[0.02] border border-red-500/10 rounded-[3rem] p-4 space-y-4">
                    {rejectedTasks.length > 0 ? rejectedTasks.map((item: any) => (
                        <div key={item.id} className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-xs font-black text-red-700 dark:text-red-100 tracking-tight">{item.task.title}</div>
                                <div className="text-[10px] font-black text-red-500">-${parseFloat(item.task.payRate).toFixed(2)}</div>
                            </div>
                            <div className="bg-white dark:bg-black/40 p-4 rounded-2xl border border-red-500/10 mb-6">
                                <label className="text-[8px] font-black text-red-500/70 uppercase block mb-1 tracking-widest">Admin Feedback:</label>
                                <p className="text-[11px] text-slate-600 dark:text-gray-400 leading-relaxed font-medium italic">"{item.review?.feedback || 'Revision required.'}"</p>
                            </div>
                            <button
                                onClick={() => router.push(`/dashboard/tasks/${item.taskId}?revise=true`)}
                                className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform shadow-lg shadow-red-500/20"
                            >
                                <RefreshCcw size={14}/> Correct & Resubmit
                            </button>
                        </div>
                    )) : (
                        <div className="py-24 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-white dark:bg-white/[0.02] rounded-full flex items-center justify-center text-slate-300 dark:text-gray-800">
                                <CheckCircle size={32} />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-gray-600 font-black uppercase tracking-[0.3em] italic max-w-[150px] leading-relaxed text-center">
                                Compliance Standards Satisfied
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* FACE VERIFICATION MODAL */}
      {showFaceModal && (
          <div className="fixed inset-0 z-[100] bg-black">
              <FaceVerificationModule onComplete={() => { setShowFaceModal(false); fetchDashboardData(); }} />
          </div>
      )}

      {/* READ-THEN-SIGN DOCUMENT MODAL */}
      {activeDoc && (
          <DocumentSignModal docType={activeDoc} onClose={() => setActiveDoc(null)} onSign={handleSign} />
      )}
    </div>
  );
}

// URGENT PROTOCOL BUTTON
function UrgentProtocolButton({ label, icon, action }: any) {
    return (
        <button onClick={action} className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
            {icon} {label}
            <span className="ml-1 flex items-center gap-1 text-red-200/90 border-l border-red-400/40 pl-3"> <Lock size={12}/> Locked </span>
        </button>
    );
}

// CHECKLIST ITEM
function ChecklistItem({ label, desc, status, action, locked }: { label: string; desc?: string; status: boolean; action?: () => void; locked?: boolean; }) {
    return (
        <div className={`p-8 rounded-[2.5rem] border flex justify-between items-center transition-all ${status ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/5'}`}>
            <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}> {status ? <CheckCircle size={24}/> : <ShieldCheck size={24}/>} </div>
                <div className="text-left">
                    <h4 className={`font-black uppercase text-sm ${status ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>{label}</h4>
                    {desc && <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">{desc}</p>}
                </div>
            </div>
            {status ? <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-xl">Verified</span> : locked ? <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase opacity-40"><Lock size={14}/> Gated</div> : action ? <button onClick={action} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-lg">Begin Protocol</button> : <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-4 py-2 rounded-xl animate-pulse">Pending Audit</div>}
        </div>
    );
}

// PROJECT CARD
function ProjectCard({ project, stats, onEnter }: { project: any; stats?: any; onEnter: () => void }) {
    const count = stats?.count || 0;
    const canEnter = count > 0 && stats?.status === 'ACTIVE';
    return (
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] flex justify-between items-center group transition-all hover:border-indigo-500/30">
            <div className="flex items-center gap-6">
                <div className="p-5 bg-slate-100 dark:bg-white/5 rounded-2xl text-indigo-500 group-hover:scale-110 transition-transform"><Layers size={24}/></div>
                <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">{project.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[9px] font-black uppercase tracking-widest">
                        <span className={canEnter ? "text-emerald-500" : "text-amber-500"}>{canEnter ? "Stream Active" : "Locked"}</span>
                        <span className="text-slate-300 dark:text-gray-800">•</span>
                        <span className="text-slate-400">{count} Units Ready</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-400 uppercase block italic tracking-widest">Base Rate</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">${stats?.payRate || "0.00"}</span>
                </div>
                <button onClick={onEnter} disabled={!canEnter} className={`px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl ${canEnter ? 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-indigo-600 hover:text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-700 cursor-not-allowed opacity-50'}`}> Enter Queue </button>
            </div>
        </div>
    );
}

// DOCUMENT MODAL
function DocumentSignModal({ docType, onClose, onSign }: { docType: DocType; onClose: () => void; onSign: (docType: DocType) => Promise<void> | void }) {
    const [signing, setSigning] = useState(false);
    const handleAccept = async () => { setSigning(true); await onSign(docType); setSigning(false); };
    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-[2.5rem] max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-1">Signature Required</p>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{docType === 'NDA' ? 'Non-Disclosure Agreement' : 'Expert Contributor Contract'}</h2>
                </div>
                <div className="p-8 overflow-y-auto flex-1 text-sm text-slate-600 dark:text-gray-400 leading-relaxed space-y-4">
                    {docType === 'NDA' ? ( <p>This Non-Disclosure Agreement governs your access to confidential training data and model outputs. You agree not to share any task content with third parties...</p> ) : ( <p>This Contributor Agreement sets out the terms of your work as an independent contributor. You agree to provide genuine judgment and follow guidelines...</p> )}
                </div>
                <div className="p-8 border-t border-slate-200 dark:border-white/5 flex items-center gap-4">
                    <button onClick={onClose} className="px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-gray-500">Cancel</button>
                    <button onClick={handleAccept} disabled={signing} className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-600/30 disabled:opacity-50">{signing ? 'Processing...' : 'Sign & Accept'}</button>
                </div>
            </div>
        </div>
    );
}

// STAT CARD
function StatCard({ title, value, icon, accent = false }: any) {
    return (
      <div className={`bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] shadow-xl ${accent ? 'ring-1 ring-indigo-500/40 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05]' : ''}`}>
        <div className="flex justify-between items-start mb-6">
          <span className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-[0.2em]">{title}</span>
          <div className={`p-2.5 rounded-xl ${accent ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-100 dark:bg-white/5 text-indigo-500'}`}>{icon}</div>
        </div>
        <div className={`text-3xl font-black tracking-tighter ${accent ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{value}</div>
      </div>
    );
}