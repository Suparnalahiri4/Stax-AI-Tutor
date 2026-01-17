// ABOUTME: Individual contest detail page
// ABOUTME: Shows contest info, leaderboard, and join functionality

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Trophy, Users, Clock, MapPin, ArrowLeft, 
  Calendar, Award, CheckCircle 
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import type { Contest, ContestParticipant } from '../types'

export default function ContestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [contest, setContest] = useState<Contest | null>(null)
  const [leaderboard, setLeaderboard] = useState<ContestParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        const [contestsData, leaderboardData] = await Promise.all([
          api.getContests(),
          api.getLeaderboard(id)
        ])
        
        const foundContest = contestsData.find(c => c.id === id)
        setContest(foundContest || null)
        setLeaderboard(leaderboardData.participants || [])
        
        // Check if user has joined
        if (user && leaderboardData.participants) {
          setJoined(leaderboardData.participants.some(p => p.user_id === user.id))
        }
      } catch (error) {
        console.error('Failed to fetch contest:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user])

  const handleJoin = async () => {
    if (!id) return
    setJoining(true)
    try {
      await api.joinContest(id)
      setJoined(true)
      if (contest) {
        setContest({ ...contest, participant_count: contest.participant_count + 1 })
      }
    } catch (error) {
      console.error('Failed to join contest:', error)
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-gray-500">Contest not found</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Contests
      </button>

      {/* Contest Header */}
      <div className="card mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900">{contest.title}</h1>
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <span className={clsx(
                'px-3 py-1 rounded-full text-sm font-medium capitalize flex items-center gap-1',
                contest.level === 'city' && 'bg-blue-100 text-blue-700',
                contest.level === 'state' && 'bg-purple-100 text-purple-700',
                contest.level === 'national' && 'bg-orange-100 text-orange-700',
                contest.level === 'global' && 'bg-red-100 text-red-700'
              )}>
                <MapPin className="w-4 h-4" />
                {contest.level}
              </span>
              <span className={clsx(
                'px-3 py-1 rounded-full text-sm font-medium capitalize',
                contest.status === 'upcoming' && 'bg-yellow-100 text-yellow-700',
                contest.status === 'live' && 'bg-green-100 text-green-700',
                contest.status === 'completed' && 'bg-gray-100 text-gray-700'
              )}>
                {contest.status}
              </span>
            </div>
          </div>
          
          {contest.status === 'upcoming' && (
            <button
              onClick={handleJoin}
              disabled={joining || joined}
              className={clsx(
                'btn-primary flex items-center gap-2',
                joined && 'bg-green-600 hover:bg-green-700'
              )}
            >
              {joined ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Joined
                </>
              ) : joining ? (
                'Joining...'
              ) : (
                'Join Contest'
              )}
            </button>
          )}
        </div>

        {contest.description && (
          <p className="text-gray-600 mt-4">{contest.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t">
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              Start Time
            </div>
            <p className="font-medium text-gray-900">
              {new Date(contest.start_time).toLocaleString()}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="w-4 h-4" />
              End Time
            </div>
            <p className="font-medium text-gray-900">
              {new Date(contest.end_time).toLocaleString()}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              Participants
            </div>
            <p className="font-medium text-gray-900">
              {contest.participant_count}
              {contest.max_participants && ` / ${contest.max_participants}`}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Award className="w-4 h-4" />
              Top Prize
            </div>
            <p className="font-medium text-yellow-600">
              {contest.xp_rewards['1st']} XP
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {contest.topics.map(topic => (
            <span key={topic} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Leaderboard
        </h2>

        {leaderboard.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No participants yet. Be the first to join!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Rank</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Player</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Score</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Solved</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((participant, index) => (
                  <tr 
                    key={participant.user_id}
                    className={clsx(
                      'border-b last:border-0',
                      participant.user_id === user?.id && 'bg-primary-50'
                    )}
                  >
                    <td className="py-3 px-4">
                      {index < 3 ? (
                        <span className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-white',
                          index === 0 && 'bg-yellow-500',
                          index === 1 && 'bg-gray-400',
                          index === 2 && 'bg-orange-500'
                        )}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-gray-600 font-medium ml-2">{index + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-bold">
                          {participant.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {participant.display_name || participant.username}
                          </p>
                          <p className="text-sm text-gray-500">@{participant.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {participant.score}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {participant.questions_solved}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
