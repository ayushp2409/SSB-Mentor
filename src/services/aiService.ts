// ============================================================
// SSB MENTOR – CENTRAL AI SERVICE
// Provider abstraction: Gemini API → OpenAI API → Heuristic
// All client-side. No server required. Works on GitHub Pages.
// ============================================================

import {
  AIProvider,
  AIConfig,
  AIResponse,
  TATEvaluation,
  WATBatchEvaluation,
  WATResponseAnalysis,
  SRTBatchEvaluation,
  SRTResponseAnalysis,
  InterviewEvaluation,
  InterviewMessage,
  GDEvaluation,
  GDMessage,
  LecturetteAIAnalysis,
  OLQName,
  OLQEvidenceLevel,
} from '../types/ai';
import { PIQProfile } from '../types/ai';

// ─── Storage keys ─────────────────────────────────────────────
const AI_CONFIG_KEY = 'ssb_mentor_ai_config';

// ─── Load / Save Config ───────────────────────────────────────
export function getAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (raw) return JSON.parse(raw) as AIConfig;
  } catch {}
  return { provider: 'heuristic' };
}

export function saveAIConfig(config: AIConfig): void {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
}

export function getActiveProvider(): AIProvider {
  const config = getAIConfig();
  if (config.geminiApiKey && config.geminiApiKey.length > 10) return 'gemini';
  if (config.openaiApiKey && config.openaiApiKey.length > 10) return 'openai';
  return 'heuristic';
}

// ─── Gemini REST API call ─────────────────────────────────────
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model = 'gemini-2.0-flash'
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }
  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}

// ─── OpenAI REST API call ─────────────────────────────────────
async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model = 'gpt-4o-mini'
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content || '{}';
}

// ─── Generic AI call dispatcher ───────────────────────────────
async function callAI(systemPrompt: string, userPrompt: string): Promise<{ text: string; provider: AIProvider }> {
  const config = getAIConfig();

  if (config.geminiApiKey && config.geminiApiKey.length > 10) {
    try {
      const text = await callGemini(systemPrompt, userPrompt, config.geminiApiKey);
      return { text, provider: 'gemini' };
    } catch (e) {
      console.warn('Gemini failed, falling back to heuristic:', e);
    }
  }

  if (config.openaiApiKey && config.openaiApiKey.length > 10) {
    try {
      const text = await callOpenAI(systemPrompt, userPrompt, config.openaiApiKey);
      return { text, provider: 'openai' };
    } catch (e) {
      console.warn('OpenAI failed, falling back to heuristic:', e);
    }
  }

  return { text: '', provider: 'heuristic' };
}

// ─── Safe JSON parse ──────────────────────────────────────────
function safeJSON<T>(text: string, fallback: T): T {
  try {
    // extract first JSON object from response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
  } catch {}
  return fallback;
}

// ─── SYSTEM PROMPTS ───────────────────────────────────────────
const SSB_CONTEXT = `You are an expert SSB (Services Selection Board) assessor and psychologist with 20+ years of experience evaluating officer candidates in the Indian Armed Forces. You understand all 15 Officer Like Qualities (OLQs), psychological testing methodology, and the standard SSB assessment process. Always provide constructive, honest, and actionable feedback. Never claim to officially predict SSB selection. Use labels like "positive practice evidence", "developing", "needs further practice", "insufficient evidence" for OLQs. Always return valid JSON.`;

// ─── TAT EVALUATOR ───────────────────────────────────────────
const TAT_SYSTEM = SSB_CONTEXT + `
You evaluate TAT (Thematic Apperception Test) stories written by SSB candidates. 
Analyze stories for: central character identification, situation understanding, objective clarity, planning, initiative, practicality, decision-making, resource utilization, teamwork, realistic conclusions.
Return JSON with keys: summary, strengths (array), improvementAreas (array), missingElements (object with booleans: planning, initiative, teamwork, resourceUse, realisticConclusion), microActions (array of specific concrete actions), improvedIllustrativeVersion (string), olqEvidence (array of {olq, evidence, level}), practiceRecommendations (array), evidenceConfidence ("low"|"moderate"|"high").`;

export async function evaluateTATStory(
  storyText: string,
  imageRef: string,
  piq?: Partial<PIQProfile>
): Promise<AIResponse<TATEvaluation>> {
  const userPrompt = `Evaluate this TAT story written for image ${imageRef}:

STORY:
"${storyText}"

${piq?.name ? `Candidate: ${piq.name}, ${piq.age} years, ${piq.targetEntry} aspirant.` : ''}

Identify all vague or missing actions. For the microActions field, list at least 5-8 specific, practical actions the character COULD have taken but didn't mention (e.g., "Consulted teammates about their strengths", "Created a task division list"). Generate an improved illustrative version showing these actions in a natural story. Return JSON.`;

  const { text, provider } = await callAI(TAT_SYSTEM, userPrompt);

  const disclaimer =
    'This evaluation is an AI-assisted practice tool. It does not predict official SSB assessment outcomes. OLQ observations are practice indicators only.';

  if (provider === 'heuristic' || !text) {
    return {
      success: true,
      provider: 'heuristic',
      usedFallback: true,
      data: heuristicTATEvaluation(storyText, imageRef, disclaimer),
    };
  }

  const parsed = safeJSON<Partial<TATEvaluation>>(text, {});
  if (!parsed.summary) {
    return {
      success: true,
      provider,
      usedFallback: true,
      data: heuristicTATEvaluation(storyText, imageRef, disclaimer),
    };
  }

  return {
    success: true,
    provider,
    usedFallback: false,
    data: {
      storyText,
      imageRef,
      summary: parsed.summary || '',
      strengths: parsed.strengths || [],
      improvementAreas: parsed.improvementAreas || [],
      missingElements: parsed.missingElements || {
        planning: false,
        initiative: false,
        teamwork: false,
        resourceUse: false,
        realisticConclusion: false,
      },
      microActions: parsed.microActions || [],
      improvedIllustrativeVersion: parsed.improvedIllustrativeVersion || '',
      olqEvidence: parsed.olqEvidence || [],
      practiceRecommendations: parsed.practiceRecommendations || [],
      evidenceConfidence: parsed.evidenceConfidence || 'moderate',
      disclaimer,
      evaluatedAt: new Date().toISOString(),
    },
  };
}

