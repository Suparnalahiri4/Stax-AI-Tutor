# ABOUTME: Mastery tracking schemas for the AI teacher system
# ABOUTME: Handles topic mastery indices and learning progress

from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime
from uuid import UUID


class TopicMastery(BaseModel):
    """Mastery level for a single topic."""
    topic: str
    subtopic: Optional[str] = None
    mastery_probability: float = Field(ge=0.0, le=1.0, default=0.5)
    total_attempts: int = 0
    correct_attempts: int = 0
    average_time_seconds: float = 0.0
    last_attempted: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserMasteryProfile(BaseModel):
    """Complete mastery profile for a user."""
    user_id: UUID
    topics: List[TopicMastery]
    overall_mastery: float = Field(ge=0.0, le=1.0, default=0.5)
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommended_topics: List[str] = []
    last_updated: datetime


class MasteryUpdate(BaseModel):
    """Update to mastery after an attempt."""
    topic: str
    subtopic: Optional[str] = None
    is_correct: bool
    time_taken_seconds: int
    difficulty: str


class StepwiseHintRequest(BaseModel):
    """Request for a hint on a specific step."""
    question_id: UUID
    step_number: int
    previous_attempts: List[str] = []


class StepwiseHintResponse(BaseModel):
    """Response with a hint for the current step."""
    hint_level: int  # 1 = subtle, 2 = moderate, 3 = detailed
    hint_text: str
    should_reveal_solution: bool = False
    solution: Optional[str] = None


class StepSolutionRequest(BaseModel):
    """Request to solve only a specific step."""
    question_id: UUID
    step_number: int
    show_explanation: bool = True


class StepSolutionResponse(BaseModel):
    """Solution for a single step."""
    step_number: int
    solution: str
    explanation: Optional[str] = None
    next_step_hint: Optional[str] = None
