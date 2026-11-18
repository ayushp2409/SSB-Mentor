import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { candidateMemoryService } from '../../services/candidateMemoryService';
import { getGDNextMessages } from '../../services/aiService';
import { GDMessage, GDPersonaType, OLQName, OLQEvidenceLevel } from '../../types/ai';
import {
  Users2,
  Clock,
  Send,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Award,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Shield,
  Loader2,
} from 'lucide-react';

interface TopicOption {
  id: string;
  title: string;
  starterPrompt: string;
}

const TOPICS: TopicOption[] = [
  {
    id: 'agnipath',
    title: 'Should Agnipath Scheme for Armed Forces Recruitment be Expanded or Modified?',
    starterPrompt: 'Gentlemen, let us begin the discussion on whether the Agnipath scheme addresses military modernization adequately, or if modifications are necessary for regimental cohesion.',
  },
  {
    id: 'theatre',
    title: 'Theaterisation of Indian Armed Forces: Joint Warfighting & Asset Allocation Challenges',
    starterPrompt: 'The floor is open. Modern conflicts require integrated theater commands across Army, Air Force, and Navy, but what are the structural impediments?',
  },
  {
    id: 'drones',
    title: 'Autonomous Drones & Artificial Intelligence in Modern Asymmetric Warfare',
    starterPrompt: 'Friends, observing conflicts from Ukraine to the Red Sea, how should India prioritize low-cost drone swarms versus expensive fifth-generation assets?',
  },
  {
    id: 'atmanirbhar',
    title: 'Balancing Indigenous R&D with Immediate Two-Front Operational Readiness',
    starterPrompt: 'How can India balance the time lag of domestic indigenous defence manufacturing with critical shortfalls in fighter squadrons and submarines?',
  },
  {
    id: 'women_combat',
    title: 'Permanent Commission & Command Appointments for Women in the Armed Forces',
    starterPrompt: 'Let us discuss the operational, physical, and sociological factors regarding command roles for women officers in field formations.',
  },
];

const PERSONAS: Array<{ name: string; type: GDPersonaType; color: string; bg: string; desc: string }> = [
  {
    name: 'Chest No. 12 (Arjun)',
    type: 'confident',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    desc: 'Confident & Strategic',
  },
  {
    name: 'Chest No. 15 (Priya)',
    type: 'analytical',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    desc: 'Analytical & Data-Driven',
  },
  {
    name: 'Chest No. 18 (Rohit)',
    type: 'aggressive',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
    desc: 'Firm & Assertive',
  },
  {
    name: 'Chest No. 21 (Meera)',
    type: 'skeptic',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    desc: 'Critical & Prudent',
  },
];

