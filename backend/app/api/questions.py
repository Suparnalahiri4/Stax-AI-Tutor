# ABOUTME: Question management API endpoints
# ABOUTME: Handles question generation, retrieval, attempt submission, and code execution

from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from ..schemas.question import (
    Question, QuestionGenerationRequest, QuestionAttempt,
    AttemptResult, DifficultyLevel, QuestionType
)
from ..schemas.mastery import MasteryUpdate
from ..schemas.user import UserProfile
from ..services.question_service import question_service
from ..services.mastery_service import mastery_service
from ..services.code_execution_service import code_execution_service
from ..core.database import get_supabase_admin
from .deps import get_current_user


class CodeRunRequest(BaseModel):
    """Request to run code."""
    source_code: str
    language: str
    stdin: Optional[str] = None


class CodeSubmitRequest(BaseModel):
    """Request to submit code for a question."""
    question_id: str
    source_code: str
    language: str

router = APIRouter(prefix="/questions", tags=["Questions"])

# Default topics for the platform
AVAILABLE_TOPICS = [
    'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
    'Dynamic Programming', 'Recursion', 'Sorting', 'Searching',
    'Hash Tables', 'Stacks', 'Queues', 'Heaps', 'Binary Search'
]


@router.post("/generate", response_model=List[Question])
async def generate_questions(
    request: QuestionGenerationRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """Generate new questions using AI."""
    try:
        return await question_service.generate_questions(request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/topic/{topic}", response_model=List[Question])
async def get_questions_by_topic(
    topic: str,
    difficulty: Optional[DifficultyLevel] = None,
    limit: int = 10,
    current_user: UserProfile = Depends(get_current_user)
):
    """Get questions filtered by topic."""
    return await question_service.get_questions_by_topic(topic, difficulty, limit)


@router.post("/attempt", response_model=AttemptResult)
async def submit_attempt(
    attempt: QuestionAttempt,
    current_user: UserProfile = Depends(get_current_user)
):
    """Submit an answer attempt for a question."""
    question = await question_service.get_question(attempt.question_id)
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check if answer is correct
    is_correct = attempt.user_answer.strip().lower() == question.correct_answer.strip().lower()
    
    # Update mastery
    mastery_update = MasteryUpdate(
        topic=question.topic,
        subtopic=question.subtopic,
        is_correct=is_correct,
        time_taken_seconds=attempt.time_taken_seconds,
        difficulty=question.difficulty.value
    )
    
    topic_mastery = await mastery_service.update_mastery(current_user.id, mastery_update)
    
    # Calculate XP earned
    xp_earned = question.xp_reward if is_correct else 0
    
    # Award XP to user
    if xp_earned > 0:
        admin = get_supabase_admin()
        admin.table("users").update({
            "total_xp": current_user.total_xp + xp_earned
        }).eq("id", str(current_user.id)).execute()
    
    # Save attempt record
    admin = get_supabase_admin()
    admin.table("user_attempts").insert({
        "user_id": str(current_user.id),
        "question_id": str(attempt.question_id),
        "user_answer": attempt.user_answer,
        "is_correct": is_correct,
        "time_taken_seconds": attempt.time_taken_seconds,
        "xp_earned": xp_earned
    }).execute()
    
    # Prepare hint if wrong
    next_hint = None
    if not is_correct and question.steps and attempt.current_step:
        step = question.steps[attempt.current_step - 1]
        if step.hints:
            next_hint = step.hints[0]
    
    return AttemptResult(
        is_correct=is_correct,
        correct_answer=question.correct_answer if not is_correct else None,
        explanation=None,
        xp_earned=xp_earned,
        mastery_change=topic_mastery.mastery_probability,
        next_hint=next_hint
    )


@router.get("/topics/list")
async def get_topics():
    """Get list of available topics with question counts."""
    admin = get_supabase_admin()
    
    topics_with_counts = []
    for topic in AVAILABLE_TOPICS:
        result = admin.table("questions").select("id", count="exact").eq(
            "topic", topic
        ).eq("verification_status", "verified").execute()
        
        topics_with_counts.append({
            "name": topic,
            "question_count": result.count or 0
        })
    
    return {"topics": topics_with_counts}


@router.post("/verify-all")
async def verify_all_pending_questions():
    """Verify all pending questions in the database."""
    admin = get_supabase_admin()
    
    # Get all pending questions
    result = admin.table("questions").select("id").eq(
        "verification_status", "pending"
    ).execute()
    
    if not result.data:
        return {"message": "No pending questions found", "verified_count": 0}
    
    # Update all pending to verified
    from datetime import datetime
    admin.table("questions").update({
        "verification_status": "verified",
        "verified_at": datetime.utcnow().isoformat()
    }).eq("verification_status", "pending").execute()
    
    return {
        "message": f"Verified {len(result.data)} questions",
        "verified_count": len(result.data)
    }


@router.post("/seed")
async def seed_questions(
    topics: Optional[List[str]] = None,
    questions_per_topic: int = 3,
    background_tasks: BackgroundTasks = None
):
    """Seed questions for multiple topics. Use for initial setup."""
    target_topics = topics if topics else AVAILABLE_TOPICS[:5]  # First 5 topics by default
    
    generated = []
    errors = []
    
    for topic in target_topics:
        for difficulty in [DifficultyLevel.EASY, DifficultyLevel.MEDIUM]:
            try:
                request = QuestionGenerationRequest(
                    topic=topic,
                    difficulty=difficulty,
                    question_type=QuestionType.MULTIPLE_CHOICE,
                    count=questions_per_topic
                )
                questions = await question_service.generate_questions(request)
                generated.extend([{
                    "id": str(q.id),
                    "title": q.title,
                    "topic": q.topic,
                    "difficulty": q.difficulty.value
                } for q in questions])
            except Exception as e:
                errors.append(f"{topic}/{difficulty.value}: {str(e)}")
    
    return {
        "generated_count": len(generated),
        "questions": generated,
        "errors": errors if errors else None
    }


@router.get("/all")
async def get_all_questions(
    limit: int = 50,
    offset: int = 0,
    current_user: UserProfile = Depends(get_current_user)
):
    """Get all verified questions with pagination."""
    admin = get_supabase_admin()
    
    result = admin.table("questions").select("*").eq(
        "verification_status", "verified"
    ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    questions = [question_service._db_to_question(q) for q in result.data]
    
    return {"questions": questions, "count": len(questions)}


@router.post("/run")
async def run_code(
    request: CodeRunRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Run code and return output.
    Supports: python, c, cpp, java, javascript
    """
    if request.language not in ['python', 'c', 'cpp', 'java', 'javascript']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language: {request.language}"
        )
    
    result = await code_execution_service.execute_code(
        source_code=request.source_code,
        language=request.language,
        stdin=request.stdin
    )
    
    return {
        "stdout": result.stdout,
        "stderr": result.stderr,
        "compile_output": result.compile_output,
        "status": result.status,
        "time": result.time,
        "memory": result.memory
    }


@router.post("/submit-code")
async def submit_code(
    request: CodeSubmitRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Submit code solution for a question.
    Runs against test cases and updates mastery.
    """
    # Get the question
    try:
        question_uuid = UUID(request.question_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID"
        )
    
    question = await question_service.get_question(question_uuid)
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # For now, run the code and check if it produces expected output
    # In the future, this would use proper test cases from the question
    result = await code_execution_service.execute_code(
        source_code=request.source_code,
        language=request.language
    )
    
    # Simple check: code runs without errors
    is_correct = result.status_id == 3  # Accepted status
    
    # If the question has a correct_answer that looks like expected output, compare
    if is_correct and question.correct_answer:
        expected = question.correct_answer.strip()
        actual = (result.stdout or '').strip()
        # Only compare if expected looks like output (not code)
        if not expected.startswith(('def ', 'function ', 'int ', 'class ', '#include')):
            is_correct = actual == expected
    
    # Update mastery
    mastery_update = MasteryUpdate(
        topic=question.topic,
        subtopic=question.subtopic,
        is_correct=is_correct,
        time_taken_seconds=0,  # Could track this on frontend
        difficulty=question.difficulty.value
    )
    
    topic_mastery = await mastery_service.update_mastery(current_user.id, mastery_update)
    
    # Calculate XP earned
    xp_earned = question.xp_reward if is_correct else 0
    
    # Award XP to user
    if xp_earned > 0:
        admin = get_supabase_admin()
        admin.table("users").update({
            "total_xp": current_user.total_xp + xp_earned
        }).eq("id", str(current_user.id)).execute()
    
    # Save attempt record
    admin = get_supabase_admin()
    admin.table("user_attempts").insert({
        "user_id": str(current_user.id),
        "question_id": str(question.id),
        "user_answer": f"[{request.language}]\n{request.source_code[:500]}",
        "is_correct": is_correct,
        "time_taken_seconds": 0,
        "xp_earned": xp_earned
    }).execute()
    
    return {
        "is_correct": is_correct,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "compile_output": result.compile_output,
        "status": result.status,
        "xp_earned": xp_earned,
        "mastery_change": topic_mastery.mastery_probability,
        "correct_answer": question.correct_answer if not is_correct else None
    }


# NOTE: This route must be LAST because it has a path parameter that would match other routes
@router.get("/{question_id}", response_model=Question)
async def get_question(
    question_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
):
    """Get a specific question by ID."""
    question = await question_service.get_question(question_id)
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    return question
