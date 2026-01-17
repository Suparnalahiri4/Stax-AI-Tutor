// ABOUTME: Question display card component
// ABOUTME: Shows question details with difficulty badge and topic tags

import { useNavigate } from 'react-router-dom'
import { Clock, Zap, Code, List } from 'lucide-react'
import clsx from 'clsx'
import type { Question } from '../types'

interface QuestionCardProps {
  question: Question
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-orange-100 text-orange-700',
  expert: 'bg-red-100 text-red-700'
}

const questionTypeIcons = {
  coding: Code,
  multiple_choice: List,
  short_answer: List,
  multi_step: List
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const navigate = useNavigate()

  return (
    <div 
      onClick={() => navigate(`/app/question/${question.id}`)}
      className="card cursor-pointer hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
          {question.title}
        </h3>
        <span className={clsx(
          'px-2 py-1 rounded-full text-xs font-medium capitalize',
          difficultyColors[question.difficulty]
        )}>
          {question.difficulty}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {question.description}
      </p>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-yellow-500" />
          {question.xp_reward} XP
        </span>
        {question.time_limit_seconds && (
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {Math.floor(question.time_limit_seconds / 60)}min
          </span>
        )}
        <span className="flex items-center gap-1">
          {(() => {
            const TypeIcon = questionTypeIcons[question.question_type] || List
            return <TypeIcon className="w-4 h-4" />
          })()}
          <span className="capitalize">{question.question_type.replace('_', ' ')}</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs">
          {question.topic}
        </span>
        {question.tags.slice(0, 2).map(tag => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
