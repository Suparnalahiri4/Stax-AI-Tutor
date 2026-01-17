// ABOUTME: Assignments page showing personalized learning tasks
// ABOUTME: Can generate new assignments and view progress

import { useState } from 'react'
import { Zap, Clock, CheckCircle, AlertCircle, Plus, BookOpen } from 'lucide-react'
import clsx from 'clsx'
import type { Assignment } from '../types'

// Hardcoded demo assignments for presentation
const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'a1',
    user_id: 'demo',
    title: 'Array Mastery Challenge',
    description: 'Strengthen your array manipulation skills with these focused problems',
    assignment_type: 'challenge',
    target_topics: ['Arrays', 'Two Pointers', 'Sliding Window'],
    difficulty_range: { min: 'medium', max: 'hard' },
    questions: [
      { question_id: 'q1', order: 1, is_completed: true },
      { question_id: 'q2', order: 2, is_completed: true },
      { question_id: 'q3', order: 3, is_completed: false },
      { question_id: 'q4', order: 4, is_completed: false },
    ],
    status: 'in_progress',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    xp_bonus: 150,
    created_at: new Date().toISOString(),
  },
  {
    id: 'a2',
    user_id: 'demo',
    title: 'Dynamic Programming Fundamentals',
    description: 'Master the art of breaking down problems into subproblems',
    assignment_type: 'practice',
    target_topics: ['Dynamic Programming', 'Memoization'],
    difficulty_range: { min: 'easy', max: 'medium' },
    questions: [
      { question_id: 'q5', order: 1, is_completed: false },
      { question_id: 'q6', order: 2, is_completed: false },
      { question_id: 'q7', order: 3, is_completed: false },
    ],
    status: 'pending',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    xp_bonus: 100,
    created_at: new Date().toISOString(),
  },
  {
    id: 'a3',
    user_id: 'demo',
    title: 'Tree Traversal Review',
    description: 'Quick review of binary tree traversal techniques',
    assignment_type: 'review',
    target_topics: ['Trees', 'BFS', 'DFS'],
    difficulty_range: { min: 'easy', max: 'easy' },
    questions: [
      { question_id: 'q8', order: 1, is_completed: true },
      { question_id: 'q9', order: 2, is_completed: true },
    ],
    status: 'completed',
    completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    xp_bonus: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: 'a4',
    user_id: 'demo',
    title: 'Graph Algorithms Reinforcement',
    description: 'Reinforce your understanding of graph traversal and shortest paths',
    assignment_type: 'reinforcement',
    target_topics: ['Graphs', 'Dijkstra', 'BFS'],
    difficulty_range: { min: 'medium', max: 'hard' },
    questions: [
      { question_id: 'q10', order: 1, is_completed: true },
      { question_id: 'q11', order: 2, is_completed: true },
      { question_id: 'q12', order: 3, is_completed: true },
      { question_id: 'q13', order: 4, is_completed: false },
      { question_id: 'q14', order: 5, is_completed: false },
    ],
    status: 'in_progress',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    xp_bonus: 200,
    created_at: new Date().toISOString(),
  },
]

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS)
  const [loading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const handleGenerate = async () => {
    setGenerating(true)
    // Simulate generation delay
    setTimeout(() => {
      const newAssignment: Assignment = {
        id: `a${Date.now()}`,
        user_id: 'demo',
        title: 'New Personalized Assignment',
        description: 'AI-generated assignment based on your learning patterns',
        assignment_type: 'practice',
        target_topics: ['Strings', 'Hash Maps'],
        difficulty_range: { min: 'medium', max: 'medium' },
        questions: [
          { question_id: 'qn1', order: 1, is_completed: false },
          { question_id: 'qn2', order: 2, is_completed: false },
          { question_id: 'qn3', order: 3, is_completed: false },
        ],
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        xp_bonus: 120,
        created_at: new Date().toISOString(),
      }
      setAssignments([newAssignment, ...assignments])
      setGenerating(false)
    }, 1500)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <BookOpen className="w-5 h-5 text-gray-400" />
    }
  }

  const filteredAssignments = filter === 'all' 
    ? assignments 
    : assignments.filter(a => a.status === filter)

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">
            Personalized learning tasks based on your progress
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {generating ? 'Generating...' : 'Generate New'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'in_progress', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium capitalize transition-colors',
              filter === status 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No assignments found</p>
          <p className="text-gray-400 mt-2">Generate a new assignment to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map(assignment => {
            const completedCount = assignment.questions.filter(q => q.is_completed).length
            const progress = (completedCount / assignment.questions.length) * 100

            return (
              <div key={assignment.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {getStatusIcon(assignment.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-gray-600 text-sm mt-1">{assignment.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {assignment.target_topics.map(topic => (
                          <span 
                            key={topic}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={clsx(
                      'px-3 py-1 rounded-full text-sm font-medium capitalize',
                      assignment.assignment_type === 'challenge' && 'bg-red-100 text-red-700',
                      assignment.assignment_type === 'practice' && 'bg-blue-100 text-blue-700',
                      assignment.assignment_type === 'reinforcement' && 'bg-yellow-100 text-yellow-700',
                      assignment.assignment_type === 'review' && 'bg-green-100 text-green-700'
                    )}>
                      {assignment.assignment_type}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-600 mt-2 justify-end">
                      <Zap className="w-4 h-4" />
                      +{assignment.xp_bonus} bonus XP
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>{completedCount} / {assignment.questions.length} questions</span>
                    <span>{Math.round(progress)}% complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Due Date */}
                {assignment.due_date && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    Due: {new Date(assignment.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                )}

                {/* Action Button */}
                {assignment.status !== 'completed' && (
                  <button className="btn-primary mt-4">
                    {assignment.status === 'pending' ? 'Start Assignment' : 'Continue'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
