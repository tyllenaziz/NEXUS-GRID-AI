"use client";
import { useState, useEffect, Suspense } from 'react'; // Added Suspense
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '@/lib/config';
// 1. Create a component for the actual form logic
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [formData, setFormData] = useState({ code: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) router.push('/forgot-password');
  }, [email, router]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) return alert("Passwords do not match.");
    if (formData.code.length !== 6) return alert("Enter the 6-digit recovery key.");

    setLoading(true);
    try {
      // Use the production Render URL if deployed, otherwise localhost
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
        code: formData.code,
        newPassword: formData.newPassword
      });
      alert("✅ Security Credentials Updated. Please log in.");
      router.push('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
      <div className="w-full max-w-md p-12 rounded-[3rem] border border-white/5 bg-white/[0.02] shadow-2xl">
        <header className="mb-10 text-center">
            <KeyRound className="text-indigo-500 mx-auto mb-4" size={32}/>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Credential <span className="text-indigo-500">Override</span></h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Reset protocol for {email}</p>
        </header>

        <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">6-Digit Recovery Key</label>
                <input 
                    type="text"
                    maxLength={6}
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.replace(/\D/g, '')})}
                    className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-center text-xl font-black tracking-[0.5em] text-indigo-400 outline-none focus:border-indigo-500"
                    placeholder="000000"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">New Access Protocol</label>
                <div className="relative">
                    <input 
                        type={showPass ? "text" : "password"}
                        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:border-indigo-500"
                        placeholder="New Password"
                        required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600">
                        {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                </div>
            </div>

            <input 
                type="password"
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:border-indigo-500"
                placeholder="Confirm New Password"
                required
            />

            <button disabled={loading} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-all shadow-xl flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" size={20}/> : "Update Security Hash"}
            </button>
        </form>
      </div>
    </div>
  );
}

// 2. Wrap the form in Suspense to fix the Vercel Build Error
export default function ResetPassword() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase text-[10px] tracking-widest">
                Loading Security Module...
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}