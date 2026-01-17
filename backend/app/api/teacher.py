# ABOUTME: AI Teacher API endpoints for personalized learning
# ABOUTME: Handles mastery tracking, hints, and step-wise problem solving

from fastapi import APIRouter, HTTPException, status, Depends
from uuid import UUID
from ..schemas.mastery import (
    UserMasteryProfile, StepwiseHintRequest, StepwiseHintResponse,
    StepSolutionRequest, StepSolutionResponse
)
from ..schemas.assignment import (
    Assignment, AssignmentGenerationCriteria, AssignmentStatus
)
from ..schemas.user import UserProfile
from ..services.mastery_service import mastery_service
from ..services.assignment_service import assignment_service
from ..services.question_service import question_service
from .deps import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/teacher", tags=["AI Teacher"])


@router.get("/mastery", response_model=UserMasteryProfile)
async def get_my_mastery(
    current_user: UserProfile = Depends(get_current_user)
):
    """Get the current user's mastery profile."""
    return await mastery_service.get_user_mastery(current_user.id)


@router.get("/mastery/{user_id}", response_model=UserMasteryProfile)
async def get_user_mastery(
    user_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
):
    """Get a user's mastery profile (admin or self only)."""
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view other users' mastery profiles"
        )
    return await mastery_service.get_user_mastery(user_id)


@router.post("/hint", response_model=StepwiseHintResponse)
async def get_hint(
    request: StepwiseHintRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Get a progressive hint for a specific step.
    Hints escalate based on the number of previous attempts.
    """
    question = await question_service.get_question(request.question_id)
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    if not question.steps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This question does not have steps"
        )
    
    try:
        return await mastery_service.get_stepwise_hint(request, question)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/solve-step", response_model=StepSolutionResponse)
async def solve_step(
    request: StepSolutionRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Get the solution for only one specific step.
    Does not reveal solutions for other steps.
    """
    question = await question_service.get_question(request.question_id)
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    if not question.steps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This question does not have steps"
        )
    
    try:
        return await mastery_service.solve_step(request, question)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/assignments/generate", response_model=Assignment)
async def generate_assignment(
    criteria: Optional[AssignmentGenerationCriteria] = None,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Generate a personalized assignment based on user's learning profile.
    Uses mastery levels, code quality, and performance metrics.
    """
    if criteria is None:
        criteria = AssignmentGenerationCriteria(
            user_id=current_user.id,
            focus_on_weaknesses=True,
            include_strengths=False,
            max_questions=10
        )
    else:
        criteria.user_id = current_user.id
    
    try:
        return await assignment_service.generate_assignment(criteria)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/assignments", response_model=List[Assignment])
async def get_my_assignments(
    status: Optional[AssignmentStatus] = None,
    current_user: UserProfile = Depends(get_current_user)
):
    """Get the current user's assignments."""
    return await assignment_service.get_user_assignments(current_user.id, status)


@router.post("/assignments/{assignment_id}/complete-question")
async def complete_assignment_question(
    assignment_id: UUID,
    question_id: UUID,
    is_correct: bool,
    time_taken: int,
    current_user: UserProfile = Depends(get_current_user)
):
    """Mark a question in an assignment as completed."""
    try:
        return await assignment_service.complete_assignment_question(
            assignment_id, question_id, is_correct, time_taken
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
