"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  Hash, Pin, Lock, Unlock, Send, 
  Trash2, Pencil, ChevronLeft, Bookmark,
  Smile, ShieldCheck, X, Loader2, Plus
} from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

// --- TS Interfaces ---
interface Author {
  firstName: string;
  lastName: string;
  workerProfile?: { profilePicture: string };
}

interface Message {
  id: string;
  content: string;
  isPinned: boolean;
  reactions: any; // Added for emoji support
  createdAt: string;
  author: Author;
}

interface Channel {
  id: string;
  name: string;
  isLocked: boolean;
}

export default function AdminChatConsole() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [showPinned, setShowPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetchers
  const fetchChannels = useCallback(async () => {
    try {
const res = await axios.get(`${API_URL}/api/chat/channels`, { withCredentials: true });
      setChannels(res.data);
      if (res.data.length > 0 && !activeChannel) {
          setActiveChannel(res.data[0]);
      }
    } catch (err) { 
      console.error("Channel sync error:", err); 
    } finally { 
      setLoading(false); 
    }
  }, [activeChannel]);

  const fetchMessages = useCallback(async () => {
    if (!activeChannel) return;
    try {
const res = await axios.get(`${API_URL}/api/chat/channels/${activeChannel.id}/messages`, { withCredentials: true });
      setMessages(res.data);
    } catch (err) { console.error("Message sync error:", err); }
  }, [activeChannel]);

  // 2. Lifecycle
  useEffect(() => { fetchChannels(); }, [fetchChannels]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current && !showPinned) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showPinned]);

  // 3. Actions
  const handleTransmit = async () => {
    if (!inputText || !activeChannel) return;
    try {
      if (editingMsg) {
await axios.patch(`${API_URL}/api/chat/messages/${editingMsg.id}`, { content: inputText }, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/api/chat/messages`, { content: inputText, channelId: activeChannel.id }, { withCredentials: true });

      }
      setInputText("");
      setEditingMsg(null);
      fetchMessages();
    } catch (err) { alert("Transmission failure."); }
  };

  const toggleLock = async () => {
    if (!activeChannel) return;
    const newStatus = !activeChannel.isLocked;
    try {
      await axios.patch(`${API_URL}/api/chat/channels/${activeChannel.id}/lock`, { isLocked: newStatus }, { withCredentials: true });
      setActiveChannel({ ...activeChannel, isLocked: newStatus });
      fetchChannels();
    } catch (err) { alert("Lock state update failed."); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanent delete? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_URL}/api/chat/messages/${id}`, { withCredentials: true });
      fetchMessages();
    } catch (err) { alert("Delete failed."); }
  };

  const togglePin = async (id: string, current: boolean) => {
    try {
      await axios.patch(`${API_URL}/api/chat/messages/${id}/pin`, { isPinned: !current }, { withCredentials: true });
      fetchMessages();
    } catch (err) { alert("Pinning failed."); }
  };

  const handleReact = async (id: string, emoji: string) => {
    try {
      await axios.post(`${API_URL}/api/chat/messages/${id}/react`, { emoji }, { withCredentials: true });
      fetchMessages();
    } catch (err) { console.error("Reaction failed"); }
  };

  if (loading) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="animate-spin text-pink-500" size={40} />
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 font-sans overflow-hidden">
      
      {/* SIDEBAR: CHANNELS */}
      <aside className="w-72 bg-[#020617] flex flex-col shrink-0 border-r border-white/5">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
            <Link href="/" className="p-2 bg-white/5 rounded-lg text-white hover:bg-pink-600 transition-all">
                <ChevronLeft size={18}/>
            </Link>
            <h1 className="text-white font-black uppercase text-xs tracking-[0.2em]">Pulse Control</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-4 block">Active Channels</label>
            {channels.map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => setActiveChannel(c)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeChannel?.id === c.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3"><Hash size={16}/> {c.name}</div>
                  {c.isLocked && <Lock size={12} className="opacity-40"/>}
                </button>
            ))}
        </div>
      </aside>

      {/* MAIN: BROADCAST INTERFACE */}
      <main className="flex-1 flex flex-col bg-[#0f172a]">
        
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between shrink-0 bg-[#0f172a]/80 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl"><Hash size={20}/></div>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest">{activeChannel?.name}</h2>
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${activeChannel?.isLocked ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-emerald-500 shadow-[0_0_8px_green]'}`}/>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{activeChannel?.isLocked ? 'Locked Zone' : 'Standard Feed'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowPinned(!showPinned)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${showPinned ? 'bg-orange-500 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                    <Bookmark size={14}/> {showPinned ? 'Close Pinned' : 'View Pinned'}
                </button>
                <button 
                  onClick={toggleLock}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${activeChannel?.isLocked ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}
                >
                    {activeChannel?.isLocked ? <><Unlock size={14}/> Unlock Channel</> : <><Lock size={14}/> Lock Channel</>}
                </button>
            </div>
        </header>

        {/* FEED */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            {messages.filter(m => !showPinned || m.isPinned).map((msg) => (
                <div key={msg.id} className="group flex gap-5 relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <img 
                      src={msg.author.workerProfile?.profilePicture || `https://ui-avatars.com/api/?name=${msg.author.firstName}&background=random`} 
                      className="w-12 h-12 rounded-2xl object-cover border border-white/10 bg-white/5 shadow-xl"
                    />
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-white">{msg.author.firstName} {msg.author.lastName}</span>
                            <span className="bg-slate-100 text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">Author</span>
                            <span className="text-[9px] font-bold text-slate-500">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                            {msg.isPinned && <Bookmark size={14} className="text-orange-500 fill-orange-500 ml-2" />}
                        </div>
                        <div className="text-sm text-slate-300 leading-relaxed font-medium bg-white/[0.02] p-5 rounded-2xl rounded-tl-none border border-white/5 shadow-inner">
                            {msg.content}
                        </div>

                        {/* REACTION SYSTEM */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            {Object.entries((msg.reactions as any) || {}).map(([emoji, userIds]: [string, any]) => (
                                <button 
                                    key={emoji}
                                    onClick={() => handleReact(msg.id, emoji)}
                                    className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] flex items-center gap-2 hover:bg-pink-500/20 transition-all"
                                >
                                    <span>{emoji}</span>
                                    <span className="font-black text-white">{userIds.length}</span>
                                </button>
                            ))}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                {['🔥', '👍', '🚀', '💯', '❤️'].map(e => (
                                    <button 
                                        key={e} 
                                        onClick={() => handleReact(msg.id, e)}
                                        className="p-1 hover:scale-125 transition-transform"
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* MODERATION BUTTONS */}
                    <div className="absolute right-0 top-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                         <button onClick={() => togglePin(msg.id, msg.isPinned)} className={`p-2 bg-[#1e293b] border border-white/10 rounded-xl hover:shadow-2xl transition-all ${msg.isPinned ? 'text-orange-500' : 'text-slate-400'}`}><Bookmark size={16}/></button>
                         <button onClick={() => { setEditingMsg(msg); setInputText(msg.content); }} className="p-2 bg-[#1e293b] border border-white/10 text-slate-400 hover:text-blue-500 rounded-xl hover:shadow-2xl transition-all"><Pencil size={16}/></button>
                         <button onClick={() => handleDelete(msg.id)} className="p-2 bg-[#1e293b] border border-white/10 text-slate-400 hover:text-red-500 rounded-xl hover:shadow-2xl transition-all"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
        </div>

        {/* INPUT */}
        <div className="p-8 bg-[#020617] border-t border-white/5">
            {editingMsg && (
                <div className="mb-4 bg-blue-500/10 p-3 rounded-xl flex justify-between items-center border border-blue-500/20">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Pencil size={12}/> Modifying Transmission: {editingMsg.id.substring(0,8)}</span>
                    <button onClick={() => {setEditingMsg(null); setInputText("");}} className="text-blue-400 hover:text-white"><X size={16}/></button>
                </div>
            )}
            <div className="relative max-w-5xl mx-auto group">
                <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTransmit(); }}}
                    placeholder={activeChannel?.isLocked ? "Broadcasting in Protected Mode..." : `Transmit message to # ${activeChannel?.name}`}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] py-6 pl-8 pr-20 text-sm text-white outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all min-h-[80px] resize-none placeholder:text-slate-600"
                />
                <button 
                  onClick={handleTransmit}
                  className="absolute right-3 top-3 p-5 bg-pink-600 text-white rounded-2xl hover:bg-slate-100 hover:text-black transition-all shadow-xl shadow-pink-500/10"
                >
                    <Send size={24}/>
                </button>
            </div>
            <div className="mt-4 flex justify-center gap-8">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Protocol: NexusGrid_ESM_v4</span>
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">System: Secure_Encryption_Active</span>
            </div>
        </div>
      </main>
    </div>
  );
}