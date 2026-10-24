export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  targetSSBDate?: string;
  targetEntry?: string; // NDA, CDS, AFCAT, TGC, SSC-Tech, etc.
  preferredBoard?: string;
  dailyTimeTargetMinutes: number;
  restDays: number[]; // 0 = Sun, 6 = Sat
  activePriorities: string[];
  createdAt: string;
  updatedAt: string;
}

export type QuestionCategory =
  | 'OIR'
  | 'PPDT'
  | 'TAT'
  | 'WAT'
  | 'SRT'
  | 'LECTURETTE'
  | 'GTO'
  | 'INTERVIEW'
  | 'CURRENT_AFFAIRS';

export type VerificationStatus = 'unverified' | 'reviewed' | 'verified';
export type PublicationStatus = 'draft' | 'published' | 'archived';
export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Question {
  id: string;
  category: QuestionCategory;
  subcategory: string;
  title: string;
  content: string | null;
  assetStoragePath?: string | null;
  assetUrl?: string | null;
  metadata?: Record<string, any>;
  sourceArchive?: string;
  sourceFilename?: string;
  sourceReference?: string;
  tags: string[];
  difficulty?: QuestionDifficulty;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TestProfile {
  id: string;
  module: QuestionCategory;
  title: string;
  version: number;
  instructions: string;
  itemCount: number;
  selectionMode: 'ordered' | 'random' | 'set_based';
  timings: {
    viewingSeconds?: number;
    responseSeconds?: number;
    preparationSeconds?: number;
    speakingSeconds?: number;
    totalSeconds?: number;
  };
  allowedNavigation: boolean;
  autoProgress: boolean;
  autosaveIntervalSeconds: number;
  isPracticeProfile: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface TestResponse {
  questionId: string;
  responseText: string;
  timeTakenMs: number;
  skipped: boolean;
  notes?: string;
  characterBox?: {
    charactersCount: number;
    mainCharacterAge: string;
    mainCharacterSex: 'M' | 'F' | 'P';
    mainCharacterMood: '+' | '-' | '0';
    action: string;
  };
}

export interface SelfReflection {
  perceivedConfidence: number; // 1 to 5
  keyOLQsDemonstrated: string[];
  personalReviewNotes: string;
  whatWentWell?: string;
  whatToImprove?: string;
}

export interface TestAttempt {
  id: string;
  userId: string;
  module: QuestionCategory;
  profileId: string;
  profileVersion: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string | null;
  durationSeconds: number;
  totalItems: number;
  completedCount: number;
  skippedCount: number;
  responses: TestResponse[];
  selfReflection?: SelfReflection | null;
  audioRecordingUrl?: string | null;
}

export interface DailyTask {
  taskId: string;
  module: QuestionCategory;
  title: string;
  durationMinutes: number;
  isCompleted: boolean;
  completedAt?: string | null;
  attemptId?: string | null;
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  targetMinutes: number;
  tasks: DailyTask[];
  status: 'planned' | 'in_progress' | 'completed' | 'missed';
  rolloverFromDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionEntry {
  id: string;
  userId: string;
  title: string;
  category: 'SDT' | 'DAILY_JOURNAL' | 'INTERVIEW_EXPERIENCE' | 'GTO_INSIGHT';
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RevisionItem {
  id: string;
  userId: string;
  questionId: string;
  module: QuestionCategory;
  notes: string;
  reviewIntervalDays: number;
  nextReviewDate: string; // YYYY-MM-DD
  isResolved: boolean;
  createdAt: string;
}

export interface ImportBatchReport {
  id: string;
  importedBy: string;
  sourceArchive: string;
  category: QuestionCategory;
  totalFiles: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  errors: Array<{ filename: string; error: string }>;
  importedAt: string;
}
