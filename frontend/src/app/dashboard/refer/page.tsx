"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Copy, Users, Trophy, DollarSign, CheckCircle, Lock, AlertCircle } from 'lucide-react';
import { API_URL } from '@/lib/config';

export default function ReferPage() {
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, sRes] = await Promise.all([
            axios.get(`${API_URL}/api/users/me`, { withCredentials: true }),
            axios.get(`${API_URL}/api/users/referrals/stats`, { withCredentials: true })
        ]);
        setUser(uRes.data);
        setData(sRes.data);
      } catch (e) { console.error("Referral sync error"); }
    };
    fetchData();
  }, []);

  const copyLink = () => {
    if (data?.stats.count >= 3) return;
    const link = `https://nexugrid.site/apply?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return (
    <div className="p-20 text-center text-indigo-500 font-black animate-pulse uppercase tracking-widest">
        Syncing Referral Node...
    </div>
  );

  const isLimitReached = data.stats.count >= 3;

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <header className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
            Refer & <span className="text-indigo-600 dark:text-indigo-400">Earn</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-widest max-w-xl leading-relaxed">
          Invite up to <span className="text-indigo-600 dark:text-white">3 experts</span> to the grid. 
          When a referral completes their first task, you instantly earn 
          <span className="text-emerald-600 dark:text-emerald-400 ml-1">$50.00</span>.
        </p>
      </header>

      <div className="space-y-10">
        
        {/* --- REFERRAL LINK BOX --- */}
        <div className={`p-8 rounded-[2.5rem] border transition-all ${
            isLimitReached 
            ? 'bg-red-500/5 border-red-500/20' 
            : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/5 shadow-xl'
        }`}>
          <div className="flex justify-between items-center mb-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                  Your Exclusive Referral Link
              </label>
              <span className={`text-[10px] font-black uppercase ${isLimitReached ? 'text-red-500' : 'text-indigo-500'}`}>
                  {data.stats.count} / 3 Nodes Active
              </span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-6 py-4 text-xs font-bold text-slate-600 dark:text-gray-400 font-mono truncate">
              {isLimitReached ? "RECRUITMENT PROTOCOL FULL" : `https://nexugrid.site/apply?ref=${user?.referralCode}`}
            </div>
            <button 
              onClick={copyLink}
              disabled={isLimitReached}
              className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  isLimitReached 
                  ? 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-indigo-600 hover:text-white'
              }`}
            >
              {isLimitReached ? <><Lock size={14}/> Locked</> : copied ? <><CheckCircle size={14}/> Copied</> : <><Copy size={14}/> Copy Link</>}
            </button>
          </div>
          {isLimitReached && (
              <p className="mt-4 text-[9px] font-bold text-red-500 uppercase flex items-center gap-2">
                  <AlertCircle size={12}/> Recruitment limit reached for this node.
              </p>
          )}
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard label="Successful Recruits" value={`${data.stats.count} / 3`} icon={<Users size={20}/>} />
          <StatCard label="Total Referral Revenue" value={`$${data.stats.earned}.00`} icon={<DollarSign size={20}/>} accent />
        </div>

        {/* --- REFERRALS LIST --- */}
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 shadow-sm">
           <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-8">
               Active Recruit Stream
           </h3>
           {data.referrals.length > 0 ? (
             <div className="space-y-4">
               {data.referrals.map((r: any, i: number) => (
                 <div key={i} className="flex justify-between items-center p-6 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-100 dark:border-white/5">
                    <div>
                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{r.name}</span>
                        <p className="text-[8px] text-slate-400 dark:text-gray-500 font-bold uppercase mt-1 tracking-widest">Connection Verified</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                        r.status === 'Bonus Paid' 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}>
                        {r.status}
                    </span>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-20 text-slate-300 dark:text-gray-700 text-[10px] font-black uppercase tracking-[0.4em] italic border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
                 No active transmissions detected
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: any) {
  return (
    <div className={`border p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl transition-all ${
        accent 
        ? 'bg-indigo-600 border-indigo-500 text-white' 
        : 'bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-white/5 text-slate-900 dark:text-white'
    }`}>
      <div>
        <span className={`text-[9px] font-black uppercase tracking-widest block mb-2 ${
            accent ? 'text-indigo-200' : 'text-slate-400 dark:text-gray-600'
        }`}>{label}</span>
        <span className="text-4xl font-black tracking-tighter italic">{value}</span>
      </div>
      <div className={`p-4 rounded-2xl ${accent ? 'bg-white/10 text-white' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-gray-500'}`}>
        {icon}
      </div>
    </div>
  );
}