// ─── WAT EVALUATOR ───────────────────────────────────────────
const WAT_SYSTEM = SSB_CONTEXT + `
You evaluate WAT (Word Association Test) responses. For each word-response pair, assess relevance, clarity, constructiveness, and whether the response seems memorized/clichéd vs natural. Return JSON with key "responses" (array of objects with: word, response, relevance, clarity, constructiveness, isCliché, clicheNote, alternativeSuggestion), "overallThemes" (array), "positivePatterns" (array), "repetitivePatterns" (array), "genericResponsesCount" (number), "olqEvidence" (array of {olq, evidence, level}), "overallFeedback" (string), "practiceRecommendations" (array).`;

export async function evaluateWATBatch(
  responses: Array<{ word: string; response: string }>
): Promise<AIResponse<WATBatchEvaluation>> {
  const userPrompt = `Evaluate these ${responses.length} WAT responses. Identify clichés and patterns:

${responses.slice(0, 40).map((r, i) => `${i + 1}. Word: "${r.word}" → Response: "${r.response}"`).join('\n')}

For clichéd responses (like "He helped the team", "She served the nation"), note them and suggest more natural alternatives. Return JSON.`;

  const { text, provider } = await callAI(WAT_SYSTEM, userPrompt);

  if (provider === 'heuristic' || !text) {
    return {
      success: true,
      provider: 'heuristic',
      usedFallback: true,
      data: heuristicWATEvaluation(responses),
    };
  }

  const parsed = safeJSON<Partial<WATBatchEvaluation>>(text, {});
  return {
    success: true,
    provider,
    usedFallback: false,
    data: {
      totalResponses: responses.length,
      analyzedResponses: (parsed.analyzedResponses || parsed as any).responses || heuristicWATAnalyzeResponses(responses),
      overallThemes: parsed.overallThemes || [],
      positivePatterns: parsed.positivePatterns || [],
      repetitivePatterns: parsed.repetitivePatterns || [],
      genericResponsesCount: parsed.genericResponsesCount || 0,
      olqEvidence: parsed.olqEvidence || [],
      overallFeedback: parsed.overallFeedback || '',
      practiceRecommendations: parsed.practiceRecommendations || [],
      evaluatedAt: new Date().toISOString(),
    },
  };
}

// ─── SRT EVALUATOR ───────────────────────────────────────────
const SRT_SYSTEM = SSB_CONTEXT + `
You evaluate SRT (Situation Reaction Test) responses. For each situation-response pair, assess practicality, initiative, responsibility, decision quality, and safety awareness. Return JSON with key "responses" (array of {situation, response, practicality, initiative, responsibility, decisionQuality, safetyAwareness, explanation, improvedResponse}), "strengthAreas" (array), "weaknessAreas" (array), "olqEvidence" (array of {olq, evidence, level}), "overallFeedback" (string), "practiceRecommendations" (array).`;

export async function evaluateSRTBatch(
  responses: Array<{ situation: string; response: string }>
): Promise<AIResponse<SRTBatchEvaluation>> {
  const userPrompt = `Evaluate these ${responses.length} SRT responses. For each, explain what makes the response practical or impractical, and suggest an improved version:

${responses.slice(0, 20).map((r, i) => `${i + 1}. Situation: "${r.situation}" → Response: "${r.response}"`).join('\n')}

Return JSON.`;

  const { text, provider } = await callAI(SRT_SYSTEM, userPrompt);

  if (provider === 'heuristic' || !text) {
    return {
      success: true,
      provider: 'heuristic',
      usedFallback: true,
      data: heuristicSRTEvaluation(responses),
    };
  }

  const parsed = safeJSON<Partial<SRTBatchEvaluation>>(text, {});
  return {
    success: true,
    provider,
    usedFallback: false,
    data: {
      totalSituations: responses.length,
      analyzedResponses: (parsed as any).responses || parsed.analyzedResponses || heuristicSRTAnalyzeResponses(responses),
      strengthAreas: parsed.strengthAreas || [],
      weaknessAreas: parsed.weaknessAreas || [],
      olqEvidence: parsed.olqEvidence || [],
      overallFeedback: parsed.overallFeedback || '',
      practiceRecommendations: parsed.practiceRecommendations || [],
      evaluatedAt: new Date().toISOString(),
    },
  };
}

// ─── INTERVIEW NEXT QUESTION ──────────────────────────────────
const INTERVIEW_SYSTEM = SSB_CONTEXT + `
You are an SSB Interviewing Officer (IO) conducting a personal interview. You ask probing follow-up questions based on the candidate's answers. You challenge vague claims, ask for practical examples, identify inconsistencies, and adjust question difficulty. Never ask the same question twice. Rotate through categories: personal background, family, education, hobbies, leadership, achievements, failures, defence awareness, motivation. Return JSON with keys: "question" (string), "category" (string), "isFollowUp" (boolean), "followUpReason" (string if isFollowUp).`;

