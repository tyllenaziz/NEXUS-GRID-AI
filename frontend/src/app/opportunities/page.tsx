"use client";
import React from 'react';
import Link from 'next/link';
import { Layers, Search, MapPin, Clock, DollarSign, ArrowUpRight } from 'lucide-react';

const jobs = [
  { id: 1, title: 'Mathematics Expert', type: 'Remote', pay: 'Competitive', field: 'STEM' },
  { id: 2, title: 'Software Engineering Auditor', type: 'Contract', pay: 'High Yield', field: 'Coding' },
  { id: 3, title: 'Linguistic Specialist', type: 'Flexible', pay: 'Project Based', field: 'Languages' },
  { id: 4, title: 'Physics Research Lead', type: 'Remote', pay: 'Competitive', field: 'STEM' },
  { id: 5, title: 'Medical Content Evaluator', type: 'Part-time', pay: 'Variable', field: 'Medicine' },
  { id: 6, title: 'Legal Reasoning Specialist', type: 'Contract', pay: 'High Yield', field: 'Law' },
];

export default function OpportunitiesPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans pt-32 pb-20 px-6">
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-black/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-sm flex items-center justify-center"><Layers size={18} /></div>
            <span className="text-xl font-bold tracking-tighter uppercase italic">Nexus Grid AI</span>
          </Link>
          <Link href="/" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition">Back to Home</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-indigo-500 mb-6">Career Protocol</h2>
          <h1 className="text-6xl font-bold tracking-tighter uppercase mb-6 italic">Find your next <br/>AI opportunity.</h1>
          
          <div className="max-w-2xl relative mt-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
                type="text" 
                placeholder="SEARCH EXPERTISE (E.G. QUANTUM PHYSICS, PYTHON, LAW)..." 
                className="w-full bg-white/[0.03] border border-white/10 py-5 pl-14 pr-6 text-[10px] font-bold tracking-[0.2em] uppercase focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="group p-8 border border-white/5 bg-[#080808] hover:border-indigo-500/40 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-indigo-600 transition-all duration-500"></div>
                <div className="flex justify-between items-start mb-12">
                    <span className="text-[10px] font-bold px-3 py-1 bg-white/5 text-gray-400 uppercase tracking-widest">{job.field}</span>
                    <ArrowUpRight className="text-gray-700 group-hover:text-indigo-500 transition-colors" />
                </div>
                <h3 className="text-2xl font-bold italic uppercase mb-6 tracking-tight">{job.title}</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-500 text-xs uppercase tracking-widest">
                        <MapPin size={14} className="text-indigo-500" /> {job.type}
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 text-xs uppercase tracking-widest">
                        <Clock size={14} className="text-indigo-500" /> Flexible Hours
                    </div>
                    <div className="flex items-center gap-3 text-emerald-500 text-xs uppercase tracking-widest font-bold">
                        <DollarSign size={14} /> {job.pay}
                    </div>
                </div>
                <button className="mt-10 w-full py-4 border border-white/10 text-[10px] font-bold uppercase tracking-widest group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all">
                    Apply Now
                </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}