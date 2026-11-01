"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config'; 
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Layers, 
  Loader2, 
  Fingerprint, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/google`, {
        credential: response.credential
      }, { withCredentials: true });

      if (res.data.success) {
        router.push('/dashboard');
      }
    } catch (err) {
      alert("Google synchronization failed. Please use standard login.");
    } finally {
      setLoading(false);
    }
  };

  // --- GOOGLE OAUTH INITIALIZATION ---
  useEffect(() => {
    // Clear cookies as per your original logic
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

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
            text: "continue_with",
            shape: "square" // Switched to square to match the high-tech aesthetic
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

  // --- STANDARD LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim()
      };

      const res = await axios.post(`${API_URL}/api/auth/login`, cleanData, {
        withCredentials: true 
      });
      
      if (res.data.mfaRequired) {
        router.push(`/verify-login?email=${encodeURIComponent(cleanData.email)}`);
      } else {
        router.push('/dashboard'); 
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "";
      if (msg.includes("verification required")) {
        router.push(`/verify?email=${encodeURIComponent(formData.email.trim())}`);
      } else {
        alert(msg || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000] p-6 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dynamic Background Element */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

      <div className="w-full max-w-md relative">
        {/* Branding Header */}
        <div className="text-center mb-10 group">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 flex items-center justify-center rounded-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-transform group-hover:scale-110">
                <Layers className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tighter uppercase italic text-white">NexusGrid</span>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Fingerprint className="text-indigo-500" size={16} />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">Security Personnel Terminal</h2>
          </div>
          <div className="h-[1px] w-12 bg-indigo-500/50 mx-auto"></div>
        </div>

        {/* Login Card */}
        <div className="bg-[#050505] border border-white/5 p-10 relative shadow-2xl overflow-hidden">
          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-indigo-500/20 animate-scan pointer-events-none"></div>
          
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-1">
                Node Identity <span className="text-indigo-500/50">(Email)</span>
              </label>
              <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-500 transition-colors" size={18}/>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="ENTER REGISTERED EMAIL"
                    className="w-full bg-white/[0.02] border border-white/10 py-5 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-gray-800 tracking-widest font-medium"
                    required
                  />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-1">
                Access Protocol <span className="text-indigo-500/50">(Password)</span>
              </label>
              <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-500 transition-colors" size={18}/>
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••••••"
                    className="w-full bg-white/[0.02] border border-white/10 py-5 pl-12 pr-14 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-gray-800 tracking-[0.3em] font-mono"
                    required
                  />
                  <button 
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-indigo-500 transition-colors"
                  >
                      {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
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
                    Authorize Session <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* OAuth Divider */}
          <div className="relative my-12">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-[0.3em]">
                  <span className="bg-[#050505] px-4 text-gray-600">Encrypted OAuth Bridge</span>
              </div>
          </div>

          <div className="flex justify-center">
              <div id="googleBtn" className="border border-white/5 p-1 bg-black shadow-lg"></div>
          </div>

          {/* Card Footer */}
          <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/5 pt-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  New Expert? <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-4">Register Account</Link>
              </p>
              <Link href="/forgot-password" className="text-[9px] font-bold uppercase tracking-widest text-gray-700 hover:text-indigo-500 transition-colors italic">
    Forgot Security Credentials?
</Link>
          </div>
        </div>

        {/* Global Footer Meta */}
        <div className="mt-8 flex justify-between items-center px-2">
            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-gray-800">USA_SECURE_CONNECTION</span>
            <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.3em] text-gray-800">
               <ShieldCheck size={10} />
               <span>Nexus Protocol v4.0</span>
            </div>
        </div>
      </div>
    </div>
  );
}