// ABOUTME: TypeScript type definitions for the frontend
// ABOUTME: Mirrors backend schemas for type safety

export interface User {
  id: string
  email: string
  username: string
  display_name?: string
  total_xp: number
  current_level: number
  streak_days: number
  city?: string
  state?: string
  country: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface TopicMastery {
  topic: string
  subtopic?: string
  mastery_probability: number
  total_attempts: number
  correct_attempts: number
  average_time_seconds: number
  last_attempted?: string
}

export interface UserMasteryProfile {
  user_id: string
  topics: TopicMastery[]
  overall_mastery: number
  strengths: string[]
  weaknesses: string[]
  recommended_topics: string[]
  last_updated: string
}

export interface QuestionStep {
  step_number: number
  description: string
  expected_output?: string
  hints: string[]
  solution: string
}

export interface Question {
  id: string
  title: string
  description: string
  topic: string
  subtopic?: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  question_type: 'multiple_choice' | 'coding' | 'short_answer' | 'multi_step'
  options?: string[]
  correct_answer: string
  steps?: QuestionStep[]
  tags: string[]
  time_limit_seconds?: number
  xp_reward: number
  verification_status: 'pending' | 'verified' | 'rejected'
  created_at: string
}

export interface AttemptResult {
  is_correct: boolean
  correct_answer?: string
  explanation?: string
  xp_earned: number
  mastery_change: number
  next_hint?: string
}

export interface Assignment {
  id: string
  user_id: string
  title: string
  description?: string
  assignment_type: 'practice' | 'reinforcement' | 'challenge' | 'review'
  target_topics: string[]
  difficulty_range?: { min: string; max: string }
  questions: AssignmentQuestion[]
  status: 'pending' | 'in_progress' | 'completed' | 'expired'
  due_date?: string
  created_at: string
  completed_at?: string
  total_xp_earned?: number
  xp_bonus: number
}

export interface AssignmentQuestion {
  question_id: string
  order: number
  is_completed: boolean
  is_correct?: boolean
  time_taken_seconds?: number
}

export interface ContestPrize {
  rank: number
  reward: string
}

export interface Contest {
  id: string
  title: string
  description?: string
  level: 'city' | 'state' | 'national' | 'global'
  topics: string[]
  start_time: string
  end_time: string
  duration_minutes?: number
  max_participants?: number
  current_participants?: number
  participant_count?: number
  xp_rewards?: Record<string, number>
  prizes?: ContestPrize[]
  status: 'upcoming' | 'live' | 'completed' | 'cancelled'
  created_at: string
}

export interface ContestParticipant {
  user_id: string
  username: string
  display_name?: string
  score: number
  questions_solved: number
  rank?: number
  finish_time?: string
}

export interface Duel {
  id: string
  challenger_id: string
  opponent_id: string
  topic?: string
  questions: string[]
  current_question?: number
  challenger_score: number
  opponent_score: number
  challenger_username?: string
  opponent_username?: string
  status: 'pending' | 'waiting' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  started_at?: string
  completed_at?: string
  ended_at?: string
  winner_id?: string
}
