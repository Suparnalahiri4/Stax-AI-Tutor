// ABOUTME: Live duel arena page
// ABOUTME: Real-time 1v1 coding battle interface

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Swords, Clock, CheckCircle, XCircle, Trophy, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import type { Duel, Question } from '../types'

export default function DuelArena() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [duel, setDuel] = useState<Duel | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(300)

  useEffect(() => {
    const fetchDuel = async () => {
      if (!id) return
      try {
        const duelData = await api.getDuel(id)
        setDuel(duelData)
        
        // Fetch questions
        const questionPromises = duelData.questions.map(qId => api.getQuestion(qId))
        const questionData = await Promise.all(questionPromises)
        setQuestions(questionData)
      } catch (error) {
        console.error('Failed to fetch duel:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDuel()
  }, [id])

  // Timer
  useEffect(() => {
    if (!duel || duel.status !== 'in_progress') return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [duel])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!duel) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-gray-500">Duel not found</p>
      </div>
    )
  }

  const isChallenger = user?.id === duel.challenger_id
  const myScore = isChallenger ? duel.challenger_score : duel.opponent_score
  const opponentScore = isChallenger ? duel.opponent_score : duel.challenger_score
  const currentQuestion = questions[currentIndex]

  // Waiting for opponent
  if (duel.status === 'waiting') {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="card text-center max-w-md">
          <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Swords className="w-10 h-10 text-accent-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Opponent</h2>
          <p className="text-gray-600 mb-6">
            Share the duel link or wait for someone to join...
          </p>
          <div className="animate-pulse flex justify-center gap-2">
            <div className="w-3 h-3 bg-accent-500 rounded-full" />
            <div className="w-3 h-3 bg-accent-500 rounded-full animation-delay-200" />
            <div className="w-3 h-3 bg-accent-500 rounded-full animation-delay-400" />
          </div>
          <button
            onClick={() => navigate('/app/duels')}
            className="btn-secondary mt-6"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Completed
  if (duel.status === 'completed') {
    const isWinner = duel.winner_id === user?.id
    
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className={clsx(
          'card text-center max-w-md',
          isWinner ? 'border-2 border-green-500' : duel.winner_id ? 'border-2 border-red-500' : ''
        )}>
          <div className={clsx(
            'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6',
            isWinner ? 'bg-green-100' : duel.winner_id ? 'bg-red-100' : 'bg-gray-100'
          )}>
            {isWinner ? (
              <Trophy className="w-10 h-10 text-green-600" />
            ) : duel.winner_id ? (
              <XCircle className="w-10 h-10 text-red-600" />
            ) : (
              <Swords className="w-10 h-10 text-gray-600" />
            )}
          </div>
          
          <h2 className={clsx(
            'text-3xl font-bold mb-2',
            isWinner ? 'text-green-600' : duel.winner_id ? 'text-red-600' : 'text-gray-900'
          )}>
            {isWinner ? 'Victory!' : duel.winner_id ? 'Defeat' : 'Draw!'}
          </h2>
          
          <div className="flex items-center justify-center gap-8 my-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">{myScore}</div>
              <div className="text-gray-500">You</div>
            </div>
            <div className="text-2xl text-gray-400">vs</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-600">{opponentScore}</div>
              <div className="text-gray-500">Opponent</div>
            </div>
          </div>

          {isWinner && (
            <p className="text-green-600 font-medium mb-6">+50 XP earned!</p>
          )}

          <button
            onClick={() => navigate('/app/duels')}
            className="btn-primary"
          >
            Back to Duels
          </button>
        </div>
      </div>
    )
  }

  // Active Duel
  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/app/duels')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Leave Duel
      </button>

      {/* Score Header */}
      <div className="card mb-6 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-4xl font-bold">{myScore}</div>
            <div className="text-white/80">You</div>
          </div>
          
          <div className="text-center px-8">
            <div className="text-3xl font-mono font-bold flex items-center gap-2">
              <Clock className="w-6 h-6" />
              {formatTime(timeLeft)}
            </div>
            <div className="text-white/80">Time Left</div>
          </div>
          
          <div className="text-center flex-1">
            <div className="text-4xl font-bold">{opponentScore}</div>
            <div className="text-white/80">Opponent</div>
          </div>
        </div>
      </div>

      {/* Question Progress */}
      <div className="flex gap-2 mb-6">
        {questions.map((_, index) => (
          <div
            key={index}
            className={clsx(
              'h-2 flex-1 rounded-full',
              index < currentIndex && 'bg-green-500',
              index === currentIndex && 'bg-primary-500',
              index > currentIndex && 'bg-gray-200'
            )}
          />
        ))}
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className={clsx(
              'px-3 py-1 rounded-full text-sm font-medium capitalize',
              currentQuestion.difficulty === 'easy' && 'bg-green-100 text-green-700',
              currentQuestion.difficulty === 'medium' && 'bg-yellow-100 text-yellow-700',
              currentQuestion.difficulty === 'hard' && 'bg-orange-100 text-orange-700'
            )}>
              {currentQuestion.difficulty}
            </span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {currentQuestion.title}
          </h2>
          <p className="text-gray-700 mb-6">{currentQuestion.description}</p>

          {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options ? (
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={clsx(
                    'flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors',
                    answer === option 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={answer === option}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="input-field min-h-[150px] font-mono text-sm mb-6"
              placeholder="Write your answer..."
            />
          )}

          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setAnswer('')
                setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1))
              }}
              className="btn-secondary"
            >
              Skip
            </button>
            <button
              onClick={() => {
                // Submit answer logic
                setAnswer('')
                setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1))
              }}
              disabled={!answer}
              className="btn-primary disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
