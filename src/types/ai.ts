// ============================================================
// SSB MENTOR – AI TYPES
// All schemas for AI evaluations, candidate context, OLQs
// ============================================================

// ─── PIQ (Personal Interview Questionnaire) Profile ─────────
export interface PIQProfile {
  userId: string;
  name: string;
  age: number | null;
  dob: string; // YYYY-MM-DD
  hometown: string;
  state: string;

  // Education
  schoolName: string;
  schoolBoard: string;
  class10Percentage: string;
  class12Percentage: string;
  graduationCollege: string;
  graduationDegree: string;
  graduationPercentage: string;
  currentOccupation: string; // Student / Working / Preparing

  // Family
  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  siblings: string; // e.g. "1 elder brother, Engineer"
  familyBackground: string; // Brief family description

  // Interests & Activities
  hobbies: string;
  sports: string;
  achievements: string; // list as text, one per line
  leadershipExperiences: string;
  socialActivities: string;
  nccNss: string; // NCC / NSS / Scout / none
  nccGrade: string;

  // Defence Connection
  defenceBackground: string; // family in forces?
  motivationForForces: string;
  targetArm: string; // Army / Navy / Air Force
  targetEntry: string; // NDA / CDS / TES / AFCAT etc.
  previousAttempts: number;
  previousSSBBoards: string;
  previousSSBResult: string;

  // Personality Self-Assessment
  strengthsSelf: string;
  weaknessesSelf: string;
  roleModels: string;
  futurePlansIfNotSelected: string;

  updatedAt: string;
}

// ─── OLQ Evidence System ─────────────────────────────────────
export const OLQ_GROUPS = {
  'Group I – Intellectual': [
    'Effective Intelligence',
    'Reasoning Ability',
    'Organising Ability',
    'Power of Expression',
  ],
  'Group II – Social': [
    'Social Adaptability',
    'Cooperation',
    'Sense of Responsibility',
  ],
  'Group III – Dynamic': [
    'Initiative',
    'Self Confidence',
    'Speed of Decision',
    'Ability to Influence the Group',
    'Liveliness',
  ],
  'Group IV – Disciplined': [
    'Determination',
    'Courage',
    'Stamina',
  ],
} as const;

export type OLQName =
  | 'Effective Intelligence'
  | 'Reasoning Ability'
  | 'Organising Ability'
  | 'Power of Expression'
  | 'Social Adaptability'
  | 'Cooperation'
  | 'Sense of Responsibility'
  | 'Initiative'
  | 'Self Confidence'
  | 'Speed of Decision'
  | 'Ability to Influence the Group'
  | 'Liveliness'
  | 'Determination'
  | 'Courage'
  | 'Stamina';

export type OLQEvidenceLevel = 'positive_evidence' | 'developing' | 'needs_practice' | 'insufficient_evidence';

export type EvidenceSource = 'WAT' | 'TAT' | 'SRT' | 'INTERVIEW' | 'GTO' | 'LECTURETTE' | 'PPDT';

export interface OLQEvidenceItem {
  olqName: OLQName;
  level: OLQEvidenceLevel;
  evidence: string; // Human-readable observation
  source: EvidenceSource;
  sessionId: string;
  timestamp: string;
}

export interface OLQEvidenceStore {
  userId: string;
  items: OLQEvidenceItem[];
  lastUpdated: string;
}

// ─── AI Evaluation Schemas ───────────────────────────────────

export interface TATEvaluation {
  storyText: string;
  imageRef: string; // e.g. tat_001.jpeg
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  missingElements: {
    planning: boolean;
    initiative: boolean;
    teamwork: boolean;
    resourceUse: boolean;
    realisticConclusion: boolean;
  };
  microActions: string[]; // specific concrete actions AI suggests
  improvedIllustrativeVersion: string;
  olqEvidence: Array<{ olq: OLQName; evidence: string; level: OLQEvidenceLevel }>;
  practiceRecommendations: string[];
  evidenceConfidence: 'low' | 'moderate' | 'high';
  disclaimer: string;
  evaluatedAt: string;
}

export interface WATResponseAnalysis {
  word: string;
  response: string;
  relevance: 'high' | 'medium' | 'low';
  clarity: 'high' | 'medium' | 'low';
  constructiveness: 'positive' | 'neutral' | 'negative';
  isCliché: boolean;
  clicheNote?: string;
  alternativeSuggestion?: string;
}

export interface WATBatchEvaluation {
  totalResponses: number;
  analyzedResponses: WATResponseAnalysis[];
  overallThemes: string[];
  positivePatterns: string[];
  repetitivePatterns: string[];
  genericResponsesCount: number;
  olqEvidence: Array<{ olq: OLQName; evidence: string; level: OLQEvidenceLevel }>;
  overallFeedback: string;
  practiceRecommendations: string[];
  evaluatedAt: string;
}

export interface SRTResponseAnalysis {
  situation: string;
  response: string;
  practicality: 'high' | 'medium' | 'low';
  initiative: 'high' | 'medium' | 'low';
  responsibility: 'high' | 'medium' | 'low';
  decisionQuality: 'sound' | 'acceptable' | 'questionable';
  safetyAwareness: boolean;
  explanation: string;
  improvedResponse?: string;
}

