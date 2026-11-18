from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class UserAuthRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    role: str

class PIQProfileSchema(BaseModel):
    name: str
    age: Optional[int] = None
    target_entry: str = "CDS"
    target_arm: str = "Army"
    hometown: Optional[str] = None
    education: Optional[Dict[str, Any]] = None
    family: Optional[Dict[str, Any]] = None
    activities: Optional[Dict[str, Any]] = None
    motivation: Optional[str] = None

class TATEvaluationRequest(BaseModel):
    story_text: str
    image_ref: str
    piq: Optional[Dict[str, Any]] = None

class TATEvaluationResponse(BaseModel):
    summary: str
    strengths: List[str]
    improvement_areas: List[str]
    micro_actions: List[str]
    improved_illustrative_version: str
    olq_evidence: List[Dict[str, Any]]
    disclaimer: str

class WATBatchRequest(BaseModel):
    responses: List[Dict[str, str]] # [{'word': ..., 'response': ...}]

class SRTBatchRequest(BaseModel):
    responses: List[Dict[str, str]] # [{'situation': ..., 'response': ...}]

class InterviewNextQRequest(BaseModel):
    messages: List[Dict[str, Any]]
    piq: Optional[Dict[str, Any]] = None

class InterviewEvaluateRequest(BaseModel):
    messages: List[Dict[str, Any]]
    piq: Optional[Dict[str, Any]] = None

class GDNextMessageRequest(BaseModel):
    topic: str
    recent_messages: List[Dict[str, Any]]
    candidate_message: str

class SpeechAnalysisRequest(BaseModel):
    transcript: str
    topic: str
    duration_seconds: int = 180

class MentorChatRequest(BaseModel):
    question: str
    context: Optional[Dict[str, Any]] = None
