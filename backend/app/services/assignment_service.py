# ABOUTME: Personalized assignment generation service
# ABOUTME: Creates assignments based on mastery, code quality, and performance metrics

from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from ..core.database import get_supabase_admin
from ..schemas.assignment import (
    Assignment, AssignmentCreate, AssignmentQuestion,
    AssignmentType, AssignmentStatus, AssignmentGenerationCriteria
)
from ..schemas.mastery import UserMasteryProfile
from .mastery_service import mastery_service


class AssignmentService:
    """Service for generating and managing personalized assignments."""
    
    def __init__(self):
        self.admin = get_supabase_admin()
    
    async def generate_assignment(
        self, 
        criteria: AssignmentGenerationCriteria
    ) -> Assignment:
        """
        Generate a personalized assignment based on user's learning profile.
        Considers mastery levels, code quality history, and time performance.
        """
        # Get user's mastery profile
        mastery_profile = await mastery_service.get_user_mastery(criteria.user_id)
        
        # Get user's performance metrics
        performance = await self._get_user_performance(criteria.user_id)
        
        # Determine assignment type based on profile
        assignment_type = self._determine_assignment_type(mastery_profile, performance)
        
        # Select topics for the assignment
        topics = self._select_topics(criteria, mastery_profile)
        
        # Determine difficulty based on mastery
        difficulty = self._determine_difficulty(mastery_profile, criteria.target_difficulty)
        
        # Fetch appropriate questions
        questions = await self._select_questions(
            topics=topics,
            difficulty=difficulty,
            count=criteria.max_questions,
            user_id=criteria.user_id
        )
        
        # Create the assignment
        assignment = Assignment(
            id=uuid4(),
            user_id=criteria.user_id,
            title=self._generate_title(assignment_type, topics),
            description=self._generate_description(assignment_type, topics, mastery_profile),
            assignment_type=assignment_type,
            target_topics=topics,
            questions=questions,
            status=AssignmentStatus.PENDING,
            due_date=datetime.utcnow() + timedelta(days=7),
            created_at=datetime.utcnow(),
            xp_bonus=self._calculate_xp_bonus(assignment_type, len(questions))
        )
        
        # Save to database
        await self._save_assignment(assignment)
        
        return assignment
    
    async def _get_user_performance(self, user_id: UUID) -> dict:
        """Get user's historical performance metrics."""
        result = self.admin.table("user_attempts").select("*").eq(
            "user_id", str(user_id)
        ).order("created_at", desc=True).limit(50).execute()
        
        attempts = result.data or []
        
        if not attempts:
            return {
                "avg_time_ratio": 1.0,
                "recent_accuracy": 0.5,
                "code_quality_avg": 0.5,
                "consistency_score": 0.5
            }
        
        # Calculate metrics
        correct_count = sum(1 for a in attempts if a.get("is_correct"))
        total_time = sum(a.get("time_taken_seconds", 0) for a in attempts)
        
        return {
            "avg_time_ratio": total_time / (len(attempts) * 300) if attempts else 1.0,
            "recent_accuracy": correct_count / len(attempts) if attempts else 0.5,
            "code_quality_avg": sum(a.get("code_quality", 0.5) for a in attempts) / len(attempts),
            "consistency_score": self._calculate_consistency(attempts)
        }
    
    def _calculate_consistency(self, attempts: List[dict]) -> float:
        """Calculate how consistent the user's performance is."""
        if len(attempts) < 5:
            return 0.5
        
        results = [1 if a.get("is_correct") else 0 for a in attempts[:20]]
        if not results:
            return 0.5
        
        # Lower variance = more consistent
        mean = sum(results) / len(results)
        variance = sum((r - mean) ** 2 for r in results) / len(results)
        
        # Convert variance to consistency score (0-1)
        return max(0, 1 - variance * 2)
    
    def _determine_assignment_type(
        self, 
        mastery: UserMasteryProfile,
        performance: dict
    ) -> AssignmentType:
        """Determine the best assignment type for the user."""
        if mastery.weaknesses and performance["recent_accuracy"] < 0.5:
            return AssignmentType.REINFORCEMENT
        elif performance["recent_accuracy"] > 0.8:
            return AssignmentType.CHALLENGE
        elif mastery.overall_mastery > 0.7:
            return AssignmentType.REVIEW
        else:
            return AssignmentType.PRACTICE
    
    def _select_topics(
        self, 
        criteria: AssignmentGenerationCriteria,
        mastery: UserMasteryProfile
    ) -> List[str]:
        """Select topics for the assignment."""
        if criteria.topics:
            return criteria.topics
        
        topics = []
        
        if criteria.focus_on_weaknesses and mastery.weaknesses:
            topics.extend(mastery.weaknesses[:3])
        
        if criteria.include_strengths and mastery.strengths:
            topics.extend(mastery.strengths[:2])
        
        if not topics:
            topics = mastery.recommended_topics or ["fundamentals"]
        
        return list(set(topics))
    
    def _determine_difficulty(
        self, 
        mastery: UserMasteryProfile,
        target: Optional[str]
    ) -> str:
        """Determine appropriate difficulty level."""
        if target:
            return target
        
        overall = mastery.overall_mastery
        
        if overall < 0.3:
            return "easy"
        elif overall < 0.5:
            return "medium"
        elif overall < 0.7:
            return "hard"
        else:
            return "expert"
    
    async def _select_questions(
        self, 
        topics: List[str],
        difficulty: str,
        count: int,
        user_id: UUID
    ) -> List[AssignmentQuestion]:
        """Select appropriate questions for the assignment."""
        # Get questions the user hasn't attempted recently
        attempted_result = self.admin.table("user_attempts").select("question_id").eq(
            "user_id", str(user_id)
        ).execute()
        
        attempted_ids = {a["question_id"] for a in (attempted_result.data or [])}
        
        # Query questions
        questions_result = self.admin.table("questions").select("id").eq(
            "verification_status", "verified"
        ).eq("difficulty", difficulty).in_("topic", topics).limit(count * 2).execute()
        
        available = [
            q for q in (questions_result.data or [])
            if q["id"] not in attempted_ids
        ][:count]
        
        # If not enough unattempted, include some attempted ones
        if len(available) < count:
            additional = [
                q for q in (questions_result.data or [])
                if q["id"] in attempted_ids
            ][:count - len(available)]
            available.extend(additional)
        
        return [
            AssignmentQuestion(
                question_id=UUID(q["id"]),
                order=i + 1,
                is_completed=False
            )
            for i, q in enumerate(available)
        ]
    
    def _generate_title(self, atype: AssignmentType, topics: List[str]) -> str:
        """Generate a descriptive title for the assignment."""
        type_titles = {
            AssignmentType.PRACTICE: "Practice Session",
            AssignmentType.REINFORCEMENT: "Skill Reinforcement",
            AssignmentType.CHALLENGE: "Challenge Assignment",
            AssignmentType.REVIEW: "Review & Consolidation"
        }
        
        topic_str = ", ".join(topics[:2])
        if len(topics) > 2:
            topic_str += f" (+{len(topics) - 2} more)"
        
        return f"{type_titles[atype]}: {topic_str}"
    
    def _generate_description(
        self, 
        atype: AssignmentType, 
        topics: List[str],
        mastery: UserMasteryProfile
    ) -> str:
        """Generate a personalized description."""
        descriptions = {
            AssignmentType.PRACTICE: "Regular practice to build your skills in {topics}.",
            AssignmentType.REINFORCEMENT: "These exercises will help strengthen your understanding of {topics}.",
            AssignmentType.CHALLENGE: "Push your limits with these challenging problems in {topics}!",
            AssignmentType.REVIEW: "Review and consolidate your knowledge of {topics}."
        }
        
        return descriptions[atype].format(topics=", ".join(topics))
    
    def _calculate_xp_bonus(self, atype: AssignmentType, question_count: int) -> int:
        """Calculate bonus XP for completing the assignment."""
        base_bonus = {
            AssignmentType.PRACTICE: 20,
            AssignmentType.REINFORCEMENT: 30,
            AssignmentType.CHALLENGE: 50,
            AssignmentType.REVIEW: 25
        }
        
        return base_bonus[atype] + (question_count * 5)
    
    async def _save_assignment(self, assignment: Assignment):
        """Save assignment to database."""
        data = {
            "id": str(assignment.id),
            "user_id": str(assignment.user_id),
            "title": assignment.title,
            "description": assignment.description,
            "assignment_type": assignment.assignment_type.value,
            "target_topics": assignment.target_topics,
            "questions": [q.model_dump() for q in assignment.questions],
            "status": assignment.status.value,
            "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
            "created_at": assignment.created_at.isoformat(),
            "xp_bonus": assignment.xp_bonus
        }
        
        self.admin.table("assignments").insert(data).execute()
    
    async def get_user_assignments(
        self, 
        user_id: UUID,
        status: Optional[AssignmentStatus] = None
    ) -> List[Assignment]:
        """Get assignments for a user."""
        query = self.admin.table("assignments").select("*").eq(
            "user_id", str(user_id)
        )
        
        if status:
            query = query.eq("status", status.value)
        
        result = query.order("created_at", desc=True).execute()
        
        return [self._db_to_assignment(a) for a in (result.data or [])]
    
    async def complete_assignment_question(
        self, 
        assignment_id: UUID,
        question_id: UUID,
        is_correct: bool,
        time_taken: int
    ) -> Assignment:
        """Mark a question in an assignment as completed."""
        result = self.admin.table("assignments").select("*").eq(
            "id", str(assignment_id)
        ).single().execute()
        
        if not result.data:
            raise ValueError("Assignment not found")
        
        assignment = self._db_to_assignment(result.data)
        
        # Update the question
        for q in assignment.questions:
            if q.question_id == question_id:
                q.is_completed = True
                q.is_correct = is_correct
                q.time_taken_seconds = time_taken
                break
        
        # Check if all questions are completed
        if all(q.is_completed for q in assignment.questions):
            assignment.status = AssignmentStatus.COMPLETED
            assignment.completed_at = datetime.utcnow()
            assignment.total_xp_earned = sum(
                10 for q in assignment.questions if q.is_correct
            ) + assignment.xp_bonus
        else:
            assignment.status = AssignmentStatus.IN_PROGRESS
        
        # Update database
        self.admin.table("assignments").update({
            "questions": [q.model_dump() for q in assignment.questions],
            "status": assignment.status.value,
            "completed_at": assignment.completed_at.isoformat() if assignment.completed_at else None,
            "total_xp_earned": assignment.total_xp_earned
        }).eq("id", str(assignment_id)).execute()
        
        return assignment
    
    def _db_to_assignment(self, data: dict) -> Assignment:
        """Convert database row to Assignment."""
        questions = [
            AssignmentQuestion(**q) for q in data.get("questions", [])
        ]
        
        return Assignment(
            id=UUID(data["id"]),
            user_id=UUID(data["user_id"]),
            title=data["title"],
            description=data.get("description"),
            assignment_type=AssignmentType(data["assignment_type"]),
            target_topics=data.get("target_topics", []),
            questions=questions,
            status=AssignmentStatus(data["status"]),
            due_date=datetime.fromisoformat(data["due_date"]) if data.get("due_date") else None,
            created_at=datetime.fromisoformat(data["created_at"]),
            completed_at=datetime.fromisoformat(data["completed_at"]) if data.get("completed_at") else None,
            total_xp_earned=data.get("total_xp_earned", 0),
            xp_bonus=data.get("xp_bonus", 0)
        )


assignment_service = AssignmentService()
