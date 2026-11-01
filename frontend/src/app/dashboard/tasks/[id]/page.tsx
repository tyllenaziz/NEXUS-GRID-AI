"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/config';
import {
  ShieldCheck, Info, ChevronLeft, AlertTriangle,
  CheckSquare, Search, Link as LinkIcon,
  Scale, BadgeCheck, XCircle,
  Flag, Gauge, Tags, Users, Building2, MapPin,
  Package, CalendarDays, Smile, Frown, Angry,
  Meh, Heart, Zap, EyeOff, MessageSquareWarning,
  Ghost, Sparkles, PencilLine, Globe2, FileWarning,
  RefreshCcw
} from 'lucide-react';

// ---------------------------------------------------------------------------
// TYPES & CONSTANTS
// ---------------------------------------------------------------------------

type DimensionSet = {
  helpfulness: number;
  accuracy: number;
  relevance: number;
  completeness: number;
  clarity: number;
  conciseness: number;
  instructionFollowing: number;
  reasoning: number;
  professionalism: number;
  safety: number;
};

type ErrorBlockState = { hasError: 'Yes' | 'No'; type: string; explanation: string };
type FlagBlockState = { flagged: 'Yes' | 'No'; explanation: string };

const DIMENSION_LABELS: { key: keyof DimensionSet; label: string }[] = [
  { key: 'helpfulness', label: 'Helpfulness' },
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'relevance', label: 'Relevance' },
  { key: 'completeness', label: 'Completeness' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'conciseness', label: 'Conciseness' },
  { key: 'instructionFollowing', label: 'Instruction Following' },
  { key: 'reasoning', label: 'Reasoning' },
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'safety', label: 'Safety' },
];

const DEFAULT_DIMENSIONS: DimensionSet = {
  helpfulness: 3, accuracy: 3, relevance: 3, completeness: 3, clarity: 3,
  conciseness: 3, instructionFollowing: 3, reasoning: 3, professionalism: 3, safety: 3,
};

const DEFAULT_ERROR_BLOCK: ErrorBlockState = { hasError: 'No', type: '', explanation: '' };
const DEFAULT_FLAG_BLOCK: FlagBlockState = { flagged: 'No', explanation: '' };

const ERROR_TYPES = [
  'Factual Error', 'Logical Inconsistency', 'Instruction Violation',
  'Formatting Issue', 'Incomplete Answer', 'Unsafe Content', 'Other',
];

const EMOTIONS = [
  { key: 'Happiness', icon: Smile },
  { key: 'Anger', icon: Angry },
  { key: 'Sadness', icon: Frown },
  { key: 'Neutral', icon: Meh },
  { key: 'Affection', icon: Heart },
  { key: 'Excitement', icon: Zap },
  { key: 'Fear', icon: Ghost },
  { key: 'Surprise', icon: Sparkles },
];

const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const LENGTH_OPTIONS = ['Too Short', 'Appropriate', 'Too Long'];
const RECENCY_OPTIONS = ['Current', 'Outdated', 'Unknown'];
const TONE_OPTIONS = ['Formal', 'Informal', 'Neutral'];

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------