export async function getInterviewNextQuestion(
  messages: InterviewMessage[],
  piq: Partial<PIQProfile>
): Promise<AIResponse<{ question: string; category: string; isFollowUp: boolean; followUpReason?: string }>> {
  const piqSummary = `Candidate Profile:
Name: ${piq.name || 'Unknown'}
Age: ${piq.age || 'Unknown'}
Education: ${piq.graduationDegree || piq.currentOccupation || 'Not specified'}
Target Entry: ${piq.targetEntry || 'Not specified'}
Hobbies: ${piq.hobbies || 'Not specified'}
Sports: ${piq.sports || 'Not specified'}
Achievements: ${piq.achievements || 'Not specified'}
Leadership: ${piq.leadershipExperiences || 'Not specified'}
Motivation: ${piq.motivationForForces || 'Not specified'}
Previous Attempts: ${piq.previousAttempts || 0}`;

  const conversationHistory = messages
    .slice(-8)
    .map((m) => `${m.role === 'interviewer' ? 'IO' : 'Candidate'}: ${m.content}`)
    .join('\n');

  const userPrompt = `${piqSummary}

Recent conversation:
${conversationHistory || 'Interview just started.'}

${messages.length === 0 ? 'Start the interview with a warm, professional opening question.' : 'Based on the candidate\'s last answer, generate the next appropriate question. If the last answer was vague or unsubstantiated, ask a probing follow-up. Otherwise, move to a new category.'}

Return JSON with the next question.`;

  const { text, provider } = await callAI(INTERVIEW_SYSTEM, userPrompt);

  if (provider === 'heuristic' || !text) {
    return {
      success: true,
      provider: 'heuristic',
      usedFallback: true,
      data: heuristicNextInterviewQuestion(messages, piq),
    };
  }

  const parsed = safeJSON<{ question: string; category: string; isFollowUp: boolean; followUpReason?: string }>(text, {
    question: "Tell me about yourself.",
    category: "Personal Background",
    isFollowUp: false,
  });

  return { success: true, provider, usedFallback: false, data: parsed };
}

// ─── INTERVIEW EVALUATION ─────────────────────────────────────
const INTERVIEW_EVAL_SYSTEM = SSB_CONTEXT + `
You evaluate a complete personal interview session. Analyze all candidate answers for: clarity of thought, communication, honesty and consistency, self-awareness, logical reasoning, depth of answers, decision-making, quality of personal examples. Score each dimension 1-5 (5=excellent). Identify strong responses, weak responses, missing information, contradictions, improvement exercises, and follow-up questions to practice. Return JSON matching the InterviewEvaluation schema.`;

export async function evaluateInterviewSession(
  messages: InterviewMessage[],
  piq: Partial<PIQProfile>
): Promise<AIResponse<InterviewEvaluation>> {
  const candidateAnswers = messages
    .filter((m) => m.role === 'candidate')
    .map((m, i) => `${i + 1}. ${m.content}`)
    .join('\n');

  const userPrompt = `Evaluate this SSB interview. Candidate: ${piq.name || 'Candidate'}, targeting ${piq.targetEntry || 'CDS'}.

Candidate answers:
${candidateAnswers}

Return comprehensive evaluation JSON with scores (1-5) for all 8 dimensions, strong/weak responses, contradictions, improvement exercises, follow-up questions, and OLQ evidence.`;

  const { text, provider } = await callAI(INTERVIEW_EVAL_SYSTEM, userPrompt);

  if (provider === 'heuristic' || !text) {
    return {
      success: true,
      provider: 'heuristic',
      usedFallback: true,
      data: heuristicInterviewEvaluation(messages, piq),
    };
  }

  const parsed = safeJSON<InterviewEvaluation>(text, heuristicInterviewEvaluation(messages, piq));
  return {
    success: true,
    provider,
    usedFallback: false,
    data: {
      ...heuristicInterviewEvaluation(messages, piq), // base defaults
      ...parsed,
      disclaimer: 'This evaluation is an AI-assisted practice tool and does not predict official SSB selection outcomes.',
      evaluatedAt: new Date().toISOString(),
    },
  };
}

// ─── GD NEXT MESSAGE ──────────────────────────────────────────
const GD_SYSTEM = SSB_CONTEXT + `
You simulate a Group Discussion with AI participants. Each participant has a distinct personality. When the candidate speaks, generate natural responses from 1-2 AI participants that build on, challenge, or redirect the discussion. Return JSON with key "messages" (array of {speakerId, speakerName, speakerType, content}) and optionally "topicShift" (string). Keep responses concise (1-3 sentences each). Sound like real humans debating, not formal essays.`;

export async function getGDNextMessages(
  topic: string,
  recentMessages: GDMessage[],
  candidateMessage: string
): Promise<AIResponse<GDMessage[]>> {
  const history = recentMessages
    .slice(-6)
    .map((m) => `${m.speakerName}: ${m.content}`)
    .join('\n');

  const userPrompt = `Group Discussion topic: "${topic}"

Recent discussion:
${history}

Candidate just said: "${candidateMessage}"

Generate 1-2 natural AI participant responses. Use these personas as appropriate:
- Arjun (confident): Makes bold, decisive statements with conviction
- Priya (analytical): Provides data-driven, structured arguments  
- Rohit (aggressive): Interrupts, pushes back strongly, may be confrontational
- Meera (skeptic): Questions assumptions, asks "but what about..."

Return JSON with "messages" array.`;

  const { text, provider } = await callAI(GD_SYSTEM, userPrompt);

  if (provider === 'heuristic' || !text) {
    return {
      success: true,
      provider: 'heuristic',
      usedFallback: true,
      data: heuristicGDMessages(topic, candidateMessage),
    };
  }

  const parsed = safeJSON<{ messages: Omit<GDMessage, 'id' | 'timestamp'>[] }>(text, { messages: [] });
  const now = new Date().toISOString();
  return {
    success: true,
    provider,
    usedFallback: false,
    data: (parsed.messages || []).map((m, i) => ({
      ...m,
      id: `gd_ai_${Date.now()}_${i}`,
      timestamp: new Date(Date.now() + i * 1500).toISOString(),
    })) as GDMessage[],
  };
}

