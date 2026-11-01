"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';
import { ChevronLeft, ShieldCheck, RefreshCcw, Lock } from 'lucide-react';

export default function AssessmentPage() {
    const router = useRouter();
    const [test, setTest] = useState<any>(null);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                // 1. Fetch the active assessment
                const res = await axios.get(`${API_URL}/api/users/assessment-test`, { withCredentials: true });
                
                const assessmentData = res.data;

                if (!assessmentData || !assessmentData.assessmentData) {
                    alert("No active assessment protocol found. Returning to dashboard.");
                    router.push('/dashboard');
                    return;
                }

                // 2. Initialize the test and the answers array
                setTest(assessmentData);
                setUserAnswers(new Array(assessmentData.assessmentData.length).fill(-1));
            } catch (err: any) { 
                console.error("Assessment fetch error:", err);
                
                // BUG 1 FIX: Only redirect to login if the session is actually invalid (401)
                if (err.response?.status === 401) {
                    alert("Session expired. Please log in again.");
                    router.push('/login');
                } else {
                    // If it's a 404 (Test missing in DB) or 500 (Server error),
                    // go back to dashboard instead of logging the user out.
                    alert("Assessment protocol is currently offline or missing. Redirecting to safe zone.");
                    router.push('/dashboard');
                }
            } finally { 
                setLoading(false); 
            }
        };
        fetchTest();
    }, [router]);

    const handleSubmit = async () => {
        if (userAnswers.includes(-1)) {
            return alert("PROTOCOL INCOMPLETE: Please provide a selection for all criteria.");
        }

        setSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/api/users/submit-assessment`, { 
                answers: userAnswers 
            }, { withCredentials: true });
            
            alert(`COMPLIANCE SCORE: ${res.data.score}% - ${res.data.message}`);
            router.push('/dashboard');
        } catch (err: any) {
            const msg = err.response?.data?.message || "Transmission error. Please check your connection.";
            alert(msg);
        } finally { 
            setSubmitting(false); 
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
            <RefreshCcw className="animate-spin text-indigo-500" size={40} />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Decrypting Assessment Protocol...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050505] p-6 md:p-12 font-sans selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto space-y-10">
                
                <header className="flex justify-between items-center bg-white dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                    <button 
                        onClick={() => router.push('/dashboard')} 
                        className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-all tracking-widest"
                    >
                        <ChevronLeft size={16}/> Abort Protocol
                    </button>
                    <div className="bg-indigo-600 text-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                        <Lock size={12}/> Secure Qualification Stream
                    </div>
                </header>

                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-12 rounded-[3.5rem] shadow-2xl space-y-12">
                    <div className="border-b border-slate-100 dark:border-white/5 pb-10">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 italic">
                            {test?.name || "Qualification Domain"}
                        </h1>
                        <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                             <p className="text-sm text-slate-600 dark:text-indigo-200 font-medium leading-relaxed italic">
                                "{test?.description || "Review the criteria below and select the most accurate response."}"
                             </p>
                        </div>
                    </div>

                    <div className="space-y-16">
                        {test?.assessmentData?.map((q: any, qIdx: number) => (
                            <div key={qIdx} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white flex gap-4 leading-tight uppercase tracking-tight">
                                    <span className="text-indigo-500">0{qIdx + 1}.</span> {q.q}
                                </h3>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                    {q.options.map((opt: string, oIdx: number) => (
                                        <button 
                                            key={oIdx}
                                            onClick={() => {
                                                const newAnswers = [...userAnswers];
                                                newAnswers[qIdx] = oIdx;
                                                setUserAnswers(newAnswers);
                                            }}
                                            className={`p-6 rounded-[1.5rem] border-2 text-left transition-all duration-300 group ${
                                                userAnswers[qIdx] === oIdx 
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' 
                                                : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-600 dark:text-gray-400 hover:border-indigo-400'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-black text-[10px] ${
                                                    userAnswers[qIdx] === oIdx ? 'bg-white text-indigo-600 border-white' : 'border-slate-300 dark:border-gray-700'
                                                }`}>
                                                    {String.fromCharCode(65 + oIdx)}
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-widest">{opt}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 border-t border-slate-100 dark:border-white/5 text-center">
                        <button 
                            disabled={submitting}
                            onClick={handleSubmit}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-sm hover:bg-indigo-600 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCcw className="animate-spin" size={20}/> 
                                    Analyzing Compliance Data...
                                </>
                            ) : (
                                <>
                                    Finalize Protocol & Unlock Grid <ShieldCheck size={20}/>
                                </>
                            )}
                        </button>
                        <p className="mt-6 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                            * Accuracy threshold required: 70% • Decision logic is immutable once submitted.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}