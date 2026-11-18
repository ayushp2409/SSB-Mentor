import React, { useState } from 'react';
import { getKnowledgeMentorResponse } from '../../services/aiService';
import {
  Globe,
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Shield,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const DEFENCE_QUIZ: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the motto of the Indian Army?",
    options: ["Touch the Sky with Glory", "Service Before Self", "May the Lord of the Waters be auspicious unto us", "Valour and Wisdom"],
    correctAnswer: 1,
    explanation: "'Service Before Self' (Seva Paramo Dharma) is the motto of the Indian Army. 'Touch the Sky with Glory' is IAF, and 'Sam No Varunah' is the Indian Navy.",
  },
  {
    id: 2,
    question: "Which is India's first indigenously designed and built aircraft carrier?",
    options: ["INS Vikramaditya", "INS Viraat", "INS Vikrant (IAC-1)", "INS Vishal"],
    correctAnswer: 2,
    explanation: "INS Vikrant (IAC-1) was constructed by Cochin Shipyard Limited and commissioned into the Indian Navy in September 2022.",
  },
  {
    id: 3,
    question: "Exercise 'Malabar' is a multilateral naval exercise conducted between which nations?",
    options: ["India, Russia, China", "India, USA, Japan, Australia (Quad)", "India, France, UK", "India, Singapore, Thailand"],
    correctAnswer: 1,
    explanation: "Exercise Malabar began as a bilateral India-US exercise in 1992 and now includes all four Quad partners: India, United States, Japan, and Australia.",
  },
  {
    id: 4,
    question: "Who was the first Chief of Defence Staff (CDS) of the Indian Armed Forces?",
    options: ["General Manoj Mukund Naravane", "General Bipin Rawat", "General Anil Chauhan", "Air Chief Marshal B.S. Dhanoa"],
    correctAnswer: 1,
    explanation: "General Bipin Rawat was appointed as India's first Chief of Defence Staff on 1 January 2020, serving until his tragic demise in December 2021.",
  },
  {
    id: 5,
    question: "Which supersonic cruise missile was developed as a joint venture between India and Russia?",
    options: ["Nirbhay", "BrahMos", "Astra", "Nag"],
    correctAnswer: 1,
    explanation: "BrahMos is named after the Brahmaputra and Moskva rivers, developed by BrahMos Aerospace, a joint venture between DRDO and NPO Mashinostroyeniya.",
  },
  {
    id: 6,
    question: "How many operational commands does the Indian Army currently have?",
    options: ["5", "6 operational + 1 training (7 total)", "4", "3"],
    correctAnswer: 1,
    explanation: "The Indian Army has 6 operational commands (Northern, Western, Eastern, Southern, Central, South Western) and 1 training command (ARTRAC in Shimla).",
  },
  {
    id: 7,
    question: "The 'Agnipath' recruitment scheme involves service for what duration for Agniveers?",
    options: ["3 years", "4 years", "5 years", "7 years"],
    correctAnswer: 1,
    explanation: "Under the Agnipath scheme launched in June 2022, Agniveers serve for 4 years, after which up to 25% are enrolled in regular cadre.",
  },
  {
    id: 8,
    question: "Where is the Indian Military Academy (IMA) located?",
    options: ["Khadakwasla, Pune", "Dehradun, Uttarakhand", "Dundigal, Hyderabad", "Ezhimala, Kerala"],
    correctAnswer: 1,
    explanation: "The IMA is located in Dehradun, Uttarakhand. NDA is at Khadakwasla, Air Force Academy is at Dundigal, and Indian Naval Academy is at Ezhimala.",
  },
  {
    id: 9,
    question: "What is the highest wartime gallantry award in India?",
    options: ["Maha Vir Chakra", "Param Vir Chakra", "Ashoka Chakra", "Kirti Chakra"],
    correctAnswer: 1,
    explanation: "Param Vir Chakra (PVC) is the highest wartime gallantry decoration. Ashoka Chakra is the highest peacetime equivalent.",
  },
  {
    id: 10,
    question: "The Light Combat Helicopter (LCH) developed by HAL is officially named:",
    options: ["Prachand", "Rudra", "Dhruv", "Tejas"],
    correctAnswer: 0,
    explanation: "HAL's Light Combat Helicopter was formally named 'Prachand' upon its induction into the Indian Air Force and Army Aviation Corps in October 2022.",
  },
];

