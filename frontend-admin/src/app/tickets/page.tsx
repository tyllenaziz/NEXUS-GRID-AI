"use client";
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../lib/config';
import { MessageCircle, Mail, CheckCircle, ChevronLeft, Loader2, Trash2 } from 'lucide-react'; // Added Trash2
import Link from 'next/link';

interface Ticket {
    id: string;
    status: 'OPEN' | 'RESOLVED';
    subject: string;
    message: string;
    user: {
        firstName: string;
        email: string;
    };
}

export default function AdminTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTickets = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/tickets`, { withCredentials: true });
            setTickets(res?.data || []);
        } catch (err) {
            console.error("Support Ledger Sync Failure:", err);
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const handleReply = async (id: string) => {
        const msg = prompt("PROTOCOL: Enter your transmission to the worker:");
        if (!msg) return;
        try {
            await axios.post(`${API_URL}/api/admin/tickets/${id}/reply`, { replyMessage: msg }, { withCredentials: true });
            alert("✅ Reply Dispatched.");
            fetchTickets();
        } catch (e) { alert("Transmission Error."); }
    };

    /**
     * NEW ACTION: Delete the ticket from the database
     */
    const handleDelete = async (id: string) => {
        if (!confirm("⚠️ PERMANENT PURGE: Remove this ticket from the ledger?")) return;
        try {
            await axios.delete(`${API_URL}/api/admin/tickets/${id}`, { withCredentials: true });
            setTickets(prev => prev.filter(t => t.id !== id)); // Remove from UI instantly
        } catch (e) {
            alert("Purge failed.");
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 font-black uppercase text-[10px] tracking-widest animate-pulse">Accessing Support Ledger...</div>;

    return (
        <div className="p-8 md:p-16 bg-slate-50 min-h-screen font-sans text-slate-900">
            <header className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-lg"><ChevronLeft size={24}/></Link>
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic">Support <span className="text-indigo-600 not-italic">Inbox</span></h1>
                </div>
                <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Unresolved: <span className="text-indigo-600">{tickets.filter(t => t.status === 'OPEN').length}</span>
                </div>
            </header>

            <div className="max-w-6xl mx-auto space-y-6">
                {tickets.length > 0 ? tickets.map((t) => (
                    <div key={t.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex-1 space-y-4 text-left">
                            <div className="flex items-center gap-3">
                                <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg border ${t.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{t.status}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.user.firstName} • {t.user.email}</span>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl text-slate-400 mt-1"><MessageCircle size={18}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase text-slate-800 leading-tight">{t.subject}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl italic border border-slate-100 mt-4">"{t.message}"</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* --- ACTIONS --- */}
                        <div className="flex flex-col md:flex-row gap-3 shrink-0 w-full md:w-auto">
                             <button 
                                onClick={() => handleReply(t.id)} 
                                className="bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl flex items-center justify-center gap-3"
                             >
                                <Mail size={16}/> Reply
                             </button>
                             <button 
                                onClick={() => handleDelete(t.id)} 
                                className="p-5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                                title="Purge Ticket"
                             >
                                <Trash2 size={20}/>
                             </button>
                        </div>
                    </div>
                )) : (
                    <div className="py-32 text-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
                        <CheckCircle className="mx-auto text-slate-100 mb-4" size={64}/>
                        <p className="font-black uppercase text-slate-300 tracking-[0.4em]">Support Ledger Clean</p>
                    </div>
                )}
            </div>
        </div>
    );
}