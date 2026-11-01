"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Users, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Microscope,
  FileSearch,
  PenTool,
  Fingerprint,
  ChevronDown,
  Star,
  MapPin,
  Quote
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#000] text-white selection:bg-indigo-500/30 selection:text-indigo-200 font-sans scroll-smooth">
      
      {/* NAVIGATION: Sticky Glass-morphism */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 flex items-center justify-center rounded-sm">
              <Layers size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase italic">Nexus Grid AI</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="#about" className="hover:text-white transition-colors">About Us</Link>
            <Link href="#experts" className="hover:text-white transition-colors">Our Experts</Link>
            <Link href="/gallery" className="hover:text-white transition-colors">Gallery</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs font-bold uppercase tracking-widest hover:text-indigo-400 transition">Log In</Link>
            <Link 
              href="/register" 
              className="bg-indigo-600 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              Apply to the Grid
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-48 pb-32 px-6 overflow-hidden text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent -z-10" />
          
          <div className="max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-10 border border-indigo-500/30 bg-indigo-500/10 rounded-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Zap size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-400">United States AI Alignment Protocol</span>
            </div>

            <h1 className="text-[11vw] md:text-[8.5rem] font-bold tracking-[-0.07em] leading-[0.8] uppercase mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              Become the expert <br />
              <span className="bg-gradient-to-b from-white via-white/90 to-indigo-500/40 bg-clip-text text-transparent">that AI learns from.</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed font-light mb-12">
              Join the elite global community shaping the next generation of artificial intelligence. Turn your expertise into impact with the world's most trusted data evaluation grid.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/register" className="w-full sm:w-auto bg-white text-black px-10 py-5 text-sm font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                View Opportunities
              </Link>
              <Link href="#about" className="w-full sm:w-auto border border-white/20 px-10 py-5 text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                Learn How It Works
              </Link>
            </div>
          </div>
        </section>

        {/* STATISTICS SECTION */}
        <section className="py-20 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-12 text-center">
            <StatItem value="900K+" label="Experts Worldwide" />
            <StatItem value="$500M+" label="Paid to Experts" />
            <StatItem value="11+" label="Colleges" />
            <StatItem value="2024" label="Year Founded" />
            <StatItem value="4.9/5" label="Quality Score" />
          </div>
        </section>

        {/* MOTIVATIONAL HERITAGE SECTION */}
        <section id="about" className="py-32 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative aspect-square border border-white/10 overflow-hidden group bg-indigo-900/5">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80')] bg-cover bg-center grayscale opacity-30 group-hover:scale-105 transition-transform duration-1000"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
               <div className="absolute bottom-10 left-10">
                  <Fingerprint className="text-indigo-500 mb-4" size={40} />
                  <span className="text-xs uppercase tracking-widest font-bold block">Founder Identity Verified</span>
                  <span className="text-gray-400 text-[10px] uppercase tracking-widest italic">Nexus Grid HQ • Kenya</span>
               </div>
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-indigo-500 mb-6 italic">The Human Spark</h2>
              <h3 className="text-5xl font-bold tracking-tighter mb-8 leading-[1.1]">GUIDING INTELLIGENCE WITH WISDOM.</h3>
              <p className="text-xl text-gray-300 leading-relaxed font-light mb-8 italic border-l-2 border-indigo-500 pl-8">
                "Artificial Intelligence is a mirror of humanity. To make AI better, we must first empower the best of us to teach it."
              </p>
              <p className="text-gray-400 leading-relaxed mb-10">
                Founded in 2024 by <span className="text-white font-bold">Tyllen Aziz</span> in Kenya, NexusGrid AI was developed to support the data collection and preparation needed to train and improve artificial intelligence models. During my fourth year at Mount Kenya University, I involved other students in the project, introducing them to NexusGrid AI and assigning them data collection tasks. The data collected was used to train and improve the AI model behind Kinga, my smart pest management application designed to help farmers identify crop pests and diseases and receive accurate, data-driven recommendations. Through this initiative, I created an opportunity for students to gain practical experience in AI data preparation while contributing to a solution addressing real agricultural challenges in Kenya.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <div>
                  <h4 className="text-indigo-500 font-bold uppercase tracking-widest text-[10px] mb-2">Our Mission</h4>
                  <p className="text-gray-500 text-xs uppercase leading-relaxed">Providing high-fidelity human alignment for the world's most advanced LLMs.</p>
                </div>
                <div>
                  <h4 className="text-indigo-500 font-bold uppercase tracking-widest text-[10px] mb-2">Kenya Hub</h4>
                  <p className="text-gray-500 text-xs uppercase leading-relaxed">Headquartered in Kenya, delivering secure global expert infrastructure.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EXPERT REVIEWS SECTION */}
        <section className="py-32 px-6 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20">
              <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-indigo-500 mb-6">Expert Feedback</h2>
              <h3 className="text-5xl font-bold tracking-tighter uppercase italic">The Voice of the Grid.</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <ReviewCard 
                name="Dr. Kylo" 
                date="Active since Jan 2024" 
                text="NexusGrid is the gold standard. I've been contributing since the launch, and the level of technical depth required is unparalleled." 
              />
              <ReviewCard 
                name="Brian Manya" 
                date="Active since June 2024" 
                text="The flexibility is real, but the impact is what keeps me here. Payouts are consistent and the -based support is elite." 
              />
              <ReviewCard 
                name="Wayne John ." 
                date="Active since Oct 2025" 
                text="Joined during the Tier-2 expansion. If you are a coder looking to shape the future of LLMs, this is the only grid you need to be on. I have known Tyllen as the founder and also class mate in Mount Kenya University. He is a very good person and a great leader. I have been working with him for a long time and I can say that he is a very good person and a great leader." 
              />
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-32 px-6 bg-black">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-indigo-500 mb-4 italic">Security Terminal</h2>
              <h3 className="text-5xl font-bold tracking-tighter uppercase">Frequently Asked Questions.</h3>
            </div>

            <div className="space-y-4">
              <FaqItem 
                index={0} active={openFaq} setActive={setOpenFaq}
                question="What qualifications do I need?"
                answer="Requirements vary by project. We typically look for experts with undergraduate-level knowledge or professional certifications in STEM, Linguistics, Law, or Software Engineering."
              />
              <FaqItem 
                index={1} active={openFaq} setActive={setOpenFaq}
                question="When was NexusGrid officially established?"
                answer="NexusGrid AI was officially incorporated in 2024 in the United States. We have grown into a global network of over 50,000 expert contributors."
              />
              <FaqItem 
                index={2} active={openFaq} setActive={setOpenFaq}
                question="What is the payout structure?"
                answer="We offer competitive project-based earnings. Payouts are issued bi-weekly via secure banking rails. High-fidelity contributors with 2024-heritage scores earn premium rates."
              />
              <FaqItem 
                index={3} active={openFaq} setActive={setOpenFaq}
                question="Is my work remote?"
                answer="Yes. The Grid is built for a decentralized workforce. As long as you maintain a secure US-standard connection, you can work from anywhere."
              />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#050505] pt-32 pb-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
            <div className="col-span-1 md:col-span-1">
               <div className="flex items-center gap-2 mb-8">
                  <div className="w-6 h-6 bg-indigo-600 rounded-sm flex items-center justify-center"><Layers size={14} className="text-white" /></div>
                  <span className="text-lg font-bold tracking-tighter uppercase italic">Nexus Grid AI</span>
                </div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Corporate Headquarters</p>
                <p className="text-gray-500 text-xs leading-relaxed uppercase tracking-widest">
                  700 Carnegie Ave<br/>
                  Cleveland, OH 44115<br/>
                  United States of America
                </p>
            </div>
            
            <FooterColumn title="Company" links={['About Us', 'Expertise', 'Gallery', 'Videos']} />
            <FooterColumn title="Legal" links={['NDA Protocol', 'Privacy Policy', 'Cookie Policy', 'Security']} />
            <FooterColumn title="Socials" links={['Twitter / X', 'LinkedIn', 'GitHub', 'Discord']} />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-700">
            <p>© 2026 Nexus Grid AI Security Protocol. All Rights Reserved.</p>
            <div className="flex items-center gap-2 text-emerald-500/50">
               <ShieldCheck size={12} />
               <span>System Secure: Kenya_NODE_ACTIVE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* SUB-COMPONENTS */

