# SSB Mentor — Complete Services Selection Board Preparation Platform

SSB Mentor is a full-stack, responsive, multi-user web application designed for aspirants preparing for officer selection in the Indian Armed Forces (Army, Navy, and Air Force). It covers both **Stage I (Screening)** and **Stage II (Psychology, GTO, and Personal Interview)** assessments.

---

## 1. Features Overview

### Stage I: Screening
- **Picture Perception & Description Test (PPDT):**
  - 30-second observation of hazy/clear picture prompts.
  - 1-minute character box recording (number of persons, age, sex, mood, and action title).
  - 4-minute individual story writing.
  - 1-minute individual narration practice with optional audio recording.
  - Group discussion reflection and consensus-building guidelines.

### Stage II: Psychological Tests
- **Word Association Test (WAT):**
  - Sequential presentation of 60 words for exactly 15 seconds each.
  - Distraction-free, centered UI with automatic advance on timeout.
  - Real-time autosave of response text and latency (reaction time in milliseconds).
  - Post-test review with skipped word detection and spaced revision bookmarking.
- **Thematic Apperception Test (TAT):**
  - 12-slide battery: 11 real picture prompts + 1 blank slide (Slide 12).
  - 30-second observation phase followed by 4-minute story writing.
  - Guided structure prompts: Past $\to$ Present $\to$ Future.
  - Post-test self-reflection (OLQ identification and confidence scoring).
- **Situation Reaction Test (SRT):**
  - 60 practical emergency and daily dilemmas within a 30-minute countdown.
  - Interactive question palette (Answered, Unanswered, Current).
  - Autosave on blur and completion analytics.
- **Self-Description Test (SDT):**
  - Master template covering Parents, Teachers, Friends, Self-perception, and Qualities to Develop.

### Stage II: GTO & Interview
- **Lecturette Studio:**
  - 4-topic card generator (High, Medium 1, Medium 2, General).
  - 3-minute preparation countdown with bullet-point scratchpad.
  - 3-minute speaking timer with optional microphone recording.
  - Self-evaluation rubric covering Introduction, Content, Fluency, and Conclusion.
  - Searchable repository of curated defense and geopolitics topics.
- **Group Planning Exercise (GPE / GTO):**
  - Tactical narratives with map-based emergency scenarios.
  - Problem Priority Matrix tool (Life-threatening $\to$ Serious crime/danger $\to$ Minor target).
  - Resource and time calculation planner with assessor strategy benchmarks.
- **Personal Interview & CIQ Series:**
  - Structured modules for CIQ 1 (Education), CIQ 2 (Family), CIQ 3 (Friends), CIQ 4 (Motivation), and Technical Defense questions.
  - Private experience logger preventing fabricated AI narratives.

### Student Daily Target Engine & Analytics
- 90-minute daily workload by default (fully adjustable).
- Automated module rotation over the week.
- Intelligent backlog rescheduling (preventing demotivating task pile-up).
- Spaced repetition revision queue for bookmarked weak areas.

### Administrator Console
- Searchable and filterable master question bank (2,268+ real SSB items).
- Single-item create, edit, draft, publish, and archive operations.
- Bulk JSON ingestion pipeline with dry-run preview and duplicate detection.
- Question bank JSON export.

---

## 2. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React.
- **Backend & Storage:** Firebase Authentication, Cloud Firestore, Firebase Cloud Storage.
- **Data Ingestion:** Python (PyMuPDF, Pillow, python-pptx) for safe PDF/PPT extraction.
- **Testing:** Vitest, React Testing Library, JSDOM.

---

## 3. Quick Start (Local Development)

### Prerequisites
- Node.js v18+ (tested on v24)
- Python 3.10+ (for data ingestion scripts)

### Installation
```bash
# Clone or navigate to the repository
cd SSBMentor

# Install frontend dependencies
npm install

# Start local development server
npm run dev
```

The application will be live at `http://localhost:5173`.

---

## 4. Test Accounts & Instant Demo Access

When Firebase credentials are not yet configured, the app runs in **Local Demo Mode** using local storage and pre-loaded extracted questions:

| Account Role | Email | Password | Access Level |
|---|---|---|---|
| **Cadet / Student** | `cadet@ssbmentor.in` | `Cadet@123` | Dashboard, Practice Tests, Journal, Progress |
| **Administrator** | `admin@ssbmentor.in` | `Admin@123` | Full Question Bank Manager, Bulk Import, Edit, Export |

*Tip: You can also use the one-click role switcher in the navigation bar to immediately toggle between Cadet and Admin views.*

---

## 5. Running Automated Tests & Production Build

```bash
# Run unit & integration test suite (Vitest)
npm run test

# Run production build (TypeScript check + Vite bundle)
npm run build
```

---

## 6. Firebase Setup & Production Deployment

### Step 1: Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (e.g. `ssb-mentor`).
3. Enable **Authentication** (Email/Password provider).
4. Enable **Cloud Firestore** in production mode.
5. Enable **Firebase Storage**.

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Firebase credentials:
```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef"
VITE_USE_LOCAL_STORAGE_MOCK="false"
```

### Step 3: Deploy Security Rules
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize and deploy rules
firebase deploy --only firestore:rules,storage
```

### Step 4: Initial Administrator Bootstrap
To designate the first administrator account:
1. Register an account via `/register` with your email.
2. In Firebase Console $\to$ **Firestore Database** $\to$ `users` collection, locate your user document.
3. Change the `role` field from `"student"` to `"admin"`.
*(Client code and registration forms strictly forbid self-assigning the admin role).*

---

## 7. Data Directory Structure

```
data/
├── source-zips/           # Immutable original ZIP downloads
│   ├── drive-download-20261024T144514Z-1-001.zip (GTO/GPE)
│   ├── drive-download-20261024T144713Z-1-001.zip (Interview/CIQ)
│   ├── drive-download-20261024T144845Z-1-001.zip (Lecturette)
│   ├── drive-download-20261024T145407Z-1-001.zip (SRT)
│   ├── drive-download-20261024T150103Z-1-001.zip (TAT)
│   ├── drive-download-20261024T150301Z-1-001.zip (OIR Booklets)
│   ├── drive-download-20261024T150456Z-1-001.zip (PPDT)
│   └── drive-download-20261024T150622Z-1-001.zip (WAT)
├── staging/               # Extracted files segregated by category
├── manifests/             # Category JSON manifests and combined question bank
└── import-reports/        # Audit and ingestion logs
```

---

## 8. Disclaimer

SSB Mentor is an independent training preparation platform developed to assist defense aspirants in cultivating Officer Like Qualities (OLQs), structured writing, and communication confidence. The platform does not guarantee recommendation, predict selection board results, or claim official affiliation with the Ministry of Defence, DIPR, or the Services Selection Board.
