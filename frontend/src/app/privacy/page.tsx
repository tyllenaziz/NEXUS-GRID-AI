"use client";
import { ChevronLeft, ShieldCheck, Lock, EyeOff, Globe, Scale } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyNotice() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-20 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-all font-black uppercase text-[10px] tracking-widest mb-12">
          <ChevronLeft size={16} /> Back to Settings
        </Link>

        <header className="mb-16">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">NexusGrid <span className="text-orange-500">Expert Notice</span></h1>
          <div className="flex gap-6 text-[10px] font-black text-gray-600 uppercase tracking-widest">
            <span>Version: 2026-08-18-v1</span>
            <span>Status: Legally Binding</span>
          </div>
        </header>

        <div className="space-y-16">
          <Section icon={<ShieldCheck className="text-orange-500"/>} title="01. Scope of Governance">
            <p className="text-gray-400 leading-relaxed font-medium">
              This notice explains how NexusGrid LLC handles personal information when you apply to join our expert network, complete assessments, or contribute to a project. We treat your professional identity as a secure asset.
            </p>
          </Section>

          <Section icon={<Lock className="text-orange-500"/>} title="02. Information Acquisition">
            <p className="text-gray-400 leading-relaxed font-medium">
              We collect name, email, expertise, education, and professional profiles (LinkedIn/GitHub). These are used strictly for **Domain Verification**. NexusGrid does not "sell" your data to third parties or use your profile to train AI models.
            </p>
          </Section>

          <Section icon={<Globe className="text-orange-500"/>} title="03. Snapshot & Payment Integrity">
            <p className="text-gray-400 leading-relaxed font-medium">
              To process your earnings, our approved payment providers collect identity and bank details. NexusGrid only retains a unique "Payee Identifier" and your payout status to ensure the **Financial Snapshot Engine** functions correctly.
            </p>
          </Section>

          <Section icon={<EyeOff className="text-orange-500"/>} title="04. Expert Work Product">
            <p className="text-gray-400 leading-relaxed font-medium italic border-l-2 border-orange-500/30 pl-6">
              "Materials created while performing a project (Work Product) are governed by specific project NDAs. While your work may train AI, your Profile and Resume are never used for this purpose."
            </p>
          </Section>

          <Section icon={<Scale className="text-orange-500"/>} title="05. Your Rights">
            <p className="text-gray-400 leading-relaxed font-medium">
              You may request deletion of your node from the grid at any time. However, we retain transaction and agreement records as required by law for a period of 7 years to satisfy audit requirements.
            </p>
          </Section>
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 text-center">
          <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">NexusGrid Security Protocol © 2026</p>
        </footer>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: any) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 text-white font-black uppercase text-sm tracking-widest">
        {icon} {title}
      </div>
      {children}
    </section>
  );
}