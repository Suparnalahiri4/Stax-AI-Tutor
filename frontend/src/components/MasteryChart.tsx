// ABOUTME: Visual mastery chart component
// ABOUTME: Displays topic mastery as a horizontal bar chart

import clsx from 'clsx'
import type { TopicMastery } from '../types'

interface MasteryChartProps {
  topics: TopicMastery[]
  maxItems?: number
}

export default function MasteryChart({ topics, maxItems = 5 }: MasteryChartProps) {
  const sortedTopics = [...topics]
    .sort((a, b) => b.mastery_probability - a.mastery_probability)
    .slice(0, maxItems)

  const getMasteryColor = (probability: number) => {
    if (probability >= 0.8) return 'from-green-400 to-green-600'
    if (probability >= 0.6) return 'from-blue-400 to-blue-600'
    if (probability >= 0.4) return 'from-yellow-400 to-yellow-600'
    if (probability >= 0.2) return 'from-orange-400 to-orange-600'
    return 'from-red-400 to-red-600'
  }

  const getMasteryLabel = (probability: number) => {
    if (probability >= 0.8) return 'Expert'
    if (probability >= 0.6) return 'Proficient'
    if (probability >= 0.4) return 'Developing'
    if (probability >= 0.2) return 'Beginner'
    return 'Novice'
  }

  if (topics.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No mastery data yet. Start practicing to see your progress!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedTopics.map((topic) => (
        <div key={`${topic.topic}-${topic.subtopic || ''}`}>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              {topic.topic}
              {topic.subtopic && (
                <span className="text-gray-400 ml-1">/ {topic.subtopic}</span>
              )}
            </span>
            <span className={clsx(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              topic.mastery_probability >= 0.6 
                ? 'bg-green-100 text-green-700' 
                : topic.mastery_probability >= 0.4
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            )}>
              {getMasteryLabel(topic.mastery_probability)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={clsx(
                'h-3 rounded-full bg-gradient-to-r transition-all duration-500',
                getMasteryColor(topic.mastery_probability)
              )}
              style={{ width: `${topic.mastery_probability * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{topic.total_attempts} attempts</span>
            <span>{Math.round(topic.mastery_probability * 100)}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}
