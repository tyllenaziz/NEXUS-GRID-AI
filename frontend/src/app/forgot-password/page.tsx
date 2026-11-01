"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Mail, ChevronLeft, Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
await axios.post(`${API_URL}/api/auth/forgot-password`, { email: email.trim() });
      alert("Success: Reset token transmitted.");
      router.push(`/reset-password?email=${email}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Identity recovery failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
      <div className="w-full max-w-md p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.02]">
        <Link href="/login" className="text-gray-600 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-10 transition-colors">
            <ChevronLeft size={14}/> Return to Access Portal
        </Link>
        
        <header className="mb-10">
            <KeyRound className="text-indigo-500 mb-4" size={32}/>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Recover <span className="text-indigo-500">Identity</span></h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Initiate secure credential override</p>
        </header>

        <form onSubmit={handleRequest} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Registered Node Email</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:border-indigo-500 outline-none"
                    placeholder="name@nexus.ai"
                    required
                />
            </div>
            <button disabled={loading} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto"/> : "Transmit Reset Key"}
            </button>
        </form>
      </div>
    </div>
  );
}