export const GDSimulatorPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState<TopicOption>(TOPICS[0]);
  const [isDiscussionActive, setIsDiscussionActive] = useState(false);
  const [isConcluded, setIsConcluded] = useState(false);

  // Discussion state
  const [messages, setMessages] = useState<GDMessage[]>([]);
  const [candidateInput, setCandidateInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Timer: 15 minutes (900s)
  const [secondsRemaining, setSecondsRemaining] = useState(900);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const timerRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Timer countdown
  useEffect(() => {
    if (!isDiscussionActive || isConcluded || isTimerPaused) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleConclude();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isDiscussionActive, isConcluded, isTimerPaused]);

  // Auto-scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleStartDiscussion = () => {
    setIsDiscussionActive(true);
    setIsConcluded(false);
    setSecondsRemaining(900);
    setIsTimerPaused(false);

    // Initial starter messages
    const initialMsgs: GDMessage[] = [
      {
        id: `starter_${Date.now()}`,
        speakerId: 'arjun',
        speakerName: 'Chest No. 12 (Arjun)',
        speakerType: 'confident',
        content: selectedTopic.starterPrompt,
        timestamp: new Date().toISOString(),
      },
      {
        id: `follow_${Date.now() + 1}`,
        speakerId: 'priya',
        speakerName: 'Chest No. 15 (Priya)',
        speakerType: 'analytical',
        content:
          'I would like to add that we must divide our analysis into three dimensions: operational efficacy, fiscal sustainability, and human resource morale.',
        timestamp: new Date().toISOString(),
      },
    ];

    setMessages(initialMsgs);
  };

  const handleSendContribution = async () => {
    const text = candidateInput.trim();
    if (!text || isAiThinking) return;

    const cadetMsg: GDMessage = {
      id: `cadet_${Date.now()}`,
      speakerId: user?.id || 'candidate',
      speakerName: `Chest No. 07 (You)`,
      speakerType: 'candidate',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...messages, cadetMsg];
    setMessages(nextHistory);
    setCandidateInput('');
    setIsAiThinking(true);

    try {
      const res = await getGDNextMessages(selectedTopic.title, nextHistory, text);
      const aiReplies = res.data || [];
      if (aiReplies.length > 0) {
        setMessages([...nextHistory, ...aiReplies]);
      } else {
        // Fallback natural reaction
        const fallbackMsg: GDMessage = {
          id: `ai_fallback_${Date.now()}`,
          speakerId: 'rohit',
          speakerName: 'Chest No. 18 (Rohit)',
          speakerType: 'aggressive',
          content: `I agree with Chest No. 07 to an extent, but we cannot ignore the immediate operational friction this causes on the ground.`,
          timestamp: new Date().toISOString(),
        };
        setMessages([...nextHistory, fallbackMsg]);
      }
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleConclude = () => {
    setIsConcluded(true);
    setIsDiscussionActive(false);

    // Log OLQ evidence from candidate participation
    const candidateMsgs = messages.filter((m) => m.speakerType === 'candidate');
    if (user && candidateMsgs.length > 0) {
      candidateMemoryService.addOLQEvidence(user.id, [
        {
          olqName: 'Ability to Influence the Group',
          level: candidateMsgs.length >= 3 ? 'positive_evidence' : 'developing',
          evidence: `Participated in simulated GD on "${selectedTopic.title}" with ${candidateMsgs.length} active contributions.`,
          source: 'GTO',
          sessionId: `gd_${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
        {
          olqName: 'Cooperation',
          level: 'positive_evidence',
          evidence: 'Engaged respectfully with divergent viewpoints from assertive and analytical peers.',
          source: 'GTO',
          sessionId: `gd_${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const candidateMessages = messages.filter((m) => m.speakerType === 'candidate');
  const avgWords =
    candidateMessages.length > 0
      ? Math.round(
          candidateMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0) /
            candidateMessages.length
        )
      : 0;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
            <Link to="/gto" className="hover:underline flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5 mr-0.5" />
              <span>GTO Tasks Hub</span>
            </Link>
            <span>•</span>
            <span>Virtual Group Discussion Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            GTO Group Discussion (GD) Multi-Agent Simulator
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Simulate a live 8-candidate GTO Group Discussion with autonomous AI peers exhibiting distinct personality archetypes.
          </p>
        </div>

        {/* Persona Legend */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700/80">
          {PERSONAS.map((p) => (
            <div
              key={p.name}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${p.bg} ${p.color}`}
            >
              {p.name.split(' ')[0]} ({p.desc.split(' ')[0]})
            </div>
          ))}
        </div>
      </div>

      {/* TOPIC SELECTION / SETUP */}
      {!isDiscussionActive && !isConcluded && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Users2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Select Group Discussion Topic</h2>
            <p className="text-xs text-slate-300 max-w-lg mx-auto">
              In Stage II, the GTO presents high-stakes strategic topics. You are expected to contribute logical arguments, demonstrate social adaptability, and avoid aggressive interruptions.
            </p>
          </div>

          <div className="space-y-2.5">
            {TOPICS.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTopic(t)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTopic.id === t.id
                    ? 'bg-military-800/80 border-amber-400 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-700 hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="text-sm font-bold">{t.title}</div>
                <div className="text-xs text-slate-400 mt-1 italic">
                  GTO Prompt: "{t.starterPrompt.slice(0, 100)}..."
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleStartDiscussion}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-sm flex items-center space-x-2 shadow-lg transition-transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Enter Virtual Group Discussion</span>
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE DISCUSSION INTERFACE */}
      {isDiscussionActive && !isConcluded && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[650px]">
          {/* Top Bar */}
          <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center space-x-2">
                <span className="text-amber-400">Topic:</span>
                <span className="line-clamp-1">{selectedTopic.title}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                You are <strong className="text-white">Chest No. 07</strong> • 4 AI group members active
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
              </div>

              <button
                onClick={handleConclude}
                className="px-3.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Conclude GD
              </button>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => {
              const isCadet = m.speakerType === 'candidate';
              const personaMatch = PERSONAS.find((p) => p.type === m.speakerType);

              return (
                <div key={m.id} className={`flex ${isCadet ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                      isCadet
                        ? 'bg-military-800 text-white rounded-br-xs border border-military-600'
                        : 'bg-slate-900 text-slate-200 rounded-bl-xs border-l-4 border-slate-700/80'
                    } ${
                      !isCadet && personaMatch?.type === 'aggressive'
                        ? 'border-l-rose-500'
                        : !isCadet && personaMatch?.type === 'analytical'
                        ? 'border-l-blue-500'
                        : !isCadet && personaMatch?.type === 'confident'
                        ? 'border-l-emerald-500'
                        : !isCadet
                        ? 'border-l-amber-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1 opacity-80">
                      <span className={personaMatch?.color || 'text-amber-300'}>{m.speakerName}</span>
                      {personaMatch && (
                        <span className="text-[10px] font-mono opacity-70">
                          {personaMatch.desc}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-line">{m.content}</p>
                  </div>
                </div>
              );
            })}

            {isAiThinking && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border-l-4 border-l-amber-400 border border-slate-700 rounded-2xl rounded-bl-xs p-4 flex items-center space-x-2 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Other candidates are reacting to your point...</span>
                </div>
              </div>
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={candidateInput}
                onChange={(e) => setCandidateInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendContribution()}
                placeholder="Make your point (e.g., 'Gentlemen, while Chest 15 made a valid point on costs, we must also consider...')"
                disabled={isAiThinking}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400"
              />
              <button
                onClick={handleSendContribution}
                disabled={!candidateInput.trim() || isAiThinking}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Speak</span>
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Aim for 3-4 structured, respectful contributions • Press Enter to speak</span>
              <span>Your Contributions: {candidateMessages.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* CONCLUDED EVALUATION DOSSIER */}
      {isConcluded && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-700 gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
                <Award className="w-4 h-4" />
                <span>GTO Assessment Report</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Group Discussion Dossier</h2>
              <p className="text-xs text-slate-400 mt-1">Topic: {selectedTopic.title}</p>
            </div>

            <button
              onClick={handleStartDiscussion}
              className="px-4 py-2 bg-military-700 hover:bg-military-600 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry This Topic</span>
            </button>
          </div>

          {/* Performance Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/60 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Times Contributed</div>
              <div className="text-2xl font-black text-amber-400">{candidateMessages.length}</div>
              <div className="text-[10px] text-slate-500">Target: 3-5 entries</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/60 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Average Depth</div>
              <div className="text-2xl font-black text-emerald-400">{avgWords} words</div>
              <div className="text-[10px] text-slate-500">Per intervention</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/60 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Group Cooperation</div>
              <div className="text-2xl font-black text-blue-400">
                {candidateMessages.length >= 3 ? 'Strong' : 'Moderate'}
              </div>
              <div className="text-[10px] text-slate-500">No aggression logged</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/60 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Influence Index</div>
              <div className="text-2xl font-black text-purple-400">
                {candidateMessages.length >= 4 ? 'High' : candidateMessages.length >= 2 ? 'Active' : 'Low'}
              </div>
              <div className="text-[10px] text-slate-500">Idea reception</div>
            </div>
          </div>

          {/* Key Observations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Assessor's Feedback & Key Takeaways
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {candidateMessages.length >= 3
                    ? 'Excellent participation cadence. You avoided monopolizing while stepping in with clear structural points when discussion fractured.'
                    : 'Participation was sparse. In the SSB GTO tasks, silent candidates cannot be assessed. Aim to initiate or build on points within the first 3 minutes.'}
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  {avgWords >= 25
                    ? 'Good substance per intervention. You supported claims with practical justifications rather than one-line slogans.'
                    : 'Responses tended to be brief. Try structuring each point: Acknowledge peer → State argument → Provide 1 concrete fact or example.'}
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Remember to address the group as a whole ('Friends / Gentlemen') rather than confronting individual candidates aggressively.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-military-900/60 border border-military-700/60 text-xs text-slate-300">
            Observations logged to your{' '}
            <Link to="/olq" className="text-amber-400 font-semibold underline">
              15 OLQ Dossier
            </Link>{' '}
            for Ability to Influence the Group and Cooperation.
          </div>
        </div>
      )}
    </div>
  );
};
export default GDSimulatorPage;