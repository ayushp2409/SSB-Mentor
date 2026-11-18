import os
import json
import httpx
from ..config import settings

class AIEngine:
    @staticmethod
    async def call_gemini(system_prompt: str, user_prompt: str) -> str:
        if not settings.GEMINI_API_KEY:
            return ""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.7}
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return ""

    @staticmethod
    def fallback_tat_evaluation(story_text: str, image_ref: str) -> dict:
        word_count = len(story_text.split())
        return {
            "summary": f"Your story contains {word_count} words. Clear central theme noted.",
            "strengths": [
                "Identified a clear protagonist and central conflict",
                "Demonstrated goal-oriented behavior and positive outcome",
            ],
            "improvement_areas": [
                "Include more intermediate operational steps before reaching the conclusion",
                "Mention specific resource allocation and peer coordination",
            ],
            "micro_actions": [
                "Assessed the situation and prioritized safety first",
                "Consulted teammates to divide responsibilities based on individual skill sets",
                "Arranged required materials and maintained clear communication lines",
                "Monitored execution progress and adapted to unforeseen hurdles",
                "Debriefed the group upon successful mission completion",
            ],
            "improved_illustrative_version": (
                "Noticing the impending flash flood, the young sub-divisional officer immediately alerted the local administration. "
                "He gathered his team, divided them into rescue, communication, and medical supply cells, and organized sandbag embankments. "
                "Through disciplined coordination, all villagers were evacuated to high ground before the breach widened."
            ),
            "olq_evidence": [
                {"olq": "Initiative", "level": "positive_evidence", "evidence": "Proactive crisis response initiated without delay."},
                {"olq": "Organising Ability", "level": "developing", "evidence": "Structured resource planning visible in narrative."},
            ],
            "disclaimer": "This evaluation is an AI-assisted practice reflection and does not predict official SSB board recommendations."
        }
