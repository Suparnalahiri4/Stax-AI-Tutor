# ABOUTME: Contest and gamification schemas for competitive features
# ABOUTME: Handles contests, duels, 3v3 battles, and marathons

from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from uuid import UUID
from enum import Enum


class ContestLevel(str, Enum):
    CITY = "city"
    STATE = "state"
    NATIONAL = "national"
    GLOBAL = "global"


class ContestStatus(str, Enum):
    UPCOMING = "upcoming"
    LIVE = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DuelStatus(str, Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ContestCreate(BaseModel):
    """Schema for creating a contest."""
    title: str
    description: Optional[str] = None
    level: ContestLevel
    topics: List[str]
    start_time: datetime
    end_time: datetime
    max_participants: Optional[int] = None
    xp_rewards: Dict[str, int] = {"1st": 500, "2nd": 300, "3rd": 150}


class Contest(ContestCreate):
    """Full contest with metadata."""
    id: UUID
    status: ContestStatus
    participant_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True


class ContestParticipant(BaseModel):
    """Participant in a contest."""
    user_id: UUID
    username: str
    display_name: Optional[str] = None
    score: int = 0
    questions_solved: int = 0
    rank: Optional[int] = None
    finish_time: Optional[datetime] = None


class ContestLeaderboard(BaseModel):
    """Contest leaderboard."""
    contest_id: UUID
    participants: List[ContestParticipant]
    last_updated: datetime


class DuelChallenge(BaseModel):
    """Challenge someone to a duel."""
    opponent_id: Optional[UUID] = None  # None for random match
    topic: Optional[str] = None
    question_count: int = 5
    time_limit_seconds: int = 300


class Duel(BaseModel):
    """Active duel between two users."""
    id: UUID
    challenger_id: UUID
    opponent_id: UUID
    topic: Optional[str] = None
    questions: List[UUID]
    challenger_score: int = 0
    opponent_score: int = 0
    status: DuelStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    winner_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True


class TeamMember(BaseModel):
    """Member of a 3v3 team."""
    user_id: UUID
    username: str
    score: int = 0
    is_captain: bool = False


class Team3v3(BaseModel):
    """A team in a 3v3 standoff."""
    id: UUID
    name: str
    members: List[TeamMember]
    total_score: int = 0


class Standoff3v3(BaseModel):
    """3v3 team battle."""
    id: UUID
    team_a: Team3v3
    team_b: Team3v3
    topic: Optional[str] = None
    questions: List[UUID]
    status: DuelStatus
    created_at: datetime
    winner_team_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True


class Marathon(BaseModel):
    """Extended coding marathon event."""
    id: UUID
    title: str
    description: Optional[str] = None
    topics: List[str]
    start_time: datetime
    end_time: datetime
    checkpoints: List[datetime]  # Milestone times
    participant_count: int = 0
    status: ContestStatus
    xp_multiplier: float = 2.0  # Bonus XP during marathon
    
    class Config:
        from_attributes = True
