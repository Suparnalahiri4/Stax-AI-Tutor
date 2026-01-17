-- ABOUTME: Supabase database schema for Brainwave learning platform
-- ABOUTME: Run this in Supabase SQL Editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS ====================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User statistics
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_questions_attempted INTEGER DEFAULT 0,
    total_questions_correct INTEGER DEFAULT 0,
    total_time_spent_minutes INTEGER DEFAULT 0,
    contests_participated INTEGER DEFAULT 0,
    contests_won INTEGER DEFAULT 0,
    duels_won INTEGER DEFAULT 0,
    duels_lost INTEGER DEFAULT 0,
    current_ranking INTEGER
);

-- ==================== MASTERY ====================

CREATE TABLE IF NOT EXISTS user_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    overall_mastery DECIMAL(5,4) DEFAULT 0.5,
    topics JSONB DEFAULT '[]'::jsonb,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ==================== QUESTIONS ====================

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    topic TEXT NOT NULL,
    subtopic TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'coding', 'short_answer', 'multi_step')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    steps JSONB,
    tags TEXT[] DEFAULT '{}',
    time_limit_seconds INTEGER,
    xp_reward INTEGER DEFAULT 10,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_status ON questions(verification_status);

-- ==================== USER ATTEMPTS ====================

CREATE TABLE IF NOT EXISTS user_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN,
    time_taken_seconds INTEGER,
    xp_earned INTEGER DEFAULT 0,
    code_quality DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_attempts_user ON user_attempts(user_id);
CREATE INDEX idx_attempts_question ON user_attempts(question_id);

-- ==================== ASSIGNMENTS ====================

CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('practice', 'reinforcement', 'challenge', 'review')),
    target_topics TEXT[] DEFAULT '{}',
    questions JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_xp_earned INTEGER DEFAULT 0,
    xp_bonus INTEGER DEFAULT 0
);

CREATE INDEX idx_assignments_user ON assignments(user_id);
CREATE INDEX idx_assignments_status ON assignments(status);

-- ==================== CONTESTS ====================

CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    level TEXT NOT NULL CHECK (level IN ('city', 'state', 'national', 'global')),
    topics TEXT[] DEFAULT '{}',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    max_participants INTEGER,
    xp_rewards JSONB DEFAULT '{"1st": 500, "2nd": 300, "3rd": 150}'::jsonb,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_level ON contests(level);

-- Contest participants
CREATE TABLE IF NOT EXISTS contest_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    display_name TEXT,
    score INTEGER DEFAULT 0,
    questions_solved INTEGER DEFAULT 0,
    finish_time TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contest_id, user_id)
);

CREATE INDEX idx_participants_contest ON contest_participants(contest_id);
CREATE INDEX idx_participants_score ON contest_participants(score DESC);

-- ==================== DUELS ====================

CREATE TABLE IF NOT EXISTS duels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
    opponent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT,
    questions UUID[] DEFAULT '{}',
    challenger_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    time_limit_seconds INTEGER DEFAULT 300,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    winner_id UUID REFERENCES users(id)
);

CREATE INDEX idx_duels_status ON duels(status);
CREATE INDEX idx_duels_challenger ON duels(challenger_id);
CREATE INDEX idx_duels_opponent ON duels(opponent_id);

-- ==================== 3v3 STANDOFFS ====================

CREATE TABLE IF NOT EXISTS standoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_a JSONB NOT NULL,
    team_b JSONB,
    topic TEXT,
    questions UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    winner_team_id UUID
);

-- ==================== MARATHONS ====================

CREATE TABLE IF NOT EXISTS marathons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    topics TEXT[] DEFAULT '{}',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    checkpoints TIMESTAMP WITH TIME ZONE[] DEFAULT '{}',
    participant_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
    xp_multiplier DECIMAL(3,2) DEFAULT 2.0
);

-- Marathon participants
CREATE TABLE IF NOT EXISTS marathon_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marathon_id UUID REFERENCES marathons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_xp_earned INTEGER DEFAULT 0,
    questions_solved INTEGER DEFAULT 0,
    checkpoints_reached INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(marathon_id, user_id)
);

-- ==================== FUNCTIONS ====================

-- Function to increment user stats
CREATE OR REPLACE FUNCTION increment_user_stat(
    p_user_id UUID,
    p_stat_name TEXT,
    p_amount INTEGER
) RETURNS VOID AS $$
BEGIN
    EXECUTE format(
        'UPDATE user_stats SET %I = COALESCE(%I, 0) + $1 WHERE user_id = $2',
        p_stat_name, p_stat_name
    ) USING p_amount, p_user_id;
    
    -- Insert if not exists
    IF NOT FOUND THEN
        INSERT INTO user_stats (user_id) VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
        
        EXECUTE format(
            'UPDATE user_stats SET %I = $1 WHERE user_id = $2',
            p_stat_name
        ) USING p_amount, p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Mastery policies
CREATE POLICY "Users can view own mastery" ON user_mastery
    FOR SELECT USING (auth.uid() = user_id);

-- Attempts policies
CREATE POLICY "Users can view own attempts" ON user_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON user_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Assignments policies
CREATE POLICY "Users can view own assignments" ON assignments
    FOR SELECT USING (auth.uid() = user_id);

-- Questions are public for authenticated users
CREATE POLICY "Authenticated users can view questions" ON questions
    FOR SELECT TO authenticated USING (verification_status = 'verified');

-- Contests are public
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view contests" ON contests
    FOR SELECT USING (true);

-- Contest participants
ALTER TABLE contest_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view participants" ON contest_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join contests" ON contest_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);
