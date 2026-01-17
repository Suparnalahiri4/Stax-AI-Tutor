# ABOUTME: Question-related schemas for the question generation system
# ABOUTME: Handles questions, steps, hints, and verification status

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    CODING = "coding"
    SHORT_ANSWER = "short_answer"
    MULTI_STEP = "multi_step"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class QuestionStep(BaseModel):
    """A single step in a multi-step question."""
    step_number: int
    description: str
    expected_output: Optional[str] = None
    hints: List[str] = []
    solution: str


class QuestionBase(BaseModel):
    """Base question fields."""
    title: str
    description: str
    topic: str
    subtopic: Optional[str] = None
    difficulty: DifficultyLevel
    question_type: QuestionType
    tags: List[str] = []


class QuestionCreate(QuestionBase):
    """Schema for creating a question."""
    options: Optional[List[str]] = None  # For MCQ
    correct_answer: str
    steps: Optional[List[QuestionStep]] = None  # For multi-step
    time_limit_seconds: Optional[int] = None
    xp_reward: int = 10


class Question(QuestionBase):
    """Full question with metadata."""
    id: UUID
    options: Optional[List[str]] = None
    correct_answer: str
    steps: Optional[List[QuestionStep]] = None
    time_limit_seconds: Optional[int] = None
    xp_reward: int
    verification_status: VerificationStatus
    created_at: datetime
    verified_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class QuestionGenerationRequest(BaseModel):
    """Request to generate new questions."""
    topic: str
    subtopic: Optional[str] = None
    difficulty: DifficultyLevel
    question_type: QuestionType
    count: int = 1
    specific_concepts: Optional[List[str]] = None


class QuestionAttempt(BaseModel):
    """Schema for submitting a question attempt."""
    question_id: UUID
    user_answer: str
    time_taken_seconds: int
    current_step: Optional[int] = None  # For multi-step questions


class AttemptResult(BaseModel):
    """Result of a question attempt."""
    is_correct: bool
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    xp_earned: int
    mastery_change: float
    next_hint: Optional[str] = None  # If wrong and hints available