// ─── LECTURETTE AI ANALYSIS ───────────────────────────────────
const LECTURETTE_SYSTEM = SSB_CONTEXT + `
You analyze a Lecturette speech transcript. Assess: fluency, grammar, vocabulary, logical structure, topic relevance, filler words, repetition, speaking pace estimate. Return JSON with keys: wordCount (number), estimatedPace ("slow"|"ideal"|"fast"), fillerWords (array of {word, count}), fillerWordPercentage (number), structure ({hasIntroduction, hasBody, hasConclusion, logicalFlow}), contentFeedback ({topicCoverage, keyPointsMissed, strongPoints}), improvedSampleSpeech (string), practiceRecommendations (array), olqEvidence (array).`;

export async function analyzeLecturetteTranscript(
  transcript: string,
  topic: string,
  durationSeconds: number
): Promise<AIResponse<LecturetteAIAnalysis>> {
  const userPrompt = `Analyze this Lecturette speech on the topic: "${topic}" (Duration: ${durationSeconds} seconds)

TRANSCRIPT:
"${transcript}"

Count filler words (um, uh, like, you know, basically, actually, so, right). Estimate speaking pace based on word count and duration. Generate a concise improved sample speech on the same topic. Return JSON.`;

  const { text, provider } = await callAI(LECTURETTE_SYSTEM, userPrompt);

  if (provider === 'heuristic' || !text) {
    return {
      success: true,
      provider: 'heuristic',
      usedFallback: true,
      data: heuristicLecturetteAnalysis(transcript, topic, durationSeconds),
    };
  }

  const parsed = safeJSON<Partial<LecturetteAIAnalysis>>(text, {});
  return {
    success: true,
    provider,
    usedFallback: false,
    data: {
      transcript,
      wordCount: parsed.wordCount || transcript.split(/\s+/).length,
      estimatedPace: parsed.estimatedPace || 'ideal',
      fillerWords: parsed.fillerWords || [],
      fillerWordPercentage: parsed.fillerWordPercentage || 0,
      structure: parsed.structure || { hasIntroduction: true, hasBody: true, hasConclusion: false, logicalFlow: 'moderate' },
      contentFeedback: parsed.contentFeedback || { topicCoverage: 'Moderate', keyPointsMissed: [], strongPoints: [] },
      improvedSampleSpeech: parsed.improvedSampleSpeech || '',
      practiceRecommendations: parsed.practiceRecommendations || [],
      olqEvidence: parsed.olqEvidence || [],
      evaluatedAt: new Date().toISOString(),
    },
  };
}

// ─── CENTRAL MENTOR RESPONSE ──────────────────────────────────
const MENTOR_SYSTEM = SSB_CONTEXT + `
You are "SSB Personal Mentor", an intelligent preparation assistant for a candidate preparing for the SSB interview. You have access to their complete practice history, PIQ profile, and performance data. Answer questions about their preparation, suggest what to practice, analyze their patterns, and motivate them. Never invent data that isn't provided. If data is missing, say so honestly. Keep responses concise and actionable.`;

export async function getMentorResponse(
  userQuestion: string,
  context: {
    piq?: Partial<PIQProfile>;
    recentAttempts?: Array<{ module: string; completedCount: number; totalItems: number; date: string }>;
    olqSummary?: Record<string, string>;
    conversationHistory?: Array<{ role: string; content: string }>;
  }
): Promise<AIResponse<string>> {
  const contextStr = `
Candidate: ${context.piq?.name || 'Unknown'}, targeting ${context.piq?.targetEntry || 'SSB'}
Recent practice sessions: ${JSON.stringify(context.recentAttempts?.slice(0, 5) || [])}
OLQ pattern summary: ${JSON.stringify(context.olqSummary || {})}
`;

  const history = (context.conversationHistory || [])
    .slice(-6)
    .map((m) => `${m.role === 'mentor' ? 'Mentor' : 'Candidate'}: ${m.content}`)
    .join('\n');

  const userPrompt = `${contextStr}

Recent conversation:
${history}

Candidate asks: "${userQuestion}"

Respond as SSB Personal Mentor. Be specific, use their actual data where available, be encouraging but honest. Keep response under 200 words.`;

  const { text, provider } = await callAI(MENTOR_SYSTEM, userPrompt);

  if (provider === 'heuristic' || !text) {
    return {
      success: true,
      provider: 'heuristic',
      usedFallback: true,
      data: heuristicMentorResponse(userQuestion, context),
    };
  }

  // For mentor, response is free-form text, not JSON
  const cleanText = text.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  return { success: true, provider, usedFallback: false, data: cleanText };
}

// ─── KNOWLEDGE MENTOR RESPONSE ────────────────────────────────
const KNOWLEDGE_SYSTEM = SSB_CONTEXT + `
You are a Defence Knowledge Mentor specializing in Indian Armed Forces, national security, current affairs, military history, and defence technology. Answer questions conversationally with accurate, verifiable information. Cite your sources when possible. Never invent facts, dates, exercises, or current events. If unsure, say so. Keep answers informative but concise. Return plain text (not JSON).`;

