import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { candidateMemoryService } from '../../services/candidateMemoryService';
import { getMentorResponse } from '../../services/aiService';
import { MentorMessage } from '../../types/ai';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Sparkles,
  Trash2,
  Loader2,
  ChevronDown,
  Minimize2,
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What should I practise today?',
  'What are my biggest improvement areas?',
  'Analyse my recent practice patterns',
  'How is my WAT performance?',
  'Generate interview questions from my PIQ',
  'What OLQs do I need to develop?',
];

export const AIMentorWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !hasLoaded && user) {
      const session = candidateMemoryService.getMentorSession(user.id);
      if (session.messages.length > 0) {
        setMessages(session.messages.slice(-20));
      } else {
        // Welcome message
        const welcome: MentorMessage = {
          id: 'welcome',
          role: 'mentor',
          content: `Jai Hind! I am your SSB Personal Mentor. I can help you with personalised preparation guidance based on your practice history and PIQ profile.\n\nAsk me anything about your preparation, what to practise today, or how to improve your weak areas.`,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcome]);
      }
      setHasLoaded(true);
    }
  }, [isOpen, user, hasLoaded]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (text?: string) => {
    const question = text || inputText.trim();
    if (!question || !user) return;

    setInputText('');
    const userMsg: MentorMessage = {
      id: `user_${Date.now()}`,
      role: 'candidate',
      content: question,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const context = candidateMemoryService.buildMentorContext(user.id);
      const result = await getMentorResponse(question, context);

      const mentorMsg: MentorMessage = {
        id: `mentor_${Date.now()}`,
        role: 'mentor',
        content: result.data || "I'm here to help with your SSB preparation. Could you rephrase your question?",
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, mentorMsg];
      setMessages(finalMessages);

      // Save to memory
      candidateMemoryService.addMentorMessage(user.id, userMsg);
      candidateMemoryService.addMentorMessage(user.id, mentorMsg);
    } catch (e) {
      const errMsg: MentorMessage = {
        id: `err_${Date.now()}`,
        role: 'mentor',
        content: "I'm unable to respond right now. Please try again or check your AI settings.",
        timestamp: new Date().toISOString(),
      };
      setMessages([...updatedMessages, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (!user) return;
    candidateMemoryService.clearMentorHistory(user.id);
    setMessages([]);
    setHasLoaded(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 shadow-2xl flex items-center justify-center transition-all hover:scale-110 group"
          title="SSB Personal Mentor"
        >
          <Bot className="w-7 h-7 text-white" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col transition-all ${
            isMinimized ? 'h-14' : 'h-[520px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0 rounded-t-2xl bg-slate-800/60">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span>SSB Personal Mentor</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-400">AI-powered • always available</div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
                title="Clear conversation history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                {isMinimized ? <ChevronDown className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'mentor' && (
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 mr-2">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] text-xs rounded-xl px-3 py-2.5 leading-relaxed ${
                        msg.role === 'candidate'
                          ? 'bg-military-700 text-white rounded-br-sm'
                          : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
                      }`}
                    >
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-1' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 mr-2">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl rounded-bl-sm px-3 py-2.5">
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions */}
              {messages.length <= 1 && (
                <div className="px-3 pb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:border-blue-500/50 hover:text-white transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-slate-800 shrink-0">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Ask your mentor anything..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputText.trim() || isLoading}
                    className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                  Powered by your practice data • Configure AI in settings
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
