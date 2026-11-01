"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  Layers, ShieldCheck, Type, MessageSquare, 
  ArrowRight, Zap, Info 
} from 'lucide-react';
import { API_URL } from '@/lib/config';
export default function ProjectsPage() {
  const router = useRouter();
  const [queueCounts, setQueueCounts] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
const res = await axios.get(`${API_URL}/api/users/task-counts`, { withCredentials: true });
        setQueueCounts(res.data);
      } catch (err) {
        console.error("Queue sync failed");
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const startSession = async (type: string) => {
    try {
const res = await axios.get(`${API_URL}/api/users/tasks/next/${type}`, { withCredentials: true });
      router.push(`/dashboard/tasks/${res.data.id}`);
    } catch (err) {
      alert("This project queue is temporarily empty. Check back in a few minutes.");
    }
  };

 const projectCategories = [
  { id: 'PREFERENCE_RANKING', name: 'Preference Ranking', icon: <Layers size={22}/>, color: 'text-indigo-400', desc: 'Compare two AI responses and rank them based on logic and safety.' },
  { id: 'FACT_CHECKING', name: 'Fact Checking', icon: <ShieldCheck size={22}/>, color: 'text-blue-400', desc: 'Verify claims against external sources to ensure high factual accuracy.' },
  { id: 'TEXT_CLASSIFICATION', name: 'Text Classification', icon: <Type size={22}/>, color: 'text-emerald-400', desc: 'Categorize datasets based on intent, topic, and emotional tone.' },
  { id: 'SENTIMENT_ANALYSIS', name: 'Sentiment Analysis', icon: <MessageSquare size={22}/>, color: 'text-amber-400', desc: 'Detect emotional nuances and sarcasm within complex strings of text.' },
];

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      
      {/* Header Section */}
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
            Active <span className="text-orange-500">Projects</span>
          </h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.3em]">
            Available Work Streams & Live Task Queues
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white/[0.03] border border-white/5 px-6 py-3 rounded-2xl">
          <Zap size={14} className="text-orange-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">All Systems Operational</span>
        </div>
      </div>

      {/* Grid of Projects */}
      <div className="grid gap-6">
        {projectCategories.map((project) => (
          <div 
            key={project.id} 
            className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] flex flex-col md:flex-row justify-between items-center hover:bg-[#111] transition-all group relative overflow-hidden"
          >
            {/* Background Glow Effect */}
            <div className={`absolute -right-20 -top-20 w-40 h-40 blur-[80px] opacity-10 transition-opacity group-hover:opacity-20 ${project.color.replace('text', 'bg')}`}></div>

            <div className="flex items-center gap-8 w-full md:w-auto">
              <div className={`p-6 bg-white/5 rounded-3xl ${project.color} group-hover:scale-110 transition-transform shadow-xl`}>
                {project.icon}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">{project.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Instant Credit</span>
                  <span className="text-gray-800">•</span>
           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
    { (queueCounts[project.id]?.count || 0) > 0 ? "Queue Available" : "Replenishing" }
</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end mt-8 md:mt-0 pt-8 md:pt-0 border-t md:border-0 border-white/5">
              <div className="text-right">
    <span className="text-[9px] font-black text-gray-600 uppercase block tracking-widest mb-1 italic">Base Rate</span>
    <span className="text-3xl font-black text-white tracking-tighter">
        ${queueCounts[project.id]?.payRate || "0.00"}
    </span>
</div>
              
             <button 
    onClick={() => startSession(project.id)}
    // Check for .count > 0
    disabled={!(queueCounts[project.id]?.count > 0)}
    className={`px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center gap-3 ${
        (queueCounts[project.id]?.count || 0) > 0 
        ? 'bg-white text-black hover:bg-orange-500 hover:text-white' 
        : 'bg-white/5 text-gray-700 cursor-not-allowed opacity-50'
    }`}
>
    {(queueCounts[project.id]?.count || 0) > 0 ? (
        <>Enter Queue <ArrowRight size={16}/></>
    ) : (
        'Replenishing'
    )}
</button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-12 p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-start gap-4">
        <Info className="text-gray-600 shrink-0" size={20} />
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-relaxed">
          Pay rates are fixed based on domain complexity. Advanced contributors with a star rating above 4.5 will automatically unlock "Priority Tier" projects with a 15% increase in base rates.
        </p>
      </div>
    </div>
  );
}