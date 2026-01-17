// ABOUTME: Contest display card component
// ABOUTME: Shows contest info with countdown and participant count

import { useNavigate } from 'react-router-dom'
import { Users, Clock, Trophy, MapPin } from 'lucide-react'
import clsx from 'clsx'
import type { Contest } from '../types'

interface ContestCardProps {
  contest: Contest
}

const levelColors = {
  city: 'bg-blue-100 text-blue-700',
  state: 'bg-purple-100 text-purple-700',
  national: 'bg-orange-100 text-orange-700',
  global: 'bg-red-100 text-red-700'
}

const statusColors = {
  upcoming: 'bg-yellow-100 text-yellow-700',
  live: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700'
}

export default function ContestCard({ contest }: ContestCardProps) {
  const navigate = useNavigate()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now()
    if (diff < 0) return 'Started'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h`
    return `${hours}h`
  }

  return (
    <div 
      onClick={() => navigate(`/app/contests/${contest.id}`)}
      className="card cursor-pointer hover:shadow-xl transition-shadow border-l-4 border-primary-500"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {contest.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={clsx(
              'px-2 py-0.5 rounded-full text-xs font-medium capitalize flex items-center gap-1',
              levelColors[contest.level]
            )}>
              <MapPin className="w-3 h-3" />
              {contest.level}
            </span>
            <span className={clsx(
              'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
              statusColors[contest.status]
            )}>
              {contest.status}
            </span>
          </div>
        </div>
        <div className="text-right">
          {contest.prizes && contest.prizes[0] && (
            <div className="flex items-center gap-1 text-primary-600 font-bold text-sm">
              <Trophy className="w-4 h-4" />
              {contest.prizes[0].reward}
            </div>
          )}
          {contest.xp_rewards && contest.xp_rewards['1st'] && (
            <div className="flex items-center gap-1 text-primary-600 font-bold">
              <Trophy className="w-4 h-4" />
              {contest.xp_rewards['1st']} XP
            </div>
          )}
        </div>
      </div>

      {contest.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {contest.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {contest.current_participants || contest.participant_count || 0}
            {contest.max_participants && ` / ${contest.max_participants}`}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDate(contest.start_time)}
          </span>
        </div>
        
        {contest.status === 'upcoming' && (
          <span className="text-primary-600 font-medium">
            Starts in {getTimeUntil(contest.start_time)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {contest.topics.slice(0, 3).map(topic => (
          <span key={topic} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
            {topic}
          </span>
        ))}
        {contest.topics.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
            +{contest.topics.length - 3} more
          </span>
        )}
      </div>
    </div>
  )
}
