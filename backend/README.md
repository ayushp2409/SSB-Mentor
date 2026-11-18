# SSB Mentor — Central AI Intelligence Engine (FastAPI Backend)

This is the production-ready FastAPI backend for **SSB Mentor**, providing centralized AI services for all 9 specialized SSB preparation agents.

---

## Architecture Overview

- **Framework:** Python FastAPI
- **Database:** Supabase PostgreSQL / SQLite fallback (`SQLAlchemy` ORM)
- **AI Providers:** Dual abstraction (Google Gemini API + OpenAI API) with smart offline heuristic fallbacks
- **Deployment Targets:** Render, Railway, Docker, AWS ECS, or any standard Linux VPS

---

## Suggested Database Schema (15 Tables)

1. `users`: Credentials, emails, roles (cadet/admin)
2. `candidate_profiles`: Comprehensive PIQ profile (demographics, family, education, sports, motivation)
3. `practice_sessions`: Session metadata, duration, timestamps, modules
4. `interview_conversations`: Active and completed mock interview threads
5. `interview_answers`: Individual CIQ questions and candidate answers
6. `tat_stories`: TAT stories, picture references, extracted micro-actions
7. `wat_responses`: 60-word timed reactions, response latency, cliché flags
8. `srt_responses`: 60-situation reactions, practicality ratings
9. `gto_sessions`: Multi-agent Group Discussion transcripts & evaluations
10. `lecturette_sessions`: Audio transcripts, words-per-minute pace, filler word metrics
11. `olq_observations`: 15 Officer Like Qualities evidence mapping across Groups I–IV
12. `performance_reports`: Weekly/monthly cumulative performance dossiers
13. `preparation_tasks`: Dynamic daily and weekly adaptive roadmap items
14. `mentor_conversations`: Central "SSB Personal Mentor" chat memory
15. `knowledge_documents`: Verified defence and geopolitical articles for RAG

---

## Local Development Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Interactive OpenAPI Swagger documentation will be available at:
`http://localhost:8000/docs`

---

## Environment Variables (.env)

```env
DATABASE_URL=sqlite:///./ssb_mentor.db # or postgresql://user:pass@db.supabase.co:5432/postgres
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_secure_jwt_secret_here
```
