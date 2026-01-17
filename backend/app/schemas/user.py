# ABOUTME: User-related Pydantic schemas for API validation
# ABOUTME: Handles user profiles, authentication responses, and stats

from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """Base user fields."""
    email: EmailStr
    username: str
    display_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserProfile(UserBase):
    """Full user profile with stats."""
    id: UUID
    created_at: datetime
    total_xp: int = 0
    current_level: int = 1
    streak_days: int = 0
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    
    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """User statistics summary."""
    total_questions_attempted: int = 0
    total_questions_correct: int = 0
    total_time_spent_minutes: int = 0
    contests_participated: int = 0
    contests_won: int = 0
    duels_won: int = 0
    duels_lost: int = 0
    current_ranking: Optional[int] = None


class AuthResponse(BaseModel):
    """Authentication response with tokens."""
    access_token: str
    refresh_token: str
    user: UserProfile