export async function getKnowledgeMentorResponse(
  question: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<AIResponse<string>> {
  const history = conversationHistory
    .slice(-6)
    .map((m) => `${m.role === 'mentor' ? 'Mentor' : 'Candidate'}: ${m.content}`)
    .join('\n');

  const userPrompt = `${history ? `Recent conversation:\n${history}\n\n` : ''}Question: "${question}"

Answer accurately. If this is about recent events (after your knowledge cutoff), say so and explain what you do know.`;

  const { text, provider } = await callAI(KNOWLEDGE_SYSTEM, userPrompt);

  if (provider === 'heuristic' || !text) {
    return {
      success: true,
      provider: 'heuristic',
      usedFallback: true,
      data: heuristicKnowledgeResponse(question),
    };
  }

  return { success: true, provider, usedFallback: false, data: text };
}

// ─── HEURISTIC FALLBACKS ──────────────────────────────────────
// These provide meaningful (not fake) feedback without an API key.
// They use rule-based SSB evaluation logic.

function heuristicTATEvaluation(storyText: string, imageRef: string, disclaimer: string): TATEvaluation {
  const wordCount = storyText.trim().split(/\s+/).length;
  const hasHero = /he|she|they|the (young|boy|girl|man|woman|officer|soldier|student|cadet)/i.test(storyText);
  const hasPlan = /plan|decided|thought|realized|organized|arranged|prepared/i.test(storyText);
  const hasTeam = /team|group|together|helped|colleagues|friends|unit/i.test(storyText);
  const hasGoal = /want|goal|aim|objective|mission|challenge|problem/i.test(storyText);
  const hasConclusion = /success|achieved|won|completed|solved|finally|eventually|result/i.test(storyText);
  const hasInit = /took initiative|first|started|began|decided to|approached/i.test(storyText);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (wordCount >= 80) strengths.push('Good story length with sufficient detail');
  else improvements.push('Story is too short — aim for 80-120 words');

  if (hasHero) strengths.push('Clear central character identified');
  else improvements.push('Identify a specific central character (he/she/the officer)');

  if (hasGoal) strengths.push('Story has a clear objective or challenge');
  else improvements.push('Define a clear goal or problem for the character to solve');

  if (hasPlan) strengths.push('Some planning or decision-making is visible');
  else improvements.push('Include planning steps (e.g., "He assessed the situation and planned...")');

  if (hasTeam) strengths.push('Teamwork or social cooperation mentioned');
  if (hasConclusion) strengths.push('Story has a conclusion');
  else improvements.push('Add a realistic, positive conclusion');

  if (hasInit) strengths.push('Initiative demonstrated by central character');
  else improvements.push('Show initiative — have the character take the first action without waiting');

  const microActions = [
    'Assessed the situation and identified the core challenge',
    'Consulted with available team members or stakeholders',
    'Created a clear action plan with prioritized steps',
    'Divided responsibilities based on individual strengths',
    'Monitored progress and adjusted the approach as needed',
    'Communicated clearly with all involved parties',
    'Completed the task and briefed the outcome to relevant people',
    'Reflected on what could be done better next time',
  ];

  return {
    storyText,
    imageRef,
    summary: `Your story is ${wordCount} words. ${strengths.length > 0 ? 'Key strengths noted.' : 'Several areas need development.'}`,
    strengths,
    improvementAreas: improvements,
    missingElements: {
      planning: !hasPlan,
      initiative: !hasInit,
      teamwork: !hasTeam,
      resourceUse: !/resource|material|tool|equipment/i.test(storyText),
      realisticConclusion: !hasConclusion,
    },
    microActions,
    improvedIllustrativeVersion: `The young officer arrived at the site and quickly assessed the situation. Realizing the urgency, he gathered his team and briefed them on the challenge. He divided responsibilities — assigning the technical aspect to the engineer, communication to the junior officer, and resource management to himself. As the team worked methodically, he monitored progress and addressed hurdles as they arose. After coordinating effectively, the task was completed within the stipulated time. He debriefed the team and noted key learnings for future operations.`,
    olqEvidence: [
      { olq: 'Initiative' as OLQName, evidence: hasInit ? 'Character takes first action without prompting' : 'No clear initiative demonstrated', level: hasInit ? 'positive_evidence' : 'needs_practice' as OLQEvidenceLevel },
      { olq: 'Organising Ability' as OLQName, evidence: hasPlan ? 'Some planning visible in story' : 'Planning steps absent from narrative', level: hasPlan ? 'developing' : 'needs_practice' as OLQEvidenceLevel },
      { olq: 'Cooperation' as OLQName, evidence: hasTeam ? 'Teamwork referenced in story' : 'Individual focus — no team collaboration', level: hasTeam ? 'positive_evidence' : 'developing' as OLQEvidenceLevel },
    ],
    practiceRecommendations: [
      'Write 5 TAT stories daily — focus on including planning, teamwork and micro-actions',
      'Each story should have: Situation → Assessment → Plan → Action → Conclusion',
      'Avoid vague verbs like "worked hard" — use specific action verbs',
    ],
    evidenceConfidence: 'moderate',
    disclaimer,
    evaluatedAt: new Date().toISOString(),
  };
}

function heuristicWATAnalyzeResponses(responses: Array<{ word: string; response: string }>): WATResponseAnalysis[] {
  const clichePhrases = [
    'serve the nation', 'help the team', 'work hard', 'never give up', 'be strong',
    'fight for country', 'protect the border', 'lead by example', 'be a good leader',
  ];
  return responses.map((r) => {
    const isCliché = clichePhrases.some((c) => r.response.toLowerCase().includes(c));
    const wordCount = r.response.trim().split(/\s+/).length;
    return {
      word: r.word,
      response: r.response,
      relevance: r.response.toLowerCase().includes(r.word.toLowerCase().slice(0, 4)) ? 'high' : 'medium',
      clarity: wordCount > 3 && wordCount < 20 ? 'high' : wordCount > 20 ? 'medium' : 'low',
      constructiveness: /help|build|lead|achieve|success|create|solve|improve/i.test(r.response) ? 'positive' : 'neutral',
      isCliché,
      clicheNote: isCliché ? 'This is a commonly coached phrase. Try expressing your natural thought.' : undefined,
      alternativeSuggestion: isCliché ? `Try a more specific, personal expression related to "${r.word}"` : undefined,
    };
  });
}

function heuristicWATEvaluation(responses: Array<{ word: string; response: string }>): WATBatchEvaluation {
  const analyzed = heuristicWATAnalyzeResponses(responses);
  const clicheCount = analyzed.filter((r) => r.isCliché).length;
  const positiveCount = analyzed.filter((r) => r.constructiveness === 'positive').length;

  return {
    totalResponses: responses.length,
    analyzedResponses: analyzed,
    overallThemes: ['Leadership', 'Service', 'Achievement'],
    positivePatterns: positiveCount > responses.length * 0.6 ? ['Predominantly positive and constructive responses'] : [],
    repetitivePatterns: clicheCount > 5 ? [`${clicheCount} responses appear memorized or coached`] : [],
    genericResponsesCount: clicheCount,
    olqEvidence: [
      { olq: 'Power of Expression' as OLQName, evidence: `${positiveCount}/${responses.length} responses are constructive and clear`, level: 'developing' as OLQEvidenceLevel },
      { olq: 'Effective Intelligence' as OLQName, evidence: 'WAT responses show range of associative thinking', level: 'developing' as OLQEvidenceLevel },
    ],
    overallFeedback: `You completed ${responses.length} WAT responses. ${clicheCount > 5 ? `${clicheCount} responses seem coached or generic — focus on natural, spontaneous reactions.` : 'Good variety of responses noted.'} Positive/constructive responses: ${positiveCount}/${responses.length}.`,
    practiceRecommendations: [
      'Practice word association daily — write the first thought, not a memorized phrase',
      'Review responses that felt forced and find more personal alternatives',
      'Focus on action verbs and positive framing without sounding coached',
    ],
    evaluatedAt: new Date().toISOString(),
  };
}

function heuristicSRTAnalyzeResponses(responses: Array<{ situation: string; response: string }>): SRTResponseAnalysis[] {
  return responses.map((r) => {
    const hasAction = /would|will|immediately|first|then|next|after/i.test(r.response);
    const hasSafety = /safe|careful|ensure|check|verify|report|alert/i.test(r.response);
    const hasLeadership = /lead|organize|coordinate|assign|delegate|direct/i.test(r.response);
    const responseLen = r.response.trim().split(/\s+/).length;
    return {
      situation: r.situation,
      response: r.response,
      practicality: hasAction && responseLen > 5 ? 'high' : responseLen > 3 ? 'medium' : 'low',
      initiative: hasAction ? 'high' : 'medium',
      responsibility: hasSafety || hasLeadership ? 'high' : 'medium',
      decisionQuality: hasAction && hasLeadership ? 'sound' : hasAction ? 'acceptable' : 'questionable',
      safetyAwareness: hasSafety,
      explanation: hasAction
        ? 'Response shows practical action-oriented thinking.'
        : 'Response lacks specific actionable steps. Add "first I would..." followed by concrete steps.',
      improvedResponse: hasAction ? undefined : `First, I would assess the situation and ensure everyone's safety. Then, I would organize available resources, assign clear responsibilities, and address the challenge systematically while keeping relevant people informed.`,
    };
  });
}

function heuristicSRTEvaluation(responses: Array<{ situation: string; response: string }>): SRTBatchEvaluation {
  const analyzed = heuristicSRTAnalyzeResponses(responses);
  const highPracticality = analyzed.filter((r) => r.practicality === 'high').length;
  const soundDecision = analyzed.filter((r) => r.decisionQuality === 'sound').length;

  return {
    totalSituations: responses.length,
    analyzedResponses: analyzed,
    strengthAreas: highPracticality > responses.length * 0.5 ? ['Practical action orientation'] : [],
    weaknessAreas: highPracticality < responses.length * 0.3 ? ['Lack of specific actionable steps in responses'] : [],
    olqEvidence: [
      { olq: 'Speed of Decision' as OLQName, evidence: `${highPracticality}/${responses.length} responses show immediate practical action`, level: highPracticality > responses.length * 0.6 ? 'positive_evidence' : 'developing' as OLQEvidenceLevel },
      { olq: 'Initiative' as OLQName, evidence: `${soundDecision}/${responses.length} responses demonstrate initiative`, level: soundDecision > responses.length * 0.5 ? 'positive_evidence' : 'developing' as OLQEvidenceLevel },
    ],
    overallFeedback: `Completed ${responses.length} SRT situations. Practical responses: ${highPracticality}/${responses.length}. ${highPracticality < responses.length * 0.4 ? 'Focus on including specific action steps in every response.' : 'Good action orientation shown.'}`,
    practiceRecommendations: [
      'Structure each SRT response: Assess → Prioritize → Act → Inform',
      'Include at least 2-3 specific actions in each response',
      'Practice emergency situations where you must decide quickly',
    ],
    evaluatedAt: new Date().toISOString(),
  };
}

function heuristicNextInterviewQuestion(
  messages: InterviewMessage[],
  piq: Partial<PIQProfile>
): { question: string; category: string; isFollowUp: boolean } {
  const questionBank = [
    { q: `Tell me about yourself, ${piq.name || 'Cadet'}.`, cat: 'Personal Background' },
    { q: 'Why do you want to join the Armed Forces?', cat: 'Motivation' },
    { q: 'What does your family think about your career choice?', cat: 'Family' },
    { q: 'Describe a moment when you led a group or team.', cat: 'Leadership' },
    { q: 'What are your hobbies and how do they help you?', cat: 'Hobbies' },
    { q: 'Tell me about a failure and what you learned from it.', cat: 'Self Awareness' },
    { q: 'What do you know about the current border situation of India?', cat: 'Defence Awareness' },
    { q: 'How do you handle conflict within a team?', cat: 'Social Skills' },
    { q: 'Where do you see yourself in 10 years?', cat: 'Future Plans' },
    { q: 'What is your greatest achievement so far?', cat: 'Achievements' },
    { q: 'What would you do if you are not selected in this SSB?', cat: 'Determination' },
    { q: 'How do you manage stress and pressure?', cat: 'Self Management' },
    { q: 'Name three qualities that make a good officer.', cat: 'Officer Qualities' },
    { q: 'Tell me about a responsibility you held and how you managed it.', cat: 'Responsibility' },
    { q: 'What newspapers or magazines do you read regularly?', cat: 'Current Awareness' },
  ];

  const usedQuestions = new Set(messages.filter((m) => m.role === 'interviewer').map((m) => m.content));
  const available = questionBank.filter((q) => !usedQuestions.has(q.q));
  const pick = available[Math.floor(Math.random() * available.length)] || questionBank[0];
  return { question: pick.q, category: pick.cat, isFollowUp: false };
}

function heuristicInterviewEvaluation(
  messages: InterviewMessage[],
  piq: Partial<PIQProfile>
): InterviewEvaluation {
  const candidateAnswers = messages.filter((m) => m.role === 'candidate');
  const avgLen = candidateAnswers.reduce((s, m) => s + m.content.split(/\s+/).length, 0) / Math.max(candidateAnswers.length, 1);
  const hasExamples = candidateAnswers.filter((m) => /example|instance|when|time|once|experience/i.test(m.content)).length;
  const score = (val: boolean): 1 | 2 | 3 | 4 | 5 => val ? 4 : 2;

  return {
    clarityOfThought: { score: score(avgLen > 30), evidence: [`Average answer length: ${Math.round(avgLen)} words`] },
    communication: { score: score(avgLen > 25), evidence: ['Based on response length and structure'] },
    honestyConsistency: { score: 3, evidence: ['Insufficient data for full consistency check'] },
    selfAwareness: { score: score(hasExamples > candidateAnswers.length * 0.3), evidence: [`${hasExamples} answers included personal examples`] },
    logicalReasoning: { score: 3, evidence: ['Moderate logical structure observed'] },
    depthOfAnswers: { score: score(avgLen > 40), evidence: [`Average response: ${Math.round(avgLen)} words (target: 40-80)`] },
    decisionMaking: { score: 3, evidence: ['Limited decision scenarios covered'] },
    personalExamplesQuality: { score: score(hasExamples > 2), evidence: [`${hasExamples} personal examples identified`] },
    strongResponses: candidateAnswers.slice(0, 2).map((m) => m.content.substring(0, 80) + '...'),
    weakResponses: avgLen < 25 ? ['Several responses were too brief — aim for 40-80 words per answer'] : [],
    missingAreas: ['Leadership examples', 'Specific defence knowledge', 'Future vision'],
    contradictions: [],
    improvementExercises: [
      'Practice the STAR method (Situation, Task, Action, Result) for every answer',
      'Prepare 5-7 personal examples that demonstrate different OLQs',
      'Read a defence newspaper daily and practice relating it to interview questions',
    ],
    followUpQuestions: [
      `${piq.name ? `${piq.name}, ` : ''}give me a specific example of a time you led others under pressure.`,
      'What are the main differences between the Indian Army, Navy and Air Force officer roles?',
      'How has your academic background prepared you for a career in the forces?',
    ],
    olqEvidence: [
      { olq: 'Power of Expression' as OLQName, evidence: `Average answer: ${Math.round(avgLen)} words`, level: avgLen > 35 ? 'positive_evidence' : 'needs_practice' as OLQEvidenceLevel },
      { olq: 'Self Confidence' as OLQName, evidence: 'Assessed from answer completeness', level: 'developing' as OLQEvidenceLevel },
    ],
    overallFeedback: `Interview session with ${candidateAnswers.length} responses analyzed. ${avgLen > 35 ? 'Good response depth.' : 'Work on answer depth — be more elaborate with personal examples.'} ${hasExamples > 2 ? 'Good use of personal examples.' : 'Include more specific personal examples (use the STAR method).'}`,
    disclaimer: 'This is an AI practice tool. Scores do not predict official SSB recommendation.',
    evaluatedAt: new Date().toISOString(),
  };
}

function heuristicGDMessages(topic: string, candidateMessage: string): GDMessage[] {
  const personas = [
    { id: 'arjun', name: 'Arjun', type: 'confident' as const },
    { id: 'priya', name: 'Priya', type: 'analytical' as const },
    { id: 'rohit', name: 'Rohit', type: 'aggressive' as const },
    { id: 'meera', name: 'Meera', type: 'skeptic' as const },
  ];
  const responses = [
    `I agree with the point raised. From a strategic perspective, ${topic.split(' ').slice(0, 3).join(' ')} has significant implications for national security.`,
    `That's an interesting perspective, but we should also consider the data. Studies show this affects multiple dimensions.`,
    `Wait, I think you're oversimplifying. The real issue is more complex than what's being discussed here.`,
    `But what about the practical implementation challenges? We can't just focus on the theory.`,
  ];
  const selectedPersona = personas[Math.floor(Math.random() * 2)]; // confident or analytical usually respond
  return [{
    id: `gd_heuristic_${Date.now()}`,
    speakerId: selectedPersona.id,
    speakerName: selectedPersona.name,
    speakerType: selectedPersona.type,
    content: responses[Math.floor(Math.random() * responses.length)],
    timestamp: new Date().toISOString(),
  }];
}

function heuristicLecturetteAnalysis(transcript: string, topic: string, durationSeconds: number): LecturetteAIAnalysis {
  const words = transcript.trim().split(/\s+/);
  const wordCount = words.length;
  const wordsPerMin = Math.round((wordCount / durationSeconds) * 60);
  const fillerWordList = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'right'];
  const fillerCounts: Record<string, number> = {};
  fillerWordList.forEach((fw) => {
    const regex = new RegExp(`\\b${fw}\\b`, 'gi');
    const count = (transcript.match(regex) || []).length;
    if (count > 0) fillerCounts[fw] = count;
  });
  const totalFillers = Object.values(fillerCounts).reduce((a, b) => a + b, 0);
  const pace = wordsPerMin < 100 ? 'slow' : wordsPerMin > 160 ? 'fast' : 'ideal';

  return {
    transcript,
    wordCount,
    estimatedPace: pace,
    fillerWords: Object.entries(fillerCounts).map(([word, count]) => ({ word, count })),
    fillerWordPercentage: Math.round((totalFillers / wordCount) * 100),
    structure: {
      hasIntroduction: /today|topic|talk about|discuss|introduction|begin/i.test(transcript),
      hasBody: wordCount > 50,
      hasConclusion: /conclusion|finally|therefore|in summary|to conclude|end/i.test(transcript),
      logicalFlow: wordCount > 100 ? 'moderate' : 'weak',
    },
    contentFeedback: {
      topicCoverage: wordCount > 150 ? 'Good coverage' : wordCount > 80 ? 'Moderate coverage' : 'Insufficient coverage',
      keyPointsMissed: ['Historical context', 'Current relevance', 'Future implications'],
      strongPoints: wordCount > 100 ? ['Reasonable length maintained'] : [],
    },
    improvedSampleSpeech: `Good morning. Today I will speak on "${topic}". This is a topic of great relevance in today's context. [Body: 3 key points with examples]. In conclusion, we can see that ${topic.split(' ').slice(0, 4).join(' ')} is crucial for India's development and security. Thank you.`,
    practiceRecommendations: [
      `Target 120-150 words per minute (you spoke at ~${wordsPerMin} wpm)`,
      totalFillers > 5 ? `Reduce filler words: detected ${totalFillers} instances. Practice pausing instead.` : 'Good filler word control',
      'Use the structure: Introduction (20s) → 3 Main Points (2m) → Conclusion (10s)',
    ],
    olqEvidence: [
      { olq: 'Power of Expression' as OLQName, evidence: `Spoke ${wordCount} words in ${durationSeconds}s. Pace: ${pace}`, level: pace === 'ideal' ? 'positive_evidence' : 'developing' as OLQEvidenceLevel },
    ],
    evaluatedAt: new Date().toISOString(),
  };
}

