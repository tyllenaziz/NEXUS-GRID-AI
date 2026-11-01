"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FolderPlus, ChevronLeft, Shield, Info, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
export default function CreateProject() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', description: '' });
const [isAssessment, setIsAssessment] = useState(false);
const [questions, setQuestions] = useState([{ q: '', options: ['', '', '', ''], correct: 0 }]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      ...formData,
      id: formData.id.trim() === "" ? undefined : formData.id.trim(),
      isAssessment, // Now correctly passed
      assessmentData: isAssessment ? questions : null // Now correctly passed
    };

    try {
      await axios.post(`${API_URL}/api/admin/projects`, projectData, { withCredentials: true });
      alert("✅ Project Domain Mapped Successfully.");
      router.push('/projects');
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create project mapping.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12 flex items-center gap-6">
          <Link href="/projects" className="p-3 bg-slate-900 rounded-2xl text-white hover:bg-indigo-600 transition-all shadow-lg">
            <ChevronLeft size={20}/>
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tight italic">New <span className="text-indigo-600 not-italic">Architect</span></h1>
        </header>
<div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
    <div className="flex justify-between items-center mb-6">
        <label className="text-xs font-black uppercase text-slate-500">Enable Assessment Mode</label>
        <input type="checkbox" checked={isAssessment} onChange={e => setIsAssessment(e.target.checked)} className="w-6 h-6 accent-indigo-600" />
    </div>

    {isAssessment && (
        <div className="space-y-8">
            {questions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4">
                    <input placeholder="Question text..." className="w-full font-bold text-sm outline-none" value={q.q} onChange={e => {
                        const newQ = [...questions];
                        newQ[qIdx].q = e.target.value;
                        setQuestions(newQ);
                    }} />
                    <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                                <input type="radio" name={`correct-${qIdx}`} checked={q.correct === oIdx} onChange={() => {
                                    const newQ = [...questions];
                                    newQ[qIdx].correct = oIdx;
                                    setQuestions(newQ);
                                }} />
                                <input placeholder={`Option ${oIdx + 1}`} className="text-xs border-b w-full" value={opt} onChange={e => {
                                    const newQ = [...questions];
                                    newQ[qIdx].options[oIdx] = e.target.value;
                                    setQuestions(newQ);
                                }} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <button type="button" onClick={() => setQuestions([...questions, { q: '', options: ['', '', '', ''], correct: 0 }])} className="text-[10px] font-black uppercase text-indigo-600">+ Add Question</button>
        </div>
    )}
</div>
        <form onSubmit={handleSubmit} className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
          <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-widest">
            <Sparkles size={18}/> Define New Domain Mapping
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Reference ID (Optional)</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                placeholder="e.g. PJ-101"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Domain Name (Public)</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                placeholder="e.g. Technical Code Analysis"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Scope & Guidelines</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-medium outline-none focus:border-indigo-500 transition-all h-32 resize-none"
                placeholder="What is the goal of this project folder?"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <><FolderPlus size={20}/> Initialize Mapping</>}
          </button>
        </form>
      </div>
    </div>
  );
}