// ABOUTME: User profile page with stats and mastery
// ABOUTME: Shows detailed learning progress and achievements

import { useEffect, useState } from 'react'
import { 
  User, Zap, Trophy, Flame, Target, Clock, 
  CheckCircle, Award, TrendingUp 
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import MasteryChart from '../components/MasteryChart'
import type { UserMasteryProfile } from '../types'

export default function Profile() {
  const { user } = useAuth()
  const [mastery, setMastery] = useState<UserMasteryProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMastery = async () => {
      try {
        const data = await api.getMastery()
        setMastery(data)
      } catch (error) {
        console.error('Failed to fetch mastery:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMastery()
  }, [])

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-accent-400 rounded-2xl flex items-center justify-center text-white text-4xl font-bold">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.display_name || user?.username}
            </h1>
            <p className="text-gray-500">@{user?.username}</p>
            <div className="flex items-center gap-4 mt-4">
              <span className="flex items-center gap-1 text-yellow-600">
                <Zap className="w-5 h-5" />
                {user?.total_xp || 0} XP
              </span>
              <span className="flex items-center gap-1 text-accent-600">
                <Award className="w-5 h-5" />
                Level {user?.current_level || 1}
              </span>
              <span className="flex items-center gap-1 text-orange-600">
                <Flame className="w-5 h-5" />
                {user?.streak_days || 0} day streak
              </span>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Level {user?.current_level || 1}</span>
            <span>Level {(user?.current_level || 1) + 1}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-4 rounded-full transition-all"
              style={{ width: `${((user?.total_xp || 0) % 1000) / 10}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {1000 - ((user?.total_xp || 0) % 1000)} XP to next level
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <Target className="w-10 h-10 text-primary-500 mx-auto mb-3" />
          <div className="text-3xl font-bold text-gray-900">
            {Math.round((mastery?.overall_mastery || 0) * 100)}%
          </div>
          <div className="text-gray-500">Overall Mastery</div>
        </div>

        <div className="card text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <div className="text-3xl font-bold text-gray-900">
            {mastery?.topics.reduce((sum, t) => sum + t.total_attempts, 0) || 0}
          </div>
          <div className="text-gray-500">Problems Solved</div>
        </div>

        <div className="card text-center">
          <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <div className="text-3xl font-bold text-gray-900">
            {mastery?.strengths.length || 0}
          </div>
          <div className="text-gray-500">Strong Topics</div>
        </div>

        <div className="card text-center">
          <TrendingUp className="w-10 h-10 text-accent-500 mx-auto mb-3" />
          <div className="text-3xl font-bold text-gray-900">
            {mastery?.topics.length || 0}
          </div>
          <div className="text-gray-500">Topics Practiced</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Mastery Chart */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary-600" />
            Topic Mastery
          </h2>
          <MasteryChart topics={mastery?.topics || []} maxItems={10} />
        </div>

        {/* Strengths & Weaknesses */}
        <div className="space-y-6">
          {/* Strengths */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-green-500" />
              Your Strengths
            </h2>
            {mastery?.strengths && mastery.strengths.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mastery.strengths.map(topic => (
                  <span 
                    key={topic}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Keep practicing to discover your strengths!</p>
            )}
          </div>

          {/* Weaknesses */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-orange-500" />
              Areas to Improve
            </h2>
            {mastery?.weaknesses && mastery.weaknesses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mastery.weaknesses.map(topic => (
                  <span 
                    key={topic}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Great job! No weak areas detected.</p>
            )}
          </div>

          {/* Recommended */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary-500" />
              Recommended Topics
            </h2>
            {mastery?.recommended_topics && mastery.recommended_topics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mastery.recommended_topics.map(topic => (
                  <span 
                    key={topic}
                    className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Complete more problems to get recommendations!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
