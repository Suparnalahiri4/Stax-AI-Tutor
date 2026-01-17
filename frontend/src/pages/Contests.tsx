// ABOUTME: Contests listing page
// ABOUTME: Shows upcoming, live, and completed contests

import { useState } from 'react'
import { Trophy, MapPin } from 'lucide-react'
import clsx from 'clsx'
import ContestCard from '../components/ContestCard'
import type { Contest } from '../types'

// Hardcoded demo contests for presentation
const MOCK_CONTESTS: Contest[] = [
  {
    id: 'c1',
    title: 'National Coding Championship 2026',
    description: 'The biggest coding competition of the year! Compete with the best programmers across the nation.',
    level: 'national',
    status: 'live',
    start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 180,
    max_participants: 10000,
    current_participants: 7842,
    topics: ['Dynamic Programming', 'Graphs', 'Trees', 'Arrays'],
    prizes: [
      { rank: 1, reward: '₹1,00,000 + Laptop' },
      { rank: 2, reward: '₹50,000 + Tablet' },
      { rank: 3, reward: '₹25,000 + Headphones' },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'c2',
    title: 'Mumbai City Showdown',
    description: 'Prove your skills against the best coders in Mumbai!',
    level: 'city',
    status: 'upcoming',
    start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 120,
    max_participants: 500,
    current_participants: 234,
    topics: ['Arrays', 'Strings', 'Two Pointers'],
    prizes: [
      { rank: 1, reward: '₹10,000' },
      { rank: 2, reward: '₹5,000' },
      { rank: 3, reward: '₹2,500' },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'c3',
    title: 'Maharashtra State Finals',
    description: 'State-level competition for top performers from all city contests',
    level: 'state',
    status: 'upcoming',
    start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 180,
    max_participants: 1000,
    current_participants: 456,
    topics: ['Dynamic Programming', 'Greedy', 'Binary Search'],
    prizes: [
      { rank: 1, reward: '₹25,000 + Trophy' },
      { rank: 2, reward: '₹15,000' },
      { rank: 3, reward: '₹7,500' },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'c4',
    title: 'Weekly Algorithm Sprint',
    description: 'Fast-paced weekly contest to sharpen your skills',
    level: 'global',
    status: 'upcoming',
    start_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    duration_minutes: 90,
    max_participants: 50000,
    current_participants: 12543,
    topics: ['Arrays', 'Math', 'Sorting'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'c5',
    title: 'Bangalore Tech Challenge',
    description: 'Completed contest - View your results and rankings',
    level: 'city',
    status: 'completed',
    start_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 120,
    max_participants: 800,
    current_participants: 654,
    topics: ['Linked Lists', 'Stacks', 'Queues'],
    prizes: [
      { rank: 1, reward: '₹15,000' },
      { rank: 2, reward: '₹8,000' },
      { rank: 3, reward: '₹4,000' },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'c6',
    title: 'DSA Marathon 2026',
    description: 'A completed national-level marathon testing all DSA concepts',
    level: 'national',
    status: 'completed',
    start_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 300,
    max_participants: 15000,
    current_participants: 11234,
    topics: ['All Topics'],
    prizes: [
      { rank: 1, reward: '₹2,00,000' },
      { rank: 2, reward: '₹1,00,000' },
      { rank: 3, reward: '₹50,000' },
    ],
    created_at: new Date().toISOString(),
  },
]

export default function Contests() {
  const [contests] = useState<Contest[]>(MOCK_CONTESTS)
  const [loading] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  const filteredContests = contests.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (levelFilter !== 'all' && c.level !== levelFilter) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Contests
        </h1>
        <p className="text-gray-600 mt-1">
          Compete at city, state, and national levels
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
            <div className="flex gap-2">
              {['all', 'upcoming', 'live', 'completed'].map(status => (
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
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Level Filter */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Level</p>
            <div className="flex gap-2">
              {['all', 'city', 'state', 'national', 'global'].map(level => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={clsx(
                    'px-4 py-2 rounded-lg font-medium capitalize transition-colors flex items-center gap-1',
                    levelFilter === level 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {level !== 'all' && <MapPin className="w-4 h-4" />}
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contests Grid */}
      {filteredContests.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No contests found</p>
          <p className="text-gray-400 mt-2">Check back later for new competitions!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredContests.map(contest => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  )
}
