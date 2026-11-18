import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { candidateMemoryService, emptyPIQ } from '../../services/candidateMemoryService';
import { getInterviewNextQuestion, evaluateInterviewSession } from '../../services/aiService';
import { PIQProfile, InterviewMessage, InterviewSession, InterviewEvaluation } from '../../types/ai';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  User,
  Mic,
  MicOff,
  Send,
  Star,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Save,
  ClipboardList,
  MessageSquare,
  Trophy,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Shield,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────
type TabId = 'live' | 'profile';
type PhaseId = 'setup' | 'interview' | 'evaluation';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
declare class SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

// ─── Helpers ──────────────────────────────────────────────────
function newId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function newSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Star Rating Component ─────────────────────────────────────
const StarRating: React.FC<{ score: number; max?: number }> = ({ score, max = 5 }) => (
  <div className="flex items-center space-x-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < score ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
      />
    ))}
  </div>
);

// ─── Score Color Helper ────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 4) return 'text-emerald-400';
  if (score >= 3) return 'text-amber-400';
  return 'text-red-400';
}

// ─── Loading Dots ─────────────────────────────────────────────
const LoadingDots: React.FC = () => (
  <div className="flex items-center space-x-1.5 py-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

// ─── PIQ Setup Form ───────────────────────────────────────────
interface PIQFormProps {
  userId: string;
  initialPiq: PIQProfile;
  onSaved: (piq: PIQProfile) => void;
}

const PIQSetupForm: React.FC<PIQFormProps> = ({ userId, initialPiq, onSaved }) => {
  const [form, setForm] = useState<PIQProfile>(initialPiq);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState<string>('personal');

  const set = (field: keyof PIQProfile, value: string | number | null) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    const saved = candidateMemoryService.savePIQ(userId, form);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    onSaved(saved);
  };

  const isComplete = !!(form.name && form.age && form.targetEntry && form.motivationForForces);

  const Section: React.FC<{ id: string; label: string; icon: React.ReactNode; children: React.ReactNode }> = ({
    id, label, icon, children,
  }) => {
    const open = openSection === id;
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenSection(open ? '' : id)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="text-amber-400">{icon}</span>
            <span className="font-semibold text-white text-sm">{label}</span>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {open && <div className="px-5 pb-5 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>}
      </div>
    );
  };

  const Field: React.FC<{
    label: string;
    field: keyof PIQProfile;
    type?: string;
    placeholder?: string;
    wide?: boolean;
    required?: boolean;
  }> = ({ label, field, type = 'text', placeholder, wide, required }) => (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
        {label} {required && <span className="text-amber-400">*</span>}
      </label>
      <input
        type={type}
        value={(form[field] as string | number) ?? ''}
        onChange={(e) => set(field, type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
      />
    </div>
  );

  const TextArea: React.FC<{
    label: string;
    field: keyof PIQProfile;
    placeholder?: string;
    wide?: boolean;
    required?: boolean;
    rows?: number;
  }> = ({ label, field, placeholder, wide, required, rows = 3 }) => (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
        {label} {required && <span className="text-amber-400">*</span>}
      </label>
      <textarea
        value={(form[field] as string) ?? ''}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors leading-relaxed resize-none"
      />
    </div>
  );

  const SelectField: React.FC<{
    label: string;
    field: keyof PIQProfile;
    options: string[];
    required?: boolean;
  }> = ({ label, field, options, required }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
        {label} {required && <span className="text-amber-400">*</span>}
      </label>
      <select
        value={(form[field] as string) ?? ''}
        onChange={(e) => set(field, e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center space-x-2 bg-amber-400/10 border border-amber-400/30 rounded-full px-4 py-1.5 text-amber-400 text-xs font-semibold">
          <ClipboardList className="w-4 h-4" />
          <span>Personal Information Questionnaire (PIQ)</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">Build Your Candidate Profile</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Your PIQ is used to generate realistic, personalised IO questions. Complete at least the{' '}
          <span className="text-amber-400 font-semibold">required fields</span> to begin.
        </p>
      </div>

      {/* Required fields highlight */}
      <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 text-xs text-amber-300 space-y-1">
        <p className="font-semibold">Required to start interview:</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {['Full Name', 'Age', 'Target Entry', 'Motivation for Forces'].map((r) => (
            <span key={r} className="px-2 py-0.5 bg-amber-400/10 rounded-full">{r}</span>
          ))}
        </div>
      </div>

      {/* Sections */}
      <Section id="personal" label="Personal Information" icon={<User className="w-4 h-4" />}>
        <Field label="Full Name" field="name" placeholder="Rahul Sharma" required />
        <Field label="Age" field="age" type="number" placeholder="22" required />
        <Field label="Date of Birth" field="dob" type="date" />
        <Field label="Hometown" field="hometown" placeholder="Pune" />
        <Field label="State" field="state" placeholder="Maharashtra" />
        <Field label="Current Occupation" field="currentOccupation" placeholder="Student / Working / Preparing" />
      </Section>

      <Section id="education" label="Education" icon={<ClipboardList className="w-4 h-4" />}>
        <Field label="School Name" field="schoolName" placeholder="Army Public School, Pune" />
        <Field label="School Board" field="schoolBoard" placeholder="CBSE / ICSE / State Board" />
        <Field label="10th Percentage" field="class10Percentage" placeholder="92%" />
        <Field label="12th Percentage" field="class12Percentage" placeholder="88%" />
        <Field label="Graduation College" field="graduationCollege" placeholder="COEP, Pune" />
        <Field label="Degree" field="graduationDegree" placeholder="B.Tech / B.Sc / BA" />
        <Field label="Graduation %" field="graduationPercentage" placeholder="75%" />
      </Section>

      <Section id="family" label="Family" icon={<Shield className="w-4 h-4" />}>
        <Field label="Father's Name" field="fatherName" placeholder="Col. Ramesh Sharma (Retd.)" />
        <Field label="Father's Occupation" field="fatherOccupation" placeholder="Retired Army Officer" />
        <Field label="Mother's Name" field="motherName" placeholder="Sunita Sharma" />
        <Field label="Mother's Occupation" field="motherOccupation" placeholder="School Teacher" />
        <TextArea label="Siblings" field="siblings" placeholder="1 elder sister, Software Engineer at Infosys" wide />
        <TextArea label="Family Background" field="familyBackground" placeholder="Brief family description…" wide />
        <Field label="Defence Family Background" field="defenceBackground" placeholder="Father served in Army, retired as Colonel" wide />
      </Section>

      <Section id="interests" label="Interests & Activities" icon={<Sparkles className="w-4 h-4" />}>
        <TextArea label="Hobbies" field="hobbies" placeholder="Reading military history, Chess, Photography" />
        <TextArea label="Sports" field="sports" placeholder="Football (school team captain), Swimming" />
        <TextArea label="Achievements" field="achievements" placeholder="State-level chess champion, NCC 'C' certificate…" wide rows={3} />
        <TextArea label="Leadership Experiences" field="leadershipExperiences" placeholder="School prefect, college fest organizer…" wide rows={3} />
        <TextArea label="Social Activities" field="socialActivities" placeholder="NSS volunteer, blood donation camps…" wide />
        <Field label="NCC / NSS / Scout" field="nccNss" placeholder="NCC / NSS / Scout / None" />
        <Field label="NCC Grade / Certificate" field="nccGrade" placeholder="'C' Certificate / 'B' Certificate" />
      </Section>

      <Section id="defence" label="Defence Profile" icon={<Bot className="w-4 h-4" />}>
        <SelectField label="Target Arm" field="targetArm" options={['Army', 'Navy', 'Air Force']} required />
        <SelectField label="Target Entry" field="targetEntry" options={['NDA', 'CDS', 'TES', 'AFCAT', 'SSC-Tech', 'UES', 'TGC', 'ACC']} required />
        <Field label="Previous SSB Attempts" field="previousAttempts" type="number" placeholder="0" />
        <Field label="Previous SSB Boards" field="previousSSBBoards" placeholder="1 AFSB Dehradun, 2 SSB Allahabad" />
        <Field label="Previous SSB Result" field="previousSSBResult" placeholder="Screened out / Conferenced out / Recommended" />
        <TextArea
          label="Motivation for Joining Forces"
          field="motivationForForces"
          placeholder="Describe in detail why you want to serve in the armed forces…"
          wide
          rows={4}
          required
        />
      </Section>

      <Section id="self" label="Self Assessment" icon={<TrendingUp className="w-4 h-4" />}>
        <TextArea label="Your Strengths" field="strengthsSelf" placeholder="Leadership, quick decision-making, discipline…" wide />
        <TextArea label="Your Weaknesses" field="weaknessesSelf" placeholder="Impatience, public speaking anxiety…" wide />
        <TextArea label="Role Models" field="roleModels" placeholder="Field Marshal Sam Manekshaw — for his leadership…" wide />
        <TextArea
          label="Future Plans if Not Selected"
          field="futurePlansIfNotSelected"
          placeholder="I will continue preparing and attempt again. Meanwhile…"
          wide
        />
      </Section>

      {/* Save Button */}
      <div className="flex flex-col items-center space-y-3 pb-6">
        {!isComplete && (
          <p className="text-xs text-amber-400 text-center">
            Fill in Name, Age, Target Entry, and Motivation to unlock the interview.
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-bold rounded-2xl flex items-center space-x-2 transition-colors shadow-lg shadow-amber-500/20"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>{saving ? 'Saving…' : 'Save PIQ Profile'}</span>
        </button>
        {isComplete && (
          <p className="text-xs text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile complete — ready to start interview!</span>
          </p>
        )}
      </div>
    </div>
  );
};

// ─── PIQ Viewer (read-only with edit button) ───────────────────
const PIQViewer: React.FC<{
  piq: PIQProfile;
  onEdit: () => void;
}> = ({ piq, onEdit }) => {
  const sections = [
    {
      title: 'Personal', items: [
        ['Name', piq.name], ['Age', piq.age?.toString()], ['DOB', piq.dob],
        ['Hometown', piq.hometown], ['State', piq.state], ['Occupation', piq.currentOccupation],
      ],
    },
    {
      title: 'Education', items: [
        ['School', piq.schoolName], ['Board', piq.schoolBoard], ['10th', piq.class10Percentage],
        ['12th', piq.class12Percentage], ['College', piq.graduationCollege],
        ['Degree', piq.graduationDegree], ['Graduation %', piq.graduationPercentage],
      ],
    },
    {
      title: 'Family', items: [
        ['Father', piq.fatherName], ['Father Occ.', piq.fatherOccupation],
        ['Mother', piq.motherName], ['Mother Occ.', piq.motherOccupation],
        ['Siblings', piq.siblings], ['Defence Bg.', piq.defenceBackground],
      ],
    },
    {
      title: 'Interests', items: [
        ['Hobbies', piq.hobbies], ['Sports', piq.sports],
        ['NCC/NSS', piq.nccNss], ['NCC Grade', piq.nccGrade],
        ['Achievements', piq.achievements], ['Leadership', piq.leadershipExperiences],
      ],
    },
    {
      title: 'Defence Profile', items: [
        ['Target Arm', piq.targetArm], ['Target Entry', piq.targetEntry],
        ['Prev. Attempts', piq.previousAttempts?.toString()],
        ['Prev. Boards', piq.previousSSBBoards], ['Prev. Result', piq.previousSSBResult],
        ['Motivation', piq.motivationForForces],
      ],
    },
    {
      title: 'Self Assessment', items: [
        ['Strengths', piq.strengthsSelf], ['Weaknesses', piq.weaknessesSelf],
        ['Role Models', piq.roleModels], ['Future Plans', piq.futurePlansIfNotSelected],
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">My PIQ Profile</h3>
        <button
          onClick={onEdit}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>
      <p className="text-xs text-slate-500">Last updated: {new Date(piq.updatedAt).toLocaleString('en-IN')}</p>
      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.title} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">{s.title}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {s.items.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{k}</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{v}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Evaluation Report ─────────────────────────────────────────
const EvaluationReport: React.FC<{
  evaluation: InterviewEvaluation;
  onRestart: () => void;
}> = ({ evaluation, onRestart }) => {
  const dimensions: Array<{ key: keyof InterviewEvaluation; label: string }> = [
    { key: 'clarityOfThought', label: 'Clarity of Thought' },
    { key: 'communication', label: 'Communication' },
    { key: 'honestyConsistency', label: 'Honesty & Consistency' },
    { key: 'selfAwareness', label: 'Self Awareness' },
    { key: 'logicalReasoning', label: 'Logical Reasoning' },
    { key: 'depthOfAnswers', label: 'Depth of Answers' },
    { key: 'decisionMaking', label: 'Decision Making' },
    { key: 'personalExamplesQuality', label: 'Quality of Personal Examples' },
  ];

  const dim = evaluation as unknown as Record<string, { score: number; evidence: string[] }>;
  const totalScore = dimensions.reduce((sum, d) => sum + (dim[d.key]?.score || 0), 0);
  const avgScore = (totalScore / dimensions.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Overall */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-400/30 rounded-2xl p-6 text-center">
        <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
          <Trophy className="w-4 h-4" />
          <span>Interview Evaluation Report</span>
        </div>
        <div className="text-5xl font-black text-white mb-1">{avgScore}<span className="text-2xl text-slate-400">/5</span></div>
        <p className="text-sm text-slate-400">Average Score across 8 dimensions</p>
        <div className="flex justify-center mt-3">
          <StarRating score={Math.round(Number(avgScore))} />
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span>Dimension Scores</span>
        </h4>
        <div className="space-y-3">
          {dimensions.map(({ key, label }) => {
            const d = dim[key] as { score: number; evidence: string[] } | undefined;
            const score = d?.score || 0;
            return (
              <div key={key} className="flex items-center space-x-3">
                <div className="w-36 shrink-0 text-xs text-slate-300 font-medium">{label}</div>
                <StarRating score={score} />
                <span className={`text-sm font-bold ml-auto ${scoreColor(score)}`}>{score}/5</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence per dimension */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-white">Score Evidence</h4>
        <div className="space-y-3">
          {dimensions.map(({ key, label }) => {
            const d = dim[key] as { score: number; evidence: string[] } | undefined;
            if (!d?.evidence?.length) return null;
            return (
              <div key={key} className="border-l-2 border-slate-700 pl-3">
                <p className="text-xs font-semibold text-amber-400 mb-1">{label}</p>
                {d.evidence.map((e, i) => (
                  <p key={i} className="text-xs text-slate-400">{e}</p>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strong / Weak Responses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {evaluation.strongResponses?.length > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Strong Responses</span>
            </h4>
            <ul className="space-y-1.5">
              {evaluation.strongResponses.map((r, i) => (
                <li key={i} className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-emerald-400 font-bold mr-1">→</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {evaluation.weakResponses?.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-red-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Weak Responses</span>
            </h4>
            <ul className="space-y-1.5">
              {evaluation.weakResponses.map((r, i) => (
                <li key={i} className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-red-400 font-bold mr-1">↓</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Contradictions */}
      {evaluation.contradictions?.length > 0 && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-orange-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Contradictions Detected</span>
          </h4>
          <ul className="space-y-1.5">
            {evaluation.contradictions.map((c, i) => (
              <li key={i} className="text-xs text-slate-300">{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement Exercises */}
      {evaluation.improvementExercises?.length > 0 && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-blue-400 flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Improvement Exercises</span>
          </h4>
          <ul className="space-y-1.5">
            {evaluation.improvementExercises.map((e, i) => (
              <li key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                <span className="text-blue-400 font-bold mt-0.5">{i + 1}.</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up Questions */}
      {evaluation.followUpQuestions?.length > 0 && (
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-purple-400 flex items-center space-x-2">
            <HelpCircle className="w-4 h-4" />
            <span>Follow-up Questions to Practise</span>
          </h4>
          <ul className="space-y-2">
            {evaluation.followUpQuestions.map((q, i) => (
              <li key={i} className="text-xs text-slate-300 bg-purple-500/5 rounded-lg px-3 py-2 leading-relaxed">
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* OLQ Evidence */}
      {evaluation.olqEvidence?.length > 0 && (
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-amber-400 flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>OLQ Evidence Observed</span>
          </h4>
          <div className="space-y-2">
            {evaluation.olqEvidence.map((item, i) => {
              const levelColor =
                item.level === 'positive_evidence' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                : item.level === 'developing' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                : item.level === 'needs_practice' ? 'text-red-400 bg-red-400/10 border-red-400/20'
                : 'text-slate-400 bg-slate-700/50 border-slate-600/20';
              const levelLabel =
                item.level === 'positive_evidence' ? '✓ Positive Evidence'
                : item.level === 'developing' ? '~ Developing'
                : item.level === 'needs_practice' ? '↓ Needs Practice'
                : '— Insufficient';
              return (
                <div key={i} className="flex items-start justify-between space-x-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">{item.olq}</p>
                    <p className="text-xs text-slate-400">{item.evidence}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${levelColor}`}>
                    {levelLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overall Feedback */}
      {evaluation.overallFeedback && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Overall Feedback</h4>
          <p className="text-sm text-slate-200 leading-relaxed">{evaluation.overallFeedback}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
        <span className="font-semibold text-slate-400">Disclaimer: </span>
        {evaluation.disclaimer}
      </div>

      {/* Restart */}
      <div className="flex justify-center pb-4">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-2xl flex items-center space-x-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Start New Interview</span>
        </button>
      </div>
    </div>
  );
};

// ─── Chat Message ──────────────────────────────────────────────
const ChatMessage: React.FC<{ msg: InterviewMessage }> = ({ msg }) => {
  const isIO = msg.role === 'interviewer';
  return (
    <div className={`flex ${isIO ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] space-y-1 ${isIO ? '' : ''}`}>
        {/* Sender + Category badge */}
        <div className={`flex items-center space-x-2 ${isIO ? '' : 'flex-row-reverse space-x-reverse'}`}>
          {isIO ? (
            <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-military-700/80 border border-slate-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-slate-300" />
            </div>
          )}
          <span className="text-[10px] font-semibold text-slate-500">
            {isIO ? 'Interviewing Officer' : 'You'}
          </span>
          {msg.questionCategory && isIO && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400">
              {msg.questionCategory}
            </span>
          )}
          {msg.isFollowUp && isIO && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-400/10 border border-orange-400/20 text-orange-400">
              Follow-up
            </span>
          )}
        </div>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isIO
              ? 'bg-slate-800 border-l-4 border-amber-400 text-slate-100 rounded-tl-none'
              : 'bg-slate-700 border border-slate-600 text-slate-100 rounded-tr-none'
          }`}
        >
          {msg.content}
        </div>
        <p className="text-[10px] text-slate-600 px-1">
          {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────
export const InterviewSimulatorPage: React.FC = () => {
  const { user } = useAuth();
  const [piq, setPiq] = useState<PIQProfile | null>(null);
  const [piqComplete, setPiqComplete] = useState(false);
  const [showPIQForm, setShowPIQForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('live');
  const [phase, setPhase] = useState<PhaseId>('interview');

  // Session
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Voice
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Scroll
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ── Load PIQ on mount ──
  useEffect(() => {
    if (!user) return;
    const loaded = candidateMemoryService.getPIQ(user.id);
    setPiq(loaded);
    const complete = candidateMemoryService.isPIQComplete(loaded);
    setPiqComplete(complete);
    if (!complete) setShowPIQForm(true);
  }, [user]);

  // ── Voice support detection ──
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
    if (SR) {
      const sr = new SR();
      sr.continuous = false;
      sr.interimResults = false;
      sr.lang = 'en-IN';
      sr.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join(' ');
        setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };
      sr.onerror = () => setIsListening(false);
      sr.onend = () => setIsListening(false);
      recognitionRef.current = sr;
    }
  }, []);

  // ── Auto-scroll ──
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Handle PIQ save ──
  const handlePIQSaved = useCallback((saved: PIQProfile) => {
    setPiq(saved);
    const complete = candidateMemoryService.isPIQComplete(saved);
    setPiqComplete(complete);
    if (complete) setShowPIQForm(false);
  }, []);

  // ── Create session ──
  const createSession = useCallback((piqData: PIQProfile): InterviewSession => {
    return {
      id: newSessionId(),
      userId: user!.id,
      piqSnapshot: piqData,
      messages: [],
      status: 'active',
      startedAt: new Date().toISOString(),
    };
  }, [user]);

  // ── Start interview ──
  const handleStart = useCallback(async () => {
    if (!piq || !user) return;
    setIsLoading(true);
    setStarted(true);
    const sess = createSession(piq);
    setSession(sess);

    try {
      const res = await getInterviewNextQuestion([], piq);
      const qData = res.data;
      const ioMsg: InterviewMessage = {
        id: newId(),
        role: 'interviewer',
        content: qData?.question || 'Tell me about yourself.',
        timestamp: new Date().toISOString(),
        questionCategory: qData?.category,
        isFollowUp: qData?.isFollowUp || false,
      };
      const updatedMsgs = [ioMsg];
      setMessages(updatedMsgs);
      const updatedSess = { ...sess, messages: updatedMsgs };
      setSession(updatedSess);
      candidateMemoryService.saveInterviewSession(user.id, updatedSess);
    } catch (err) {
      console.error('Start interview error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [piq, user, createSession]);

  // ── Send message ──
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading || !piq || !user || !session) return;

    const candidateMsg: InterviewMessage = {
      id: newId(),
      role: 'candidate',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMsgs = [...messages, candidateMsg];
    setMessages(updatedMsgs);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await getInterviewNextQuestion(updatedMsgs, piq);
      const qData = res.data;
      const ioMsg: InterviewMessage = {
        id: newId(),
        role: 'interviewer',
        content: qData?.question || "Could you elaborate further?",
        timestamp: new Date().toISOString(),
        questionCategory: qData?.category,
        isFollowUp: qData?.isFollowUp || false,
      };
      const finalMsgs = [...updatedMsgs, ioMsg];
      setMessages(finalMsgs);
      const updatedSess = { ...session, messages: finalMsgs };
      setSession(updatedSess);
      candidateMemoryService.saveInterviewSession(user.id, updatedSess);
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, piq, user, session, messages]);

  // ── Handle Enter key ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Voice toggle ──
  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  }, [isListening]);

  // ── End interview & evaluate ──
  const handleEndInterview = useCallback(async () => {
    if (!piq || !user || !session) return;
    setEvaluating(true);

    try {
      const res = await evaluateInterviewSession(messages, piq);
      const ev = res.data;
      if (!ev) return;

      setEvaluation(ev);
      const completedSess: InterviewSession = {
        ...session,
        messages,
        status: 'completed',
        completedAt: new Date().toISOString(),
        evaluation: ev,
      };
      setSession(completedSess);
      candidateMemoryService.saveInterviewSession(user.id, completedSess);

      // Save OLQ evidence
      if (ev.olqEvidence?.length) {
        candidateMemoryService.addOLQEvidence(
          user.id,
          ev.olqEvidence.map((item) => ({
            olqName: item.olq,
            level: item.level,
            evidence: item.evidence,
            source: 'INTERVIEW' as const,
            sessionId: session.id,
            timestamp: new Date().toISOString(),
          }))
        );
      }

      setPhase('evaluation');
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  }, [piq, user, session, messages]);

  // ── Restart ──
  const handleRestart = useCallback(() => {
    setMessages([]);
    setStarted(false);
    setSession(null);
    setEvaluation(null);
    setPhase('interview');
    setInputText('');
  }, []);

  const candidateMessageCount = messages.filter((m) => m.role === 'candidate').length;
  const canEvaluate = candidateMessageCount >= 10;

  // ── Render: PIQ setup (not complete) ──
  if (!piqComplete || showPIQForm) {
    return (
      <div className="space-y-5">
        <div className="flex items-center space-x-3">
          <Link
            to="/interview"
            className="flex items-center space-x-1.5 text-slate-400 hover:text-white text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Interview Prep</span>
          </Link>
        </div>
        <PIQSetupForm
          userId={user?.id || ''}
          initialPiq={piq || emptyPIQ(user?.id || '')}
          onSaved={handlePIQSaved}
        />
      </div>
    );
  }

  // ── Render: Main simulator ──
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/interview"
            className="flex items-center space-x-1.5 text-slate-400 hover:text-white text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
          <div className="h-4 w-px bg-slate-700" />
          <div>
            <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <Bot className="w-4 h-4" />
              <span>AI Interview Simulator</span>
            </div>
            <h1 className="text-lg font-extrabold text-white leading-tight">
              Personal Interview — IO Mode
            </h1>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Session</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {[
          { id: 'live' as TabId, label: 'Live Interview', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'profile' as TabId, label: 'My PIQ Profile', icon: <ClipboardList className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: PIQ Profile ── */}
      {activeTab === 'profile' && piq && (
        <PIQViewer piq={piq} onEdit={() => { setShowPIQForm(true); setPiqComplete(false); }} />
      )}

      {/* ── Tab: Live Interview ── */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {/* Evaluation Report */}
          {phase === 'evaluation' && evaluation && (
            <EvaluationReport evaluation={evaluation} onRestart={handleRestart} />
          )}

          {/* Interview Chat */}
          {phase === 'interview' && (
            <>
              {/* Not started */}
              {!started && (
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-amber-400/10 border-2 border-amber-400/30 flex items-center justify-center mx-auto">
                    <Bot className="w-8 h-8 text-amber-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white">Ready to face the IO?</h2>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      The AI will play an Interviewing Officer and ask personalised questions based on your PIQ.
                      Respond naturally as you would in a real SSB interview.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-400">
                    {['Personalised PIQ-based questions', 'Cross-questioning & follow-ups', 'AI evaluation after 10+ answers'].map((f) => (
                      <div key={f} className="flex items-center space-x-1.5 bg-slate-700/50 rounded-full px-3 py-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleStart}
                    disabled={isLoading}
                    className="inline-flex items-center space-x-2 px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-bold rounded-2xl transition-colors shadow-lg shadow-amber-500/20"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                    <span>{isLoading ? 'Starting…' : 'Start Interview'}</span>
                  </button>
                </div>
              )}

              {/* Chat area */}
              {started && (
                <>
                  {/* Progress indicator */}
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>{candidateMessageCount} answer{candidateMessageCount !== 1 ? 's' : ''} given</span>
                    <span>{canEvaluate ? '✓ Ready for evaluation' : `${10 - candidateMessageCount} more to unlock evaluation`}</span>
                  </div>

                  {/* Messages */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-5 min-h-[400px] max-h-[520px] overflow-y-auto">
                    {messages.map((msg) => (
                      <ChatMessage key={msg.id} msg={msg} />
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800 border-l-4 border-amber-400 rounded-2xl rounded-tl-none px-4 py-3">
                          <LoadingDots />
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input area */}
                  <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
                      rows={3}
                      disabled={isLoading}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors leading-relaxed resize-none disabled:opacity-50"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {voiceSupported && (
                          <button
                            type="button"
                            onClick={toggleVoice}
                            disabled={isLoading}
                            title={isListening ? 'Stop recording' : 'Start voice input'}
                            className={`p-2.5 rounded-xl border transition-all disabled:opacity-50 ${
                              isListening
                                ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                                : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'
                            }`}
                          >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </button>
                        )}
                        {isListening && (
                          <span className="text-xs text-red-400 animate-pulse">● Recording…</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {canEvaluate && !evaluating && (
                          <button
                            type="button"
                            onClick={handleEndInterview}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
                          >
                            <Trophy className="w-4 h-4" />
                            <span>End & Evaluate</span>
                          </button>
                        )}
                        {evaluating && (
                          <div className="flex items-center space-x-2 text-xs text-amber-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Evaluating session…</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleSend}
                          disabled={!inputText.trim() || isLoading}
                          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl flex items-center space-x-2 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hint */}
                  {candidateMessageCount < 10 && (
                    <p className="text-xs text-slate-600 text-center">
                      Complete at least 10 exchanges to unlock the AI evaluation report.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
