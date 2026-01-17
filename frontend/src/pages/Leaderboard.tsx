// ABOUTME: Global leaderboard page
// ABOUTME: Shows top users by XP with filtering options

import { useState } from 'react'
import { Trophy, Medal, Zap, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../contexts/AuthContext'

// Simulated leaderboard data - in real app, fetch from API
const MOCK_LEADERBOARD = [
  { id: '1', username: 'codemaster', display_name: 'Code Master', total_xp: 15420, level: 12, streak: 45 },
  { id: '2', username: 'devninja', display_name: 'Dev Ninja', total_xp: 12350, level: 11, streak: 32 },
  { id: '3', username: 'algoqueen', display_name: 'Algo Queen', total_xp: 11200, level: 10, streak: 28 },
  { id: '4', username: 'bytewizard', display_name: 'Byte Wizard', total_xp: 9800, level: 9, streak: 21 },
  { id: '5', username: 'loopmaster', display_name: 'Loop Master', total_xp: 8500, level: 8, streak: 18 },
  { id: '6', username: 'recursionking', display_name: 'Recursion King', total_xp: 7200, level: 7, streak: 15 },
  { id: '7', username: 'datastructor', display_name: 'Data Structor', total_xp: 6100, level: 6, streak: 12 },
  { id: '8', username: 'graphguru', display_name: 'Graph Guru', total_xp: 5400, level: 5, streak: 10 },
  { id: '9', username: 'treeclimber', display_name: 'Tree Climber', total_xp: 4800, level: 5, streak: 8 },
  { id: '10', username: 'stackpusher', display_name: 'Stack Pusher', total_xp: 4200, level: 4, streak: 6 },
]

export default function Leaderboard() {
  const { user } = useAuth()
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all')

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
          <Trophy className="w-6 h-6 text-yellow-900" />
        </div>
      )
    }
    if (rank === 2) {
      return (
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <Medal className="w-6 h-6 text-gray-700" />
        </div>
      )
    }
    if (rank === 3) {
      return (
        <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center">
          <Medal className="w-6 h-6 text-orange-900" />
        </div>
      )
    }
    return (
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
        {rank}
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-gray-600 mt-1">
          Top learners on Brainwave
        </p>
      </div>

      {/* Time Filter */}
      <div className="card mb-8">
        <div className="flex gap-2">
          {(['all', 'month', 'week'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={clsx(
                'px-6 py-2 rounded-lg font-medium capitalize transition-colors',
                timeFilter === filter 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {filter === 'all' ? 'All Time' : `This ${filter}`}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {MOCK_LEADERBOARD.slice(0, 3).map((player, index) => (
          <div 
            key={player.id}
            className={clsx(
              'card text-center relative overflow-hidden',
              index === 0 && 'ring-2 ring-yellow-400 bg-gradient-to-b from-yellow-50 to-white',
              index === 1 && 'ring-2 ring-gray-300',
              index === 2 && 'ring-2 ring-orange-300'
            )}
          >
            {index === 0 && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400" />
            )}
            
            <div className="mb-4">
              {getRankBadge(index + 1)}
            </div>
            
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {player.username[0].toUpperCase()}
            </div>
            
            <h3 className="font-bold text-gray-900">{player.display_name}</h3>
            <p className="text-sm text-gray-500 mb-4">@{player.username}</p>
            
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-yellow-600">
                <Zap className="w-4 h-4" />
                {player.total_xp.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-accent-600">
                <TrendingUp className="w-4 h-4" />
                Lvl {player.level}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard */}
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-4 px-4 text-gray-500 font-medium">Rank</th>
              <th className="text-left py-4 px-4 text-gray-500 font-medium">Player</th>
              <th className="text-right py-4 px-4 text-gray-500 font-medium">XP</th>
              <th className="text-right py-4 px-4 text-gray-500 font-medium">Level</th>
              <th className="text-right py-4 px-4 text-gray-500 font-medium">Streak</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LEADERBOARD.map((player, index) => (
              <tr 
                key={player.id}
                className={clsx(
                  'border-b last:border-0 hover:bg-gray-50 transition-colors',
                  player.id === user?.id && 'bg-primary-50'
                )}
              >
                <td className="py-4 px-4">
                  {getRankBadge(index + 1)}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-bold">
                      {player.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{player.display_name}</p>
                      <p className="text-sm text-gray-500">@{player.username}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="flex items-center justify-end gap-1 text-yellow-600 font-bold">
                    <Zap className="w-4 h-4" />
                    {player.total_xp.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4 text-right font-medium text-gray-900">
                  {player.level}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-orange-600">{player.streak} days</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
