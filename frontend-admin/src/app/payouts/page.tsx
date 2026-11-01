"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, Landmark, Mail, ShieldCheck, 
  ArrowRightLeft, AlertCircle, History, 
  ChevronLeft, Camera, DollarSign, CheckCircle2,
  Calendar, Zap, Eye
} from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
interface SnapshotUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  snapshotBalance: number;
  payoutMethod: string;
  payoutDetails: any;
  payInput?: string; 
  paidThisCycle: boolean;
  manualDate?: string; // ADD: Manual date per user
}

export default function PayoutManager() {
  const [users, setUsers] = useState<SnapshotUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  // Set default date to today for the inputs
  const today = new Date().toISOString().split('T')[0];

  const fetchSnapshot = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/finance/snapshot-data`, { 
        withCredentials: true 
      });
      const { cycleActive, users: fetchedUsers } = res.data;
      setUsers(fetchedUsers.map((u: any) => ({ 
        ...u, 
        payInput: u.snapshotBalance.toString(),
        manualDate: today 
      })));
      setSnapshotTaken(cycleActive);
    } catch (err) {
      console.error("No active snapshot data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, []);

  const takeSnapshot = async () => {
    if(!confirm("Capture Payout Snapshot? This will freeze all approved tasks up to this second.")) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/admin/finance/snapshot`, {}, { withCredentials: true });
      alert("✅ Snapshot captured successfully.");
      fetchSnapshot();
    } catch (err) {
      alert("Snapshot failed.");
    } finally {
      setLoading(false);
    }
  };

  const executePayout = async (user: SnapshotUser) => {
    const payAmount = parseFloat(user.payInput || "0");
    if (payAmount <= 0) return alert("Invalid payment amount.");
    
    const confirmMsg = `Confirm disbursement of $${payAmount} to ${user.email}?\n` + 
                       `Recorded Date: ${user.manualDate}\n` +
                       `Channel: ${user.payoutMethod}`;

    if(!confirm(confirmMsg)) return;

    try {
      await axios.post(`${API_URL}/api/admin/payout/process`, {
        userId: user.id,
        amountToPay: payAmount,
        manualDate: user.manualDate 
      }, { withCredentials: true });

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, paidThisCycle: true } : u));
      alert(`✅ Disbursement synchronized for ${user.manualDate}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Payment execution failed.");
    }
  };

  const finishCycle = async () => {
    if (!confirm("Finalize cycle? This clears the board for the next sweep.")) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/admin/finance/cycle-complete`, {}, { withCredentials: true });
      setUsers([]);
      setSnapshotTaken(false);
    } catch (err) {
      alert("Failed to finalize cycle.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) return <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest">Synchronizing Ledgers...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-6">
            <Link href="/" className="bg-slate-900 p-3 rounded-2xl text-white hover:bg-indigo-600 transition-all shadow-lg">
                <ChevronLeft size={24} />
            </Link>
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-1 italic">Financial <span className="text-indigo-600 not-italic">Sweep</span></h1>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck size={14} className="text-indigo-600"/> Batch Disbursement Engine
                </p>
            </div>
          </div>

          <div className="flex gap-4">
            {!snapshotTaken ? (
              <button onClick={takeSnapshot} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl">
                <Camera size={18}/> Initialize Snapshot
              </button>
            ) : (
              <button onClick={finishCycle} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl">
                <CheckCircle2 size={18}/> Finalize Sweep
              </button>
            )}
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8 mb-10">
          <StatCard title="Total Liability" value={`$${users.reduce((acc, u) => acc + u.snapshotBalance, 0).toFixed(2)}`} icon={<DollarSign/>} />
          <StatCard title="Eligible Nodes" value={users.length} icon={<History/>} />
          <div className="lg:col-span-2 bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-widest mb-1 italic">Protocol State</span>
                <span className="text-lg font-black text-indigo-900">{snapshotTaken ? "Snapshot Active (Protected)" : "Idle (Ready)"}</span>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <AlertCircle size={24} className={snapshotTaken ? "animate-pulse text-indigo-500" : "text-slate-200"}/>
              </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400">
              <tr className="text-[9px] font-black uppercase tracking-widest">
                <th className="p-8">Contributor</th>
                <th className="p-8">Payout Identity</th>
                <th className="p-8">Audit Date</th>
                <th className="p-8">Eligible</th>
                <th className="p-8 text-right">Execute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-8">
                    <p className="text-xs font-black uppercase text-slate-900 mb-1">{u.firstName} {u.lastName}</p>
                    <p className="text-[10px] font-bold text-slate-400">{u.email}</p>
                  </td>
                  <td className="p-8">
  <div className="flex flex-col gap-2">
      {/* 1. Status Badge */}
      <div className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md w-fit flex items-center gap-2 border ${
          u.payoutMethod === 'PAYPAL' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
          u.payoutMethod === 'STRIPE' ? 'bg-purple-50 text-purple-600 border-purple-100' :
          u.payoutMethod === 'BANK' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          'bg-slate-100 text-slate-400 border-slate-200'
      }`}>
         {u.payoutMethod || 'NOT SET'}
      </div>

      {/* 2. Dynamic Details Logic (The Fix) */}
      <div className="text-[10px] font-mono text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
          {u.payoutMethod === 'BANK' ? (
              <div className="space-y-1">
                  <p className="font-black text-slate-700 uppercase">Name: {u.payoutDetails?.bankName || 'N/A'}</p>
                  <p>Acct: {u.payoutDetails?.bankNumber || 'N/A'}</p>
                  <p>SWIFT: {u.payoutDetails?.bankSwift || 'N/A'}</p>
              </div>
          ) : (
              /* Handle PAYPAL or STRIPE emails */
              <p className="font-bold">{u.payoutDetails?.email || 'Details Pending'}</p>
          )}
      </div>
  </div>
</td>
                  <td className="p-8">
                    {/* MANUAL DATE INPUT */}
                    <div className="relative w-fit">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                        <input 
                            type="date" 
                            className="bg-slate-50 border border-slate-200 py-2 pl-9 pr-4 rounded-xl text-[10px] font-black uppercase outline-none focus:border-indigo-500 transition-all"
                            value={u.manualDate}
                            onChange={(e) => {
                                const newUsers = users.map(user => user.id === u.id ? {...user, manualDate: e.target.value} : user);
                                setUsers(newUsers);
                            }}
                        />
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="text-lg font-black text-slate-900">${u.snapshotBalance.toFixed(2)}</div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Approved for Release</span>
                  </td>
                  <td className="p-8 text-right">
                    {u.paidThisCycle ? (
                      <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-emerald-100">
                        <CheckCircle2 size={14}/> Sync Complete
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-2">
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                            <input 
                              type="number" 
                              className="bg-slate-50 border border-slate-200 py-3 pl-8 pr-4 rounded-xl text-sm font-black w-28 outline-none focus:border-indigo-500 transition-all"
                              value={u.payInput}
                              onChange={(e) => {
                                const newUsers = users.map(user => user.id === u.id ? {...user, payInput: e.target.value} : user);
                                setUsers(newUsers);
                              }}
                            />
                        </div>
                        <button onClick={() => executePayout(u)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-600 transition-all shadow-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                            <ArrowRightLeft size={12}/> Release Node Funds
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex justify-between items-start">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">{title}</span>
        <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
      </div>
      <div className="p-4 bg-slate-50 text-indigo-600 rounded-2xl">{icon}</div>
    </div>
  );
}