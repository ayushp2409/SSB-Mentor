import { ReflectionEntry, RevisionItem, QuestionCategory } from '../types';
import { isFirebaseConfigured, db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEY_REFLECTIONS = 'ssb_mentor_reflections';
const STORAGE_KEY_REVISIONS = 'ssb_mentor_revisions';

function getLocalReflections(): ReflectionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REFLECTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Prepopulate standard SDT structure for cadet
  const initialSDT: ReflectionEntry = {
    id: 'sdt_template_001',
    userId: 'usr_student_001',
    title: 'Self-Description Test (SDT) - Master Draft',
    category: 'SDT',
    content: `### 1. Parents' Opinion
My parents consider me a responsible, dependable, and hardworking individual who always values family commitments. They appreciate my calm demeanour during domestic crises and my habit of planning ahead, though they sometimes advise me not to be overly perfectionist.

### 2. Teachers' / Mentors' Opinion
My teachers and professors have viewed me as an attentive, proactive student who actively participates in sports and group projects. They recognize my clarity of expression and reliability in executing leadership roles, though they encouraged me to delegate more often.

### 3. Friends' Opinion
My friends look upon me as a loyal, supportive, and cheerful companion who can be counted upon in any emergency. They value my sense of humor and candid advice, occasionally teasing me about my punctuality and strict adherence to schedules.

### 4. Self-Perception
I perceive myself as an emotionally balanced, curious, and determined person who welcomes challenges. I take ownership of my actions and believe in continuous personal learning through sports and physical fitness.

### 5. Qualities I Aim to Develop
I am actively working on expanding my depth in international geopolitics and improving my conversational Hindi fluency to communicate seamlessly across all ranks.`,
    tags: ['sdt', 'psychology', 'self_awareness', 'parents', 'teachers', 'friends'],
    createdAt: '2026-10-24T10:00:00Z',
    updatedAt: '2026-10-24T10:00:00Z',
  };

  const init = [initialSDT];
  localStorage.setItem(STORAGE_KEY_REFLECTIONS, JSON.stringify(init));
  return init;
}

function saveLocalReflections(items: ReflectionEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY_REFLECTIONS, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not save reflections:', e);
  }
}

function getLocalRevisions(): RevisionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVISIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveLocalRevisions(items: RevisionItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_REVISIONS, JSON.stringify(items));
  } catch (e) {}
}

export const reflectionService = {
  async getUserReflections(userId: string): Promise<ReflectionEntry[]> {
    if (isFirebaseConfigured) {
      const q = query(collection(db, 'reflections'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as ReflectionEntry);
    }
    const local = getLocalReflections();
    return local.filter(r => r.userId === userId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async saveReflection(entry: ReflectionEntry): Promise<ReflectionEntry> {
    if (isFirebaseConfigured) {
      await setDoc(doc(db, 'reflections', entry.id), entry);
    }
    const local = getLocalReflections();
    const idx = local.findIndex(r => r.id === entry.id);
    if (idx >= 0) {
      local[idx] = { ...entry, updatedAt: new Date().toISOString() };
    } else {
      local.unshift(entry);
    }
    saveLocalReflections(local);
    return entry;
  },

  async deleteReflection(id: string): Promise<void> {
    if (isFirebaseConfigured) {
      await deleteDoc(doc(db, 'reflections', id));
    }
    const local = getLocalReflections();
    saveLocalReflections(local.filter(r => r.id !== id));
  },

  // Spaced Repetition Bookmarks
  async addRevisionItem(userId: string, questionId: string, module: QuestionCategory, notes: string): Promise<RevisionItem> {
    const nextDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]; // 3 days review interval
    const item: RevisionItem = {
      id: `rev_${Date.now()}`,
      userId,
      questionId,
      module,
      notes,
      reviewIntervalDays: 3,
      nextReviewDate: nextDate,
      isResolved: false,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      await setDoc(doc(db, 'revisionItems', item.id), item);
    }
    const local = getLocalRevisions();
    local.push(item);
    saveLocalRevisions(local);
    return item;
  },

  async getUserRevisionItems(userId: string): Promise<RevisionItem[]> {
    if (isFirebaseConfigured) {
      const q = query(collection(db, 'revisionItems'), where('userId', '==', userId), where('isResolved', '==', false));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as RevisionItem);
    }
    const local = getLocalRevisions();
    return local.filter(r => r.userId === userId && !r.isResolved);
  }
};
