"use client";
import { useState, useEffect, Suspense } from 'react'; // Added Suspense
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, ArrowRight, Loader2, Mail } from 'lucide-react';
import { API_URL } from '@/lib/config';
function VerifyOTPContent() { // Moved logic into a sub-component
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // If someone lands here without an email in URL, send them to login
  useEffect(() => {
    if (!email) router.push('/login');
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return alert("Code must be 6 digits.");
    
    setLoading(true);
    try {
      // Uses centralized config and ensures cookie support
      await axios.post(`${API_URL}/api/auth/verify-email`, 
        { email, code }, 
        { withCredentials: true }
      );
      alert("✅ Node Activated. You may now access the portal.");
      router.push('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 font-sans">
      <div className="w-full max-w-md p-12 rounded-[3rem] border border-white/5 bg-white/[0.02] shadow-2xl text-center">
        <header className="mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
                <ShieldCheck className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Confirm <span className="text-indigo-500">Identity</span></h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Check {email} for your 6-digit access key</p>
        </header>

        <form onSubmit={handleVerify} className="space-y-8">
            <input 
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-black border border-white/10 rounded-2xl py-6 text-center text-3xl font-black tracking-[0.5em] text-indigo-400 focus:border-indigo-500 outline-none transition-all shadow-inner"
                required
            />
            
            <button 
                disabled={loading}
                className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin mx-auto"/> : "Activate Contributor Node"}
            </button>
        </form>

        <button 
            onClick={() => router.push('/register')}
            className="mt-10 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
        >
            Incorrect Email? Restart Sequence
        </button>
      </div>
    </div>
  );
}

// Wrap in Suspense for Vercel Build
export default function VerifyOTP() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase text-[10px] tracking-[0.4em]">Initializing Security...</div>}>
            <VerifyOTPContent />
        </Suspense>
    );
}