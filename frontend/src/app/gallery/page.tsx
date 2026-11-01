"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, X, Maximize2 } from 'lucide-react';

const galleryImages = [
  { id: 1, category: 'Experts', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800', title: 'Collaboration Session' },
  { id: 2, category: 'Technology', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800', title: 'Neural Hardware' },
  { id: 3, category: 'Community', url: 'https://images.unsplash.com/photo-1523240715632-d984bb4b970e?q=80&w=800', title: 'Global Meetup' },
  { id: 4, category: 'Workspace', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800', title: 'Nexus Hub' },
  { id: 5, category: 'Experts', url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800', title: 'Domain Analysis' },
  { id: 6, category: 'Technology', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800', title: 'Data Visualisation' },
];

export default function GalleryPage() {
  const [filter, setFilter] = useState('All');
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const filtered = filter === 'All' ? galleryImages : galleryImages.filter(img => img.category === filter);

  return (
    <div className="min-h-screen bg-black text-white font-sans pt-32 pb-20 px-6">
      {/* Navigation - Re-used from Home */}
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-black/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-sm flex items-center justify-center">
              <Layers size={18} />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase italic">Nexus Grid AI</span>
          </Link>
          <Link href="/" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition">Back to Home</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto">
        <header className="mb-20">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-indigo-500 mb-6">Visual Archive</h2>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase mb-8">Inside the Grid.</h1>
          <p className="max-w-2xl text-xl text-gray-500 font-light">Explore moments, people, and the cutting-edge environments where our global community shapes the future of AI.</p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-12">
          {['All', 'Experts', 'Community', 'Workspace', 'Technology'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all ${
                filter === cat ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:border-white/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((img) => (
            <div 
              key={img.id} 
              className="group relative aspect-[4/5] bg-zinc-900 overflow-hidden cursor-pointer border border-white/5"
              onClick={() => setSelectedImg(img.url)}
            >
              <img 
                src={img.url} 
                alt={img.title} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2">{img.category}</span>
                <h4 className="text-xl font-bold uppercase italic">{img.title}</h4>
              </div>
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 lg:p-20">
          <button 
            className="absolute top-10 right-10 text-white hover:text-indigo-500 transition"
            onClick={() => setSelectedImg(null)}
          >
            <X size={40} />
          </button>
          <img src={selectedImg} className="max-w-full max-h-full object-contain border border-white/10 shadow-2xl" alt="Enlarged view" />
        </div>
      )}
    </div>
  );
}