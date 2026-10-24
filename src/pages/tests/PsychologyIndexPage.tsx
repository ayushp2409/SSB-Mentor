import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Clock, FileText, Image, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

export const PsychologyIndexPage: React.FC = () => {
  const modules = [
    {
      id: 'wat',
      name: 'Word Association Test (WAT)',
      stage: 'Stage II - Psychology',
      description: '60 words sequentially displayed for 15 seconds each. Evaluates spontaneous subconscious reactions, emotional equilibrium, and positive mindset.',
      items: '60 words',
      timing: '15 seconds / word (15 mins total)',
      format: 'Distraction-free auto-advancing simulator',
      link: '/psychology/wat',
      icon: MessageSquare,
      color: 'amber',
    },
    {
      id: 'tat',
      name: 'Thematic Apperception Test (TAT)',
      stage: 'Stage II - Psychology',
      description: '11 ambiguous picture slides + 1 blank slide. 30 seconds observation followed by 4 minutes story writing per slide covering past, present actions, and outcome.',
      items: '12 slides (11 pictures + 1 blank)',
      timing: '4m 30s / slide (~54 mins total)',
      format: 'Observation + guided story writing',
      link: '/psychology/tat',
      icon: Image,
      color: 'emerald',
    },
    {
      id: 'srt',
      name: 'Situation Reaction Test (SRT)',
      stage: 'Stage II - Psychology',
      description: '60 real-life practical situations presenting daily emergencies and moral dilemmas. Write rapid, effective, and complete actions within 30 minutes.',
      items: '60 situations',
      timing: '30 minutes continuous',
      format: 'Interactive response booklet with palette',
      link: '/psychology/srt',
      icon: FileText,
      color: 'sky',
    },
    {
      id: 'ppdt',
      name: 'Picture Perception & Description Test (PPDT)',
      stage: 'Stage I - Screening',
      description: 'The critical Day 1 screening test. 30s picture observation, 1m character box, 4m story writing, followed by individual narration and group discussion practice.',
      items: '1 picture prompt',
      timing: '6.5 minutes total',
      format: 'Box details + Story + Narration practice',
      link: '/psychology/ppdt',
      icon: Image,
      color: 'purple',
    },
    {
      id: 'sdt',
      name: 'Self-Description Test (SDT)',
      stage: 'Stage II - Psychology',
      description: 'Structured self-assessment across 5 paragraphs: Parents, Teachers/Superiors, Friends, Self-perception, and Qualities you wish to cultivate.',
      items: '5 paragraphs',
      timing: '15 minutes practice',
      format: 'Deep reflection master template',
      link: '/journal',
      icon: BrainCircuit,
      color: 'rose',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
          <BrainCircuit className="w-4 h-4" />
          <span>SSB Psychological Assessment Battery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Psychology Testing Center
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-1.5 leading-relaxed">
          The psychological series at the Services Selection Board accesses the candidate's subconscious personality patterns under calibrated time pressure. The tests reward genuine thoughts, proactive leadership, emotional stability, and social adaptability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className="bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-6 flex flex-col justify-between transition-all shadow-lg hover:shadow-xl group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 font-medium">
                    {m.stage}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    {m.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-400">Content:</span>{' '}
                    <strong className="text-slate-200">{m.items}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Pacing:</span>{' '}
                    <strong className="text-slate-200">{m.timing}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  to={m.link}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-military-600 hover:bg-military-500 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  <span>Launch Simulator</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
