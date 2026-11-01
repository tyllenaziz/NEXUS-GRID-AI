"use client";
import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '../../lib/config';
import { ShieldCheck, Loader2, Key, ArrowLeft } from 'lucide-react';

function VerifyLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) router.push('/login');
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return setError("Code must be 6 digits.");
    
    setLoading(true);
    setError("");
    try {
      // Updated to use API_URL and withCredentials
      const res = await axios.post(`${API_URL}/api/auth/verify-login`, 
        { email, code }, 
        { withCredentials: true }
      );
      
      // Admin specific logic: Ensure only staff can access the Ops portal
      const user = res.data.user;
      if (user.role === 'WORKER') {
        setError("Access Denied: Node lacks administrative authority.");
        return;
      }

      router.push('/'); // Redirect to Admin Dashboard Home
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification protocol failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-md p-10 rounded-[3rem] bg-white border border-slate-200 shadow-2xl text-center">
        <header className="mb-10">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Key className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Auth <span className="text-indigo-600 not-italic">Gateway</span></h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 px-4">
                Secondary Access Key Required for Admin Session
            </p>
        </header>

        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] uppercase tracking-widest rounded-2xl font-black">
               ⚠️ {error}
            </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">OTP Input</label>
                <input 
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-6 text-center text-3xl font-black tracking-[0.5em] text-slate-900 focus:border-indigo-600 outline-none transition-all font-mono"
                    autoFocus
                    required
                />
            </div>
            
            <button 
                disabled={loading}
                className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
            >
                {loading ? <Loader2 className="animate-spin" size={18}/> : "Authorize Access"}
            </button>
        </form>

        <button 
            onClick={() => router.push('/login')}
            className="mt-10 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
        >
            <ArrowLeft size={14}/> Return to Protocol
        </button>
      </div>
    </div>
  );
}

export default function VerifyLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-black uppercase text-[10px] tracking-widest">Loading Security Module...</div>}>
            <VerifyLoginContent />
        </Suspense>
    );
}