function heuristicMentorResponse(
  question: string,
  context: { piq?: Partial<PIQProfile>; recentAttempts?: Array<{ module: string; completedCount: number; totalItems: number; date: string }> }
): string {
  const name = context.piq?.name || 'Cadet';
  const attempts = context.recentAttempts || [];
  const totalSessions = attempts.length;

  if (/improve|weakness|weak/i.test(question)) {
    return `${name}, based on your practice history with ${totalSessions} sessions, focus on: (1) Writing more detailed TAT stories with specific micro-actions, (2) Using personal examples in every WAT response, (3) Structuring your SRT responses with clear prioritization. These areas consistently correlate with strong SSB performance.`;
  }
  if (/today|practice|what should/i.test(question)) {
    return `For today's preparation, I recommend: 5 TAT stories (focus on planning steps), 15 WAT words (avoid coached phrases), and 10 SRT situations. After completing them, review your responses critically. Consistency is what gets candidates recommended.`;
  }
  if (/progress|how am i/i.test(question)) {
    return `You've completed ${totalSessions} practice sessions so far. ${totalSessions < 10 ? 'Keep building the habit — aim for daily practice.' : totalSessions < 30 ? 'Good consistency. Now focus on quality over quantity.' : 'Excellent dedication! Focus now on refining weak areas based on your OLQ evidence.'}`;
  }
  return `${name}, I'm your SSB preparation mentor. I can help you with: analyzing your practice sessions, suggesting today's tasks, explaining your OLQ patterns, generating interview questions from your PIQ, or answering defence knowledge questions. What would you like to focus on?`;
}

