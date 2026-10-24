import React, { useState, useEffect } from 'react';
import { questionService } from '../../services/questionService';
import { Question } from '../../types';
import {
  Users2,
  Clock,
  Compass,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

export const GTOPage: React.FC = () => {
  const [gpeScenarios, setGpeScenarios] = useState<Question[]>([]);
  const [selectedGPE, setSelectedGPE] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState<'gpe' | 'gd'>('gpe');

  // Candidate Solution Inputs
  const [p1Solution, setP1Solution] = useState('');
  const [p2Solution, setP2Solution] = useState('');
  const [p3Solution, setP3Solution] = useState('');
  const [resourcesAllocated, setResourcesAllocated] = useState('');
  const [showModelSolution, setShowModelSolution] = useState(false);

  useEffect(() => {
    const loadGPE = async () => {
      try {
        const items = await questionService.getQuestionsByCategory('GTO', false);
        setGpeScenarios(items);
        if (items.length > 0) setSelectedGPE(items[0]);
      } catch (e) {
        console.error('Failed to load GTO items:', e);
      }
    };
    loadGPE();
  }, []);

  const gdTopics = [
    {
      title: 'Should Agnipath Scheme for Armed Forces Recruitment be Expanded or Modified?',
      perspectives: [
        'Economic & Modernization: Reduces ballooning military pension budget, freeing funds for advanced capital acquisition and fifth-gen fighter acquisitions.',
        'Regimental Cohesion & Training: 4-year tenure may affect operational bonding, institutional depth, and high-tech equipment mastery.',
        'Youth Demographics & Discipline: Returns disciplined, skilled young veterans into civil society and central armed police forces (CAPFs).'
      ]
    },
    {
      title: 'Theaterisation of Indian Armed Forces: Integration Challenges & Strategic Imperatives',
      perspectives: [
        'Joint Warfighting: Modern conflicts require joint synergy across Army, Navy, and Air Force under unified regional commanders.',
        'Asset Allocation: Concerns regarding Air Force air defense asset distribution across multiple geographical theaters.',
        'Geopolitical Preparedness: Critical for confronting two-front hybrid threats and maintaining maritime dominance in the Indian Ocean Region (IOR).'
      ]
    },
    {
      title: 'Role of Autonomous Drones & Artificial Intelligence in Modern Asymmetric Warfare',
      perspectives: [
        'Tactical Superiority: Precision loitering munitions and swarm drones dramatically lower personnel risk in border terrain.',
        'Counter-UAS Doctrine: Need for domestic soft-kill jamming and hard-kill laser interception systems along sensitive sectors.',
        'Indigenization vs Dependence: Accelerating Indian defense startups via iDEX (Innovations for Defence Excellence).'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
          <Users2 className="w-4 h-4" />
          <span>Stage II • Group Testing Officer Tasks</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          GTO Tasks & Group Planning Exercise
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-1.5 leading-relaxed">
          The GTO battery assesses social adaptability, group coordination, courage, and practical situational decision-making. Practice structured planning in the Group Planning Exercise (GPE) and multi-perspective thinking for Group Discussions (GD).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('gpe')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'gpe'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Group Planning Exercise (GPE)
        </button>
        <button
          onClick={() => setActiveTab('gd')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'gd'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Group Discussion (GD) Themes
        </button>
      </div>

      {/* TAB 1: GPE SCENARIO SOLVER */}
      {activeTab === 'gpe' && (
        <div className="space-y-6">
          {/* Scenario Selector */}
          <div className="flex flex-wrap gap-2">
            {gpeScenarios.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGPE(g);
                  setShowModelSolution(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  selectedGPE?.id === g.id
                    ? 'bg-military-800 border-amber-400 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {g.title}
              </button>
            ))}
          </div>

          {selectedGPE && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Scenario Narrative Card */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <span className="text-xs font-mono text-amber-400 uppercase font-semibold">
                    Live Planning Narrative
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>5m Reading • 10m Writing</span>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-white">{selectedGPE.title}</h2>
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedGPE.content}
                </div>

                {/* Tactical Tips */}
                <div className="p-3.5 rounded-xl bg-military-900/50 border border-military-700/50 text-xs text-slate-300 space-y-1.5">
                  <div className="font-semibold text-amber-400 flex items-center space-x-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span>Standard Problem Prioritization Hierarchy:</span>
                  </div>
                  <ol className="list-decimal list-inside text-slate-400 space-y-0.5">
                    <li><strong>Priority 1:</strong> Immediate threat to human life (Snake bite, approaching train, drowning).</li>
                    <li><strong>Priority 2:</strong> Significant danger to public property or law & order (Terrorist alert, forest fire).</li>
                    <li><strong>Priority 3:</strong> Minor problem or meeting regular schedule (Bicycle repair, rejoining group target).</li>
                  </ol>
                </div>
              </div>

              {/* Solution Worksheet */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <h3 className="font-bold text-white text-sm">Individual Solution Worksheet</h3>
                  <span className="text-xs text-slate-400 font-mono">Structured Format</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Priority 1: Immediate Life-Saving Action
                    </label>
                    <textarea
                      value={p1Solution}
                      onChange={(e) => setP1Solution(e.target.value)}
                      placeholder="Divide team: 2 cadets immediately rush snake-bite victim with first aid on bicycle to dispensary (2 km, 8 mins)..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Priority 2: Impending Catastrophe / Crime Interception
                    </label>
                    <textarea
                      value={p2Solution}
                      onChange={(e) => setP2Solution(e.target.value)}
                      placeholder="3 cadets use motorboat / police checkpost to signal approaching 1445 hrs train with red cloth and notify station master..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Priority 3 & Rejoining Target Time
                    </label>
                    <textarea
                      value={p3Solution}
                      onChange={(e) => setP3Solution(e.target.value)}
                      placeholder="Remaining members contact civil administration, rejoin at Rampur inspection bungalow by 1600 hrs..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModelSolution(!showModelSolution)}
                    className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <span>{showModelSolution ? 'Hide Model Strategy Framework' : 'Compare with Strategic Solution Framework'}</span>
                  </button>
                </div>

                {showModelSolution && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-2 text-xs leading-relaxed text-slate-300">
                    <div className="font-bold text-amber-400">Assessor Strategy Benchmark:</div>
                    <p>
                      <strong>1. Team Division:</strong> Do not tackle problems sequentially with all 8 members together. Form sub-teams: Sub-group A (2 members) for the immediate life threat; Sub-group B (3 members) for the train collision alert; Sub-group C (3 members) for telephone tower/security alert.
                    </p>
                    <p>
                      <strong>2. Distance & Time Calculations:</strong> A cycling speed is approx 15 km/h (1 km every 4 mins). Running speed is 10 km/h. State explicit timestamps (e.g. "Depart at 1405 hrs, reach checkpost by 1413 hrs").
                    </p>
                    <p>
                      <strong>3. Reassembly Plan:</strong> Always assign a rendezvous point and time where all subgroups rejoin to continue original mission.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GROUP DISCUSSION (GD) THEMES */}
      {activeTab === 'gd' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gdTopics.map((gd, idx) => (
            <div key={idx} className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-military-700 text-military-200 uppercase font-semibold">
                  Theme #{idx + 1}
                </span>
                <h3 className="text-base font-bold text-white leading-snug">{gd.title}</h3>

                <div className="space-y-2 pt-2 border-t border-slate-700 text-xs">
                  <span className="font-semibold text-amber-400">Key Analytical Angles:</span>
                  {gd.perspectives.map((p, pIdx) => (
                    <div key={pIdx} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-700/60 text-slate-300 leading-relaxed">
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 text-[11px] text-slate-400 italic">
                Tip: Enter the GD early, substantiate with facts, listen respectfully to fellow candidates, and help synthesize different perspectives without shouting.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
