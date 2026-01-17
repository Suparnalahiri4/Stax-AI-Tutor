# ABOUTME: AI Teacher mastery tracking service
# ABOUTME: Manages topic mastery indices with Bayesian probability updates

import math
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime
from ..core.database import get_supabase_admin
from ..schemas.mastery import (
    TopicMastery, UserMasteryProfile, MasteryUpdate,
    StepwiseHintRequest, StepwiseHintResponse,
    StepSolutionRequest, StepSolutionResponse
)
from ..schemas.question import Question, DifficultyLevel
import google.generativeai as genai
from ..core.config import get_settings

settings = get_settings()


class MasteryService:
    """Service for tracking and updating user mastery levels."""
    
    # Difficulty weights for mastery updates
    DIFFICULTY_WEIGHTS = {
        "easy": 0.5,
        "medium": 1.0,
        "hard": 1.5,
        "expert": 2.0
    }
    
    # Base learning rate for mastery updates
    BASE_LEARNING_RATE = 0.1
    
    def __init__(self):
        self.admin = get_supabase_admin()
        genai.configure(api_key=settings.gemini_api_key)
        self.ai_model = genai.GenerativeModel('gemini-pro')
    
    async def get_user_mastery(self, user_id: UUID) -> UserMasteryProfile:
        """Get the complete mastery profile for a user."""
        result = self.admin.table("user_mastery").select("*").eq(
            "user_id", str(user_id)
        ).single().execute()
        
        if not result.data:
            # Initialize mastery profile if it doesn't exist
            return await self._initialize_mastery(user_id)
        
        return self._db_to_mastery_profile(result.data, user_id)
    
    async def _initialize_mastery(self, user_id: UUID) -> UserMasteryProfile:
        """Initialize a new mastery profile for a user."""
        profile_data = {
            "user_id": str(user_id),
            "overall_mastery": 0.5,
            "topics": [],
            "last_updated": datetime.utcnow().isoformat()
        }
        
        self.admin.table("user_mastery").insert(profile_data).execute()
        
        return UserMasteryProfile(
            user_id=user_id,
            topics=[],
            overall_mastery=0.5,
            strengths=[],
            weaknesses=[],
            recommended_topics=[],
            last_updated=datetime.utcnow()
        )
    
    async def update_mastery(
        self, 
        user_id: UUID, 
        update: MasteryUpdate
    ) -> TopicMastery:
        """
        Update mastery for a topic based on attempt result.
        Uses a Bayesian-inspired update formula that considers:
        - Current mastery level
        - Difficulty of the question
        - Whether the answer was correct
        - Time taken relative to expected time
        """
        profile = await self.get_user_mastery(user_id)
        
        # Find or create topic mastery
        topic_mastery = None
        for tm in profile.topics:
            if tm.topic == update.topic and tm.subtopic == update.subtopic:
                topic_mastery = tm
                break
        
        if topic_mastery is None:
            topic_mastery = TopicMastery(
                topic=update.topic,
                subtopic=update.subtopic,
                mastery_probability=0.5,
                total_attempts=0,
                correct_attempts=0,
                average_time_seconds=0.0
            )
        
        # Calculate mastery update
        difficulty_weight = self.DIFFICULTY_WEIGHTS.get(update.difficulty, 1.0)
        
        # Adaptive learning rate based on number of attempts
        learning_rate = self.BASE_LEARNING_RATE / (1 + 0.1 * topic_mastery.total_attempts)
        
        # Calculate the update magnitude
        if update.is_correct:
            # Increase mastery, scaled by difficulty
            delta = learning_rate * difficulty_weight * (1 - topic_mastery.mastery_probability)
            new_mastery = min(1.0, topic_mastery.mastery_probability + delta)
            topic_mastery.correct_attempts += 1
        else:
            # Decrease mastery, easier questions cause larger decreases
            delta = learning_rate * (1 / difficulty_weight) * topic_mastery.mastery_probability
            new_mastery = max(0.0, topic_mastery.mastery_probability - delta)
        
        # Update statistics
        topic_mastery.total_attempts += 1
        topic_mastery.mastery_probability = new_mastery
        topic_mastery.last_attempted = datetime.utcnow()
        
        # Update average time
        old_avg = topic_mastery.average_time_seconds
        n = topic_mastery.total_attempts
        topic_mastery.average_time_seconds = (
            (old_avg * (n - 1) + update.time_taken_seconds) / n
        )
        
        # Update database
        await self._save_topic_mastery(user_id, profile, topic_mastery)
        
        return topic_mastery
    
    async def _save_topic_mastery(
        self, 
        user_id: UUID, 
        profile: UserMasteryProfile,
        updated_topic: TopicMastery
    ):
        """Save updated topic mastery to database."""
        # Update the topics list
        topics_data = []
        found = False
        
        for tm in profile.topics:
            if tm.topic == updated_topic.topic and tm.subtopic == updated_topic.subtopic:
                topics_data.append(updated_topic.model_dump())
                found = True
            else:
                topics_data.append(tm.model_dump())
        
        if not found:
            topics_data.append(updated_topic.model_dump())
        
        # Calculate overall mastery
        if topics_data:
            overall = sum(t["mastery_probability"] for t in topics_data) / len(topics_data)
        else:
            overall = 0.5
        
        # Identify strengths and weaknesses
        strengths = [
            t["topic"] for t in topics_data 
            if t["mastery_probability"] >= 0.7
        ]
        weaknesses = [
            t["topic"] for t in topics_data 
            if t["mastery_probability"] <= 0.3
        ]
        
        self.admin.table("user_mastery").update({
            "topics": topics_data,
            "overall_mastery": overall,
            "last_updated": datetime.utcnow().isoformat()
        }).eq("user_id", str(user_id)).execute()
    
    async def get_stepwise_hint(
        self, 
        request: StepwiseHintRequest,
        question: Question
    ) -> StepwiseHintResponse:
        """
        Get a progressive hint for a specific step.
        Hints escalate from subtle to detailed based on previous attempts.
        """
        if not question.steps or request.step_number > len(question.steps):
            raise ValueError("Invalid step number")
        
        step = question.steps[request.step_number - 1]
        hint_level = min(len(request.previous_attempts) + 1, 3)
        
        # If already have 3 failed attempts, provide solution
        if len(request.previous_attempts) >= 3:
            return StepwiseHintResponse(
                hint_level=3,
                hint_text=step.hints[-1] if step.hints else "Let me show you the solution.",
                should_reveal_solution=True,
                solution=step.solution
            )
        
        # Generate progressive hint using AI
        hint = await self._generate_hint(question, step, hint_level, request.previous_attempts)
        
        return StepwiseHintResponse(
            hint_level=hint_level,
            hint_text=hint,
            should_reveal_solution=False
        )
    
    async def _generate_hint(
        self, 
        question: Question, 
        step, 
        hint_level: int,
        previous_attempts: List[str]
    ) -> str:
        """Generate a hint using AI based on hint level."""
        # Use predefined hints if available
        if step.hints and len(step.hints) >= hint_level:
            return step.hints[hint_level - 1]
        
        # Generate hint with AI
        level_descriptions = {
            1: "Give a subtle hint that points in the right direction without revealing the approach",
            2: "Give a moderate hint that explains the general approach without showing code",
            3: "Give a detailed hint that explains the exact steps needed"
        }
        
        prompt = f"""The student is working on this problem:
Question: {question.description}
Current Step: {step.description}
Expected Output: {step.expected_output}

Previous attempts by the student:
{chr(10).join(f"- {attempt}" for attempt in previous_attempts) if previous_attempts else "None yet"}

{level_descriptions[hint_level]}. Do not give the complete solution."""

        response = self.ai_model.generate_content(prompt)
        return response.text
    
    async def solve_step(
        self, 
        request: StepSolutionRequest,
        question: Question
    ) -> StepSolutionResponse:
        """
        Solve only a specific step, not the entire problem.
        This helps users who are stuck on one particular step.
        """
        if not question.steps or request.step_number > len(question.steps):
            raise ValueError("Invalid step number")
        
        step = question.steps[request.step_number - 1]
        
        explanation = None
        if request.show_explanation:
            explanation = await self._generate_step_explanation(question, step)
        
        # Get hint for next step if applicable
        next_hint = None
        if request.step_number < len(question.steps):
            next_step = question.steps[request.step_number]
            next_hint = next_step.hints[0] if next_step.hints else None
        
        return StepSolutionResponse(
            step_number=request.step_number,
            solution=step.solution,
            explanation=explanation,
            next_step_hint=next_hint
        )
    
    async def _generate_step_explanation(self, question: Question, step) -> str:
        """Generate an explanation for why this solution works."""
        prompt = f"""Explain clearly why this solution works for the given step:

Problem: {question.description}
Step: {step.description}
Solution: {step.solution}

Give a clear, educational explanation that helps the student understand the concept."""

        response = self.ai_model.generate_content(prompt)
        return response.text
    
    def _db_to_mastery_profile(
        self, 
        data: dict, 
        user_id: UUID
    ) -> UserMasteryProfile:
        """Convert database row to UserMasteryProfile."""
        topics = [
            TopicMastery(**t) for t in data.get("topics", [])
        ]
        
        strengths = [t.topic for t in topics if t.mastery_probability >= 0.7]
        weaknesses = [t.topic for t in topics if t.mastery_probability <= 0.3]
        
        # Recommend topics that are weak or haven't been practiced
        recommended = weaknesses[:3] if weaknesses else []
        
        return UserMasteryProfile(
            user_id=user_id,
            topics=topics,
            overall_mastery=data.get("overall_mastery", 0.5),
            strengths=strengths,
            weaknesses=weaknesses,
            recommended_topics=recommended,
            last_updated=datetime.fromisoformat(data["last_updated"]) if data.get("last_updated") else datetime.utcnow()
        )


mastery_service = MasteryService()
