# ABOUTME: Gamification service for contests, duels, and competitive features
# ABOUTME: Manages city/state/national contests, 1v1 duels, and 3v3 standoffs

from typing import List, Optional, Dict
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from ..core.database import get_supabase_admin
from ..schemas.contest import (
    Contest, ContestCreate, ContestLevel, ContestStatus,
    ContestParticipant, ContestLeaderboard,
    Duel, DuelChallenge, DuelStatus,
    Team3v3, TeamMember, Standoff3v3,
    Marathon
)


class ContestService:
    """Service for managing competitive gaming features."""
    
    def __init__(self):
        self.admin = get_supabase_admin()
    
    # ==================== CONTESTS ====================
    
    async def create_contest(self, data: ContestCreate) -> Contest:
        """Create a new contest."""
        contest = Contest(
            id=uuid4(),
            title=data.title,
            description=data.description,
            level=data.level,
            topics=data.topics,
            start_time=data.start_time,
            end_time=data.end_time,
            max_participants=data.max_participants,
            xp_rewards=data.xp_rewards,
            status=ContestStatus.UPCOMING,
            participant_count=0,
            created_at=datetime.utcnow()
        )
        
        db_data = {
            "id": str(contest.id),
            "title": contest.title,
            "description": contest.description,
            "level": contest.level.value,
            "topics": contest.topics,
            "start_time": contest.start_time.isoformat(),
            "end_time": contest.end_time.isoformat(),
            "max_participants": contest.max_participants,
            "xp_rewards": contest.xp_rewards,
            "status": contest.status.value,
            "participant_count": 0,
            "created_at": contest.created_at.isoformat()
        }
        
        self.admin.table("contests").insert(db_data).execute()
        return contest
    
    async def get_contests(
        self, 
        level: Optional[ContestLevel] = None,
        status: Optional[ContestStatus] = None
    ) -> List[Contest]:
        """Get contests with optional filters."""
        query = self.admin.table("contests").select("*")
        
        if level:
            query = query.eq("level", level.value)
        if status:
            query = query.eq("status", status.value)
        
        result = query.order("start_time", desc=False).execute()
        return [self._db_to_contest(c) for c in (result.data or [])]
    
    async def join_contest(self, contest_id: UUID, user_id: UUID) -> bool:
        """Join a contest."""
        # Check if contest exists and is joinable
        contest_result = self.admin.table("contests").select("*").eq(
            "id", str(contest_id)
        ).single().execute()
        
        if not contest_result.data:
            raise ValueError("Contest not found")
        
        contest = self._db_to_contest(contest_result.data)
        
        if contest.status != ContestStatus.UPCOMING:
            raise ValueError("Contest is not open for registration")
        
        if contest.max_participants and contest.participant_count >= contest.max_participants:
            raise ValueError("Contest is full")
        
        # Check if user already joined
        existing = self.admin.table("contest_participants").select("*").eq(
            "contest_id", str(contest_id)
        ).eq("user_id", str(user_id)).execute()
        
        if existing.data:
            raise ValueError("Already joined this contest")
        
        # Get user info
        user_result = self.admin.table("users").select("username, display_name").eq(
            "id", str(user_id)
        ).single().execute()
        
        if not user_result.data:
            raise ValueError("User not found")
        
        # Add participant
        participant_data = {
            "contest_id": str(contest_id),
            "user_id": str(user_id),
            "username": user_result.data["username"],
            "display_name": user_result.data.get("display_name"),
            "score": 0,
            "questions_solved": 0,
            "joined_at": datetime.utcnow().isoformat()
        }
        
        self.admin.table("contest_participants").insert(participant_data).execute()
        
        # Update participant count
        self.admin.table("contests").update({
            "participant_count": contest.participant_count + 1
        }).eq("id", str(contest_id)).execute()
        
        return True
    
    async def get_leaderboard(self, contest_id: UUID) -> ContestLeaderboard:
        """Get contest leaderboard."""
        result = self.admin.table("contest_participants").select("*").eq(
            "contest_id", str(contest_id)
        ).order("score", desc=True).execute()
        
        participants = []
        for i, p in enumerate(result.data or []):
            participants.append(ContestParticipant(
                user_id=UUID(p["user_id"]),
                username=p["username"],
                display_name=p.get("display_name"),
                score=p.get("score", 0),
                questions_solved=p.get("questions_solved", 0),
                rank=i + 1,
                finish_time=datetime.fromisoformat(p["finish_time"]) if p.get("finish_time") else None
            ))
        
        return ContestLeaderboard(
            contest_id=contest_id,
            participants=participants,
            last_updated=datetime.utcnow()
        )
    
    # ==================== DUELS ====================
    
    async def create_duel(
        self, 
        challenger_id: UUID, 
        challenge: DuelChallenge
    ) -> Duel:
        """Create a duel challenge."""
        duel_id = uuid4()
        
        # Get questions for the duel
        questions = await self._get_duel_questions(
            challenge.topic, 
            challenge.question_count
        )
        
        duel = Duel(
            id=duel_id,
            challenger_id=challenger_id,
            opponent_id=challenge.opponent_id or UUID(int=0),  # Placeholder for random
            topic=challenge.topic,
            questions=questions,
            challenger_score=0,
            opponent_score=0,
            status=DuelStatus.WAITING if challenge.opponent_id else DuelStatus.WAITING,
            created_at=datetime.utcnow()
        )
        
        db_data = {
            "id": str(duel.id),
            "challenger_id": str(challenger_id),
            "opponent_id": str(challenge.opponent_id) if challenge.opponent_id else None,
            "topic": challenge.topic,
            "questions": [str(q) for q in questions],
            "challenger_score": 0,
            "opponent_score": 0,
            "status": duel.status.value,
            "created_at": duel.created_at.isoformat(),
            "time_limit_seconds": challenge.time_limit_seconds
        }
        
        self.admin.table("duels").insert(db_data).execute()
        return duel
    
    async def accept_duel(self, duel_id: UUID, opponent_id: UUID) -> Duel:
        """Accept a duel challenge."""
        result = self.admin.table("duels").select("*").eq(
            "id", str(duel_id)
        ).single().execute()
        
        if not result.data:
            raise ValueError("Duel not found")
        
        if result.data["status"] != DuelStatus.WAITING.value:
            raise ValueError("Duel is not available")
        
        now = datetime.utcnow()
        
        self.admin.table("duels").update({
            "opponent_id": str(opponent_id),
            "status": DuelStatus.IN_PROGRESS.value,
            "started_at": now.isoformat()
        }).eq("id", str(duel_id)).execute()
        
        return await self.get_duel(duel_id)
    
    async def submit_duel_answer(
        self, 
        duel_id: UUID, 
        user_id: UUID,
        question_id: UUID,
        is_correct: bool
    ) -> Duel:
        """Submit an answer in a duel."""
        duel = await self.get_duel(duel_id)
        
        if duel.status != DuelStatus.IN_PROGRESS:
            raise ValueError("Duel is not active")
        
        is_challenger = user_id == duel.challenger_id
        
        if is_correct:
            if is_challenger:
                duel.challenger_score += 1
            else:
                duel.opponent_score += 1
        
        # Update scores
        self.admin.table("duels").update({
            "challenger_score": duel.challenger_score,
            "opponent_score": duel.opponent_score
        }).eq("id", str(duel_id)).execute()
        
        return duel
    
    async def finish_duel(self, duel_id: UUID) -> Duel:
        """Finish a duel and determine winner."""
        duel = await self.get_duel(duel_id)
        
        winner_id = None
        if duel.challenger_score > duel.opponent_score:
            winner_id = duel.challenger_id
        elif duel.opponent_score > duel.challenger_score:
            winner_id = duel.opponent_id
        
        now = datetime.utcnow()
        
        self.admin.table("duels").update({
            "status": DuelStatus.COMPLETED.value,
            "ended_at": now.isoformat(),
            "winner_id": str(winner_id) if winner_id else None
        }).eq("id", str(duel_id)).execute()
        
        # Award XP to winner
        if winner_id:
            await self._award_xp(winner_id, 50)
            await self._update_duel_stats(duel.challenger_id, duel.opponent_id, winner_id)
        
        return await self.get_duel(duel_id)
    
    async def get_duel(self, duel_id: UUID) -> Duel:
        """Get duel by ID."""
        result = self.admin.table("duels").select("*").eq(
            "id", str(duel_id)
        ).single().execute()
        
        if not result.data:
            raise ValueError("Duel not found")
        
        return self._db_to_duel(result.data)
    
    async def find_random_duel(self, user_id: UUID) -> Optional[Duel]:
        """Find a random duel waiting for an opponent."""
        result = self.admin.table("duels").select("*").eq(
            "status", DuelStatus.WAITING.value
        ).is_("opponent_id", "null").neq(
            "challenger_id", str(user_id)
        ).limit(1).execute()
        
        if result.data:
            return await self.accept_duel(UUID(result.data[0]["id"]), user_id)
        return None
    
    # ==================== 3v3 STANDOFFS ====================
    
    async def create_standoff(
        self, 
        team_a_members: List[UUID],
        topic: Optional[str] = None
    ) -> Standoff3v3:
        """Create a 3v3 standoff."""
        if len(team_a_members) != 3:
            raise ValueError("Team must have exactly 3 members")
        
        standoff_id = uuid4()
        team_a_id = uuid4()
        
        # Get team member info
        team_a = await self._create_team(team_a_id, team_a_members, "Team A")
        
        # Get questions
        questions = await self._get_duel_questions(topic, 10)
        
        standoff = Standoff3v3(
            id=standoff_id,
            team_a=team_a,
            team_b=Team3v3(id=uuid4(), name="Waiting...", members=[], total_score=0),
            topic=topic,
            questions=questions,
            status=DuelStatus.WAITING,
            created_at=datetime.utcnow()
        )
        
        db_data = {
            "id": str(standoff.id),
            "team_a": team_a.model_dump(),
            "team_b": None,
            "topic": topic,
            "questions": [str(q) for q in questions],
            "status": standoff.status.value,
            "created_at": standoff.created_at.isoformat()
        }
        
        self.admin.table("standoffs").insert(db_data).execute()
        return standoff
    
    async def _create_team(
        self, 
        team_id: UUID, 
        member_ids: List[UUID],
        name: str
    ) -> Team3v3:
        """Create a team with member info."""
        members = []
        for i, mid in enumerate(member_ids):
            user_result = self.admin.table("users").select("username").eq(
                "id", str(mid)
            ).single().execute()
            
            members.append(TeamMember(
                user_id=mid,
                username=user_result.data["username"] if user_result.data else "Unknown",
                score=0,
                is_captain=(i == 0)
            ))
        
        return Team3v3(
            id=team_id,
            name=name,
            members=members,
            total_score=0
        )
    
    # ==================== MARATHONS ====================
    
    async def create_marathon(
        self, 
        title: str,
        topics: List[str],
        duration_hours: int = 24
    ) -> Marathon:
        """Create a coding marathon event."""
        start_time = datetime.utcnow() + timedelta(hours=1)
        end_time = start_time + timedelta(hours=duration_hours)
        
        # Create checkpoints at regular intervals
        checkpoint_interval = duration_hours // 4
        checkpoints = [
            start_time + timedelta(hours=checkpoint_interval * i)
            for i in range(1, 5)
        ]
        
        marathon = Marathon(
            id=uuid4(),
            title=title,
            topics=topics,
            start_time=start_time,
            end_time=end_time,
            checkpoints=checkpoints,
            participant_count=0,
            status=ContestStatus.UPCOMING,
            xp_multiplier=2.0
        )
        
        db_data = {
            "id": str(marathon.id),
            "title": marathon.title,
            "topics": marathon.topics,
            "start_time": marathon.start_time.isoformat(),
            "end_time": marathon.end_time.isoformat(),
            "checkpoints": [cp.isoformat() for cp in marathon.checkpoints],
            "participant_count": 0,
            "status": marathon.status.value,
            "xp_multiplier": marathon.xp_multiplier
        }
        
        self.admin.table("marathons").insert(db_data).execute()
        return marathon
    
    # ==================== HELPERS ====================
    
    async def _get_duel_questions(
        self, 
        topic: Optional[str], 
        count: int
    ) -> List[UUID]:
        """Get random questions for a duel."""
        query = self.admin.table("questions").select("id").eq(
            "verification_status", "verified"
        )
        
        if topic:
            query = query.eq("topic", topic)
        
        result = query.limit(count * 2).execute()
        
        import random
        questions = [UUID(q["id"]) for q in (result.data or [])]
        random.shuffle(questions)
        return questions[:count]
    
    async def _award_xp(self, user_id: UUID, amount: int):
        """Award XP to a user."""
        result = self.admin.table("users").select("total_xp, current_level").eq(
            "id", str(user_id)
        ).single().execute()
        
        if result.data:
            new_xp = result.data["total_xp"] + amount
            new_level = self._calculate_level(new_xp)
            
            self.admin.table("users").update({
                "total_xp": new_xp,
                "current_level": new_level
            }).eq("id", str(user_id)).execute()
    
    async def _update_duel_stats(
        self, 
        challenger_id: UUID, 
        opponent_id: UUID,
        winner_id: UUID
    ):
        """Update duel win/loss stats."""
        loser_id = opponent_id if winner_id == challenger_id else challenger_id
        
        # Update winner
        self.admin.rpc("increment_user_stat", {
            "user_id": str(winner_id),
            "stat_name": "duels_won",
            "amount": 1
        }).execute()
        
        # Update loser
        self.admin.rpc("increment_user_stat", {
            "user_id": str(loser_id),
            "stat_name": "duels_lost",
            "amount": 1
        }).execute()
    
    def _calculate_level(self, xp: int) -> int:
        """Calculate user level from XP."""
        # Simple level formula: level = sqrt(xp / 100)
        import math
        return max(1, int(math.sqrt(xp / 100)) + 1)
    
    def _db_to_contest(self, data: dict) -> Contest:
        """Convert database row to Contest."""
        return Contest(
            id=UUID(data["id"]),
            title=data["title"],
            description=data.get("description"),
            level=ContestLevel(data["level"]),
            topics=data.get("topics", []),
            start_time=datetime.fromisoformat(data["start_time"]),
            end_time=datetime.fromisoformat(data["end_time"]),
            max_participants=data.get("max_participants"),
            xp_rewards=data.get("xp_rewards", {}),
            status=ContestStatus(data["status"]),
            participant_count=data.get("participant_count", 0),
            created_at=datetime.fromisoformat(data["created_at"])
        )
    
    def _db_to_duel(self, data: dict) -> Duel:
        """Convert database row to Duel."""
        return Duel(
            id=UUID(data["id"]),
            challenger_id=UUID(data["challenger_id"]),
            opponent_id=UUID(data["opponent_id"]) if data.get("opponent_id") else UUID(int=0),
            topic=data.get("topic"),
            questions=[UUID(q) for q in data.get("questions", [])],
            challenger_score=data.get("challenger_score", 0),
            opponent_score=data.get("opponent_score", 0),
            status=DuelStatus(data["status"]),
            created_at=datetime.fromisoformat(data["created_at"]),
            started_at=datetime.fromisoformat(data["started_at"]) if data.get("started_at") else None,
            ended_at=datetime.fromisoformat(data["ended_at"]) if data.get("ended_at") else None,
            winner_id=UUID(data["winner_id"]) if data.get("winner_id") else None
        )


contest_service = ContestService()
