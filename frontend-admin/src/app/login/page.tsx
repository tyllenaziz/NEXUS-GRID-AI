"use client";
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../lib/config';
import { ShieldCheck, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

// 1. Defined a specific interface for Google to satisfy the Linter
interface GoogleResponse {
  credential: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (parent: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

export default function AdminLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // --- 1. GOOGLE RESPONSE HANDLER (Fixed 'any' error) ---
  const handleGoogleResponse = useCallback(async (response: GoogleResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/google`, {
        credential: response.credential
      }, { withCredentials: true });

      const user = res.data.user;
      if (user.role === 'WORKER') {
        setError("Access Denied: Node lacks administrative authority.");
        return;
      }
      router.push('/');
    } catch (err: unknown) {
      let message = "Google authentication failed.";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // --- 2. GOOGLE ADMIN LOGIN INITIALIZATION ---
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "784650388981-sqd109f6mrcp7p4oio93u1ur44r--bbro6.apps.googleusercontent.com",
          callback: handleGoogleResponse,
        });
        const btnParent = document.getElementById("googleAdminBtn");
        if (btnParent) {
            window.google.accounts.id.renderButton(
                btnParent,
                { theme: "outline", size: "large", width: "320", shape: "rectangular", text: "signin_with" }
            );
        }
      }
    };

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);
  }, [handleGoogleResponse]);

  // --- 3. STANDARD ADMIN LOGIN (Fixed 'any' error) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      }, { withCredentials: true });

      if (res.data.mfaRequired) {
        router.push(`/verify-login?email=${encodeURIComponent(formData.email.trim())}`);
      } else {
        router.push('/'); 
      }
    } catch (err: unknown) {
      let msg = "Internal Decryption Error.";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }

      if (msg.toLowerCase().includes("verification required")) {
        router.push(`/verify-login?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-slate-900 p-3 rounded-2xl text-white shadow-xl mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">NexusGrid <span className="text-indigo-600 not-italic">Ops</span></h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Internal Secure Gateway</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] uppercase tracking-widest rounded-2xl font-black">⚠️ {error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Identity Identifier</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none" 
                placeholder="admin@nexusgrid.site" 
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Secure Access Key</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"} 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none" 
                  placeholder="••••••••" 
                  required 
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600">{showPass ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
              </div>
            </div>
            
            <button disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" size={18}/> : <>Authorize Portal Session <ArrowRight size={18}/></>}
            </button>
          </form>

          <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-300">Staff OAuth</span></div>
          </div>

          <div className="flex justify-center"><div id="googleAdminBtn"></div></div>
        </div>
      </div>
    </div>
  );
}