// ABOUTME: Practice page for browsing and selecting questions
// ABOUTME: Filters by topic, difficulty, and question type

import { useEffect, useState } from 'react'
import { Search, Filter, Sparkles, RefreshCw, Code, List } from 'lucide-react'
import { api } from '../services/api'
import QuestionCard from '../components/QuestionCard'
import type { Question } from '../types'

const TOPICS = [
  'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
  'Dynamic Programming', 'Recursion', 'Sorting', 'Searching',
  'Hash Tables', 'Stacks', 'Queues', 'Heaps', 'Binary Search'
]

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert']

const QUESTION_TYPES = [
  { id: 'coding', label: 'Coding', icon: Code },
  { id: 'multiple_choice', label: 'MCQ', icon: List }
] as const

type QuestionType = 'coding' | 'multiple_choice'

export default function Practice() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState('Arrays')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [selectedType, setSelectedType] = useState<QuestionType>('coding')
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<string>('')
  const [questionCount, setQuestionCount] = useState(3)

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const data = await api.getQuestionsByTopic(
        selectedTopic, 
        selectedDifficulty || undefined
      )
      setQuestions(data)
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [selectedTopic, selectedDifficulty])

  const handleGenerateQuestions = async () => {
    setGenerating(true)
    setMessage('')
    try {
      const difficulty = selectedDifficulty || 'easy'
      const newQuestions = await api.generateQuestions(selectedTopic, difficulty, questionCount, selectedType)
      setMessage(`Generated ${newQuestions.length} new ${selectedType === 'coding' ? 'coding' : 'MCQ'} questions!`)
      await fetchQuestions()
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const filteredQuestions = questions.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Practice</h1>
        <p className="text-gray-600 mt-1">
          Choose a topic and start solving problems
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12"
              placeholder="Search questions..."
            />
          </div>

          {/* Topic Dropdown */}
          <div className="relative">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="input-field pr-10 appearance-none cursor-pointer"
            >
              {TOPICS.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Difficulty */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDifficulty('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDifficulty === '' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {DIFFICULTIES.map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  selectedDifficulty === diff 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
        
        {/* Question Type Selector */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">Question Type:</span>
          <div className="flex gap-2">
            {QUESTION_TYPES.map(type => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedType === type.id 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Questions Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No questions found for {selectedTopic}.</p>
          <p className="text-gray-400 mt-2 mb-6">Generate some AI-powered {selectedType === 'coding' ? 'coding' : 'MCQ'} questions to get started!</p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <label className="text-gray-600">How many?</label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="input-field w-20 text-center"
            >
              {[1, 2, 3, 5, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateQuestions}
            disabled={generating}
            className="btn-primary inline-flex items-center gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating {questionCount} {selectedType === 'coding' ? 'coding' : 'MCQ'} questions...
              </>
            ) : (
              <>
                {selectedType === 'coding' ? <Code className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                Generate {questionCount} {selectedType === 'coding' ? 'Coding' : 'MCQ'} Questions
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">{filteredQuestions.length} questions available</p>
            <div className="flex items-center gap-3">
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="input-field w-16 text-center text-sm py-2"
              >
                {[1, 2, 3, 5, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <button
                onClick={handleGenerateQuestions}
                disabled={generating}
                className="btn-secondary inline-flex items-center gap-2 text-sm"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate More
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestions.map(question => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