function heuristicKnowledgeResponse(question: string): string {
  if (/agnipath|agniveer/i.test(question)) {
    return `The Agnipath Scheme, launched in June 2022, is a short-service recruitment scheme for the Indian Armed Forces. Recruits (called Agniveers) serve for 4 years, after which 25% are retained as regular soldiers. The scheme aims to create a younger military profile and reduce pension liabilities. It covers all three services: Army, Navy and Air Force. Critics have raised concerns about operational depth and unit cohesion, while proponents highlight modernization benefits and skill injection into civil society.`;
  }
  if (/exercise|joint|bilateral/i.test(question)) {
    return `India conducts numerous joint military exercises. Key ones include: Malabar (India-US-Japan trilateral naval exercise), Tasman Saber (India-Australia), Yudh Abhyas (India-US Army exercise), Shakti (India-France), Vajra Prahar (India-US Special Forces), and INDRA (India-Russia). India also participates in RIMPAC, the world's largest naval exercise.`;
  }
  if (/theatre|theaterization/i.test(question)) {
    return `Theatre Commands are proposed integrated joint commands that bring together Army, Navy and Air Force assets under unified regional commanders. India is working on creating 4-5 theatre commands: Land Theatres (N, E, W), Maritime Theatre Command, and Air Defence Command. The Chief of Defence Staff (CDS) oversees this integration. Full operationalization is ongoing.`;
  }
  return `I can answer questions about Indian Armed Forces structure, defence exercises, military history, national security policy, current affairs, and SSB interview preparation topics. Please note that for very recent events, I may have limited information. Try asking about: Agnipath scheme, theatre commands, border situations, defence acquisitions, or military exercises.`;
}
