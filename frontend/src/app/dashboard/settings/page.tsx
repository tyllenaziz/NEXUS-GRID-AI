"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  User, FileText, Clock, Shield, 
  Camera, Code, Link as LinkIcon, Globe, 
  GraduationCap, Languages, Check, Loader2,
  Lock, Unlock, AlertCircle, Upload, ExternalLink, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile');
  
  const picInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<any>({
    firstName: '', lastName: '', email: '',
    linkedinUrl: '', githubUrl: '', category: '',
    experienceYears: '', country: '', primaryLanguage: '',
    university: '', availability: '', profilePicture: '', resumeUrl: ''
  });

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/users/me`, { withCredentials: true });
    const d = res.data;
    setProfile({
      ...d,
      ...d.workerProfile, 
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email
    });
  } catch (err) { 
    console.error("Profile sync failed:", err); 
  } finally { 
    setLoading(false); 
  }
};

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/users/profile`, profile, { withCredentials: true });
      setIsEditing(false);
      alert("NexusGrid Profile Synchronized.");
    } catch (err) { 
        alert("Sync failed: Ensure all required fields are valid."); 
    } finally { 
        setSaving(false); 
    }
  };

  if (!mounted) return null;
  if (loading) return <div className="p-20 text-center text-orange-500 font-black tracking-widest">LOADING SECURE CONSOLE...</div>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      
      {/* Notice Header */}
      <div className="mb-10 bg-orange-500/5 border border-orange-500/20 p-6 rounded-[2rem] flex items-center gap-4">
        <AlertCircle className="text-orange-500 shrink-0" size={24} />
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          <span className="text-orange-500">System Note:</span> Completing this profile allows NexusGrid Admins to verify your node for high-priority tasks in specialized domains.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-12">
        {/* Navigation Sidebar */}
        <aside className="col-span-12 lg:col-span-3 space-y-2">
          {['Profile', 'Resume', 'Availability', 'Privacy'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-xl' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              {t === 'Profile' && <User size={16} />}
              {t === 'Resume' && <FileText size={16} />}
              {t === 'Availability' && <Clock size={16} />}
              {t === 'Privacy' && <Shield size={16} />}
              {t}
            </button>
          ))}
        </aside>

        {/* Content Panel */}
        <main className="col-span-12 lg:col-span-9">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 shadow-2xl">
            
            {activeTab === 'Profile' && (
              <div className="space-y-12">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Contributor Profile</h2>
                  <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isEditing ? 'bg-white text-black' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'}`}
                  >
                    {saving ? <Loader2 className="animate-spin" size={14}/> : isEditing ? 'Commit Changes' : 'Edit Details'}
                  </button>
                </div>

                <div className="flex items-center gap-8 border-b border-white/5 pb-12">
                  <div className="w-24 h-24 bg-[#111] rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center">
                    {profile.profilePicture ? <img src={profile.profilePicture} className="w-full h-full object-cover" /> : <User className="text-gray-800" size={40}/>}
                  </div>
                  <div>
                    <input type="file" ref={picInputRef} hidden onChange={(e) => handleFileUpload(e, 'profilePicture')} accept="image/*" />
                    <button 
                      onClick={() => picInputRef.current?.click()}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-white hover:bg-white/10 border border-white/5`}
                    >
                      <Camera size={14} className="inline mr-2"/> Change Avatar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <StaticField label="Legal Identity" value={`${profile.firstName} ${profile.lastName}`} />
                    <StaticField label="System Email" value={profile.email} />
                    <InputField isEditing={isEditing} label="LinkedIn" value={profile.linkedinUrl} icon={<LinkIcon size={14}/>} onChange={(v:any) => setProfile({...profile, linkedinUrl: v})} />
                    <InputField isEditing={isEditing} label="GitHub" value={profile.githubUrl} icon={<Code size={14}/>} onChange={(v:any) => setProfile({...profile, githubUrl: v})} />
                    <SelectField isEditing={isEditing} label="Skill Category" value={profile.category} options={['Software Engineering', 'Medical', 'Legal', 'Finance', 'Creative']} onChange={(v:any) => setProfile({...profile, category: v})} />
                    <SelectField isEditing={isEditing} label="Years Exp" value={profile.experienceYears} options={['1-3', '3-5', '5-10', '10+']} onChange={(v:any) => setProfile({...profile, experienceYears: v})} />
                </div>
              </div>
            )}

            {activeTab === 'Availability' && (
              <div className="space-y-8">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Availability Status</h2>
                <div className="max-w-md space-y-6">
                  <SelectField isEditing={true} label="Standard Work Week" value={profile.availability} options={['20-40 hours/week', '40-60 hours/week', '60-80 hours/week', '80+ hours/week']} onChange={(v:any) => setProfile({...profile, availability: v})} />
                  <button onClick={handleSave} className="bg-orange-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20">Update Status</button>
                </div>
              </div>
            )}

            {activeTab === 'Resume' && (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="flex justify-between items-end">
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Document Vault</h2>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">
          Your professional credentials are encrypted and stored securely.
        </p>
      </div>
      {/* Save button appears here too for convenience */}
      {isEditing && (
        <button onClick={handleSave} className="bg-orange-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20">
          Save Changes
        </button>
      )}
    </div>

    {profile.resumeUrl ? (
      /* --- STATE: RESUME UPLOADED --- */
      <div className="bg-[#111] border border-white/10 p-10 rounded-[2.5rem] flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 shadow-inner">
          <FileText size={32} />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight">Professional_Resume.pdf</h3>
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Status: Active & Verified</p>
        </div>
        
        <div className="flex gap-4">
          
        
          {/* Delete Button */}
          <button 
            onClick={() => {
              if(confirm("Are you sure you want to delete this resume? You will need to save changes to make this permanent.")) {
                setProfile({...profile, resumeUrl: ''});
                setIsEditing(true); // Automatically unlock editing so they can save the deletion
              }
            }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            <Trash2 size={14}/> Delete Resume
          </button>
        </div>
      </div>
    ) : (
      /* --- STATE: NO RESUME (UPLOAD BOX) --- */
      <div 
        className="bg-[#050505] border-2 border-dashed border-white/5 p-16 rounded-[2.5rem] flex flex-col items-center justify-center space-y-6 hover:border-orange-500/30 transition-all cursor-pointer group"
        onClick={() => resumeInputRef.current?.click()}
      >
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-700 group-hover:text-orange-500 transition-colors">
          <Upload size={28} />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Click to upload professional resume</p>
          <p className="text-[9px] text-gray-700 mt-2 uppercase font-black">Supported: PDF, DOCX (Max 50MB)</p>
        </div>
        <input type="file" ref={resumeInputRef} hidden onChange={(e) => handleFileUpload(e, 'resumeUrl')} accept=".pdf,.docx" />
        
        <button className="bg-white text-black px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] group-hover:bg-orange-500 group-hover:text-white transition-all shadow-xl">
          Browse Files
        </button>
      </div>
    )}

    {/* Persistence Note */}
    <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
      <p className="text-[9px] text-gray-600 leading-relaxed font-bold uppercase tracking-widest italic">
        * Uploaded documents are persistent across sessions. To update your resume, delete the current version and upload a new one. All data is purged from NexusGrid servers immediately upon deletion.
      </p>
    </div>
  </div>
)}

            {activeTab === 'Privacy' && (
              <div className="space-y-10">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">NexusGrid Data Governance</h2>
                <div className="space-y-6 text-sm text-gray-400 leading-relaxed font-medium">
                  <p>NexusGrid processes personal information to evaluate contributor qualifications, identify high-priority project matches, and administer secure payment snapshots.</p>
                  <div className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-4">
                    <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Key Principles:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-xs">
                        <li>Contributor profiles are used solely for internal verification and domain matching.</li>
                        <li>Resumes are not used as training data for any internal AI models.</li>
                        <li>Audit logs and work products are governed by specific project NDAs.</li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-6 pt-4">
                    <Link 
  href="/privacy" 
  target="_blank" // Opens in a new tab
  className="bg-orange-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-orange-600 transition-all"
>
  Full Expert Notice <ExternalLink size={14}/>
</Link>
                    <span className="text-[10px] font-black text-gray-600 tracking-widest uppercase">privacy@nexusgrid.ai</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

// --- Visual Locked State Components ---

function StaticField({ label, value }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-2">{label}</label>
      <div className="bg-[#050505] border border-white/5 rounded-xl px-5 py-4 text-xs text-gray-600 font-bold cursor-not-allowed select-none hover:border-red-500/20 transition-all">
        {value}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, isEditing, icon }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-2 flex items-center gap-2">{icon} {label}</label>
      <input 
        disabled={!isEditing}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[#050505] border rounded-xl px-5 py-4 text-xs font-bold transition-all outline-none ${
          isEditing ? 'border-orange-500 text-white' : 'border-white/5 text-gray-600 cursor-not-allowed hover:border-red-500/30'
        }`}
      />
    </div>
  );
}

function SelectField({ label, value, options, isEditing, onChange }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-2">{label}</label>
      <select 
        disabled={!isEditing}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[#050505] border rounded-xl px-5 py-4 text-xs font-bold transition-all outline-none appearance-none ${
          isEditing ? 'border-orange-500 text-white' : 'border-white/5 text-gray-600 cursor-not-allowed hover:border-red-500/30'
        }`}
      >
        <option value="">{isEditing ? 'Select...' : 'Not Provided'}</option>
        {options.map((o: any) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}