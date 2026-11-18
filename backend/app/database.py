from datetime import datetime
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 1. users
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    role = Column(String, default="student")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("CandidateProfile", back_populates="user", uselist=False)

# 2. candidate_profiles (PIQ)
class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    target_entry = Column(String, default="CDS")
    target_arm = Column(String, default="Army")
    age = Column(Integer, nullable=True)
    education_data = Column(JSON, default=dict)
    family_data = Column(JSON, default=dict)
    activities_data = Column(JSON, default=dict)
    motivation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")

# 3. practice_sessions
class PracticeSession(Base):
    __tablename__ = "practice_sessions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    module = Column(String, index=True) # TAT, WAT, SRT, INTERVIEW, GTO, LECTURETTE
    status = Column(String, default="completed")
    duration_seconds = Column(Integer, default=0)
    score_data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

# 4. interview_conversations
class InterviewConversation(Base):
    __tablename__ = "interview_conversations"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    status = Column(String, default="active")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

# 5. interview_answers
class InterviewAnswer(Base):
    __tablename__ = "interview_answers"
    id = Column(String, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("interview_conversations.id"), index=True)
    role = Column(String, nullable=False) # interviewer / candidate
    content = Column(Text, nullable=False)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# 6. tat_stories
class TATStory(Base):
    __tablename__ = "tat_stories"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    image_ref = Column(String, nullable=False)
    story_text = Column(Text, nullable=False)
    micro_actions = Column(JSON, default=list)
    evaluation_data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

# 7. wat_responses
class WATResponse(Base):
    __tablename__ = "wat_responses"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    word = Column(String, nullable=False)
    response_text = Column(String, nullable=False)
    latency_ms = Column(Integer, default=0)
    is_cliche = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# 8. srt_responses
class SRTResponse(Base):
    __tablename__ = "srt_responses"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    situation_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=False)
    practicality = Column(String, default="high")
    created_at = Column(DateTime, default=datetime.utcnow)

# 9. gto_sessions
class GTOSession(Base):
    __tablename__ = "gto_sessions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    task_type = Column(String, default="GD") # GD / GPE
    topic = Column(String, nullable=False)
    transcript = Column(JSON, default=list)
    evaluation = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

# 10. lecturette_sessions
class LecturetteSession(Base):
    __tablename__ = "lecturette_sessions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    topic = Column(String, nullable=False)
    transcript = Column(Text, nullable=True)
    duration_seconds = Column(Integer, default=180)
    wpm_pace = Column(String, default="ideal")
    filler_word_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

# 11. olq_observations
class OLQObservation(Base):
    __tablename__ = "olq_observations"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    olq_name = Column(String, index=True, nullable=False)
    level = Column(String, default="positive_evidence")
    source_module = Column(String, nullable=False)
    evidence_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# 12. performance_reports
class PerformanceReport(Base):
    __tablename__ = "performance_reports"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    report_type = Column(String, default="weekly")
    summary_data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

# 13. preparation_tasks
class PreparationTask(Base):
    __tablename__ = "preparation_tasks"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    schedule_date = Column(String, index=True) # YYYY-MM-DD
    title = Column(String, nullable=False)
    module = Column(String, nullable=False)
    duration_minutes = Column(Integer, default=30)
    is_completed = Column(Boolean, default=False)

# 14. mentor_conversations
class MentorConversation(Base):
    __tablename__ = "mentor_conversations"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    role = Column(String, nullable=False) # candidate / mentor
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# 15. knowledge_documents
class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    source = Column(String, nullable=True)
    publication_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
