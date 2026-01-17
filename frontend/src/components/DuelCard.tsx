// ABOUTME: Duel display card component
// ABOUTME: Shows duel status, scores, and opponent info

import { useNavigate } from 'react-router-dom'
import { Swords, Clock, Trophy } from 'lucide-react'
import clsx from 'clsx'
import type { Duel } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface DuelCardProps {
  duel: Duel
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  waiting: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700'
}

export default function DuelCard({ duel }: DuelCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Check if current user is challenger - use 'demo' as fallback for demo mode
  const userId = user?.id || 'demo'
  const isChallenger = userId === duel.challenger_id
  const myScore = isChallenger ? duel.challenger_score : duel.opponent_score
  const opponentScore = isChallenger ? duel.opponent_score : duel.challenger_score
  const isWinner = duel.winner_id === userId
  
  // Use display names from mock data if available
  const myName = isChallenger 
    ? (duel.challenger_username || 'You') 
    : (duel.opponent_username || 'You')
  const opponentName = isChallenger 
    ? (duel.opponent_username || 'Opponent') 
    : (duel.challenger_username || 'Opponent')

  return (
    <div 
      onClick={() => navigate(`/app/duels/${duel.id}`)}
      className={clsx(
        'card cursor-pointer hover:shadow-xl transition-shadow',
        duel.status === 'completed' && isWinner && 'border-l-4 border-green-500',
        duel.status === 'completed' && !isWinner && duel.winner_id && 'border-l-4 border-red-500'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center">
            <Swords className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {duel.topic || 'Random Topic'} Duel
            </h3>
            <span className={clsx(
              'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
              statusColors[duel.status] || 'bg-gray-100 text-gray-700'
            )}>
              {duel.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {duel.status !== 'waiting' && duel.status !== 'pending' && (
        <div className="flex items-center justify-center gap-8 py-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{myScore}</div>
            <div className="text-sm text-gray-500">{myName}</div>
          </div>
          <div className="text-gray-400 font-bold">VS</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">{opponentScore}</div>
            <div className="text-sm text-gray-500">{opponentName}</div>
          </div>
        </div>
      )}

      {(duel.status === 'waiting' || duel.status === 'pending') && (
        <div className="flex items-center justify-center gap-8 py-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary-600">{duel.challenger_username || 'Challenger'}</div>
          </div>
          <div className="text-gray-400 font-bold">VS</div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-600">{duel.opponent_username || 'Waiting...'}</div>
          </div>
        </div>
      )}

      {duel.status === 'completed' && (
        <div className={clsx(
          'text-center py-2 rounded-lg font-medium',
          isWinner ? 'bg-green-50 text-green-700' : 
          duel.winner_id ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
        )}>
          {isWinner ? (
            <span className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" />
              Victory!
            </span>
          ) : duel.winner_id ? (
            'Defeat'
          ) : (
            'Draw'
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>{duel.questions.length} questions</span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {new Date(duel.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
