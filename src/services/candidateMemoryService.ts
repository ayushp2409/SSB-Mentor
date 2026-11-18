// ============================================================
// SSB MENTOR – CANDIDATE MEMORY SERVICE
// Cross-module unified candidate context store
// All data stored in localStorage, user-scoped
// ============================================================

import { PIQProfile, OLQEvidenceStore, OLQEvidenceItem, MentorSession, MentorMessage, InterviewSession, OLQName } from '../types/ai';

// ─── Storage keys (all user-scoped) ──────────────────────────
const piqKey = (uid: string) => `ssb_mentor_piq_${uid}`;
const olqKey = (uid: string) => `ssb_mentor_olq_${uid}`;
const mentorKey = (uid: string) => `ssb_mentor_mentor_${uid}`;
const interviewKey = (uid: string) => `ssb_mentor_interviews_${uid}`;
const tatHistoryKey = (uid: string) => `ssb_mentor_tat_history_${uid}`;
const watHistoryKey = (uid: string) => `ssb_mentor_wat_history_${uid}`;
const srtHistoryKey = (uid: string) => `ssb_mentor_srt_history_${uid}`;

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function writeLS<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', key, e);
  }
}

// ─── Empty PIQ Profile ────────────────────────────────────────
export function emptyPIQ(userId: string): PIQProfile {
  return {
    userId,
    name: '',
    age: null,
    dob: '',
    hometown: '',
    state: '',
    schoolName: '',
    schoolBoard: '',
    class10Percentage: '',
    class12Percentage: '',
    graduationCollege: '',
    graduationDegree: '',
    graduationPercentage: '',
    currentOccupation: '',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    siblings: '',
    familyBackground: '',
    hobbies: '',
    sports: '',
    achievements: '',
    leadershipExperiences: '',
    socialActivities: '',
    nccNss: '',
    nccGrade: '',
    defenceBackground: '',
    motivationForForces: '',
    targetArm: '',
    targetEntry: '',
    previousAttempts: 0,
    previousSSBBoards: '',
    previousSSBResult: '',
    strengthsSelf: '',
    weaknessesSelf: '',
    roleModels: '',
    futurePlansIfNotSelected: '',
    updatedAt: new Date().toISOString(),
  };
}

