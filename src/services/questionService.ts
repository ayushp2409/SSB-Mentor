import { Question, QuestionCategory } from '../types';
import rawQuestions from '../data/mockQuestionBank.json';
import { isFirebaseConfigured, db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEY_QUESTIONS = 'ssb_mentor_questions_db';

function getLocalQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Initialize with the 2,268 extracted items from real source files
  const initial = rawQuestions as Question[];
  try {
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(initial));
  } catch (e) {
    // If local storage quota exceeded, return in-memory rawQuestions
    return rawQuestions as Question[];
  }
  return initial;
}

function saveLocalQuestions(items: Question[]) {
  try {
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

export const questionService = {
  async getQuestionsByCategory(category: QuestionCategory, includeUnpublished = false): Promise<Question[]> {
    if (isFirebaseConfigured) {
      const colRef = collection(db, 'questions');
      const q = includeUnpublished
        ? query(colRef, where('category', '==', category))
        : query(colRef, where('category', '==', category), where('publicationStatus', '==', 'published'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Question);
    }

    const local = getLocalQuestions();
    return local.filter(q => {
      const matchCat = q.category === category;
      return includeUnpublished ? matchCat : matchCat && q.publicationStatus === 'published';
    });
  },

  async getAllQuestions(): Promise<Question[]> {
    if (isFirebaseConfigured) {
      const snap = await getDocs(collection(db, 'questions'));
      return snap.docs.map(d => d.data() as Question);
    }
    return getLocalQuestions();
  },

  async getQuestionById(id: string): Promise<Question | null> {
    const questions = await this.getAllQuestions();
    return questions.find(q => q.id === id) || null;
  },

  async getRandomQuestions(category: QuestionCategory, count: number): Promise<Question[]> {
    const questions = await this.getQuestionsByCategory(category, false);
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  },

  async saveQuestion(question: Question): Promise<Question> {
    if (isFirebaseConfigured) {
      await setDoc(doc(db, 'questions', question.id), question);
      return question;
    }

    const local = getLocalQuestions();
    const idx = local.findIndex(q => q.id === question.id);
    if (idx >= 0) {
      local[idx] = { ...question, updatedAt: new Date().toISOString() };
    } else {
      local.push({
        ...question,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    saveLocalQuestions(local);
    return question;
  },

  async deleteQuestion(id: string): Promise<void> {
    if (isFirebaseConfigured) {
      await deleteDoc(doc(db, 'questions', id));
      return;
    }

    const local = getLocalQuestions();
    const filtered = local.filter(q => q.id !== id);
    saveLocalQuestions(filtered);
  },

  async batchImportQuestions(newItems: Question[]): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;
    const local = getLocalQuestions();
    const existingIds = new Set(local.map(q => q.id));

    for (const item of newItems) {
      if (existingIds.has(item.id)) {
        skipped++;
      } else {
        local.push(item);
        existingIds.add(item.id);
        imported++;
      }
    }

    saveLocalQuestions(local);
    return { imported, skipped };
  }
};