export const KnowledgePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mentor' | 'briefing' | 'quiz'>('mentor');

  // Conversational AI Assistant State
  const [messages, setMessages] = useState<Array<{ role: 'mentor' | 'candidate'; content: string }>>([
    {
      role: 'mentor',
      content: "Jai Hind, Cadet! I am your Defence & Current Affairs Mentor. Ask me any conceptual question on the Indian Armed Forces, national security, border theaters, military hardware, joint exercises, or geopolitical developments.",
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  const suggestionChips = [
    'Explain the Agnipath scheme & its rationale',
    'What are Joint Theatre Commands in the Indian Armed Forces?',
    'What is the current status of the border at the LAC?',
    'Explain the role of the Chief of Defence Staff (CDS)',
    'Important Indian bilateral military exercises in 2023-2024',
    'What are India\'s key aircraft carriers and nuclear submarines?',
    'Tell me about the AMCA 5th-generation fighter program',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputQuestion.trim();
    if (!q || isLoading) return;

    setInputQuestion('');
    const userMsg = { role: 'candidate' as const, content: q };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setIsLoading(true);

    try {
      const res = await getKnowledgeMentorResponse(q, nextHistory);
      const reply = res.data || 'Could not retrieve information for this query. Please try rephrasing.';
      setMessages([...nextHistory, { role: 'mentor' as const, content: reply }]);
    } catch (err) {
      setMessages([
        ...nextHistory,
        { role: 'mentor' as const, content: 'Error contacting knowledge engine. Please check your AI configuration.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === DEFENCE_QUIZ[quizIndex].correctAnswer) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex < DEFENCE_QUIZ.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setQuizIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setIsQuizCompleted(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
            <Globe className="w-4 h-4" />
            <span>General Awareness • Defence & Geopolitics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Defence Knowledge & Current Affairs Mentor
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Master national security concepts, military doctrine, international relations, and historical campaigns essential for SSB interviews and GDs.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab('mentor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'mentor'
                ? 'bg-military-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Knowledge Assistant</span>
          </button>
          <button
            onClick={() => setActiveTab('briefing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'briefing'
                ? 'bg-military-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Core Defence Briefing</span>
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'quiz'
                ? 'bg-military-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive Quiz</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Conversational AI Knowledge Assistant */}
      {activeTab === 'mentor' && (
        <div className="space-y-4">
          {/* Suggestion Chips */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-400">Frequently Discussed SSB Topics:</div>
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700/80 transition-all text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Container */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[560px]">
            {/* Feed */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m, i) => {
                const isCadet = m.role === 'candidate';
                return (
                  <div key={i} className={`flex ${isCadet ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                        isCadet
                          ? 'bg-military-800 text-white rounded-br-xs border border-military-600/60'
                          : 'bg-slate-900 text-slate-200 rounded-bl-xs border-l-4 border-l-blue-400 border-slate-700/80'
                      }`}
                    >
                      <div className="text-[10px] font-semibold text-slate-400 mb-1">
                        {isCadet ? 'You (Cadet)' : 'Defence Knowledge Mentor'}
                      </div>
                      <p className="whitespace-pre-line">{m.content}</p>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border-l-4 border-l-blue-400 border border-slate-700 rounded-2xl rounded-bl-xs p-4 flex items-center space-x-2 text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Consulting verified defence repository & formulating response...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Ask about theatre commands, Rafale, border treaties, military history..."
                disabled={isLoading}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-400"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputQuestion.trim() || isLoading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Core Defence Briefing */}
      {activeTab === 'briefing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <h3>Integrated Theatre Commands (ITC)</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                India is shifting from individual service commands (17 single-service commands) toward unified, joint theatre commands. Under the proposed model, all assets of Army, Navy, and Air Force in a geographical theatre will report to a single Theatre Commander.
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Northern Theatre Command (facing China, HQ likely Lucknow/Udhampur)</li>
                <li>Western Theatre Command (facing Pakistan, HQ likely Jaipur)</li>
                <li>Maritime Theatre Command (IOR dominance, HQ likely Karwar)</li>
                <li>Air Defence Command & Logistics Joint Command</li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                <Globe className="w-4 h-4" />
                <h3>Major Bilateral & Multilateral Exercises</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                  <strong className="text-slate-200">Malabar:</strong> India, USA, Japan, Australia
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                  <strong className="text-slate-200">Yudh Abhyas:</strong> India & USA (Army)
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                  <strong className="text-slate-200">Varuna / Shakti:</strong> India & France
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                  <strong className="text-slate-200">Surya Kiran:</strong> India & Nepal (Infantry)
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                  <strong className="text-slate-200">Indra:</strong> India & Russia (Tri-service)
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                  <strong className="text-slate-200">Mitra Shakti:</strong> India & Sri Lanka
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <h3>Indigenous Hardware (Make in India / Atmanirbhar)</h3>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li><strong className="text-white">LCA Tejas Mk1A & Mk2:</strong> Indigenous 4.5 generation multi-role supersonic fighter aircraft.</li>
                <li><strong className="text-white">INS Vikrant (IAC-1):</strong> 45,000-tonne indigenous aircraft carrier built at Cochin Shipyard.</li>
                <li><strong className="text-white">Arihant-Class SSBN:</strong> India's nuclear-powered ballistic missile submarines completing the nuclear triad.</li>
                <li><strong className="text-white">Prachand LCH & Rudra:</strong> High-altitude combat helicopters engineered for Siachen operations.</li>
                <li><strong className="text-white">Pinaka MBRL:</strong> Multi-barrel rocket launch system with indigenous guided extended ranges.</li>
              </ul>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
                <BookOpen className="w-4 h-4" />
                <h3>Strategic Border Theaters & Geopolitics</h3>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li><strong className="text-white">Line of Actual Control (LAC):</strong> Divided into Western (Ladakh), Middle (Himachal/Uttarakhand), and Eastern (Sikkim/Arunachal) sectors.</li>
                <li><strong className="text-white">Siliguri Corridor ("Chicken's Neck"):</strong> Narrow 22km strip connecting mainland India to North-Eastern states, safeguarded by Tri-Service posture.</li>
                <li><strong className="text-white">Quad Initiative:</strong> Diplomatic & security framework between India, USA, Japan, Australia ensuring a Free and Open Indo-Pacific (FOIP).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Interactive Defence Quiz */}
      {activeTab === 'quiz' && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl max-w-3xl mx-auto space-y-6">
          {!isQuizCompleted ? (
            <>
              {/* Quiz Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-military-800 text-amber-400">
                    Question {quizIndex + 1} of {DEFENCE_QUIZ.length}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Current Score: <strong className="text-emerald-400">{quizScore}</strong>
                </div>
              </div>

              {/* Question */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white leading-snug">
                  {DEFENCE_QUIZ[quizIndex].question}
                </h3>

                {/* Options */}
                <div className="space-y-2.5">
                  {DEFENCE_QUIZ[quizIndex].options.map((option, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isCorrect = optIdx === DEFENCE_QUIZ[quizIndex].correctAnswer;

                    let btnClass = 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-200';
                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        btnClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold';
                      } else if (isSelected) {
                        btnClass = 'bg-rose-500/20 border-rose-500 text-rose-300';
                      }
                    } else if (isSelected) {
                      btnClass = 'bg-military-800 border-amber-400 text-white shadow-xs';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        disabled={isAnswerSubmitted}
                        className={`w-full p-3.5 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${btnClass}`}
                      >
                        <span>{option}</span>
                        {isAnswerSubmitted && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {isAnswerSubmitted && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation upon submission */}
              {isAnswerSubmitted && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 leading-relaxed space-y-1">
                  <div className="font-bold text-amber-400 flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Fact Explanation</span>
                  </div>
                  <p>{DEFENCE_QUIZ[quizIndex].explanation}</p>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex justify-end pt-2">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="px-5 py-2.5 bg-military-600 hover:bg-military-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Confirm Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizQuestion}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
                  >
                    <span>{quizIndex < DEFENCE_QUIZ.length - 1 ? 'Next Question' : 'Complete Quiz'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Quiz Completed View */
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Quiz Completed!</h3>
                <p className="text-xs text-slate-400 mt-1">Review your final assessment score</p>
              </div>

              <div className="text-5xl font-black text-amber-400">
                {quizScore} <span className="text-2xl text-slate-400">/ {DEFENCE_QUIZ.length}</span>
              </div>

              <p className="text-sm text-slate-300 max-w-md mx-auto">
                {quizScore >= 8
                  ? 'Outstanding defence awareness! Your conceptual depth on forces doctrine and hardware will serve you well in CIQ interviews.'
                  : quizScore >= 5
                  ? 'Good foundation. Review the Core Defence Briefing tab to solidify your grasp of military structures and joint commands.'
                  : 'Requires regular revision. Spend 15 minutes daily exploring defence updates and current bilateral exercises.'}
              </p>

              <button
                onClick={handleRestartQuiz}
                className="px-6 py-2.5 bg-military-700 hover:bg-military-600 text-white font-bold text-xs rounded-xl inline-flex items-center space-x-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Quiz</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default KnowledgePage;