"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Layers, 
  Type, 
  MessageSquare, 
  ShieldCheck, 
  Database,
  Rocket
} from 'lucide-react';
import Link from 'next/link';
// FIX: Path is 3 levels deep from /app/tasks/new/
import { API_URL } from '../../../lib/config';

// Define the shape of our project data
interface Project {
  id: string;
  name: string;
}

export default function CreateTask() {
  const router = useRouter();
  const [taskType, setTaskType] = useState('PREFERENCE_RANKING');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Initial state including the new payRate field
  const [task, setTask] = useState({
    title: '', 
    projectId: '', 
    instruction: '',
    payRate: '20.00', // Default starting price
    prompt: '', 
    response_a: '', 
    response_b: '',
    source_text: '', 
    categories: 'Positive, Negative, Neutral'
  });

  // 1. Fetch Projects on Load using production URL
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/projects`, { withCredentials: true });
        setProjects(res.data);
        
        // FIX: Only auto-select if there is data AND no project is currently selected
        if (res.data.length > 0 && !task.projectId) {
          setTask(prev => ({ ...prev, projectId: res.data[0].id }));
        }
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    };
    fetchProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task.projectId) {
      return alert("❌ Please select a Project Folder from the dropdown first!");
    }

    setLoading(true);

    // Prepare content based on type
    const content = taskType === 'PREFERENCE_RANKING' 
      ? { prompt: task.prompt, a: task.response_a, b: task.response_b }
      : { text: task.source_text, options: task.categories.split(',') };

    try {
      // Send task to production backend with the custom payRate
      await axios.post(`${API_URL}/api/admin/tasks`, {
        projectId: task.projectId,
        title: task.title,
        instruction: task.instruction,
        type: taskType,
        content: content,
        payRate: task.payRate 
      }, { withCredentials: true });

      alert("🚀 Task successfully deployed to the queue!");
      
      // Reset form fields but keep project and current payRate selected
      setTask(prev => ({ 
        ...prev, 
        title: '', 
        prompt: '', 
        response_a: '', 
        response_b: '', 
        source_text: '' 
      }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Check if project exists and admin session is active.";
      alert("Submission Failed: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-12 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="bg-slate-900 p-2.5 rounded-2xl text-white hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100">
              <ChevronLeft size={24}/>
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Task <span className="text-indigo-600 not-italic">Architect</span></h1>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 gap-1 shadow-sm">
            <TypeTab active={taskType === 'PREFERENCE_RANKING'} label="Ranking" icon={<Layers size={14}/>} onClick={() => setTaskType('PREFERENCE_RANKING')} />
            <TypeTab active={taskType === 'TEXT_CLASSIFICATION'} label="Classification" icon={<Type size={14}/>} onClick={() => setTaskType('TEXT_CLASSIFICATION')} />
            <TypeTab active={taskType === 'SENTIMENT_ANALYSIS'} label="Sentiment" icon={<MessageSquare size={14}/>} onClick={() => setTaskType('SENTIMENT_ANALYSIS')} />
            <TypeTab active={taskType === 'FACT_CHECKING'} label="Fact Check" icon={<ShieldCheck size={14}/>} onClick={() => setTaskType('FACT_CHECKING')} />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-10">
          
          {/* Sidebar Settings */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">

                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 tracking-widest">
                    Project Domain
                    </label>
                    <select 
  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none text-slate-900 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20"
  value={task.projectId || ""} // Ensure it defaults to empty string if null
  onChange={e => {
    const selectedId = e.target.value;
    console.log("Switching to Project ID:", selectedId);
    setTask({...task, projectId: selectedId});
  }}
  required
>
    <option value="" disabled>-- Choose a Domain --</option>
    {projects.map((p) => (
      <option key={p.id} value={p.id}>
        {p.name} {p.id ? `(${p.id.substring(0,5)})` : "(ID MISSING)"}
      </option>
    ))}
</select>
                </div>

                {/* --- NEW: PAY RATE INPUT --- */}
               {/* --- COPY THIS SPECIFIC BLOCK --- */}
<div>
    <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 tracking-widest">
        Task Pay Rate ($ USD)
    </label>
    <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black">$</span>
        <input 
            type="number"
            step="0.01"
            className="w-full bg-slate-50 border border-slate-100 p-4 pl-8 rounded-2xl outline-none text-emerald-600 font-black text-sm focus:ring-2 focus:ring-emerald-500/20" 
            placeholder="20.00"
            value={task.payRate} 
            onChange={e => setTask({...task, payRate: e.target.value})} 
            required
        />
    </div>
</div>
{/* --- END OF BLOCK --- */}

                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 tracking-widest">Batch Identifier</label>
                    <input 
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="e.g. RLHF_BATCH_001" 
                      value={task.title} 
                      onChange={e => setTask({...task, title: e.target.value})} 
                      required
                    />
                </div>

                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 tracking-widest">Worker Instructions</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none text-slate-900 h-32 text-xs font-medium leading-relaxed focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="Provide clear guidelines for the worker..." 
                      value={task.instruction} 
                      onChange={e => setTask({...task, instruction: e.target.value})} 
                      required
                    />
                </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex items-center gap-4">
               <div className="bg-white p-3 rounded-xl text-indigo-600 shadow-sm"><Database size={20}/></div>
               <div>
                  <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">System Check</div>
                  <div className="text-xs font-bold text-indigo-900">Custom rates overwrite system defaults.</div>
               </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
            {taskType === 'PREFERENCE_RANKING' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl h-28 outline-none text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500/10 transition-all" 
                  placeholder="The Original User Prompt..." 
                  value={task.prompt} 
                  onChange={e => setTask({...task, prompt: e.target.value})} 
                />
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl h-44 outline-none text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500/10 transition-all" 
                  placeholder="Model Response A..." 
                  value={task.response_a} 
                  onChange={e => setTask({...task, response_a: e.target.value})} 
                />
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl h-44 outline-none text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500/10 transition-all" 
                  placeholder="Model Response B..." 
                  value={task.response_b} 
                  onChange={e => setTask({...task, response_b: e.target.value})} 
                />
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl h-64 outline-none text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500/10 transition-all" 
                  placeholder="Source text to be analyzed or verified..." 
                  value={task.source_text} 
                  onChange={e => setTask({...task, source_text: e.target.value})} 
                />
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 tracking-widest">Classification Labels (Comma Separated)</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/10 transition-all" 
                    placeholder="e.g. Neutral, Sarcastic, Urgent" 
                    value={task.categories} 
                    onChange={e => setTask({...task, categories: e.target.value})} 
                  />
                </div>
              </div>
            )}
            
            <button 
              disabled={loading} 
              className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 group"
            >
              {loading ? "PROVISIONING DATA..." : "AUTHORIZE & DEPLOY TASK"} 
              <Rocket size={18} className="group-hover:translate-y-[-4px] group-hover:translate-x-[4px] transition-transform"/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TypeTab({ active, label, icon, onClick }: any) {
    return (
      <button 
        type="button" 
        onClick={onClick} 
        className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
      >
        {icon} {label}
      </button>
    );
}