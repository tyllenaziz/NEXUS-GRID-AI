"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '../../lib/config';
import { 
  LayoutDashboard, Wallet, Settings2, LogOut, History,
  ShieldCheck, GanttChartSquare, MessageSquare, 
  UserPlus, ShieldAlert, UserCircle, AlertTriangle,
  Sun, Moon, Loader2 
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // --- 1. HOOKS ---
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState("0.00");
  const [theme, setTheme] = useState('dark'); 
  const pathname = usePathname();
  const router = useRouter();

  // THEME INITIALIZATION (Runs once)
  useEffect(() => {
    const savedTheme = localStorage.getItem('nexus-theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // SECURE DATA FETCHING & AUTH CHECK
  useEffect(() => {
    const fetchData = async () => {
      try {
        // use withCredentials: true to send the JWT cookie to the backend
        const res = await axios.get(`${API_URL}/api/users/me`, { withCredentials: true });
        
        setUserData(res.data);
        if (res.data.wallet) {
          setBalance(parseFloat(res.data.wallet.availableBalance).toFixed(2));
        }
      } catch (err: any) {
        console.error("Session verification failed:", err);
        // If the backend returns 401 or the cookie is missing, kick to login
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [pathname, router]); 

  // THEME TOGGLE HANDLER
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('nexus-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // --- 2. CONDITIONAL RETURNS (Gating) ---

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-indigo-500 animate-spin" size={40} />
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400 tracking-[0.4em]">Synchronizing...</span>
        </div>
      </div>
    );
  }

  // If node is suspended, prevent access to any dashboard children
  if (userData?.status === 'SUSPENDED') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center p-6 text-center">
        <div className="max-w-xl animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Account Suspended</h1>
          <p className="text-slate-500 dark:text-gray-400 font-medium leading-relaxed mb-8">
            Access to the NexusGrid production environment has been permanently revoked due to data integrity violations or breach of protocol.
          </p>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl">
             <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Decision Status: Final & Non-Negotiable</p>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. MAIN RENDER ---
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white font-sans selection:bg-indigo-500/30 transition-colors duration-500">
      
      {/* SIDEBAR */}
      <aside className="w-72 border-r border-slate-200 dark:border-white/5 p-8 flex flex-col fixed h-full bg-white dark:bg-[#050505] z-50">
        <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white">N</div>
            <div className="text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">Nexus<span className="text-indigo-500">Grid</span></div>
        </div>
        
        <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div>
                <Label>Main Operations</Label>
                <nav className="space-y-1 mt-4">
                    <SidebarItem href="/dashboard" icon={<LayoutDashboard size={18}/>} label="Dashboard" active={pathname === '/dashboard'} />
                    <SidebarItem href="/dashboard/history" icon={<History size={18}/>} label="Audit History" active={pathname === '/dashboard/history'} />
                    <SidebarItem href="/dashboard/projects" icon={<GanttChartSquare size={18}/>} label="Active Projects" active={pathname === '/dashboard/projects'} />
                   
                    <SidebarItem href="/dashboard/chat" icon={<MessageSquare size={18}/>} label="Nexus Chat" active={pathname === '/dashboard/chat'} />
                    <SidebarItem 
  href="/dashboard/support" 
  icon={<ShieldAlert size={18}/>} 
  label="Support" 
  active={pathname === '/dashboard/support'} 
/>
                </nav>
            </div>

            <div>
                <Label>Financials & Legal</Label>
                <nav className="space-y-1 mt-4">
                    <SidebarItem href="/dashboard/wallet" icon={<Wallet size={18}/>} label="Earnings & Payouts" active={pathname === '/dashboard/wallet'} />
                    <SidebarItem href="/dashboard/refer" icon={<UserPlus size={18}/>} label="Refer & Earn" active={pathname === '/dashboard/refer'} />
                    <SidebarItem href="/onboarding" icon={<ShieldCheck size={18}/>} label="NDA & Compliance" active={pathname === '/onboarding'} />
                </nav>
            </div>

            <div>
                <Label>Account</Label>
                <nav className="space-y-1 mt-4">
                    <SidebarItem href="/dashboard/settings" icon={<Settings2 size={18}/>} label="Core Settings" active={pathname === '/dashboard/settings'} />
                </nav>
            </div>
        </div>

        <div className="mt-auto pt-8 border-t border-slate-200 dark:border-white/5 space-y-6">
            <div className="bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 p-5 rounded-[2rem]">
                <div className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Available Credit</div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">${balance}</div>
            </div>
            <button 
              onClick={() => router.push('/login')}
              className="flex items-center justify-between px-5 py-4 rounded-2xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all w-full font-black text-[10px] uppercase tracking-[0.2em]"
            >
                <span className="flex items-center gap-3"><LogOut size={16}/> Terminate Session</span>
            </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 min-h-screen">
        <header className="h-24 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-16 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.3em]">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Stream Status: Optimized
              </div>

              <button 
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-white transition-all border border-slate-200 dark:border-white/10"
              >
                {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
              </button>
          </div>
          
          <Link href="/dashboard/settings" className="flex items-center gap-4 group cursor-pointer">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white leading-none mb-1 group-hover:text-indigo-500 transition-colors">
                {userData?.firstName} {userData?.lastName}
              </p>
              <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest leading-none">
                {userData?.role} NODE
              </p>
            </div>
            <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-indigo-500 group-hover:border-indigo-500 transition-all">
              {userData?.workerProfile?.profilePicture ? (
                  <img src={userData.workerProfile.profilePicture} className="w-full h-full rounded-full object-cover" alt="Profile" />
              ) : (
                  <UserCircle size={24} />
              )}
            </div>
          </Link>
        </header>

        <div className="px-16 pt-8 space-y-4">
            {userData?.status === 'PENDING_VERIFICATION' && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-5 rounded-2xl flex items-center gap-4 text-indigo-700 dark:text-indigo-400">
                  <Loader2 size={20} className="animate-spin flex-shrink-0"/>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Audit In Progress</p>
                    <p className="text-xs font-medium text-slate-600 dark:text-gray-400 mt-1">
                      Your biometric identity is being verified by the NexusGrid security node. You're free to browse the platform — work streams unlock automatically once the audit clears.
                    </p>
                  </div>
              </div>
            )}
            {userData?.status === 'UNDER_REVIEW' && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 text-amber-600 dark:text-amber-500 animate-pulse">
                  <ShieldAlert size={18}/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Protocol: Account Under Review. Stream access restricted.</span>
              </div>
            )}
            {(userData?.workerProfile?.warningCount || 0) > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400">
                  <AlertTriangle size={18}/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Compliance Alert: {userData.workerProfile.warningCount} Warning(s) Detected.</span>
              </div>
            )}
        </div>

        <div className="p-16 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
    return <h4 className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-[0.3em] px-4">{children}</h4>;
}

function SidebarItem({ href, icon, label, active = false }: any) {
  return (
    <Link 
      href={href} 
      className={`flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-500 group ${
        active 
        ? 'bg-slate-100 dark:bg-white/[0.04] text-indigo-600 dark:text-white border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-2xl' 
        : 'text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className={`${active ? 'text-indigo-500 scale-110' : 'group-hover:text-indigo-400'} transition-all`}>
            {icon}
        </span>
        <span className="font-bold text-[10px] uppercase tracking-[0.15em]">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
    </Link>
  );
}