export interface SRTBatchEvaluation {
  totalSituations: number;
  analyzedResponses: SRTResponseAnalysis[];
  strengthAreas: string[];
  weaknessAreas: string[];
  olqEvidence: Array<{ olq: OLQName; evidence: string; level: OLQEvidenceLevel }>;
  overallFeedback: string;
  practiceRecommendations: string[];
  evaluatedAt: string;
}

// ─── Interview Types ──────────────────────────────────────────
export type InterviewMessageRole = 'interviewer' | 'candidate';

export interface InterviewMessage {
  id: string;
  role: InterviewMessageRole;
  content: string;
  timestamp: string;
  isFollowUp?: boolean;
  questionCategory?: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  piqSnapshot: Partial<PIQProfile>;
  messages: InterviewMessage[];
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  evaluation?: InterviewEvaluation;
}

export interface InterviewEvaluation {
  clarityOfThought: { score: 1 | 2 | 3 | 4 | 5; evidence: string[] };
  communication: { score: 1 | 2 | 3 | 4 | 5; evidence: string[] };
  honestyConsistency: { score: 1 | 2 | 3 | 4 | 5; evidence: string[] };
  selfAwareness: { score: 1 | 2 | 3 | 4 | 5; evidence: string[] };
  logicalReasoning: { score: 1 | 2 | 3 | 4 | 5; evidence: string[] };
  depthOfAnswers: { score: 1 | 2 | 3 | 4 | 5; evidence: string[] };
  decisionMaking: { score: 1 | 2 | 3 | 4 | 5; evidence: string[] };
  personalExamplesQuality: { score: 1 | 2 | 3 | 4 | 5; evidence: string[] };
  strongResponses: string[];
  weakResponses: string[];
  missingAreas: string[];
  contradictions: string[];
  improvementExercises: string[];
  followUpQuestions: string[];
  olqEvidence: Array<{ olq: OLQName; evidence: string; level: OLQEvidenceLevel }>;
  overallFeedback: string;
  disclaimer: string;
  evaluatedAt: string;
}

// ─── GTO Group Discussion Types ───────────────────────────────
export type GDPersonaType = 'confident' | 'aggressive' | 'analytical' | 'quiet' | 'skeptic';

export interface GDPersona {
  id: string;
  name: string;
  type: GDPersonaType;
  description: string;
  speakingStyle: string;
}

export interface GDMessage {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerType: GDPersonaType | 'candidate';
  content: string;
  timestamp: string;
}

export interface GDSession {
  id: string;
  userId: string;
  topic: string;
  messages: GDMessage[];
  candidateMessages: GDMessage[];
  status: 'active' | 'completed';
  startedAt: string;
  completedAt?: string;
  evaluation?: GDEvaluation;
}

export interface GDEvaluation {
  contributionQuality: string;
  relevance: string;
  listeningAbility: string;
  communication: string;
  cooperation: string;
  logicalReasoning: string;
  respectfulDisagreement: string;
  olqEvidence: Array<{ olq: OLQName; evidence: string; level: OLQEvidenceLevel }>;
  overallFeedback: string;
  practiceRecommendations: string[];
}

// ─── Lecturette AI Types ──────────────────────────────────────
export interface LecturetteAIAnalysis {
  transcript: string;
  wordCount: number;
  estimatedPace: string; // "slow" | "ideal" | "fast"
  fillerWords: Array<{ word: string; count: number }>;
  fillerWordPercentage: number;
  structure: {
    hasIntroduction: boolean;
    hasBody: boolean;
    hasConclusion: boolean;
    logicalFlow: 'strong' | 'moderate' | 'weak';
  };
  contentFeedback: {
    topicCoverage: string;
    keyPointsMissed: string[];
    strongPoints: string[];
  };
  improvedSampleSpeech: string;
  practiceRecommendations: string[];
  olqEvidence: Array<{ olq: OLQName; evidence: string; level: OLQEvidenceLevel }>;
  evaluatedAt: string;
}

// ─── Knowledge Mentor Types ───────────────────────────────────
export interface KnowledgeMessage {
  id: string;
  role: 'mentor' | 'candidate';
  content: string;
  citations?: string[];
  timestamp: string;
}

export interface KnowledgeQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// ─── Central AI Mentor Types ──────────────────────────────────
export interface MentorMessage {
  id: string;
  role: 'mentor' | 'candidate';
  content: string;
  timestamp: string;
  relatedModules?: EvidenceSource[];
}

export interface MentorSession {
  userId: string;
  messages: MentorMessage[];
  lastUpdated: string;
}

// ─── AI Provider Config ───────────────────────────────────────
export type AIProvider = 'gemini' | 'openai' | 'heuristic';

export interface AIConfig {
  provider: AIProvider;
  geminiApiKey?: string;
  openaiApiKey?: string;
  model?: string;
}

export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  provider: AIProvider;
  usedFallback: boolean;
}
