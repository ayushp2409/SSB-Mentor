import React, { useState, useEffect } from 'react';
import { questionService } from '../../services/questionService';
import { Question } from '../../types';
import {
  FileQuestion,
  UserCheck,
  BookOpen,
  Award,
  Sparkles,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const InterviewPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubcat, setSelectedSubcat] = useState<string>('ALL');
  const [personalAnswers, setPersonalAnswers] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadInterviewData = async () => {
      try {
        const items = await questionService.getQuestionsByCategory('INTERVIEW', false);
        setQuestions(items);
        if (items.length > 0) setExpandedId(items[0].id);

        // Load saved answers from localStorage
        const saved = localStorage.getItem('ssb_mentor_interview_answers');
        if (saved) setPersonalAnswers(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load interview questions:', e);
      }
    };
    loadInterviewData();
  }, []);

  const handleSaveAnswer = (qId: string) => {
    localStorage.setItem('ssb_mentor_interview_answers', JSON.stringify(personalAnswers));
    setSaveStatus(qId);
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const categories = [
    { id: 'ALL', label: 'All Questions' },
    { id: 'CIQ_1_EDUCATION', label: 'CIQ 1: Education & Academics' },
    { id: 'CIQ_2_FAMILY', label: 'CIQ 2: Family & Routine' },
    { id: 'CIQ_3_FRIENDS', label: 'CIQ 3: Friends & Social' },
    { id: 'CIQ_4_MOTIVATION', label: 'Armed Forces Motivation' },
    { id: 'TECHNICAL_DEFENSE', label: 'Defense & Technical' },
  ];

  const filteredQuestions = selectedSubcat === 'ALL'
    ? questions
    : questions.filter((q) => q.subcategory === selectedSubcat);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
          <FileQuestion className="w-4 h-4" />
          <span>Stage II • Personal Interview & CIQ Series</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Personal Interview & Comprehensive Information Questionnaire
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-1.5 leading-relaxed">
          The Interviewing Officer (IO) tests your self-awareness, personal integrity, values, and depth of experiences through rapid Comprehensive Information Questionnaires (CIQs). Build genuine personal examples based on your own life history.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedSubcat(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedSubcat === c.id
                ? 'bg-military-800 border-amber-400 text-white shadow-xs'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Question Accordion */}
      <div className="space-y-4">
        {filteredQuestions.map((q) => {
          const isExpanded = expandedId === q.id;
          const currentAnswer = personalAnswers[q.id] || '';
          return (
            <div
              key={q.id}
              className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl transition-all"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-military-800 text-amber-400 font-semibold uppercase">
                      {q.subcategory}
                    </span>
                    {currentAnswer.trim().length > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                        Answer Prepared
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">{q.title}</h3>
                </div>

                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-white"
                  aria-label="Toggle details"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-700/80 space-y-4 bg-slate-900/50">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-200 leading-relaxed">
                    <strong className="text-amber-400 block text-xs font-semibold uppercase tracking-wider mb-1">
                      Assessor Rapid Fire Prompt:
                    </strong>
                    {q.content}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Your Genuine Answer & Life Incidents (Draft your thoughts):
                    </label>
                    <textarea
                      value={currentAnswer}
                      onChange={(e) =>
                        setPersonalAnswers({ ...personalAnswers, [q.id]: e.target.value })
                      }
                      placeholder="Record your genuine personal experiences, specific dates, teacher names, sports events, or exact reasons without making up false stories..."
                      rows={6}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400">
                      Private: Never shared with other candidates.
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSaveAnswer(q.id)}
                      className="px-4 py-2 rounded-xl bg-military-600 hover:bg-military-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saveStatus === q.id ? 'Saved Successfully!' : 'Save Personal Answer'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
