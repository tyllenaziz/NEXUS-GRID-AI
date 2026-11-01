"use client";
import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../lib/config';
import { Send, Users, Mail, ChevronLeft, Loader2, Megaphone, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AdminComms() {
    // State switched from targetId to targetEmail
    const [targetEmail, setTargetEmail] = useState("");
    const [sendToAll, setSendToAll] = useState(false);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        // Validation
        if (!subject || !message) return alert("Please fill in both the subject and message body.");
        if (!sendToAll && !targetEmail) return alert("Please specify a recipient email address.");

        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/admin/communicate`, {
                targetEmail: targetEmail.trim().toLowerCase(), // Sending email instead of ID
                subject,
                message,
                sendToAll
            }, { withCredentials: true });

            alert(`✅ Transmission successful. Dispatched to ${sendToAll ? 'all active nodes' : targetEmail}.`);
            
            // Clear fields after success
            setSubject(""); 
            setMessage("");
            setTargetEmail("");
        } catch (e: any) { 
            const errorMsg = e.response?.data?.message || "Transmission failed. Verify recipient email exists in the grid.";
            alert(errorMsg); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans text-slate-900">
            <div className="max-w-2xl mx-auto space-y-12">
                
                {/* --- HEADER --- */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="p-3 bg-slate-900 rounded-2xl text-white hover:bg-indigo-600 transition-all shadow-lg">
                            <ChevronLeft size={20}/>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black uppercase italic tracking-tight leading-none">Comms <span className="text-indigo-600 not-italic">Bridge</span></h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 text-left">Internal Transmission Protocol</p>
                        </div>
                    </div>
                    <Megaphone className="text-indigo-100" size={40} />
                </header>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
                    
                    {/* --- TARGET SELECTOR --- */}
                    <div className="flex gap-4 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <button 
                            onClick={() => setSendToAll(true)} 
                            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${sendToAll ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Users size={16}/> Global Broadcast
                        </button>
                        <button 
                            onClick={() => setSendToAll(false)} 
                            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!sendToAll ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Mail size={16}/> Direct Node
                        </button>
                    </div>

                    {/* --- INPUT FIELDS --- */}
                    <div className="space-y-6">
                        {!sendToAll && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Recipient Identity</label>
                                <input 
                                    placeholder="Enter worker email (e.g. worker@nexugrid.site)" 
                                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                                    value={targetEmail} 
                                    onChange={e => setTargetEmail(e.target.value)} 
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Subject Line</label>
                            <input 
                                placeholder="Formal Subject" 
                                className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-sm font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                                value={subject} 
                                onChange={e => setSubject(e.target.value)} 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Internal Message</label>
                            <textarea 
                                placeholder="Provide technical details, feedback, or update instructions..." 
                                className="w-full bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] h-72 text-sm font-medium leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none" 
                                value={message} 
                                onChange={e => setMessage(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* --- ACTION BUTTON --- */}
                    <button 
                        disabled={loading} 
                        onClick={handleSend} 
                        className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.4em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 group shadow-2xl disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20}/>
                        ) : (
                            <>
                                DISPATCH TRANSMISSION 
                                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>
                            </>
                        )}
                    </button>
                    
                    <p className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-widest">
                        * Communication is audited. Transmissions are delivered via NexusGrid Finance/Support Node.
                    </p>
                </div>
            </div>
        </div>
    );
}