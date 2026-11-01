"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  Hash, Pin, Lock, Unlock, Smile, 
  Send, Pencil, Trash2, Bookmark, Loader2,
  Heart, Zap, ThumbsUp, Flame
} from 'lucide-react';
import { API_URL } from '@/lib/config';
export default function WorkerChat() {
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load: Fetch all Project Channels + General
  const fetchChannels = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/channels`, { withCredentials: true });
      setChannels(res.data);
      if (res.data.length > 0 && !activeChannel) setActiveChannel(res.data[0]);
    } catch (err) {
      console.error("Channel sync failed");
    } finally {
      setLoading(false);
    }
  }, [activeChannel]);

  // 2. Load messages when active channel changes
  const fetchMessages = useCallback(async () => {
    if (!activeChannel?.id) return;
    try {
        const res = await axios.get(`${API_URL}/api/chat/channels/${activeChannel.id}/messages`, { withCredentials: true });
        setMessages(res.data);
    } catch (err) {
        console.error("Message sync error");
    }
  }, [activeChannel]);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // 3. Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText || !activeChannel || activeChannel?.isLocked) return;

   try {
        await axios.post(`${API_URL}/api/chat/messages`, {
            channelId: activeChannel.id,
            content: inputText
        }, { withCredentials: true });
        
        setInputText("");
        fetchMessages();
    } catch (err) {
        alert("Transmission failed. This channel may be locked by administrators.");
    }
  };

  const handleReact = async (msgId: string, emoji: string) => {
    try {
      await axios.post(`${API_URL}/api/chat/messages/${msgId}/react`, { emoji }, { withCredentials: true });
      fetchMessages();
    } catch (err) {
      console.error("Reaction failed");
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-orange-500" size={32}/>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Connecting to Grid Streams...</p>
    </div>
  );

  return (
    <div className="flex h-[80vh] bg-[#0a0a0a] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl animate-in fade-in duration-700">
      
      {/* SIDEBAR - CHANNELS */}
      <aside className="w-72 border-r border-white/5 bg-[#050505] p-8 flex flex-col">
        <div className="mb-8">
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">Network Channels</h3>
            <div className="space-y-2">
            {channels.map(c => (
                <button 
                key={c.id} 
                onClick={() => setActiveChannel(c)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-black uppercase transition-all duration-300 ${activeChannel?.id === c.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                >
                <div className="flex items-center gap-3">
                    <Hash size={16} className={activeChannel?.id === c.id ? 'text-white' : 'text-gray-700'}/> 
                    {c.name}
                </div>
                {c.isLocked && <Lock size={12} className="opacity-40"/>}
                </button>
            ))}
            </div>
        </div>
      </aside>

      {/* MAIN CHAT WORKSPACE */}
      <main className="flex-1 flex flex-col bg-[#080808]">
        
        {/* Header */}
        <header className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                    <Hash size={20}/>
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white">{activeChannel?.name || 'Select Channel'}</h2>
                    {activeChannel?.isLocked && (
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"/>
                            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Locked by Admins • Broadcast Only</span>
                        </div>
                    )}
                </div>
            </div>
        </header>

        {/* Message Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            {messages.length > 0 ? messages.map((m) => (
                <div key={m.id} className="flex gap-5 group relative animate-in slide-in-from-bottom-2 duration-500">
                    <img 
                      src={m.author.workerProfile?.profilePicture || `https://ui-avatars.com/api/?name=${m.author.firstName}&background=random&color=fff`} 
                      className="w-12 h-12 rounded-2xl object-cover border border-white/10 bg-white/5 shadow-xl"
                    />
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-white">{m.author.firstName} {m.author.lastName}</span>
                            {m.author.role === 'ADMIN' && <span className="bg-orange-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">Expert / Admin</span>}
                            <span className="text-[9px] font-bold text-gray-600 uppercase">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {m.isPinned && <Bookmark size={14} className="text-orange-500 fill-orange-500 ml-2" />}
                        </div>
                        <div className="text-sm text-gray-400 leading-relaxed font-medium bg-white/[0.02] p-5 rounded-2xl rounded-tl-none border border-white/5">
                            {m.content}
                        </div>
                        
                        {/* REACTION SYSTEM */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            {Object.entries((m.reactions as any) || {}).map(([emoji, userIds]: [string, any]) => (
                                <button 
                                    key={emoji}
                                    onClick={() => handleReact(m.id, emoji)}
                                    className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] flex items-center gap-2 hover:bg-orange-500/20 transition-all"
                                >
                                    <span>{emoji}</span>
                                    <span className="font-black text-white">{userIds.length}</span>
                                </button>
                            ))}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                {['🔥', '👍', '🚀', '💯', '❤️'].map(e => (
                                    <button 
                                        key={e} 
                                        onClick={() => handleReact(m.id, e)}
                                        className="p-1 hover:scale-125 transition-transform"
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <Hash size={64} className="mb-4 text-gray-600"/>
                    <p className="text-xs font-black uppercase tracking-widest">No transmissions found in this frequency</p>
                </div>
            )}
        </div>

        {/* INPUT BOX - UPDATED WITH LOCK LOGIC */}
        <div className="p-8 bg-[#0a0a0a] border-t border-white/5">
            {activeChannel?.isLocked ? (
                <div className="w-full bg-red-500/5 border border-red-500/10 rounded-[2rem] py-8 px-6 text-center shadow-inner">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                        <Lock size={16} className="animate-pulse"/> Channel locked by administrators for broadcast only
                    </p>
                    <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-2">Communication stream restricted in this zone</p>
                </div>
            ) : (
                <div className="relative group max-w-5xl mx-auto">
                    <input 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => { if(e.key === 'Enter') sendMessage(); }}
                      placeholder={`Transmit to # ${activeChannel?.name}...`}
                      className="w-full bg-[#050505] border border-white/10 rounded-[2rem] py-6 pl-8 pr-20 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all placeholder:text-gray-700"
                    />
                    <button 
                        onClick={sendMessage} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-orange-500 text-white rounded-2xl hover:bg-white hover:text-black transition-all shadow-xl shadow-orange-500/20"
                    >
                        <Send size={22}/>
                    </button>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}