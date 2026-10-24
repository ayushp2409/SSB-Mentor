import { UserProfile, UserRole } from '../types';
import { isFirebaseConfigured, auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const STORAGE_KEY_AUTH = 'ssb_mentor_current_user';
const STORAGE_KEY_USERS = 'ssb_mentor_users_db';

const DEMO_STUDENT: UserProfile = {
  id: 'usr_cadet_ssbmentor_in',
  email: 'cadet@ssbmentor.in',
  displayName: 'Cadet Vikram Batra',
  role: 'student',
  targetSSBDate: '2026-12-15',
  targetEntry: 'CDS (IMA)',
  preferredBoard: '1 AFSB Dehradun',
  dailyTimeTargetMinutes: 90,
  restDays: [0],
  activePriorities: ['TAT', 'WAT', 'Lecturette'],
  createdAt: '2026-10-24T10:00:00Z',
  updatedAt: '2026-10-24T10:00:00Z',
};

const DEMO_ADMIN: UserProfile = {
  id: 'usr_admin_ssbmentor_in',
  email: 'admin@ssbmentor.in',
  displayName: 'Col. Rajesh Sharma (Assessor)',
  role: 'admin',
  dailyTimeTargetMinutes: 60,
  restDays: [0],
  activePriorities: ['Question Bank Review', 'Candidate Evaluation'],
  createdAt: '2026-10-24T08:00:00Z',
  updatedAt: '2026-10-24T08:00:00Z',
};

function formatDisplayNameFromEmail(email: string): string {
  const namePart = email.split('@')[0];
  const cleaned = namePart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Cadet Aspirant';
  return cleaned
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function generateUserIdFromEmail(email: string): string {
  return 'usr_' + email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
}

function getLocalUsers(): Record<string, { profile: UserProfile; passwordHash: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  const initial = {
    [DEMO_STUDENT.email]: { profile: DEMO_STUDENT, passwordHash: 'Cadet@123' },
    [DEMO_ADMIN.email]: { profile: DEMO_ADMIN, passwordHash: 'Admin@123' },
  };
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(initial));
  return initial;
}

export const authService = {
  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUTH);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // Return null when unauthenticated so user is prompted with Login/Signup
    return null;
  },

  async login(email: string, pass: string): Promise<UserProfile> {
    const cleanEmail = email.toLowerCase().trim();

    if (isFirebaseConfigured) {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(profile));
        return profile;
      }
    }

    // Local authentication (pure email & password, no external auth needed)
    const users = getLocalUsers();
    const existing = users[cleanEmail];
    if (!existing) {
      throw new Error('No account found with this email. Please click "Sign Up" to create an account.');
    }

    if (existing.passwordHash !== pass) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(existing.profile));
    return existing.profile;
  },

  async register(email: string, pass: string): Promise<UserProfile> {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!pass || pass.length < 4) {
      throw new Error('Password must be at least 4 characters.');
    }

    const userId = generateUserIdFromEmail(cleanEmail);
    const displayName = formatDisplayNameFromEmail(cleanEmail);

    if (isFirebaseConfigured) {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const newProfile: UserProfile = {
        id: cred.user.uid,
        email: cleanEmail,
        displayName,
        role: 'student',
        targetEntry: 'CDS',
        dailyTimeTargetMinutes: 90,
        restDays: [0],
        activePriorities: ['TAT', 'WAT', 'SRT'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newProfile));
      return newProfile;
    }

    // Local Signup Flow
    const users = getLocalUsers();
    if (users[cleanEmail]) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const newProfile: UserProfile = {
      id: userId,
      email: cleanEmail,
      displayName,
      role: 'student',
      targetEntry: 'CDS',
      dailyTimeTargetMinutes: 90,
      restDays: [0],
      activePriorities: ['TAT', 'WAT', 'SRT'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users[cleanEmail] = { profile: newProfile, passwordHash: pass };
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newProfile));
    return newProfile;
  },

  async logout(): Promise<void> {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    localStorage.removeItem(STORAGE_KEY_AUTH);
  },

  async resetPassword(email: string): Promise<void> {
    if (isFirebaseConfigured) {
      await sendPasswordResetEmail(auth, email);
      return;
    }
    const users = getLocalUsers();
    if (!users[email.toLowerCase().trim()]) {
      throw new Error('No account found with this email.');
    }
  },

  async updateProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'role' | 'email'>>): Promise<UserProfile> {
    const current = this.getCurrentUser();
    if (!current || current.id !== userId) {
      throw new Error('Unauthorized profile modification.');
    }

    const updatedProfile: UserProfile = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      await updateDoc(doc(db, 'users', userId), updates);
    }

    const users = getLocalUsers();
    if (users[current.email]) {
      users[current.email].profile = updatedProfile;
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updatedProfile));
    return updatedProfile;
  },

  // Helper to switch or seed demo role for evaluator convenience
  switchDemoRole(role: UserRole): UserProfile {
    const target = role === 'admin' ? DEMO_ADMIN : DEMO_STUDENT;
    const users = getLocalUsers();
    users[target.email] = { profile: target, passwordHash: role === 'admin' ? 'Admin@123' : 'Cadet@123' };
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(target));
    return target;
  },
};