function StatItem({ value, label }: any) {
  return (
    <div className="group">
      <div className="text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-b from-white to-gray-600 bg-clip-text text-transparent group-hover:to-indigo-400 transition-all duration-500">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mt-2">{label}</div>
    </div>
  );
}

function ReviewCard({ name, date, text }: any) {
  return (
    <div className="p-8 border border-white/5 bg-black hover:border-indigo-500/30 transition-all group relative">
      <Quote className="absolute top-4 right-4 text-white/5" size={40} />
      <div className="flex gap-1 mb-4 text-indigo-500">
        {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
      </div>
      <p className="text-gray-400 text-sm leading-relaxed mb-8 italic tracking-wide">"{text}"</p>
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-500 font-bold text-[10px]">{name[0]}</div>
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">{name}</h4>
          <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">{date}</p>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ index, active, setActive, question, answer }: any) {
  const isOpen = active === index;
  return (
    <div className="border border-white/5 bg-[#080808] transition-all">
      <button onClick={() => setActive(isOpen ? null : index)} className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.01]">
        <span className="text-xs font-bold uppercase tracking-[0.2em]">{question}</span>
        <ChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : 'text-gray-600'}`} size={16} />
      </button>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 pt-0 text-gray-500 text-xs leading-relaxed uppercase tracking-widest">{answer}</div>
      </div>
    </div>
  );
}

function FooterColumn({ title, links }: any) {
  return (
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white mb-6 italic">{title}</h4>
      <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest text-gray-600">
        {links.map((link: string) => <li key={link}><Link href="#" className="hover:text-indigo-400 transition">{link}</Link></li>)}
      </ul>
    </div>
  );
}