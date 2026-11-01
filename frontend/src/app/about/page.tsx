"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Globe, 
  Target, 
  Eye, 
  ShieldCheck, 
  Fingerprint, 
  Zap, 
  Users,
  ArrowRight
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#000] text-white selection:bg-indigo-500/30 selection:text-indigo-200 font-sans scroll-smooth">
      
      {/* NAVIGATION: Sticky Glass-morphism */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 flex items-center justify-center rounded-sm">
              <Layers size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase italic">Nexus Grid AI</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition">Back to Terminal</Link>
            <Link 
              href="/register" 
              className="bg-indigo-600 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              Apply to the Grid
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <header className="mb-32">
            <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-indigo-500 mb-6 italic">Personnel Profile: NexusGrid</h2>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase mb-8 leading-[0.9]">Humanizing <br/>Intelligence.</h1>
            <p className="max-w-2xl text-xl text-gray-400 font-light leading-relaxed">
Founded by Tyllen Aziz at Mount Kenya University during his fourth year of study, NexusGrid AI was established to bridge the gap between human intelligence and artificial intelligence. The initiative engaged fellow university students in collecting, reviewing, and preparing data to train AI models. This data was used to train and improve Kinga, an AI-powered smart pest management application designed to help farmers identify crop pests and diseases and receive accurate, data-driven recommendations. Beyond AI development, NexusGrid AI created opportunities for students to gain practical experience in data collection, AI training, and emerging technologies while contributing to solutions addressing real agricultural challenges in Kenya. </p>
          </header>

          {/* THE FOUNDER'S VISION */}
          <section className="mb-40">
            <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-indigo-500 mb-12">The Founder's Vision</h3>
            <div className="max-w-5xl border-l-2 border-indigo-500 pl-8 md:pl-12 py-4">
              <p className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-8 italic uppercase">
                "Artificial Intelligence is the fire of the 21st century. But fire without guidance is just destruction. At Nexus Grid, we provide the human wisdom that turns raw code into meaningful progress."
              </p>
              <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-8 font-light">
                Tyllen Aziz founded Nexus Grid in 2024 with a radical belief: that the most powerful AI in the world is useless without the nuance of human ethics, the precision of domain experts, and the spark of human creativity. 
                <br/><br/>
                We don't just 'tag data.' We audit the future. We ensure that when a doctor asks an AI for advice, or a student asks for history, the answer is grounded in truth. Our mission is to ensure that the AI revolution remains human-centered, forever.
              </p>
              <div className="flex items-center gap-4">
                 <div className="text-white font-bold uppercase tracking-widest text-sm italic">— Tyllen Aziz, Founder</div>
              </div>
            </div>
          </section>

          {/* MISSION & VISION CARDS */}
          <section className="grid md:grid-cols-2 gap-8 mb-40">
            <div className="p-12 border border-white/5 bg-white/[0.01] group hover:border-indigo-500/30 transition-all">
              <Target className="text-indigo-500 mb-8" size={40} />
              <h3 className="text-2xl font-bold uppercase italic mb-4">Our Mission</h3>
              <p className="text-gray-500 leading-relaxed uppercase tracking-widest text-xs">
                To accelerate the development of safe, helpful, and honest AI by leveraging the world's most disciplined experts to train the neural networks of tomorrow. We prioritize high-fidelity alignment over volume.
              </p>
            </div>
            <div className="p-12 border border-white/5 bg-white/[0.01] group hover:border-indigo-500/30 transition-all">
              <Eye className="text-indigo-500 mb-8" size={40} />
              <h3 className="text-2xl font-bold uppercase italic mb-4">Our Vision</h3>
              <p className="text-gray-500 leading-relaxed uppercase tracking-widest text-xs">
                A future where the synergy between human cognition and artificial intelligence creates a safer, more equitable global landscape for all industries, powered by American technical leadership.
              </p>
            </div>
          </section>

          {/* CORPORATE LOCATION SECTION */}
          <section className="py-32 border-t border-white/5">
              <div className="grid md:grid-cols-2 gap-20 items-center">
                  <div>
                      <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-indigo-500 mb-6">HQ Terminal</h3>
                      <p className="text-4xl font-bold italic uppercase tracking-tighter mb-6">United States Operations</p>
                      <div className="space-y-2">
                        <p className="text-gray-400 leading-relaxed text-sm uppercase tracking-[0.2em] font-bold">Nexus Grid AI Corporate</p>
                        <p className="text-gray-500 leading-relaxed text-sm uppercase tracking-widest">
                            Nairobi <br/>
                            00069<br/>
                            Kenya
                        </p>
                      </div>
                      <div className="mt-12 flex items-center gap-4 text-emerald-500">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                         <span className="text-[10px] font-bold uppercase tracking-[0.3em]">System Status: KENYA Node Active</span>
                      </div>
                  </div>
                  <div className="relative aspect-video border border-white/10 overflow-hidden bg-zinc-900">
                    <img 
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200" 
                      alt="Kenya Headquarters" 
                      className="w-full h-full object-cover grayscale opacity-50"
                    />
                    <div className="absolute inset-0 bg-indigo-600/10 mix-blend-overlay"></div>
                  </div>
              </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#050505] pt-32 pb-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-700">
            <p>© 2026 Nexus Grid AI Security Protocol. Wilmington, DE.</p>
            <p>Personnel Connection: Encrypted</p>
          </div>
        </div>
      </footer>
    </div>
  );
}