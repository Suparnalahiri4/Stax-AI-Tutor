// ABOUTME: API service for backend communication
// ABOUTME: Wraps all HTTP calls with authentication

import type { 
  Question, AttemptResult, Assignment, Contest, 
  Duel, UserMasteryProfile, AuthResponse 
} from '../types'

// Ensure API_URL ends with /api
const baseUrl = import.meta.env.VITE_API_URL || ''
const API_URL = baseUrl ? `${baseUrl}/api` : '/api'

class ApiService {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || 'An error occurred')
    }

    return response.json()
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  async register(email: string, password: string, username: string): Promise<AuthResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username })
    })
  }

  async getMe(): Promise<AuthResponse['user']> {
    return this.request('/auth/me')
  }

  // Questions
  async getQuestionsByTopic(topic: string, difficulty?: string): Promise<Question[]> {
    const params = new URLSearchParams()
    if (difficulty) params.append('difficulty', difficulty)
    return this.request(`/questions/topic/${topic}?${params}`)
  }

  async getQuestion(id: string): Promise<Question> {
    return this.request(`/questions/${id}`)
  }

  async getAllQuestions(limit: number = 50): Promise<{ questions: Question[], count: number }> {
    return this.request(`/questions/all?limit=${limit}`)
  }

  async getTopics(): Promise<{ topics: { name: string, question_count: number }[] }> {
    return this.request('/questions/topics/list')
  }

  async seedQuestions(topics?: string[], count?: number): Promise<{ generated_count: number, questions: any[], errors?: string[] }> {
    const body: any = {}
    if (topics) body.topics = topics
    if (count) body.questions_per_topic = count
    return this.request('/questions/seed', {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  async generateQuestions(
    topic: string, 
    difficulty: string, 
    count: number = 3,
    questionType: 'multiple_choice' | 'coding' = 'coding'
  ): Promise<Question[]> {
    return this.request('/questions/generate', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        difficulty,
        question_type: questionType,
        count
      })
    })
  }

  async submitAttempt(
    questionId: string, 
    answer: string, 
    timeTaken: number,
    currentStep?: number
  ): Promise<AttemptResult> {
    return this.request('/questions/attempt', {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        user_answer: answer,
        time_taken_seconds: timeTaken,
        current_step: currentStep
      })
    })
  }

  // AI Teacher
  async getMastery(): Promise<UserMasteryProfile> {
    return this.request('/teacher/mastery')
  }

  async getHint(
    questionId: string, 
    stepNumber: number, 
    previousAttempts: string[]
  ): Promise<{ hint_text: string; should_reveal_solution: boolean; solution?: string }> {
    return this.request('/teacher/hint', {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        step_number: stepNumber,
        previous_attempts: previousAttempts
      })
    })
  }

  async solveStep(
    questionId: string, 
    stepNumber: number
  ): Promise<{ solution: string; explanation?: string; next_step_hint?: string }> {
    return this.request('/teacher/solve-step', {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        step_number: stepNumber,
        show_explanation: true
      })
    })
  }

  // Assignments
  async getAssignments(status?: string): Promise<Assignment[]> {
    const params = status ? `?status=${status}` : ''
    return this.request(`/teacher/assignments${params}`)
  }

  async generateAssignment(): Promise<Assignment> {
    return this.request('/teacher/assignments/generate', { method: 'POST' })
  }

  // Contests
  async getContests(status?: string): Promise<Contest[]> {
    const params = status ? `?status=${status}` : ''
    return this.request(`/contests${params}`)
  }

  async getUpcomingContests(): Promise<Contest[]> {
    return this.request('/contests/upcoming')
  }

  async getLiveContests(): Promise<Contest[]> {
    return this.request('/contests/live')
  }

  async joinContest(contestId: string): Promise<void> {
    return this.request(`/contests/${contestId}/join`, { method: 'POST' })
  }

  async getLeaderboard(contestId: string): Promise<{ participants: any[] }> {
    return this.request(`/contests/${contestId}/leaderboard`)
  }

  // Duels
  async createDuel(opponentId?: string, topic?: string): Promise<Duel> {
    return this.request('/contests/duels', {
      method: 'POST',
      body: JSON.stringify({
        opponent_id: opponentId,
        topic,
        question_count: 5,
        time_limit_seconds: 300
      })
    })
  }

  async findRandomDuel(): Promise<Duel> {
    return this.request('/contests/duels/find-random', { method: 'POST' })
  }

  async getDuel(id: string): Promise<Duel> {
    return this.request(`/contests/duels/${id}`)
  }

  async acceptDuel(duelId: string): Promise<Duel> {
    return this.request(`/contests/duels/${duelId}/accept`, { method: 'POST' })
  }

  // Code Execution
  async runCode(
    sourceCode: string, 
    language: string, 
    stdin?: string
  ): Promise<{
    stdout: string | null
    stderr: string | null
    compile_output: string | null
    status: string
    time: string | null
    memory: number | null
  }> {
    return this.request('/questions/run', {
      method: 'POST',
      body: JSON.stringify({
        source_code: sourceCode,
        language,
        stdin
      })
    })
  }

  async submitCode(
    questionId: string,
    sourceCode: string,
    language: string
  ): Promise<{
    is_correct: boolean
    stdout: string | null
    stderr: string | null
    compile_output: string | null
    status: string
    xp_earned: number
    mastery_change: number
    correct_answer: string | null
  }> {
    return this.request('/questions/submit-code', {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        source_code: sourceCode,
        language
      })
    })
  }
}

export const api = new ApiService()
