"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Wallet, Eye, EyeOff, CreditCard, 
  History, CheckCircle2, ArrowUpRight,
  ShieldCheck, Loader2, Save, Zap,
  Settings2, ChevronRight, X, Globe,
  Mail, Landmark, Building2, Hash, Lock, ShieldAlert
} from 'lucide-react';
import { API_URL } from '@/lib/config';

export default function WorkerWallet() {
  const [userData, setUserData] = useState<any>(null);
  const [txHistory, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Security Gate States
  const [isEditing, setIsEditing] = useState(false);
  const [showOtpPrompt, setShowOtpPrompt] = useState(false);
  const [securityCode, setSecurityCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Form States
  const [showDetails, setShowDetails] = useState(false); 
  const [method, setMethod] = useState("PAYPAL");
  const [email, setEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankNumber, setBankNumber] = useState("");
  const [bankSwift, setBankSwift] = useState("");

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [u, h] = await Promise.all([
        axios.get(`${API_URL}/api/users/me`, { withCredentials: true }),
        axios.get(`${API_URL}/api/users/payout-history`, { withCredentials: true }) 
      ]);
      setUserData(u.data);
      setHistory(h.data);

      const savedMethod = u.data.wallet?.payoutMethod;
      const details = u.data.wallet?.payoutDetails || {};
      
      setMethod(savedMethod !== 'NONE' ? savedMethod : "PAYPAL");
      setEmail(details.email || "");
      setBankName(details.bankName || "");
      setBankNumber(details.bankNumber || "");
      setBankSwift(details.bankSwift || "");
    } catch (e) { console.error("Wallet sync failure:", e); }
    finally { setLoading(false); }
  };

  /**
   * ACTION: Trigger the Email OTP request
   */
  const handleInitiateUnlock = async () => {
    setVerifying(true);
    try {
        await axios.post(`${API_URL}/api/users/wallet/request-unlock`, {}, { withCredentials: true });
        setShowOtpPrompt(true);
        alert("🔒 Security Protocol Triggered: A 6-digit access key has been transmitted to your email.");
    } catch (err) {
        alert("Failed to transmit security key. Please try again later.");
    } finally {
        setVerifying(false);
    }
  };

  /**
   * ACTION: Verify the OTP and unlock the vault
   */
  const handleVerifyUnlock = async () => {
    if (securityCode.length !== 6) return alert("Please enter the 6-digit code.");
    setVerifying(true);
    try {
      await axios.post(`${API_URL}/api/users/wallet/verify-otp`, 
        { code: securityCode.trim() }, { withCredentials: true });
      
      setShowOtpPrompt(false);
      setIsEditing(true);
      setShowDetails(true); // Show sensitive data fields now that vault is unlocked
      setSecurityCode("");
    } catch (err) {
      alert("Verification Failed: The code entered is invalid or has expired.");
    } finally {
      setVerifying(false);
    }
  };

  const saveIdentity = async () => {
    try {
      const payoutDetails = method === 'BANK' ? { bankName, bankNumber, bankSwift } : { email };
      await axios.put(`${API_URL}/api/users/wallet/payout-settings`, 
        { method, details: payoutDetails }, { withCredentials: true });
      
      alert("✅ Vault synchronized and locked.");
      setIsEditing(false);
      setShowDetails(false); 
      fetchWalletData();
    } catch (e) { alert("Vault sync failed. Check database logs."); }
  };

  if (loading || !userData) return <div className="h-screen flex items-center justify-center bg-[#050505]"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-32 space-y-16 animate-in fade-in duration-1000">
      
      {/* SECTION 1: STATS */}
      <div className="grid md:grid-cols-2 gap-8">
        <StatCard title="Available Credit" value={`$${userData.finance.pending}`} subtitle="Pending next disbursement" icon={<Zap size={24}/>} accent />
        <StatCard title="Total Earnings" value={`$${userData.finance.totalEarned}`} subtitle="Total settled revenue" icon={<CheckCircle2 size={24}/>} />
      </div>

      {/* SECTION 2: HISTORY */}
      <div className="space-y-8">
        <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-3 italic"><History size={16} className="text-indigo-500"/> Transaction Ledger</h2>
        <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-4">
            {txHistory.length > 0 ? txHistory.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center p-8 hover:bg-white/[0.03] rounded-[2.5rem] transition-all border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl"><ArrowUpRight size={22}/></div>
                        <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Settled to {tx.payoutMethod || userData.wallet.payoutMethod}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 italic">{new Date(tx.payoutDate || tx.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">${tx.amount}</p>
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em]">Verified Payment</span>
                    </div>
                </div>
            )) : <p className="text-center py-20 text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">No prior disbursements found</p>}
        </div>
      </div>

      {/* SECTION 3: THE VAULT */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/[0.02] border border-white/5 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
            <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-12 flex items-center gap-3"><Lock size={16}/> Identity Vault</h2>

            {showOtpPrompt ? (
                /* OTP PROMPT */
                <div className="max-w-md mx-auto space-y-6 text-center animate-in zoom-in-95">
                    <ShieldAlert size={48} className="mx-auto text-indigo-500 mb-4" />
                    <h3 className="text-slate-900 dark:text-white font-black uppercase text-sm tracking-widest leading-relaxed">Secondary Authentication</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider px-8">Input the 6-digit access key sent to your registered node email to modify payout details.</p>
                    
                    <input 
                        type="text" 
                        maxLength={6}
                        value={securityCode}
                        onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full bg-black border border-white/10 rounded-2xl py-6 px-8 text-center text-3xl font-black text-indigo-400 outline-none focus:border-indigo-500 transition-all tracking-[0.5em]"
                        autoFocus
                    />

                    <div className="flex gap-4">
                        <button onClick={() => setShowOtpPrompt(false)} className="flex-1 py-4 bg-white/5 text-gray-500 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                        <button onClick={handleVerifyUnlock} disabled={verifying} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-500/20">
                            {verifying ? "Authorizing..." : "Verify & Unlock"}
                        </button>
                    </div>
                </div>
            ) : !isEditing ? (
                /* VIEW MODE */
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 text-indigo-400 shadow-inner">
                           {userData.wallet?.payoutMethod === 'BANK' ? <Landmark size={32}/> : <Globe size={32}/>}
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2 italic">Secured Method</span>
                            <div className="flex items-center gap-4">
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">{userData.wallet?.payoutMethod || 'None'}</h3>
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded border border-emerald-500/20 tracking-widest">Active</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleInitiateUnlock} 
                        disabled={verifying}
                        className="group flex items-center gap-3 bg-white text-black px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all shadow-xl disabled:opacity-50"
                    >
                        {verifying ? "Initializing..." : <>Modify Identity <ChevronRight size={16}/></>}
                    </button>
                </div>
            ) : (
                /* EDIT MODE */
                <div className="space-y-10 animate-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-3 gap-4">
                        {['PAYPAL', 'BANK', 'STRIPE'].map((m) => (
                            <button key={m} onClick={() => setMethod(m)} className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${method === m ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'}`}>{m}</button>
                        ))}
                    </div>

                    <div className="space-y-6">
                        {method === 'BANK' ? (
                            <div className="grid gap-6">
                                <VaultInput label="Account Holder Name" icon={<Building2 size={16}/>} value={bankName} onChange={setBankName} show={showDetails} />
                                <div className="grid md:grid-cols-2 gap-6">
                                    <VaultInput label="Account Number / IBAN" icon={<Hash size={16}/>} value={bankNumber} onChange={setBankNumber} show={showDetails} />
                                    <VaultInput label="SWIFT / BIC Code" icon={<Globe size={16}/>} value={bankSwift} onChange={setBankSwift} show={showDetails} />
                                </div>
                            </div>
                        ) : (
                            <VaultInput label={`${method} Email Address`} icon={<Mail size={16}/>} value={email} onChange={setEmail} show={showDetails} />
                        )}
                        
                        <button 
                            type="button"
                            onClick={() => setShowDetails(!showDetails)} 
                            className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4 hover:text-indigo-400 transition-colors flex items-center gap-2"
                        >
                            {showDetails ? <><EyeOff size={12}/> Obfuscate sensitive data</> : <><Eye size={12}/> Show plaintext details</>}
                        </button>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => { setIsEditing(false); setShowDetails(false); }} className="flex-1 py-5 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center gap-2"><X size={16}/> Cancel</button>
                        <button onClick={saveIdentity} className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3"><Save size={16}/> Commit To Vault</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function VaultInput({ label, icon, value, onChange, show }: any) {
    return (
        <div className="space-y-3">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-4 italic flex items-center gap-2">{icon} {label}</label>
            <input 
                type={show ? "text" : "password"} 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="w-full bg-black border border-white/10 rounded-[1.5rem] py-6 px-8 text-sm text-indigo-400 font-mono outline-none focus:border-indigo-500 transition-all shadow-inner" 
                placeholder="..." 
            />
        </div>
    );
}

function StatCard({ title, value, subtitle, icon, accent = false }: any) {
    return (
        <div className={`p-10 rounded-[3.5rem] border transition-all relative overflow-hidden ${accent ? 'bg-indigo-600 border-indigo-500 shadow-2xl text-white' : 'bg-white/[0.02] border-white/5 text-slate-900 dark:text-white shadow-xl'}`}>
            <div className="absolute -right-6 -bottom-6 opacity-10 text-white scale-[4] pointer-events-none">
                {icon}
            </div>
            <div className="relative z-10 space-y-6">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${accent ? 'text-white/70' : 'text-gray-500'}`}>{title}</span>
                <div>
                    <div className="text-6xl font-black tracking-tighter mb-2 italic">{value}</div>
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${accent ? 'text-indigo-200' : 'text-gray-600'}`}>{subtitle}</p>
                </div>
            </div>
        </div>
    );
}