"use client";
import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { 
  Eye, 
  EyeOff, 
  UserPlus, 
  ShieldCheck, 
  Loader2, 
  Layers, 
  Fingerprint, 
  ChevronRight, 
  BadgeCheck 
} from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

function RegisterForm() {
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');

  // --- GOOGLE OAUTH LOGIC ---
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "136833392894-d29jtpue6r29e6q8fnn06baih5epqfrg.apps.googleusercontent.com",
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { 
            theme: "filled_black", 
            size: "large", 
            width: "340", 
            text: "signup_with",
            shape: "square" // Matches industrial design
          }
        );
      }
    };

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/google`, {
        credential: response.credential,
        referredBy: refCode 
      }, { withCredentials: true });

      if (res.data.success) router.push('/dashboard');
    } catch (err) {
      alert("Google registration failed. Please use the form.");
    } finally {
      setLoading(false);
    }
  };

  // --- STANDARD REGISTRATION ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        ...formData,
        referredBy: refCode 
      }, { withCredentials: true });

      alert("✅ Registration sequence initiated. Check your inbox for the 6-digit access key.");
      router.push(`/verify?email=${encodeURIComponent(formData.email.trim())}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Registration sequence failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative">
      {/* Branding Header */}
      <div className="text-center mb-8 group">
        <Link href="/" className="inline-flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 flex items-center justify-center rounded-sm shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Layers className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tighter uppercase italic text-white">NexusGrid</span>
        </Link>
        <div className="flex items-center justify-center gap-2 mb-2">
          <UserPlus className="text-indigo-500" size={16} />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 text-center">Initialize Expert Identity</h2>
        </div>
        
        {refCode && (
          <div className="mt-4 px-4 py-2 bg-indigo-500/5 border border-indigo-500/20 inline-flex items-center gap-2">
             <BadgeCheck className="text-indigo-500" size={14} />
             <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Referral Protocol Active: {refCode}</p>
          </div>
        )}
      </div>

      <div className="bg-[#050505] border border-white/5 p-8 relative shadow-2xl overflow-hidden">
        {/* Scanning Line Animation */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-indigo-500/20 animate-scan pointer-events-none"></div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Legal First Name" 
              placeholder="FIRST NAME" 
              onChange={(v: string) => setFormData({...formData, firstName: v})} 
            />
            <Input 
              label="Legal Last Name" 
              placeholder="LAST NAME" 
              onChange={(v: string) => setFormData({...formData, lastName: v})} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block">
              Electronic Identity <span className="text-indigo-500/50">(Email)</span>
            </label>
            <input 
              type="email" 
              placeholder="NAME@NEXUSGRID.SITE" 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-white/[0.02] border border-white/10 p-5 text-[10px] font-bold tracking-widest uppercase focus:border-indigo-500/50 outline-none text-white transition-colors"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block">
              Security Protocol <span className="text-indigo-500/50">(Password)</span>
            </label>
            <div className="relative group">
              <input 
                type={showPass ? "text" : "password"} 
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="MINIMUM 8 CHARACTERS"
                className="w-full bg-white/[0.02] border border-white/10 p-5 text-[10px] font-bold tracking-[0.3em] uppercase focus:border-indigo-500/50 outline-none text-white transition-colors font-mono"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-indigo-500 transition-colors"
              >
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          
          <button 
            disabled={loading} 
            className="group relative w-full bg-indigo-600 text-white py-5 text-[10px] font-bold uppercase tracking-[0.3em] overflow-hidden transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={16}/> : (
                <>
                  Establish Grid Identity <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
          </button>
        </form>

        <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-[0.3em]">
                <span className="bg-[#050505] px-4 text-gray-600">Secure Enrollment Bridge</span>
            </div>
        </div>

        <div className="flex justify-center">
            <div id="googleBtn" className="border border-white/5 p-1 bg-black shadow-lg"></div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/5 pt-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 text-center">
               Already Registered? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-4">Access Terminal</Link>
            </p>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center px-2">
          <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-gray-800 italic">Personnel_USA_Secure</span>
          <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.3em] text-gray-800">
             <ShieldCheck size={10} />
             <span>Nexus Protocol v4.0.21</span>
          </div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000] p-6 selection:bg-indigo-500/30 selection:text-indigo-200">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-600">Initializing Security Module...</span>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}

function Input({ label, type = "text", placeholder, onChange }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder} 
        onChange={(e) => onChange(e.target.value)} 
        className="bg-white/[0.02] border border-white/10 p-5 text-[10px] font-bold tracking-widest uppercase focus:border-indigo-500/50 outline-none text-white transition-colors placeholder:text-gray-800" 
        required 
      />
    </div>
  );
}