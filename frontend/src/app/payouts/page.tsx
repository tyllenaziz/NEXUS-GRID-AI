"use client";
import { useState } from 'react';
import { ShieldCheck, Calendar, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function PayoutConsole() {
  const [isConfirming, setIsConfirming] = useState(false);

  const releaseFunds = async () => {
    // Backend logic would: 
    // 1. Grab all Wallets with balance > 0
    // 2. Move availableBalance to a new Transaction (Status: PAID)
    // 3. Reset availableBalance to 0
    await axios.post('http://localhost:5000/api/admin/release-all', {}, { withCredentials: true });
    alert("💸 All balances have been moved to the payout processing queue.");
    setIsConfirming(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-16">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-emerald-100 text-emerald-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-4">Financial Disbursement</h1>
        <p className="text-slate-500 font-medium mb-12">Total System Liability: <span className="text-slate-900 font-black">$42,500.80</span></p>

        {!isConfirming ? (
          <button 
            onClick={() => setIsConfirming(true)}
            className="bg-black text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl"
          >
            Trigger Bi-Weekly Release
          </button>
        ) : (
          <div className="bg-white border-2 border-red-200 p-10 rounded-[3rem] animate-in fade-in zoom-in duration-300">
            <AlertTriangle className="text-red-500 mx-auto mb-4" size={32} />
            <h2 className="text-xl font-black uppercase mb-2 text-red-600">Final Security Check</h2>
            <p className="text-slate-500 text-sm mb-8">This will zero out all worker balances and generate payment files for PayPal/Stripe. This cannot be undone.</p>
            <div className="flex gap-4 justify-center">
               <button onClick={() => setIsConfirming(false)} className="px-8 py-4 font-black uppercase text-xs text-slate-400">Cancel</button>
               <button onClick={releaseFunds} className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Execute Release</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}