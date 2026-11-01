"use client";
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { 
  Camera, RefreshCcw, ShieldCheck, Loader2, 
  AlertCircle, Upload, ArrowRight, FileText, 
  UserSquare2, CheckCircle2 
} from 'lucide-react';
import { API_URL } from '@/lib/config';

type Step = 'ID_FRONT' | 'ID_BACK' | 'FACE_PULSE';

export default function IdentityVerificationModule({ onComplete }: { onComplete: () => void }) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Logic States
  const [step, setStep] = useState<Step>('ID_FRONT');
  const [images, setImages] = useState({ 
    idFront: null as string | null, 
    idBack: null as string | null, 
    facePulse: null as string | null 
  });
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // --- IMAGE ACQUISITION ---

  // 1. Capture from Webcam
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) handleDataUpdate(imageSrc);
  }, [webcamRef, step]);

  // 2. Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleDataUpdate(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Helper to save data to the correct slot
  const handleDataUpdate = (base64: string) => {
    if (step === 'ID_FRONT') setImages(prev => ({ ...prev, idFront: base64 }));
    if (step === 'ID_BACK') setImages(prev => ({ ...prev, idBack: base64 }));
    if (step === 'FACE_PULSE') setImages(prev => ({ ...prev, facePulse: base64 }));
  };

  // --- NAVIGATION ---
  
  const nextStep = () => {
    if (step === 'ID_FRONT') setStep('ID_BACK');
    else if (step === 'ID_BACK') setStep('FACE_PULSE');
  };

  const resetStep = () => {
    if (step === 'ID_FRONT') setImages(prev => ({ ...prev, idFront: null }));
    if (step === 'ID_BACK') setImages(prev => ({ ...prev, idBack: null }));
    if (step === 'FACE_PULSE') setImages(prev => ({ ...prev, facePulse: null }));
  };

  // --- FINAL TRANSMISSION ---

  const submitIdentityPackage = async () => {
    setLoading(true);
    try {
      // Sends all three pulses to the backend in one technical package
      await axios.post(`${API_URL}/api/users/verify-identity`, 
        { 
          idFront: images.idFront, 
          idBack: images.idBack, 
          facePulse: images.facePulse 
        }, 
        { withCredentials: true }
      );
      alert("✅ Identity Verification Initiated. Your node has entered the Audit Queue.");
      onComplete(); // Refreshes dashboard layout
    } catch (err) {
      alert("Transmission failure: Data payload exceeds grid limits or connection lost.");
    } finally {
      setLoading(false);
    }
  };

  const currentData = step === 'ID_FRONT' ? images.idFront : step === 'ID_BACK' ? images.idBack : images.facePulse;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-white/[0.02] border border-white/5 rounded-[3rem] p-12 shadow-2xl text-center space-y-8 relative overflow-hidden">
        
        {/* PROGRESS TRACKER */}
        <div className="flex justify-center gap-3 mb-4">
            {(['ID_FRONT', 'ID_BACK', 'FACE_PULSE'] as Step[]).map((s, idx) => (
                <div key={s} className="flex flex-col items-center gap-2">
                    <div className={`h-1 w-12 rounded-full transition-all duration-500 ${
                        step === s ? 'bg-indigo-500 w-16' : 
                        (s === 'ID_FRONT' && images.idFront) || (s === 'ID_BACK' && images.idBack) ? 'bg-emerald-500' : 'bg-white/10'
                    }`} />
                    <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">Step 0{idx + 1}</span>
                </div>
            ))}
        </div>

        <header>
            <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                <ShieldCheck className="text-indigo-500" size={24} />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
                {step === 'ID_FRONT' ? 'Identity Document (Front)' : step === 'ID_BACK' ? 'Identity Document (Back)' : 'Liveness Biometric Scan'}
            </h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
                Anti-Fraud Identity Audit System
            </p>
        </header>

        {/* VIEWPORT (CAMERA OR PREVIEW) */}
        <div className="relative aspect-video max-w-[420px] mx-auto rounded-[2.5rem] overflow-hidden border-2 border-dashed border-indigo-500/30 bg-black shadow-inner group">
            {!currentData ? (
                <>
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                        onUserMediaError={() => setCameraError(true)}
                        className="w-full h-full object-cover grayscale brightness-110 contrast-125"
                    />
                    <div className="absolute inset-0 border-4 border-indigo-500/5 pointer-events-none" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)] animate-scan" />
                </>
            ) : (
                <img src={currentData} className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500" alt="Capture preview" />
            )}

            {cameraError && !currentData && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-red-500">
                    <AlertCircle size={32} className="mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Hardware Link Blocked</p>
                </div>
            )}
        </div>

        {/* INSTRUCTIONS */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <p className="text-white font-bold text-xs">
                {step === 'FACE_PULSE' ? "Center your face in the frame" : "Hold your ID card steady and ensure text is legible"}
            </p>
        </div>

        {/* ACTIONS */}
        <div className="pt-2">
            {!currentData ? (
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={capture}
                        className="bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"
                    >
                        <Camera size={18}/> Capture
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/5 text-gray-400 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center gap-2"
                    >
                        <Upload size={18}/> Upload File
                    </button>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                </div>
            ) : (
                <div className="flex gap-4">
                    <button 
                        onClick={resetStep}
                        className="flex-1 bg-white/5 text-gray-500 py-5 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:text-white transition-all border border-white/5 flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={14}/> Retake
                    </button>
                    
                    {step === 'FACE_PULSE' ? (
                        <button 
                            onClick={submitIdentityPackage}
                            disabled={loading}
                            className="flex-[2] bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16}/> : <><ShieldCheck size={16}/> Finalize & Submit</>}
                        </button>
                    ) : (
                        <button 
                            onClick={nextStep}
                            className="flex-[2] bg-white text-black py-5 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            Next Step <ArrowRight size={16}/>
                        </button>
                    )}
                </div>
            )}
        </div>

        <footer className="text-gray-600 text-[8px] uppercase font-black tracking-[0.2em]">
            Secure Identity Stream • End-to-End Encrypted • Protocol v4.8
        </footer>
      </div>
    </div>
  );
}