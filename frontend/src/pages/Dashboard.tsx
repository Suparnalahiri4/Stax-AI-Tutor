// ABOUTME: Main dashboard page for authenticated users
// ABOUTME: Shows mastery overview, assignments, and quick actions

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookOpen, Trophy, Swords, Zap, TrendingUp, 
  Target, Clock, Award, ArrowRight, Flame 
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import MasteryChart from '../components/MasteryChart'
import type { UserMasteryProfile, Assignment, Contest } from '../types'

export default function Dashboard() {
  const { user } = useAuth()
  const [mastery, setMastery] = useState<UserMasteryProfile | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [masteryData, assignmentsData, contestsData] = await Promise.all([
          api.getMastery(),
          api.getAssignments('pending'),
          api.getUpcomingContests()
        ])
        setMastery(masteryData)
        setAssignments(assignmentsData.slice(0, 3))
        setContests(contestsData.slice(0, 3))
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.display_name || user?.username}!
        </h1>
        <p className="text-gray-600 mt-1">
          Continue your learning journey. You're doing great!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100">Total XP</p>
              <p className="text-3xl font-bold">{user?.total_xp || 0}</p>
            </div>
            <Zap className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100">Level</p>
              <p className="text-3xl font-bold">{user?.current_level || 1}</p>
            </div>
            <Award className="w-12 h-12 text-accent-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Streak</p>
              <p className="text-3xl font-bold">{user?.streak_days || 0} days</p>
            </div>
            <Flame className="w-12 h-12 text-orange-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Mastery</p>
              <p className="text-3xl font-bold">
                {Math.round((mastery?.overall_mastery || 0) * 100)}%
              </p>
            </div>
            <Target className="w-12 h-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Mastery Overview */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary-600" />
                Your Mastery
              </h2>
              <Link to="/app/profile" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <MasteryChart topics={mastery?.topics || []} maxItems={5} />
            
            {mastery?.weaknesses && mastery.weaknesses.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Focus Areas:</strong> {mastery.weaknesses.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                to="/app/practice" 
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Practice</p>
                  <p className="text-sm text-gray-500">Solve problems</p>
                </div>
              </Link>

              <Link 
                to="/app/duels" 
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                  <Swords className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Duel</p>
                  <p className="text-sm text-gray-500">Challenge others</p>
                </div>
              </Link>

              <Link 
                to="/app/contests" 
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Contests</p>
                  <p className="text-sm text-gray-500">{contests.length} upcoming</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Pending Assignments */}
          {assignments.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Assignments</h2>
                <Link to="/app/assignments" className="text-primary-600 hover:text-primary-700 text-sm">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div 
                    key={assignment.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <p className="font-medium text-gray-900 text-sm">{assignment.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {assignment.due_date 
                        ? `Due ${new Date(assignment.due_date).toLocaleDateString()}`
                        : 'No due date'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