// ─── PIQ Profile ──────────────────────────────────────────────
export const candidateMemoryService = {
  // PIQ
  getPIQ(userId: string): PIQProfile {
    return readLS<PIQProfile>(piqKey(userId), emptyPIQ(userId));
  },

  savePIQ(userId: string, profile: Partial<PIQProfile>): PIQProfile {
    const existing = this.getPIQ(userId);
    const updated: PIQProfile = { ...existing, ...profile, userId, updatedAt: new Date().toISOString() };
    writeLS(piqKey(userId), updated);
    return updated;
  },

  isPIQComplete(piq: PIQProfile): boolean {
    return !!(piq.name && piq.age && piq.targetEntry && piq.motivationForForces);
  },

  // OLQ Evidence
  getOLQStore(userId: string): OLQEvidenceStore {
    return readLS<OLQEvidenceStore>(olqKey(userId), {
      userId,
      items: [],
      lastUpdated: new Date().toISOString(),
    });
  },

  addOLQEvidence(userId: string, items: OLQEvidenceItem[]): void {
    const store = this.getOLQStore(userId);
    store.items.push(...items);
    // Keep latest 500 evidence items
    if (store.items.length > 500) {
      store.items = store.items.slice(-500);
    }
    store.lastUpdated = new Date().toISOString();
    writeLS(olqKey(userId), store);
  },

  getOLQSummary(userId: string): Record<OLQName, { level: string; evidenceCount: number; lastNote: string }> {
    const store = this.getOLQStore(userId);
    const summary: Record<string, { level: string; evidenceCount: number; lastNote: string }> = {};
    store.items.forEach((item) => {
      if (!summary[item.olqName]) {
        summary[item.olqName] = { level: item.level, evidenceCount: 0, lastNote: '' };
      }
      summary[item.olqName].evidenceCount++;
      summary[item.olqName].lastNote = item.evidence;
      // Most recent level wins
      summary[item.olqName].level = item.level;
    });
    return summary as Record<OLQName, { level: string; evidenceCount: number; lastNote: string }>;
  },

  // AI Mentor Conversation
  getMentorSession(userId: string): MentorSession {
    return readLS<MentorSession>(mentorKey(userId), {
      userId,
      messages: [],
      lastUpdated: new Date().toISOString(),
    });
  },

  addMentorMessage(userId: string, message: MentorMessage): void {
    const session = this.getMentorSession(userId);
    session.messages.push(message);
    if (session.messages.length > 100) {
      session.messages = session.messages.slice(-100);
    }
    session.lastUpdated = new Date().toISOString();
    writeLS(mentorKey(userId), session);
  },

  clearMentorHistory(userId: string): void {
    writeLS(mentorKey(userId), { userId, messages: [], lastUpdated: new Date().toISOString() });
  },

  // Interview Sessions
  getInterviewSessions(userId: string): InterviewSession[] {
    return readLS<InterviewSession[]>(interviewKey(userId), []);
  },

  saveInterviewSession(userId: string, session: InterviewSession): void {
    const sessions = this.getInterviewSessions(userId);
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    if (sessions.length > 20) sessions.pop();
    writeLS(interviewKey(userId), sessions);
  },

  // TAT evaluation history
  getTATHistory(userId: string): Array<{ storyText: string; imageRef: string; evaluatedAt: string; strengths: string[]; microActions: string[] }> {
    return readLS(tatHistoryKey(userId), []);
  },

  saveTATEntry(userId: string, entry: { storyText: string; imageRef: string; evaluatedAt: string; strengths: string[]; microActions: string[] }): void {
    const history = this.getTATHistory(userId);
    history.unshift(entry);
    if (history.length > 50) history.pop();
    writeLS(tatHistoryKey(userId), history);
  },

  // WAT history  
  getWATHistory(userId: string): Array<{ sessionDate: string; totalWords: number; genericCount: number }> {
    return readLS(watHistoryKey(userId), []);
  },

  saveWATSession(userId: string, entry: { sessionDate: string; totalWords: number; genericCount: number }): void {
    const history = this.getWATHistory(userId);
    history.unshift(entry);
    if (history.length > 30) history.pop();
    writeLS(watHistoryKey(userId), history);
  },

  // SRT history
  getSRTHistory(userId: string): Array<{ sessionDate: string; totalSituations: number; highPracticality: number }> {
    return readLS(srtHistoryKey(userId), []);
  },

  saveSRTSession(userId: string, entry: { sessionDate: string; totalSituations: number; highPracticality: number }): void {
    const history = this.getSRTHistory(userId);
    history.unshift(entry);
    if (history.length > 30) history.pop();
    writeLS(srtHistoryKey(userId), history);
  },

  // Build context summary for AI mentor
  buildMentorContext(userId: string) {
    const piq = this.getPIQ(userId);
    const olqSummary = this.getOLQSummary(userId);
    const tatHistory = this.getTATHistory(userId);
    const watHistory = this.getWATHistory(userId);
    const srtHistory = this.getSRTHistory(userId);
    const interviewSessions = this.getInterviewSessions(userId);
    const mentorSession = this.getMentorSession(userId);

    return {
      piq,
      olqSummary: Object.fromEntries(
        Object.entries(olqSummary).map(([k, v]) => [k, v.level])
      ),
      recentAttempts: [
        ...tatHistory.slice(0, 3).map((t) => ({ module: 'TAT', completedCount: 1, totalItems: 1, date: t.evaluatedAt })),
        ...watHistory.slice(0, 3).map((w) => ({ module: 'WAT', completedCount: w.totalWords, totalItems: w.totalWords, date: w.sessionDate })),
        ...srtHistory.slice(0, 3).map((s) => ({ module: 'SRT', completedCount: s.highPracticality, totalItems: s.totalSituations, date: s.sessionDate })),
        ...interviewSessions.slice(0, 2).map((i) => ({ module: 'INTERVIEW', completedCount: i.messages.filter((m) => m.role === 'candidate').length, totalItems: i.messages.length, date: i.startedAt })),
      ],
      conversationHistory: mentorSession.messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    };
  },

  // Clear all candidate data (privacy control)
  clearAllData(userId: string): void {
    const keys = [piqKey, olqKey, mentorKey, interviewKey, tatHistoryKey, watHistoryKey, srtHistoryKey];
    keys.forEach((keyFn) => localStorage.removeItem(keyFn(userId)));
  },
};
