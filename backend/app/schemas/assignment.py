# ABOUTME: Assignment schemas for personalized learning assignments
# ABOUTME: Generated based on user mastery, code quality, and performance metrics

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class AssignmentType(str, Enum):
    PRACTICE = "practice"
    REINFORCEMENT = "reinforcement"
    CHALLENGE = "challenge"
    REVIEW = "review"


class AssignmentStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"


class AssignmentQuestion(BaseModel):
    """A question within an assignment."""
    question_id: UUID
    order: int
    is_completed: bool = False
    is_correct: Optional[bool] = None
    time_taken_seconds: Optional[int] = None


class AssignmentCreate(BaseModel):
    """Schema for creating an assignment."""
    user_id: UUID
    title: str
    description: Optional[str] = None
    assignment_type: AssignmentType
    target_topics: List[str]
    question_count: int
    due_date: Optional[datetime] = None
    xp_bonus: int = 0


class Assignment(BaseModel):
    """Full assignment with questions."""
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str] = None
    assignment_type: AssignmentType
    target_topics: List[str]
    questions: List[AssignmentQuestion]
    status: AssignmentStatus
    due_date: Optional[datetime] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    total_xp_earned: int = 0
    xp_bonus: int = 0
    
    class Config:
        from_attributes = True


class AssignmentGenerationCriteria(BaseModel):
    """Criteria for generating personalized assignments."""
    user_id: UUID
    focus_on_weaknesses: bool = True
    include_strengths: bool = False
    target_difficulty: Optional[str] = None
    max_questions: int = 10
    topics: Optional[List[str]] = None