export default function TaskWorkspace() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRevision = searchParams.get('revise') === 'true';

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [evalData, setEvalData] = useState<any>({
    // --- Universal Quality Control ---
    justification: '',
    confidence: 70,
    difficulty: 3,
    reportProblem: { flagged: false, notes: '' },

    // --- Preference Ranking: core dimensions ---
    choice: '',
    dimensionsA: { ...DEFAULT_DIMENSIONS },
    dimensionsB: { ...DEFAULT_DIMENSIONS },
    errorA: { ...DEFAULT_ERROR_BLOCK },
    errorB: { ...DEFAULT_ERROR_BLOCK },
    hallucinationDetected: 'No',
    reasoningSoundness: 'Sound',
    // --- Preference Ranking: extended dimensions ---
    toxicityA: 0, toxicityB: 0,
    biasA: { ...DEFAULT_FLAG_BLOCK }, biasB: { ...DEFAULT_FLAG_BLOCK },
    repetitionA: 'No', repetitionB: 'No',
    lengthAppropriatenessA: 'Appropriate', lengthAppropriatenessB: 'Appropriate',
    suggestedEditA: '', suggestedEditB: '',

    // --- Text Classification: core ---
    primaryCategory: '',
    secondaryCategory: '',
    intent: '',
    urgency: 'Medium',
    topic: '',
    entities: { people: '', organizations: '', locations: '', products: '', dates: '' },
    // --- Text Classification: extended ---
    languageDetected: '',
    piiDetected: 'No',
    ambiguityLevel: 3,
    multiLabelIntents: '',

    // --- Sentiment Analysis: core ---
    sentimentScore: 0,
    emotions: [] as string[],
    sentimentTarget: '',
    sarcasmDetected: false,
    negationDetected: false,
    // --- Sentiment Analysis: extended ---
    emotionIntensity: 3,
    tone: 'Neutral',
    mixedSentiment: 'No',
    culturalContextNotes: '',

    // --- Fact Checking: core ---
    verdict: '',
    evidenceUrl: '',
    claimCount: 1,
    detectedHallucination: 'No',
    // --- Fact Checking: extended ---
    sourceQuality: 3,
    claimBreakdown: '',
    evidenceRecency: 'Current',
    sourceBias: 'No',
  });

  // -------------------------------------------------------------------------
  // Fetch task data. If this is a revision (?revise=true), also pull the
  // worker's prior submission so we can pre-fill answers and show the
  // admin's feedback for why it was rejected.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchTaskData = async () => {
      setLoading(true);
      try {
        // 1. Verify Node Status first
        const userCheck = await axios.get(`${API_URL}/api/users/me`, { withCredentials: true });

        if (userCheck.data.status === 'UNDER_REVIEW') {
          setError("Your node is currently Under Review. Access to tasking is temporarily gated.");
          setLoading(false);
          return;
        }

        if (userCheck.data.status === 'SUSPENDED') {
          setError("This account has been suspended.");
          setLoading(false);
          return;
        }

        // 2. Fetch Task
        const res = await axios.get(`${API_URL}/api/users/tasks/${id}`, { withCredentials: true });
        setTask(res.data);

        // 3. Handle Revisions
        if (isRevision) {
          const historyRes = await axios.get(`${API_URL}/api/users/history`, { withCredentials: true });
          const oldSubmission = historyRes.data.find((s: any) => s.taskId === id);

          if (oldSubmission) {
            setEvalData((prev: any) => ({ ...prev, ...oldSubmission.answers }));
            setAdminFeedback(oldSubmission.review?.feedback || "No feedback provided.");
          }
        }
      } catch (err: any) {
        console.error("Task Sync Error:", err);
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError(err.response?.data?.message || "Failed to establish a secure tasking stream.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTaskData();
  }, [id, isRevision, router]);

  const update = (patch: any) => setEvalData((prev: any) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    // --- Validations ---
    if (evalData.justification.length < 100) {
      return alert("Professional Justification must be at least 100 characters.");
    }
    if (task.type === 'FACT_CHECKING' && !evalData.verdict) {
      return alert("Please provide a truth verdict for this audit.");
    }
    if (task.type === 'PREFERENCE_RANKING' && !evalData.choice) {
      return alert("Please select an overall winner (A or B).");
    }
    if (task.type === 'TEXT_CLASSIFICATION' && !evalData.primaryCategory) {
      return alert("Please provide a Primary Category.");
    }

    setLoading(true);
    try {
      const endpoint = isRevision ? '/api/users/submit-revision' : '/api/users/submit';

      await axios.post(`${API_URL}${endpoint}`, {
        taskId: id,
        answers: evalData
      }, { withCredentials: true });

      router.push(`/dashboard/success?type=${task.type}`);
    } catch (err) {
      alert("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <RefreshCcw className="animate-spin text-indigo-600 mb-4" size={40} />
      <div className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Initializing Secure Environment...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-xl font-black text-slate-900 uppercase mb-2">Access Gated</h2>
      <p className="text-slate-500 max-w-md mb-8 font-medium">{error}</p>
      <button
        onClick={() => router.push('/dashboard')}
        className="px-8 py-3 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-indigo-600 transition-all"
      >
        Return to Dashboard
      </button>
    </div>
  );

  if (!task) return null; // Safety check
  const typeColorMap: Record<string, string> = {
    FACT_CHECKING: 'border-blue-200 text-blue-600 bg-blue-50',
    PREFERENCE_RANKING: 'border-indigo-200 text-indigo-600 bg-indigo-50',
    TEXT_CLASSIFICATION: 'border-purple-200 text-purple-600 bg-purple-50',
    SENTIMENT_ANALYSIS: 'border-pink-200 text-pink-600 bg-pink-50',
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 font-sans">
      <div className="max-w-[1600px] mx-auto">

        {/* --- HEADER --- */}
        <header className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <button onClick={() => router.push('/dashboard')} className="text-xs font-black text-slate-400 uppercase hover:text-slate-900 transition flex items-center gap-2 tracking-widest"><ChevronLeft size={18} /> Discard Session</button>
          <div className="flex items-center gap-6">
            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${typeColorMap[task.type] || 'border-slate-200 text-slate-500 bg-slate-50'}`}>
              {task.type.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="bg-emerald-500 text-white px-6 py-2.5 rounded-full text-sm font-black uppercase shadow-lg shadow-emerald-500/20">Instant Credit: ${parseFloat(task.payRate).toFixed(2)}</div>
        </header>

        <div className="grid grid-cols-12 gap-8">

          {/* --- SIDEBAR --- */}
          <aside className="col-span-3 space-y-6">
            <section className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] shadow-sm">
              <h2 className="text-sm font-black uppercase text-indigo-600 mb-6 flex items-center gap-2 tracking-widest"><Info size={18} /> Guidelines</h2>
              <p className="text-sm text-slate-600 leading-relaxed italic border-l-4 border-indigo-300 pl-4 mb-6">"{task.instruction}"</p>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Target Project</span>
                  <span className="text-sm font-bold text-slate-700">{task.project?.name || "General Data"}</span>
                </div>
              </div>
            </section>

            <div className="bg-blue-50 border border-blue-200 p-8 rounded-[2rem]">
              <h3 className="text-xs font-black uppercase text-blue-600 mb-2 flex items-center gap-2"><Search size={16} /> Research Requirement</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Verify every claim against trusted sources (news, scientific papers, official docs) before scoring.</p>
            </div>

            <ReportProblemPanel
              data={evalData.reportProblem}
              onChange={(v: any) => update({ reportProblem: v })}
            />
          </aside>

          {/* --- MAIN ENGINE --- */}
          <main className="col-span-9 space-y-8">

            {/* --- REVISION FEEDBACK BANNER --- */}
            {isRevision && (
              <div className="mb-2 bg-red-500/10 border-2 border-red-500/20 p-8 rounded-[2.5rem] flex items-start gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="bg-red-500 p-3 rounded-2xl text-white shadow-lg shadow-red-500/30">
                  <RefreshCcw size={24} className="animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-red-500 font-black uppercase tracking-widest text-sm mb-2">Revision Required by Audit</h3>
                  <p className="text-slate-700 font-medium leading-relaxed italic text-sm">
                    "{adminFeedback}"
                  </p>
                  <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
                    Update your evaluation below and re-submit for credit.
                  </p>
                </div>
              </div>
            )}

            {/* Non-preference content is shown once, up top, for every other task type */}
            {task.type !== 'PREFERENCE_RANKING' && (
              <div className="bg-slate-50 border border-slate-200 p-10 rounded-[3rem] shadow-sm">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] block mb-6 italic">Source Content for Audit</span>
                <div className="text-lg text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">{task.content.text || task.content.a}</div>
              </div>
            )}

            {/* --- DYNAMIC MODULES --- */}
            <div className="bg-white border border-slate-200 p-12 rounded-[3.5rem] shadow-sm space-y-16">

              {/* MODULE: PREFERENCE RANKING — analyze A fully, then B fully, then compare */}
              {task.type === 'PREFERENCE_RANKING' && (
                <div className="space-y-16">
                  {task.content.prompt && (
                    <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem]">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] block mb-3">Original Prompt</span>
                      <p className="text-base text-slate-800 leading-relaxed whitespace-pre-wrap">{task.content.prompt}</p>
                    </div>
                  )}

                  {/* --- RESPONSE A: read it, then score it, right here --- */}
                  <section className="space-y-10">
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-indigo-600 text-center">Step 1 — Response A</h3>
                    <ContentBox label="Response A" text={task.content.a} accent="indigo" />
                    <DimensionGrid title="Score Response A" data={evalData.dimensionsA} onChange={(v: any) => update({ dimensionsA: v })} />
                    <div className="grid grid-cols-2 gap-8">
                      <ErrorBlock title="Response A Errors" data={evalData.errorA} onChange={(v: any) => update({ errorA: v })} />
                      <ExtendedResponseChecks
                        toxicity={evalData.toxicityA} onToxicity={(v: number) => update({ toxicityA: v })}
                        bias={evalData.biasA} onBias={(v: any) => update({ biasA: v })}
                        repetition={evalData.repetitionA} onRepetition={(v: string) => update({ repetitionA: v })}
                        length={evalData.lengthAppropriatenessA} onLength={(v: string) => update({ lengthAppropriatenessA: v })}
                        suggestedEdit={evalData.suggestedEditA} onSuggestedEdit={(v: string) => update({ suggestedEditA: v })}
                      />
                    </div>
                  </section>

                  {/* --- RESPONSE B: read it, then score it, right here --- */}
                  <section className="space-y-10 pt-16 border-t-2 border-dashed border-slate-200">
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-indigo-600 text-center">Step 2 — Response B</h3>
                    <ContentBox label="Response B" text={task.content.b} accent="indigo" />
                    <DimensionGrid title="Score Response B" data={evalData.dimensionsB} onChange={(v: any) => update({ dimensionsB: v })} />
                    <div className="grid grid-cols-2 gap-8">
                      <ErrorBlock title="Response B Errors" data={evalData.errorB} onChange={(v: any) => update({ errorB: v })} />
                      <ExtendedResponseChecks
                        toxicity={evalData.toxicityB} onToxicity={(v: number) => update({ toxicityB: v })}
                        bias={evalData.biasB} onBias={(v: any) => update({ biasB: v })}
                        repetition={evalData.repetitionB} onRepetition={(v: string) => update({ repetitionB: v })}
                        length={evalData.lengthAppropriatenessB} onLength={(v: string) => update({ lengthAppropriatenessB: v })}
                        suggestedEdit={evalData.suggestedEditB} onSuggestedEdit={(v: string) => update({ suggestedEditB: v })}
                      />
                    </div>
                  </section>

                  {/* --- STEP 3: compare the two --- */}
                  <section className="pt-16 border-t border-slate-200 space-y-10">
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-indigo-600 text-center">Step 3 — Compare & Decide</h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-4 block tracking-widest">Hallucination Detected</label>
                        <SegmentedControl options={['Yes', 'No']} value={evalData.hallucinationDetected} onChange={(v) => update({ hallucinationDetected: v })} />
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-4 block tracking-widest">Reasoning Soundness</label>
                        <SegmentedControl options={['Sound', 'Flawed', 'N/A']} value={evalData.reasoningSoundness} onChange={(v) => update({ reasoningSoundness: v })} />
                      </div>
                    </div>
                    <div className="flex gap-4 max-w-2xl mx-auto">
                      <ChoiceBtn active={evalData.choice === 'A'} label="Winner: A" onClick={() => update({ choice: 'A' })} />
                      <ChoiceBtn active={evalData.choice === 'TIE'} label="Tie" onClick={() => update({ choice: 'TIE' })} />
                      <ChoiceBtn active={evalData.choice === 'B'} label="Winner: B" onClick={() => update({ choice: 'B' })} />
                    </div>
                  </section>
                </div>
              )}

              {/* MODULE: TEXT CLASSIFICATION */}
              {task.type === 'TEXT_CLASSIFICATION' && (
                <div className="space-y-16">
                  <section>
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-purple-600 mb-10 text-center flex items-center justify-center gap-3"><Tags size={20} /> 1. Categorization</h3>
                    <div className="grid grid-cols-2 gap-8">
                      <LabeledInput label="Primary Category" value={evalData.primaryCategory} onChange={(v) => update({ primaryCategory: v })} placeholder="e.g. Customer Support" accent="purple" />
                      <LabeledInput label="Secondary Category" value={evalData.secondaryCategory} onChange={(v) => update({ secondaryCategory: v })} placeholder="e.g. Billing Dispute" accent="purple" />
                      <LabeledInput label="Intent" value={evalData.intent} onChange={(v) => update({ intent: v })} placeholder="e.g. Request Refund" accent="purple" />
                      <LabeledInput label="Topic" value={evalData.topic} onChange={(v) => update({ topic: v })} placeholder="e.g. Subscription Pricing" accent="purple" />
                    </div>
                    <div className="mt-8">
                      <label className="text-xs font-black uppercase text-slate-400 mb-4 block tracking-widest">Urgency</label>
                      <SegmentedControl options={URGENCY_LEVELS} value={evalData.urgency} onChange={(v) => update({ urgency: v })} />
                    </div>
                  </section>

                  <section className="pt-16 border-t border-slate-200">
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-purple-600 mb-10 text-center">2. Entity Identification</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <EntityField icon={<Users size={18} />} label="People" value={evalData.entities.people} onChange={(v) => update({ entities: { ...evalData.entities, people: v } })} />
                      <EntityField icon={<Building2 size={18} />} label="Organizations" value={evalData.entities.organizations} onChange={(v) => update({ entities: { ...evalData.entities, organizations: v } })} />
                      <EntityField icon={<MapPin size={18} />} label="Locations" value={evalData.entities.locations} onChange={(v) => update({ entities: { ...evalData.entities, locations: v } })} />
                      <EntityField icon={<Package size={18} />} label="Products" value={evalData.entities.products} onChange={(v) => update({ entities: { ...evalData.entities, products: v } })} />
                      <EntityField icon={<CalendarDays size={18} />} label="Dates" value={evalData.entities.dates} onChange={(v) => update({ entities: { ...evalData.entities, dates: v } })} className="col-span-2" />
                    </div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-4 text-center">Separate multiple entities with commas</p>
                  </section>

                  <section className="pt-16 border-t border-slate-200">
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-purple-600 mb-10 text-center">3. Additional Signals</h3>
                    <div className="grid grid-cols-2 gap-8">
                      <LabeledInput label="Language Detected" value={evalData.languageDetected} onChange={(v) => update({ languageDetected: v })} placeholder="e.g. English" accent="purple" icon={<Globe2 size={18} />} />
                      <LabeledInput label="Multi-Label / Secondary Intents" value={evalData.multiLabelIntents} onChange={(v) => update({ multiLabelIntents: v })} placeholder="Comma-separated additional intents" accent="purple" />
                    </div>
                    <div className="grid grid-cols-2 gap-8 mt-8">
                      <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-4 block tracking-widest">PII Detected</label>
                        <SegmentedControl options={['Yes', 'No']} value={evalData.piiDetected} onChange={(v) => update({ piiDetected: v })} />
                      </div>
                      <Scale5 label="Ambiguity Level" value={evalData.ambiguityLevel} onChange={(v) => update({ ambiguityLevel: v })} />
                    </div>
                  </section>
                </div>
              )}

              {/* MODULE: SENTIMENT ANALYSIS */}
              {task.type === 'SENTIMENT_ANALYSIS' && (
                <div className="space-y-16">
                  <section>
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-pink-600 mb-10 text-center">1. Sentiment Polarity</h3>
                    <div className="max-w-2xl mx-auto">
                      <SentimentSlider value={evalData.sentimentScore} onChange={(v) => update({ sentimentScore: v })} />
                    </div>
                  </section>

                  <section className="pt-16 border-t border-slate-200">
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-pink-600 mb-10 text-center">2. Emotional Signals</h3>
                    <div className="grid grid-cols-4 gap-4 max-w-3xl mx-auto">
                      {EMOTIONS.map(({ key, icon: Icon }) => {
                        const active = evalData.emotions.includes(key);
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              const next = active
                                ? evalData.emotions.filter((e: string) => e !== key)
                                : [...evalData.emotions, key];
                              update({ emotions: next });
                            }}
                            className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${active ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-200 scale-105' : 'bg-white border-slate-200 text-slate-500 hover:bg-pink-50'}`}
                          >
                            <Icon size={22} />
                            <span className="text-xs font-black uppercase tracking-widest">{key}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="max-w-2xl mx-auto mt-8">
                      <Scale5 label="Emotion Intensity" value={evalData.emotionIntensity} onChange={(v) => update({ emotionIntensity: v })} />
                    </div>
                  </section>

                  <section className="grid grid-cols-2 gap-8 pt-16 border-t border-slate-200 items-start">
                    <LabeledInput label="Sentiment Target" value={evalData.sentimentTarget} onChange={(v) => update({ sentimentTarget: v })} placeholder="What/who is the sentiment directed at?" accent="pink" />
                    <div className="space-y-5">
                      <ToggleRow label="Sarcasm Detected" active={evalData.sarcasmDetected} onClick={() => update({ sarcasmDetected: !evalData.sarcasmDetected })} />
                      <ToggleRow label="Negation Detected" active={evalData.negationDetected} onClick={() => update({ negationDetected: !evalData.negationDetected })} />
                      <ToggleRow label="Mixed Sentiment" active={evalData.mixedSentiment === 'Yes'} onClick={() => update({ mixedSentiment: evalData.mixedSentiment === 'Yes' ? 'No' : 'Yes' })} />
                    </div>
                  </section>

                  <section className="pt-16 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-4 block tracking-widest">Overall Tone</label>
                        <SegmentedControl options={TONE_OPTIONS} value={evalData.tone} onChange={(v) => update({ tone: v })} />
                      </div>
                      <LabeledTextarea label="Cultural / Contextual Notes" value={evalData.culturalContextNotes} onChange={(v) => update({ culturalContextNotes: v })} placeholder="Any idioms, regional context, or cultural cues affecting the read?" accent="pink" rows={3} />
                    </div>
                  </section>
                </div>
              )}

              {/* MODULE: FACT CHECKING */}
              {task.type === 'FACT_CHECKING' && (
                <div className="space-y-16">
                  <section className="text-center">
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-blue-600 mb-10">1. Veracity Verdict</h3>
                    <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
                      <VerdictBtn active={evalData.verdict === 'TRUE'} label="Entirely True" icon={<BadgeCheck size={22} />} color="bg-emerald-600" onClick={() => update({ verdict: 'TRUE' })} />
                      <VerdictBtn active={evalData.verdict === 'PARTIAL'} label="Mixed / Partial" icon={<Scale size={22} />} color="bg-amber-600" onClick={() => update({ verdict: 'PARTIAL' })} />
                      <VerdictBtn active={evalData.verdict === 'FALSE'} label="Entirely False" icon={<XCircle size={22} />} color="bg-red-600" onClick={() => update({ verdict: 'FALSE' })} />
                      <VerdictBtn active={evalData.verdict === 'UNVERIFIABLE'} label="Unverifiable" icon={<Search size={22} />} color="bg-slate-600" onClick={() => update({ verdict: 'UNVERIFIABLE' })} />
                    </div>
                  </section>

                  <section className="grid grid-cols-2 gap-8 pt-16 border-t border-slate-200">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-400 mb-4 block tracking-widest">Evidence Source (URL)</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                          className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-14 pr-5 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
                          placeholder="https://wikipedia.org/wiki/..."
                          value={evalData.evidenceUrl}
                          onChange={(e) => update({ evidenceUrl: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase text-slate-400 mb-4 block tracking-widest">Claim Count</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-5 px-5 text-base text-slate-900 outline-none focus:border-blue-500"
                        value={evalData.claimCount}
                        onChange={(e) => update({ claimCount: Number(e.target.value) })}
                      />
                    </div>
                  </section>

                  <section className="pt-16 border-t border-slate-200">
                    <label className="text-xs font-black uppercase text-slate-400 mb-4 block tracking-widest text-center">Hallucination Detected</label>
                    <div className="max-w-md mx-auto">
                      <SegmentedControl options={['Yes', 'No']} value={evalData.detectedHallucination} onChange={(v) => update({ detectedHallucination: v })} />
                    </div>
                  </section>

                  <section className="pt-16 border-t border-slate-200 space-y-8">
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-blue-600 text-center flex items-center justify-center gap-3"><FileWarning size={20} /> 2. Deeper Audit</h3>
                    <LabeledTextarea label="Claim-by-Claim Breakdown" value={evalData.claimBreakdown} onChange={(v) => update({ claimBreakdown: v })} placeholder="List each individual claim in the content and note true/false/unverifiable for each." accent="blue" rows={5} />
                    <div className="grid grid-cols-2 gap-8">
                      <Scale5 label="Source Quality" value={evalData.sourceQuality} onChange={(v) => update({ sourceQuality: v })} />
                      <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-4 block tracking-widest">Evidence Recency</label>
                        <SegmentedControl options={RECENCY_OPTIONS} value={evalData.evidenceRecency} onChange={(v) => update({ evidenceRecency: v })} />
                      </div>
                    </div>
                    <div className="max-w-md mx-auto">
                      <label className="text-xs font-black uppercase text-slate-400 mb-4 block tracking-widest text-center">Source Bias Suspected</label>
                      <SegmentedControl options={['Yes', 'No']} value={evalData.sourceBias} onChange={(v) => update({ sourceBias: v })} />
                    </div>
                  </section>
                </div>
              )}

              {/* --- QUALITY CONTROL (Required for all task types) --- */}
              <QualityControlPanel evalData={evalData} update={update} />

              <button
                disabled={loading}
                onClick={handleSubmit}
                className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-sm hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-4 group disabled:opacity-50"
              >
                {loading
                  ? "DATA TRANSMISSION IN PROGRESS..."
                  : isRevision
                    ? "RE-SUBMIT REVISION & RESTORE CREDIT"
                    : "FINAL SUBMIT & INSTANT CREDIT"} <ShieldCheck size={26} className="group-hover:scale-125 transition-transform" />
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SHARED / QUALITY CONTROL COMPONENTS
// ---------------------------------------------------------------------------

function QualityControlPanel({ evalData, update }: any) {
  return (
    <section className="pt-16 border-t border-slate-200">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h3 className="text-base font-black uppercase tracking-[0.3em] text-indigo-600 mb-2">Quality Control</h3>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Explain your audit logic in technical detail</p>
        </div>

        <textarea
          className="w-full bg-white border border-slate-200 rounded-[2.5rem] p-8 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 outline-none min-h-[16rem] focus:border-indigo-500 transition-all font-medium"
          placeholder="Explain your verdict in technical detail. If content is flawed, identify the specific lines that are incorrect. (Min 100 characters)"
          value={evalData.justification}
          onChange={(e) => update({ justification: e.target.value })}
        />

        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3 text-sm text-slate-500 font-black uppercase">
            <input type="checkbox" className="w-5 h-5 accent-indigo-500" required />
            This audit follows NexusGrid compliance rules.
          </div>
          <div className={`text-sm font-black px-4 py-1.5 rounded-full ${evalData.justification.length >= 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {evalData.justification.length} / 100 characters
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 pt-10 border-t border-slate-200">
          <div>
            <label className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center gap-2 tracking-widest"><Gauge size={16} /> Confidence: {evalData.confidence}%</label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={evalData.confidence}
              onChange={(e) => update({ confidence: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
          <Scale5 label="Task Difficulty" value={evalData.difficulty} onChange={(v) => update({ difficulty: v })} />
        </div>
      </div>
    </section>
  );
}

function ReportProblemPanel({ data, onChange }: any) {
  return (
    <div className="bg-red-50 border border-red-200 p-8 rounded-[2rem] space-y-4">
      <button
        onClick={() => onChange({ ...data, flagged: !data.flagged })}
        className={`w-full flex items-center justify-between text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all ${data.flagged ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-200 hover:bg-red-100'}`}
      >
        <span className="flex items-center gap-2"><Flag size={16} /> Report Problem</span>
        <AlertTriangle size={16} />
      </button>
      {data.flagged && (
        <textarea
          className="w-full bg-white border border-red-200 rounded-xl p-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none min-h-[6rem] focus:border-red-500"
          placeholder="Describe the issue with this task (broken content, unclear instructions, etc.)"
          value={data.notes}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PREFERENCE RANKING COMPONENTS
// ---------------------------------------------------------------------------

function VerdictBtn({ active, label, icon, color, onClick }: any) {
  return (
    <button onClick={onClick} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${active ? `${color} border-transparent text-white shadow-xl scale-105` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
      {icon}
      <span className="text-xs font-black uppercase tracking-widest text-center">{label}</span>
    </button>
  );
}

function ContentBox({ label, text, accent = 'indigo' }: any) {
  const ring: Record<string, string> = {
    indigo: 'border-indigo-200', purple: 'border-purple-200', pink: 'border-pink-200', blue: 'border-blue-200',
  };
  return (
    <div className={`bg-slate-50 border ${ring[accent] || 'border-slate-200'} p-10 rounded-[3rem] shadow-sm`}>
      <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] block mb-6 italic">{label}</span>
      <div className="text-lg text-slate-800 leading-relaxed font-medium whitespace-pre-wrap max-h-[420px] overflow-y-auto pr-4">{text}</div>
    </div>
  );
}

function DimensionGrid({ title, data, onChange }: any) {
  const update = (key: string, val: number) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-5 bg-slate-50 p-8 rounded-3xl border border-slate-200">
      <h4 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 text-left border-b border-slate-200 pb-3">{title}</h4>
      <div className="grid grid-cols-2 gap-x-10 gap-y-4">
        {DIMENSION_LABELS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between group">
            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors">{label}</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => update(key, n)} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${data[key] === n ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>{n}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorBlock({ title, data, onChange }: any) {
  return (
    <div className="space-y-5 bg-slate-50 p-6 rounded-3xl border border-slate-200">
      <h4 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 text-left border-b border-slate-200 pb-3 flex items-center gap-2"><MessageSquareWarning size={16} /> {title}</h4>
      <SegmentedControl options={['No', 'Yes']} value={data.hasError} onChange={(v) => onChange({ ...data, hasError: v })} />
      {data.hasError === 'Yes' && (
        <div className="space-y-4 pt-2">
          <select
            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-900 outline-none focus:border-indigo-500"
            value={data.type}
            onChange={(e) => onChange({ ...data, type: e.target.value })}
          >
            <option value="">Select error type...</option>
            {ERROR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <textarea
            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none min-h-[6rem] focus:border-indigo-500"
            placeholder="Explain the specific error..."
            value={data.explanation}
            onChange={(e) => onChange({ ...data, explanation: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

function ExtendedResponseChecks({
  toxicity, onToxicity, bias, onBias, repetition, onRepetition, length, onLength, suggestedEdit, onSuggestedEdit,
}: any) {
  return (
    <div className="space-y-5 bg-slate-50 p-6 rounded-3xl border border-slate-200">
      <h4 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 text-left border-b border-slate-200 pb-3">Extended Checks</h4>
      <Scale5 label="Toxicity Level" value={toxicity} onChange={onToxicity} startAtZero />
      <div>
        <label className="text-sm font-bold text-slate-500 mb-2 block">Bias Detected</label>
        <SegmentedControl options={['No', 'Yes']} value={bias.flagged} onChange={(v) => onBias({ ...bias, flagged: v })} />
        {bias.flagged === 'Yes' && (
          <textarea
            className="w-full mt-3 bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none min-h-[5rem] focus:border-indigo-500"
            placeholder="Describe the bias..."
            value={bias.explanation}
            onChange={(e) => onBias({ ...bias, explanation: e.target.value })}
          />
        )}
      </div>
      <div>
        <label className="text-sm font-bold text-slate-500 mb-2 block">Repetition / Redundancy</label>
        <SegmentedControl options={['No', 'Yes']} value={repetition} onChange={onRepetition} />
      </div>
      <div>
        <label className="text-sm font-bold text-slate-500 mb-2 block">Length Appropriateness</label>
        <SegmentedControl options={LENGTH_OPTIONS} value={length} onChange={onLength} />
      </div>
      <div>
        <label className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-2"><PencilLine size={16} /> Suggested Edit (optional)</label>
        <textarea
          className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none min-h-[5rem] focus:border-indigo-500"
          placeholder="How would you rewrite the weakest part of this response?"
          value={suggestedEdit}
          onChange={(e) => onSuggestedEdit(e.target.value)}
        />
      </div>
    </div>
  );
}

function ChoiceBtn({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex-1 py-6 rounded-2xl border-2 font-black text-sm uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TEXT CLASSIFICATION COMPONENTS
// ---------------------------------------------------------------------------

function LabeledInput({ label, value, onChange, placeholder, className = '', accent = 'indigo', icon }: any) {
  const ring: Record<string, string> = { indigo: 'focus:border-indigo-500', purple: 'focus:border-purple-500', pink: 'focus:border-pink-500', blue: 'focus:border-blue-500' };
  return (
    <div className={className}>
      <label className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2 tracking-widest">{icon}{label}</label>
      <input
        className={`w-full bg-white border border-slate-200 rounded-2xl py-5 px-6 text-base text-slate-900 placeholder:text-slate-400 outline-none ${ring[accent]}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function LabeledTextarea({ label, value, onChange, placeholder, accent = 'indigo', rows = 4 }: any) {
  const ring: Record<string, string> = { indigo: 'focus:border-indigo-500', purple: 'focus:border-purple-500', pink: 'focus:border-pink-500', blue: 'focus:border-blue-500' };
  return (
    <div>
      <label className="text-xs font-black uppercase text-slate-400 mb-4 block tracking-widest">{label}</label>
      <textarea
        className={`w-full bg-white border border-slate-200 rounded-2xl p-6 text-base text-slate-900 placeholder:text-slate-400 outline-none ${ring[accent]}`}
        style={{ minHeight: `${rows * 2.2}rem` }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function EntityField({ icon, label, value, onChange, className = '' }: any) {
  return (
    <div className={className}>
      <label className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2 tracking-widest">{icon} {label}</label>
      <input
        className="w-full bg-white border border-slate-200 rounded-2xl py-5 px-6 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:border-purple-500"
        placeholder={`e.g. ${label} mentioned in text`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SENTIMENT ANALYSIS COMPONENTS
// ---------------------------------------------------------------------------

function SentimentSlider({ value, onChange }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
        <span className="text-red-500">-5 Very Negative</span>
        <span className="text-3xl text-slate-900 font-black">{value > 0 ? `+${value}` : value}</span>
        <span className="text-emerald-500">+5 Very Positive</span>
      </div>
      <input
        type="range"
        min={-5}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-pink-500"
      />
    </div>
  );
}

function ToggleRow({ label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl border-2 transition-all ${active ? 'bg-pink-600 border-pink-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-pink-50'}`}>
      <span className="text-sm font-black uppercase tracking-widest">{label}</span>
      {active ? <EyeOff size={18} /> : <CheckSquare size={18} className="opacity-30" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// GENERIC PRIMITIVES
// ---------------------------------------------------------------------------

function SegmentedControl({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${value === opt ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Scale5({ label, value, onChange, startAtZero = false }: { label: string; value: number; onChange: (v: number) => void; startAtZero?: boolean }) {
  const options = startAtZero ? [0, 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5];
  return (
    <div>
      <label className="text-sm font-bold text-slate-500 mb-3 block">{label}</label>
      <div className="flex gap-2">
        {options.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 py-4 rounded-xl text-sm font-black transition-all ${value === n ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}