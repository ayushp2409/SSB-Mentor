import { TestAttempt, TestResponse, SelfReflection, QuestionCategory } from '../types';
import { isFirebaseConfigured, db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const STORAGE_KEY_ATTEMPTS = 'ssb_mentor_attempts_db';

function getLocalAttempts(): TestAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveLocalAttempts(items: TestAttempt[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not save attempts to localStorage:', e);
  }
}

export const attemptService = {
  async createAttempt(
    userId: string,
    module: QuestionCategory,
    profileId: string,
    profileVersion: number,
    totalItems: number
  ): Promise<TestAttempt> {
    const newAttempt: TestAttempt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      module,
      profileId,
      profileVersion,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      completedAt: null,
      durationSeconds: 0,
      totalItems,
      completedCount: 0,
      skippedCount: 0,
      responses: [],
      selfReflection: null,
    };

    if (isFirebaseConfigured) {
      await setDoc(doc(db, 'testAttempts', newAttempt.id), newAttempt);
    }

    const local = getLocalAttempts();
    local.push(newAttempt);
    saveLocalAttempts(local);
    return newAttempt;
  },

  async autosaveResponse(attemptId: string, response: TestResponse): Promise<void> {
    const local = getLocalAttempts();
    const attempt = local.find(a => a.id === attemptId);
    if (!attempt) return;

    const existingIdx = attempt.responses.findIndex(r => r.questionId === response.questionId);
    if (existingIdx >= 0) {
      attempt.responses[existingIdx] = response;
    } else {
      attempt.responses.push(response);
    }

    attempt.completedCount = attempt.responses.filter(r => !r.skipped && r.responseText.trim().length > 0).length;
    attempt.skippedCount = attempt.responses.filter(r => r.skipped).length;

    saveLocalAttempts(local);

    if (isFirebaseConfigured) {
      await updateDoc(doc(db, 'testAttempts', attemptId), {
        responses: attempt.responses,
        completedCount: attempt.completedCount,
        skippedCount: attempt.skippedCount,
      });
    }
  },

  async completeAttempt(
    attemptId: string,
    durationSeconds: number,
    selfReflection?: SelfReflection | null
  ): Promise<TestAttempt> {
    const local = getLocalAttempts();
    const attempt = local.find(a => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found');

    attempt.status = 'completed';
    attempt.completedAt = new Date().toISOString();
    attempt.durationSeconds = durationSeconds;
    if (selfReflection) {
      attempt.selfReflection = selfReflection;
    }

    saveLocalAttempts(local);

    if (isFirebaseConfigured) {
      await updateDoc(doc(db, 'testAttempts', attemptId), {
        status: 'completed',
        completedAt: attempt.completedAt,
        durationSeconds,
        selfReflection: selfReflection || null,
      });
    }
    return attempt;
  },

  async getAttemptById(attemptId: string): Promise<TestAttempt | null> {
    if (isFirebaseConfigured) {
      const snap = await getDoc(doc(db, 'testAttempts', attemptId));
      return snap.exists() ? (snap.data() as TestAttempt) : null;
    }
    const local = getLocalAttempts();
    return local.find(a => a.id === attemptId) || null;
  },

  async getUserAttempts(userId: string): Promise<TestAttempt[]> {
    if (isFirebaseConfigured) {
      const q = query(collection(db, 'testAttempts'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as TestAttempt);
    }
    const local = getLocalAttempts();
    return local.filter(a => a.userId === userId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
};
