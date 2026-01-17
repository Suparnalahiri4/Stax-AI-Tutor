# ABOUTME: Contest and gamification API endpoints
# ABOUTME: Handles contests, duels, 3v3 standoffs, and marathons

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from uuid import UUID
from ..schemas.contest import (
    Contest, ContestCreate, ContestLevel, ContestStatus,
    ContestLeaderboard, Duel, DuelChallenge,
    Standoff3v3, Marathon
)
from ..schemas.user import UserProfile
from ..services.contest_service import contest_service
from .deps import get_current_user

router = APIRouter(prefix="/contests", tags=["Contests & Gamification"])


# ==================== CONTESTS ====================

@router.post("/", response_model=Contest)
async def create_contest(
    data: ContestCreate,
    current_user: UserProfile = Depends(get_current_user)
):
    """Create a new contest (admin only in production)."""
    return await contest_service.create_contest(data)


@router.get("/", response_model=List[Contest])
async def get_contests(
    level: Optional[ContestLevel] = None,
    status: Optional[ContestStatus] = None,
    current_user: UserProfile = Depends(get_current_user)
):
    """Get available contests."""
    return await contest_service.get_contests(level, status)


@router.get("/upcoming", response_model=List[Contest])
async def get_upcoming_contests(
    current_user: UserProfile = Depends(get_current_user)
):
    """Get upcoming contests."""
    return await contest_service.get_contests(status=ContestStatus.UPCOMING)


@router.get("/live", response_model=List[Contest])
async def get_live_contests(
    current_user: UserProfile = Depends(get_current_user)
):
    """Get currently live contests."""
    return await contest_service.get_contests(status=ContestStatus.LIVE)


@router.post("/{contest_id}/join")
async def join_contest(
    contest_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
):
    """Join a contest."""
    try:
        await contest_service.join_contest(contest_id, current_user.id)
        return {"message": "Successfully joined contest"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{contest_id}/leaderboard", response_model=ContestLeaderboard)
async def get_contest_leaderboard(
    contest_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
):
    """Get contest leaderboard."""
    return await contest_service.get_leaderboard(contest_id)


# ==================== DUELS ====================

@router.post("/duels", response_model=Duel)
async def create_duel(
    challenge: DuelChallenge,
    current_user: UserProfile = Depends(get_current_user)
):
    """Create a duel challenge."""
    return await contest_service.create_duel(current_user.id, challenge)


@router.post("/duels/find-random", response_model=Optional[Duel])
async def find_random_duel(
    current_user: UserProfile = Depends(get_current_user)
):
    """Find and join a random duel waiting for an opponent."""
    duel = await contest_service.find_random_duel(current_user.id)
    if duel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No available duels found. Create one instead!"
        )
    return duel


@router.get("/duels/{duel_id}", response_model=Duel)
async def get_duel(
    duel_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
):
    """Get duel details."""
    try:
        return await contest_service.get_duel(duel_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/duels/{duel_id}/accept", response_model=Duel)
async def accept_duel(
    duel_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
):
    """Accept a duel challenge."""
    try:
        return await contest_service.accept_duel(duel_id, current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/duels/{duel_id}/submit")
async def submit_duel_answer(
    duel_id: UUID,
    question_id: UUID,
    is_correct: bool,
    current_user: UserProfile = Depends(get_current_user)
):
    """Submit an answer in a duel."""
    try:
        return await contest_service.submit_duel_answer(
            duel_id, current_user.id, question_id, is_correct
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/duels/{duel_id}/finish", response_model=Duel)
async def finish_duel(
    duel_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
):
    """Finish a duel and determine winner."""
    return await contest_service.finish_duel(duel_id)


# ==================== 3v3 STANDOFFS ====================

@router.post("/standoffs", response_model=Standoff3v3)
async def create_standoff(
    team_members: List[UUID],
    topic: Optional[str] = None,
    current_user: UserProfile = Depends(get_current_user)
):
    """Create a 3v3 standoff."""
    # Ensure current user is in the team
    if current_user.id not in team_members:
        team_members = [current_user.id] + team_members[:2]
    
    try:
        return await contest_service.create_standoff(team_members[:3], topic)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ==================== MARATHONS ====================

@router.post("/marathons", response_model=Marathon)
async def create_marathon(
    title: str,
    topics: List[str],
    duration_hours: int = 24,
    current_user: UserProfile = Depends(get_current_user)
):
    """Create a coding marathon event."""
    return await contest_service.create_marathon(title, topics, duration_hours)
