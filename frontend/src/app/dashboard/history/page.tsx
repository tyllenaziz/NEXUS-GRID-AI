"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { History, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import { API_URL } from '@/lib/config';
export default function TaskHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
axios.get(`${API_URL}/api/users/history`, { withCredentials: true })
      .then(res => setHistory(res.data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Task History</h1>
        <p className="text-gray-500">Review your past contributions and admin feedback.</p>
      </header>

      <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <tr>
              <th className="p-6">Task Identity</th>
              <th className="p-6">Status</th>
              <th className="p-6">Pay</th>
              <th className="p-6 text-right">Audit Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {history.map((item: any) => (
              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-6">
                    <div className="font-bold text-gray-200">{item.task.title}</div>
                    <div className="text-[10px] text-gray-500 uppercase">{item.task.type}</div>
                </td>
                
                <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {item.status}
                    </span>
                </td>
                <td className="p-6 font-black text-emerald-500">+${parseFloat(item.task.payRate).toFixed(2)}</td>
                <td className="p-6 text-right">
                    {item.review ? (
                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 p-3 rounded-xl text-[10px] font-medium max-w-xs text-left">
                            <MessageCircle size={14}/> {item.review.feedback}
                        </div>
                    ) : <span className="text-[10px] text-gray-600 italic">No audit performed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}