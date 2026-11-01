"use client";
import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/config';
import { MessageSquare, Send, ShieldAlert, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkerSupport() {
    const router = useRouter();
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/users/support-ticket`, { subject, message }, { withCredentials: true });
            alert("Ticket submitted. Staff will review and reply to your email.");
            setSubject(""); setMessage("");
        } catch (e) { alert("Submission failed."); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <header>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Staff <span className="text-indigo-500">Contact</span></h1>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-2">Submit disputes or requests for grid clarity</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-12 rounded-[3rem] shadow-2xl space-y-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Enquiry Subject</label>
                    <input className="w-full bg-black border border-white/10 p-4 rounded-xl text-white font-bold" value={subject} onChange={e => setSubject(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Message Body</label>
                    <textarea className="w-full bg-black border border-white/10 p-6 rounded-[2rem] h-64 text-white font-medium" value={message} onChange={e => setMessage(e.target.value)} required />
                </div>
                <button disabled={loading} className="w-full bg-white text-black py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                    {loading ? "Transmitting..." : "Send Request to Admin"}
                </button>
            </form>
        </div>
    );
}