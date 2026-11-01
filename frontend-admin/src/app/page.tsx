"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config'; // Centralized Config Import
import { 
  PlusCircle, 
  CreditCard, 
  Megaphone, 
  LayoutGrid, 
  ShieldCheck, 
  Package, 
  GanttChartSquare,
  Camera, 
  Activity,
  LogOut,
  UserCog, 
  ArrowRight,
    MessageCircle
} from 'lucide-react';

interface AdminCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  accent: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        /**
         * SECURE ADMIN CHECK
         * Uses withCredentials: true to send the JWT cookie across domains 
         * (ops.nexugrid.site -> nexusgrid-backend.onrender.com)
         */
        const res = await axios.get(`${API_URL}/api/users/me`, { withCredentials: true });
        
        // Security Gate: Ensure only Admins or Super Admins can stay here
        if (res.data.role !== 'ADMIN' && res.data.role !== 'SUPER_ADMIN') {
          console.warn("Unauthorized access attempt. Redirecting to login.");
          router.push('/login');
        } else {
          setAdminName(res.data.firstName);
          setLoading(false);
        }
      } catch (err) {
        console.error("Ops session verification failed:", err);
        router.push('/login'); // Redirect to login if not authenticated
      }
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    /**
     * Note: In a full production flow, you might want to call 
     * a backend logout route to clear the cookie, but a router 
     * push to login effectively terminates the UI session.
     */
    router.push('/login');
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-slate-900/10 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Establishing Secure Admin Session...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 md:p-16 selection:bg-indigo-100 font-sans">
      
      {/* HEADER: OPS CONTROL */}
      <header className="mb-16 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-5">
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl shadow-slate-200">
            <LayoutGrid size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase leading-none italic">
                NexusGrid <span className="text-indigo-600 not-italic">Ops</span>
            </h1>
            <div className="flex items-center gap-2 mt-2 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
              <ShieldCheck size={12} className="text-indigo-500" /> Authenticated Protocol: {adminName}
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="group flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-red-500 transition-all uppercase tracking-widest border border-slate-200 px-8 py-4 rounded-2xl bg-white shadow-sm hover:shadow-lg hover:border-red-100"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Terminate Session
        </button>
      </header>

      {/* CORE ADMIN GRID */}
      <main className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        <AdminCard 
          href="/tasks/new" 
          icon={<PlusCircle size={32}/>} 
          title="Task Architect" 
          desc="Deploy new RLHF tasks to worker queues and set dynamic pay rates." 
          color="text-indigo-600"
          accent="bg-indigo-50"
        />
        
        <AdminCard 
          href="/reviews" 
          icon={<ShieldCheck size={32}/>} 
          title="Quality Audit" 
          desc="Verify justifications, identify fraud/speeders, and assign accuracy stars." 
          color="text-indigo-600"
          accent="bg-indigo-50/50"
        />

        <AdminCard 
          href="/verification" 
          icon={<Camera size={32}/>} 
          title="Biometric Scan" 
          desc="Review contributor face verification transmissions to authorize grid access." 
          color="text-amber-600"
          accent="bg-amber-50"
        />

        <AdminCard 
          href="/payouts" 
          icon={<CreditCard size={32}/>} 
          title="Financial Sweep" 
          desc="Release bi-weekly balances and process bulk payments for workers." 
          color="text-emerald-600"
          accent="bg-emerald-50"
        />

        <AdminCard 
          href="/inventory" 
          icon={<Package size={32}/>} 
          title="Task Inventory" 
          desc="Manage the database of live and completed tasks across all projects." 
          color="text-slate-600"
          accent="bg-slate-100"
        />

        <AdminCard 
          href="/projects" 
          icon={<GanttChartSquare size={32}/>} 
          title="Project Mapping" 
          desc="Create internal project folders and manage status (Active/Paused)." 
          color="text-blue-600"
          accent="bg-blue-50"
        />

        <AdminCard 
          href="/nodes" 
          icon={<UserCog size={32}/>} 
          title="Node Authority" 
          desc="Elevate workers to Admin roles or manage system permissions." 
          color="text-indigo-600"
          accent="bg-indigo-50"
        />
        <AdminCard 
  href="/comms" 
  icon={<Megaphone size={32}/>} 
  title="Staff Communication" 
  desc="Broadcast internal transmissions to all worker emails or a specific node." 
  color="text-orange-600"
  accent="bg-orange-50"
/>
<AdminCard 
  href="/tickets" 
  icon={<MessageCircle size={32}/>} 
  title="Support Inbox" 
  desc="Review and reply to worker disputes, clarity requests, and system enquiries." 
  color="text-indigo-600"
  accent="bg-indigo-50"
/>

        <AdminCard 
          href="/pulses" 
          icon={<Megaphone size={32}/>} 
          title="System Pulses" 
          desc="Broadcast global updates and payment announcements to workers." 
          color="text-pink-600"
          accent="bg-pink-50"
        />
      </main>

      {/* SYSTEM FOOTER */}
      <footer className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-200 flex flex-wrap justify-between items-center gap-12">
        <div className="flex gap-12">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Grid Status</span>
              <span className="text-xs font-black text-emerald-600 flex items-center gap-2 uppercase tracking-tighter">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Security Protocol: Active
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Internal Version</span>
              <span className="text-xs font-black text-slate-700 font-mono tracking-tighter uppercase">Nexus_v24.ESM_PROD</span>
            </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            <Activity size={14}/> Real-time Synchronization Active
        </div>
      </footer>
    </div>
  );
}

function AdminCard({ href, icon, title, desc, color, accent }: AdminCardProps) {
  return (
    <Link href={href} className="group p-10 bg-white border border-slate-200 rounded-[3.5rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 hover:border-indigo-300 transition-all duration-500 flex flex-col">
      <div className={`${accent} ${color} w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black mb-4 tracking-tighter text-slate-900 uppercase italic leading-tight">
        {title}
      </h3>
      <p className="text-slate-500 leading-relaxed text-sm mb-10 flex-1 font-medium">
        {desc}
      </p>
      <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 group-hover:text-indigo-600 transition-colors">
        Access Domain 
        <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
      </div>
    </Link>
  );
}