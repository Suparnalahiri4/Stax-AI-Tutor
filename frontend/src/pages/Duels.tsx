// ABOUTME: Duels page for 1v1 competitive battles
// ABOUTME: Create, find, or view duel history

import { useState } from 'react'
import { Swords, Plus, Shuffle, Users, Trophy, Clock, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Duel } from '../types'

const TOPICS = [
  'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
  'Dynamic Programming', 'Recursion', 'Sorting'
]

// Hardcoded demo duels for presentation
const MOCK_DUELS: Duel[] = [
  {
    id: 'd1',
    challenger_id: 'demo',
    opponent_id: 'user2',
    topic: 'Arrays',
    status: 'in_progress',
    challenger_score: 2,
    opponent_score: 1,
    questions: ['q1', 'q2', 'q3', 'q4', 'q5'],
    current_question: 3,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    challenger_username: 'You',
    opponent_username: 'CodeNinja42',
  },
  {
    id: 'd2',
    challenger_id: 'user3',
    opponent_id: 'demo',
    topic: 'Dynamic Programming',
    status: 'completed',
    challenger_score: 2,
    opponent_score: 3,
    questions: ['q6', 'q7', 'q8', 'q9', 'q10'],
    current_question: 5,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    winner_id: 'demo',
    challenger_username: 'AlgoMaster',
    opponent_username: 'You',
  },
  {
    id: 'd3',
    challenger_id: 'demo',
    opponent_id: 'user4',
    topic: 'Trees',
    status: 'completed',
    challenger_score: 4,
    opponent_score: 1,
    questions: ['q11', 'q12', 'q13', 'q14', 'q15'],
    current_question: 5,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    winner_id: 'demo',
    challenger_username: 'You',
    opponent_username: 'TreeClimber',
  },
  {
    id: 'd4',
    challenger_id: 'user5',
    opponent_id: 'demo',
    topic: 'Graphs',
    status: 'pending',
    challenger_score: 0,
    opponent_score: 0,
    questions: ['q16', 'q17', 'q18', 'q19', 'q20'],
    current_question: 0,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    challenger_username: 'GraphGuru',
    opponent_username: 'You',
  },
]

export default function Duels() {
  const navigate = useNavigate()
  const [duels, setDuels] = useState<Duel[]>(MOCK_DUELS)
  const [loading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [finding, setFinding] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreateDuel = async () => {
    setCreating(true)
    try {
      const duel = await api.createDuel(undefined, selectedTopic || undefined)
      navigate(`/app/duels/${duel.id}`)
    } catch (error) {
      console.error('Failed to create duel:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleFindRandom = async () => {
    setFinding(true)
    try {
      const duel = await api.findRandomDuel()
      navigate(`/app/duels/${duel.id}`)
    } catch (error) {
      console.error('No duels available:', error)
      // If no duels found, create one
      const duel = await api.createDuel()
      navigate(`/app/duels/${duel.id}`)
    } finally {
      setFinding(false)
    }
  }

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
          <Swords className="w-8 h-8 text-accent-500" />
          Duels
        </h1>
        <p className="text-gray-600 mt-1">
          Challenge others to 1v1 coding battles
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div 
          onClick={() => setShowCreateModal(true)}
          className="card cursor-pointer hover:shadow-xl transition-shadow border-2 border-dashed border-gray-300 hover:border-primary-400"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Create Duel</h3>
              <p className="text-gray-600">Challenge someone or wait for a match</p>
            </div>
          </div>
        </div>

        <div 
          onClick={handleFindRandom}
          className="card cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-r from-accent-500 to-primary-500 text-white"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              {finding ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              ) : (
                <Shuffle className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold">Quick Match</h3>
              <p className="text-white/80">Find an opponent instantly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Duels */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Duels</h2>
        {duels.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No duels yet</p>
            <p className="text-gray-400 mt-2">Create a duel or find a quick match to get started!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {duels.map(duel => (
              <DuelCard key={duel.id} duel={duel} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Duel</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic (optional)
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="input-field"
              >
                <option value="">Any Topic</option>
                {TOPICS.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDuel}
                disabled={creating}
                className="btn-primary flex-1"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
