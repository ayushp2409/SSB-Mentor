import React, { useState, useEffect, useRef } from 'react';
import { questionService } from '../../services/questionService';
import { Question } from '../../types';
import {
  Mic,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  Award,
  Search,
  CheckCircle2,
  Square,
  AlertCircle
} from 'lucide-react';

export const LecturettePage: React.FC = () => {
  const [topics, setTopics] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Practice Session State
  const [activeCard, setActiveCard] = useState<Question[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Question | null>(null);
  const [sessionPhase, setSessionPhase] = useState<'selection' | 'preparation' | 'speaking' | 'review'>('selection');
  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const [prepNotes, setPrepNotes] = useState('');

  // Self Evaluation Rubric
  const [scoreIntro, setScoreIntro] = useState(4);
  const [scoreContent, setScoreContent] = useState(4);
  const [scoreFluency, setScoreFluency] = useState(3);
  const [scoreConclusion, setScoreConclusion] = useState(4);

  // Audio Recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const loadLecturetteTopics = async () => {
      try {
        const items = await questionService.getQuestionsByCategory('LECTURETTE', false);
        setTopics(items);
        generateCard(items);
      } catch (e) {
        console.error('Failed to load lecturette topics:', e);
      } finally {
        setLoading(false);
      }
    };
    loadLecturetteTopics();
  }, []);

  const generateCard = (allTopics: Question[]) => {
    if (allTopics.length < 4) return;
    const shuffled = [...allTopics].sort(() => 0.5 - Math.random());
    const card = shuffled.slice(0, 4);
    setActiveCard(card);
    setSelectedTopic(card[0]);
    setSessionPhase('selection');
    setPrepNotes('');
    setAudioUrl(null);
  };

  // Timer effect
  useEffect(() => {
    if (sessionPhase !== 'preparation' && sessionPhase !== 'speaking') return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (sessionPhase === 'preparation') {
            setSessionPhase('speaking');
            return 180; // 3 minutes speaking
          } else {
            if (isRecording) stopRecording();
            setSessionPhase('review');
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [sessionPhase, isRecording]);

  const handleStartPrep = () => {
    if (!selectedTopic) return;
    setSessionPhase('preparation');
    setSecondsRemaining(180); // 3 minutes preparation
  };

  const handleStartSpeakingNow = () => {
    clearInterval(timerRef.current);
    setSessionPhase('speaking');
    setSecondsRemaining(180); // 3 minutes speaking
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (e) {
      alert('Microphone permission required for audio recording.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTimer = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const filteredTopics = topics.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
          <Mic className="w-4 h-4" />
          <span>GTO Battery • Communication & Confidence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Lecturette Simulator & Topic Bank
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-1.5 leading-relaxed">
          In the Lecturette task, the GTO gives each candidate a card with 4 topics. You have 3 minutes to choose a topic and prepare your thoughts, followed by exactly 3 minutes to deliver an uninterrupted speech to your group.
        </p>
      </div>

      {/* Main Grid: Interactive Card Simulator (Left) + Searchable Topic Bank (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 4-Topic Card Simulator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
                  Official SSB Card Format
                </span>
                <h2 className="text-lg font-bold text-white">4-Topic Lecturette Card</h2>
              </div>

              {sessionPhase !== 'selection' && (
                <div className="flex items-center space-x-2 font-mono text-xl font-bold text-white bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-700">
                  <Clock className={`w-5 h-5 ${secondsRemaining <= 30 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                  <span>{formattedTimer}</span>
                </div>
              )}
            </div>

            {/* PHASE 1: TOPIC SELECTION */}
            {sessionPhase === 'selection' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Select 1 topic from the card below. You will get 3 minutes to prepare your outline:
                </p>

                <div className="space-y-2.5">
                  {activeCard.map((item, idx) => {
                    const isSelected = selectedTopic?.id === item.id;
                    const levels = ['High Level (Geopolitics / Strategic)', 'Medium Level 1 (National Issue)', 'Medium Level 2 (Social / Tech)', 'General (Simple Everyday Theme)'];
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedTopic(item)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                          isSelected
                            ? 'bg-military-800/90 border-amber-400 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-semibold uppercase text-amber-400">
                            Topic {idx + 1}: {levels[idx]}
                          </span>
                          <div className="font-bold text-sm sm:text-base">{item.title}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => generateCard(topics)}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Shuffle New Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartPrep}
                    disabled={!selectedTopic}
                    className="px-6 py-2.5 rounded-xl bg-military-600 hover:bg-military-500 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-2 shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start 3-Minute Preparation</span>
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 2: PREPARATION */}
            {sessionPhase === 'preparation' && (
              <div className="space-y-4">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                  <span className="text-xs text-amber-400 font-mono font-semibold uppercase">Selected Topic:</span>
                  <div className="text-lg font-bold text-white mt-0.5">{selectedTopic?.title}</div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Jot Down Bullet Points & Speech Structure (Scratchpad):
                  </label>
                  <textarea
                    value={prepNotes}
                    onChange={(e) => setPrepNotes(e.target.value)}
                    placeholder="1. Introduction (Define topic & background)&#10;2. Current Importance & Initiatives&#10;3. Key Challenges & Counter-arguments&#10;4. Constructive Conclusion & Way Forward..."
                    rows={8}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400">
                    Auto-advancing to speaking phase when timer hits zero.
                  </span>
                  <button
                    type="button"
                    onClick={handleStartSpeakingNow}
                    className="px-4 py-2 rounded-xl bg-military-600 hover:bg-military-500 text-white text-xs font-bold flex items-center space-x-1.5"
                  >
                    <span>Ready to Speak Now &rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 3: SPEAKING */}
            {sessionPhase === 'speaking' && (
              <div className="space-y-6 text-center py-4">
                <div className="space-y-2">
                  <span className="text-xs uppercase font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 animate-pulse">
                    Speaking Phase Active
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{selectedTopic?.title}</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Speak clearly at an even tempo. Maintain eye contact with the full group arc. Do not look down or address the GTO.
                  </p>
                </div>

                {/* Audio Recording Controls */}
                <div className="flex justify-center space-x-3">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-2"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Record Speech for Self-Review</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-2 animate-pulse"
                    >
                      <Square className="w-4 h-4" />
                      <span>Stop Recording</span>
                    </button>
                  )}
                </div>

                {audioUrl && (
                  <div className="pt-2">
                    <audio src={audioUrl} controls className="mx-auto" />
                  </div>
                )}

                {prepNotes && (
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-left max-w-lg mx-auto">
                    <div className="text-[11px] font-mono text-slate-400 mb-1">Your Prep Notes:</div>
                    <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans">{prepNotes}</pre>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-700 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (isRecording) stopRecording();
                      setSessionPhase('review');
                    }}
                    className="px-4 py-2 rounded-xl bg-military-600 hover:bg-military-500 text-white text-xs font-bold"
                  >
                    Finish Speech & Complete Rubric &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 4: POST-SPEECH REVIEW */}
            {sessionPhase === 'review' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
                  <Award className="w-7 h-7 text-amber-400" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Lecturette Delivery Scorecard</h3>
                    <p className="text-xs text-slate-400">Self-evaluate your structure, content depth, and stage presence</p>
                  </div>
                </div>

                {audioUrl && (
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2">
                    <span className="text-xs font-semibold text-slate-300">Speech Playback:</span>
                    <audio src={audioUrl} controls className="w-full" />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-300">Introduction & Definition:</span>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setScoreIntro(s)}
                          className={`w-7 h-7 rounded font-bold ${scoreIntro === s ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-300">Content Depth & Facts:</span>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setScoreContent(s)}
                          className={`w-7 h-7 rounded font-bold ${scoreContent === s ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-300">Fluency & Body Language:</span>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setScoreFluency(s)}
                          className={`w-7 h-7 rounded font-bold ${scoreFluency === s ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-300">Conclusion & Vision:</span>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setScoreConclusion(s)}
                          className={`w-7 h-7 rounded font-bold ${scoreConclusion === s ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => generateCard(topics)}
                    className="px-5 py-2.5 rounded-xl bg-military-600 hover:bg-military-500 text-white text-xs font-bold"
                  >
                    Practice Another Topic &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Searchable Lecturette Topic Bank */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Curated Topic Bank</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{topics.length} Topics</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search defense, geo, tech topics..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredTopics.slice(0, 20).map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1 hover:border-slate-500 transition-colors"
              >
                <div className="font-bold text-xs text-white">{t.title}</div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {t.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
