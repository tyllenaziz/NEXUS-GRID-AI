"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // Added for back button
import { 
  FileText, CheckCircle2, Download, Eye, X, ChevronLeft, Lock, Scale 
} from 'lucide-react';
import { API_URL } from '@/lib/config';

export default function LegalConsole() {
  const router = useRouter(); // Initialize router
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
const res = await axios.get(`${API_URL}/api/users/me`, { withCredentials: true });

setUserData(res.data);
    } catch (err) { console.error("Legal sync failed"); }
    finally { setLoading(false); }
  };

  const handleSign = async (type: string) => {
    try {
await axios.post(`${API_URL}/api/users/legal/sign`, { docType: type }, { withCredentials: true });
      setViewingDoc(null);
      fetchData();
    } catch (err) { alert("Signature failed."); }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-orange-500 font-black tracking-widest uppercase">Decrypting Legal Vault...</div>;

  const docs = [
    { 
      id: 'CONTRACT', 
      name: 'Expert Contributor Agreement', 
      signed: !!userData?.signedContract, 
      date: userData?.signedContract,
      content: <ContractContent name={`${userData?.firstName} ${userData?.lastName}`} />
    },
    { 
      id: 'NDA', 
      name: 'Confidentiality Agreement', 
      signed: !!userData?.signedNDA, 
      date: userData?.signedNDA,
      content: <NDAContent name={`${userData?.firstName} ${userData?.lastName}`} />
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* --- BACK BUTTON --- */}
        <button 
          onClick={() => router.push('/dashboard')} 
          className="mb-8 flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-[0.3em] transition-all group"
        >
          <div className="p-2 bg-white/5 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-all">
            <ChevronLeft size={16} />
          </div>
          Back to Dashboard
        </button>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-4">Legal <span className="text-orange-500 italic text-3xl ml-2">Console</span></h1>
          <p className="text-gray-500 font-bold text-[11px] uppercase tracking-widest max-w-2xl leading-relaxed">
            Agreements between you and NexusGrid. Signing is done right here, electronically — read the document, confirm, and type your legal name.
          </p>
        </div>

        {/* Document List */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
          {docs.map((doc, index) => (
            <div 
              key={doc.id} 
              className={`p-10 flex flex-col md:flex-row justify-between items-center gap-6 ${index !== docs.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <div className="flex items-center gap-6">
                <div className={`p-5 rounded-2xl ${doc.signed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-gray-400'}`}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{doc.name}</h3>
                  {doc.signed ? (
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-2 flex items-center gap-2">
                      <CheckCircle2 size={12}/> Signed by {userData.firstName} {userData.lastName} on {new Date(doc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  ) : (
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-2 italic">Electronic Signature Required</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {doc.signed && (
                  <div className="bg-emerald-500/10 text-emerald-500 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle2 size={12}/> Completed
                  </div>
                )}
                
                <button 
                  onClick={() => setViewingDoc(doc.id)}
                  className="bg-[#1a1a1a] text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                >
                  {doc.signed ? 'View' : 'Sign Now'}
                </button>

                <button className="bg-orange-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-relaxed max-w-xl italic">
          * Both agreements must be signed before your first submission. After signing, your countersigned copy stays available here to view or download as a PDF at any time.
        </p>

        {/* --- PAPER DOCUMENT MODAL (View/Sign Mode) --- */}
        {viewingDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setViewingDoc(null)} />
            
            <div className="relative bg-[#f5f5f7] w-full max-w-4xl h-full rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="p-8 border-b border-gray-200 flex justify-between items-center bg-white">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">NexusGrid Secure Document Viewer</span>
                <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400"><X size={24}/></button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-12 md:p-24 text-gray-800 font-serif leading-relaxed custom-scrollbar bg-white">
                <div className="max-w-2xl mx-auto">
                  {docs.find(d => d.id === viewingDoc)?.content}
                </div>
              </div>

              {/* Footer */}
              <div className="p-10 border-t border-gray-200 bg-white flex justify-between items-center">
                {docs.find(d => d.id === viewingDoc)?.signed ? (
                  <div className="text-emerald-600 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={18}/> Document Signed & Verified
                  </div>
                ) : (
                  <button 
                    onClick={() => handleSign(viewingDoc)}
                    className="w-full md:w-auto bg-[#050505] text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl"
                  >
                    I Accept and Digitally Sign
                  </button>
                )}
                <button onClick={() => setViewingDoc(null)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- DOCUMENT CONTENT COMPONENTS ---

function ContractContent({ name }: { name: string }) {
  return (
    <div className="space-y-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">Expert Contributor Agreement</h2>
        <p className="text-[9px] font-sans font-black text-gray-400 uppercase tracking-[0.4em]">NexusGrid Global Network Standard</p>
      </div>
      <p className="text-sm">This Agreement is made between <strong>NexusGrid Ops</strong> and <strong>{name}</strong>.</p>
      <div className="space-y-6 text-sm">
        <h4 className="font-bold border-b border-gray-200 pb-2">1. Independent Status</h4>
        <p>The Contributor acts as an independent contractor. No employment, partnership, or joint venture is created by this relationship.</p>
        <h4 className="font-bold border-b border-gray-200 pb-2">2. Bi-Weekly Snapshot Logic</h4>
        <p>Earnings are calculated via the Snapshot Engine. Every 14 days, approved units are processed for disbursement.</p>
        <h4 className="font-bold border-b border-gray-200 pb-2">3. IP Assignment</h4>
        <p>All data created, prompt comparisons, and evaluations are owned exclusively by NexusGrid.</p>
      </div>
    </div>
  );
}

function NDAContent({ name }: { name: string }) {
  return (
    <div className="space-y-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">Confidentiality Agreement</h2>
        <p className="text-[9px] font-sans font-black text-gray-400 uppercase tracking-[0.4em]">Data Integrity Protocol</p>
      </div>
      <p className="text-sm">This NDA protects proprietary client data accessed by <strong>{name}</strong>.</p>
      <div className="space-y-6 text-sm">
        <h4 className="font-bold border-b border-gray-200 pb-2">1. Definition of Secrets</h4>
        <p>Includes client names, internal task taxonomies, model responses, and project instructions.</p>
        <h4 className="font-bold border-b border-gray-200 pb-2">2. Prohibited Disclosure</h4>
        <p>Contributor shall not use Confidential Information to train external AI models or share screenshots of production tasks.</p>
        <div className="bg-red-50 p-8 border-l-4 border-red-500 text-xs text-red-900 leading-relaxed italic">
          "Leakage of project secrets results in immediate account termination and legal pursuit for maximum statutory damages."
        </div>
      </div>
    </div>
  );
}