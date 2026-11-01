"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, ChevronDown, ShieldCheck, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: "How does NexusGrid verify its contributors?",
    a: "Every expert undergoes a multi-stage background check and identity verification protocol. In the USA, we adhere to strict KYC (Know Your Customer) guidelines to ensure that our 'Grid' consists only of verified, high-level domain experts with proven track records."
  },
  {
    q: "What domains are currently in high demand?",
    a: "As of 2025, we are prioritizing experts in Quantum Computing, Medical Law, Advanced Python/Rust development, and Pure Mathematics. However, our creative RLHF tracks are always open to talented writers and linguists."
  },
  {
    q: "When was NexusGrid officially established?",
    a: "NexusGrid was officially incorporated in early 2024 in the USA. Since then, we have audited over 1 million tasks and paid out over $500M to expert contributors across the globe, maintaining a standard of technical excellence."
  },
  {
    q: "Is my data and work secure on the platform?",
    a: "Security is our core protocol. All work is conducted over encrypted connections and protected by strict NDAs (Non-Disclosure Agreements). Our security architecture is designed to protect both the proprietary AI models we train and the privacy of our expert contributors."
  },
  {
    q: "What is the payout structure?",
    a: "We offer a Tiered Payout system. Contributors are paid based on the complexity of the task and their historical accuracy score. High-fidelity contributors earn a premium rate, with payouts issued bi-weekly via secure US banking rails or global digital transfers."
  }
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#000] text-white selection:bg-indigo-500/30 font-sans">
      
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 flex items-center justify-center rounded-sm">
              <Layers size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase italic">Nexus Grid AI</span>
          </Link>
          <Link href="/" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition">Exit Terminal</Link>
        </div>
      </nav>

      <main className="pt-40 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <header className="mb-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-indigo-500/30 bg-indigo-500/10 rounded-full">
              <HelpCircle size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-400">Support Terminal</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase italic mb-6">Expert FAQ.</h1>
            <p className="text-gray-500 uppercase tracking-[0.2em] text-xs font-bold">Frequently Asked Questions for Grid Contributors</p>
          </header>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/5 bg-[#080808] overflow-hidden transition-all duration-500">
                <button 
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-8 text-left hover:bg-white/[0.01] transition-colors"
                >
                  <span className="text-sm md:text-base font-bold uppercase tracking-widest italic">{faq.q}</span>
                  <ChevronDown className={`transition-transform duration-500 ${openIndex === i ? 'rotate-180 text-indigo-500' : 'text-gray-600'}`} size={20} />
                </button>
                <div className={`transition-all duration-500 ease-in-out ${openIndex === i ? 'max-h-[300px] opacity-100 border-t border-white/5' : 'max-h-0 opacity-0'}`}>
                  <p className="p-8 text-gray-500 leading-relaxed text-sm md:text-base font-light">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 p-10 border border-indigo-500/20 bg-indigo-500/5 text-center">
            <ShieldCheck className="text-indigo-500 mx-auto mb-4" size={32} />
            <h4 className="text-sm font-bold uppercase tracking-widest mb-2">Still need assistance?</h4>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-6 font-medium">Our USA-based support team is active 24/7.</p>
            <Link href="mailto:support@nexusgrid.ai" className="text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition underline underline-offset-8">
              Open Support Ticket
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-800">
          Nexus Grid Security Protocol v4.0.21 — Wilmington, Delaware
        </p>
      </footer>
    </div>
  );
}