"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, LayoutDashboard, Zap } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/lib/config';
export default function Success() {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get('type');

  const handleNext = async () => {
    try {
const res = await axios.get(`${API_URL}/api/users/tasks/next/${type}`, { withCredentials: true });
      router.push(`/dashboard/tasks/${res.data.id}`);
    } catch (err) {
      alert("Queue is empty! Great work.");
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center bg-emerald-500/20 p-6 rounded-full border border-emerald-500/20 text-emerald-500 mb-4 animate-bounce">
            <CheckCircle2 size={64}/>
        </div>
        <div>
            <h1 className="text-4xl font-black text-white mb-2">TASK SAVED</h1>
            <p className="text-gray-500 font-medium uppercase text-[10px] tracking-widest">Sent to reviewer queue • Internal ID Verified</p>
        </div>

        <div className="grid gap-3 pt-6">
            <button onClick={handleNext} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-2">
                Continue To Next Task <Zap size={16}/>
            </button>
            <button onClick={() => router.push('/dashboard')} className="w-full bg-white/5 text-gray-400 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:text-white transition-all flex items-center justify-center gap-2">
                Back to Dashboard <LayoutDashboard size={16}/>
            </button>
        </div>
      </div>
    </div>
  );
}