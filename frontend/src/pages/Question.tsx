// ABOUTME: Question solving page with code editor and step-wise hints
// ABOUTME: Handles code execution, answer submission and mastery updates

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, Zap, Lightbulb, CheckCircle, XCircle, ArrowLeft, Eye, Code } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../services/api'
import CodeEditor, { type SupportedLanguage } from '../components/CodeEditor'
import type { Question as QuestionType, AttemptResult } from '../types'

interface CodeResult {
  is_correct?: boolean
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  status: string
  xp_earned?: number
  correct_answer?: string | null
}

export default function Question() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [question, setQuestion] = useState<QuestionType | null>(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [stepAnswers, setStepAnswers] = useState<string[]>([])
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [hint, setHint] = useState<string | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [previousAttempts, setPreviousAttempts] = useState<string[]>([])
  
  // Code editor state
  const [isRunning, setIsRunning] = useState(false)
  const [codeOutput, setCodeOutput] = useState<string>('')
  const [codeResult, setCodeResult] = useState<CodeResult | null>(null)

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!id) return
      try {
        const data = await api.getQuestion(id)
        setQuestion(data)
        if (data.steps) {
          setStepAnswers(new Array(data.steps.length).fill(''))
        }
      } catch (error) {
        console.error('Failed to fetch question:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestion()
  }, [id])

  // Timer
  useEffect(() => {
    if (loading || result) return
    
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, result])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async () => {
    if (!question || !id) return
    setSubmitting(true)

    try {
      const attemptResult = await api.submitAttempt(
        id,
        question.steps ? stepAnswers[currentStep - 1] : answer,
        timeElapsed,
        question.steps ? currentStep : undefined
      )
      setResult(attemptResult)
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleGetHint = async () => {
    if (!question || !id || !question.steps) return
    setHintLoading(true)

    try {
      const hintResponse = await api.getHint(id, currentStep, previousAttempts)
      setHint(hintResponse.hint_text)
      
      if (hintResponse.should_reveal_solution && hintResponse.solution) {
        setHint(`Solution: ${hintResponse.solution}`)
      }
    } catch (error) {
      console.error('Failed to get hint:', error)
    } finally {
      setHintLoading(false)
    }
  }

  const handleSolveStep = async () => {
    if (!question || !id || !question.steps) return
    
    try {
      const solution = await api.solveStep(id, currentStep)
      setHint(`Step ${currentStep} Solution:\n${solution.solution}\n\n${solution.explanation || ''}`)
    } catch (error) {
      console.error('Failed to solve step:', error)
    }
  }

  const handleRunCode = async (code: string, language: SupportedLanguage) => {
    setIsRunning(true)
    setCodeOutput('')
    try {
      const result = await api.runCode(code, language)
      let output = `Status: ${result.status}\n\n`
      
      if (result.compile_output) {
        output += `Compilation:\n${result.compile_output}\n\n`
      }
      if (result.stdout) {
        output += `Output:\n${result.stdout}\n`
      }
      if (result.stderr) {
        output += `\nErrors:\n${result.stderr}`
      }
      if (result.time) {
        output += `\nTime: ${result.time}s`
      }
      setCodeOutput(output)
    } catch (error: any) {
      setCodeOutput(`Error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmitCode = async (code: string, language: SupportedLanguage) => {
    if (!id) return
    setSubmitting(true)
    setCodeOutput('')
    try {
      const result = await api.submitCode(id, code, language)
      setCodeResult(result)
      
      let output = `Status: ${result.status}\n`
      if (result.stdout) {
        output += `\nOutput:\n${result.stdout}`
      }
      if (result.stderr) {
        output += `\nErrors:\n${result.stderr}`
      }
      if (result.compile_output) {
        output += `\nCompilation:\n${result.compile_output}`
      }
      setCodeOutput(output)
      
      // Set result for the result display
      if (result.is_correct !== undefined) {
        setResult({
          is_correct: result.is_correct,
          xp_earned: result.xp_earned || 0,
          mastery_change: result.mastery_change || 0,
          correct_answer: result.correct_answer || undefined
        })
      }
    } catch (error: any) {
      setCodeOutput(`Error: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-gray-500">Question not found</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{question.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className={clsx(
                'px-3 py-1 rounded-full text-sm font-medium capitalize',
                question.difficulty === 'easy' && 'bg-green-100 text-green-700',
                question.difficulty === 'medium' && 'bg-yellow-100 text-yellow-700',
                question.difficulty === 'hard' && 'bg-orange-100 text-orange-700',
                question.difficulty === 'expert' && 'bg-red-100 text-red-700'
              )}>
                {question.difficulty}
              </span>
              <span className="text-gray-500">{question.topic}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-2xl font-mono text-gray-900">
              <Clock className="w-6 h-6 text-gray-400" />
              {formatTime(timeElapsed)}
            </div>
            <div className="flex items-center gap-1 text-yellow-600 mt-1">
              <Zap className="w-4 h-4" />
              {question.xp_reward} XP
            </div>
          </div>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{question.description}</p>
        </div>
      </div>

      {/* Multi-step Progress */}
      {question.steps && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step {currentStep} of {question.steps.length}
          </h2>
          <div className="flex gap-2 mb-4">
            {question.steps.map((_, index) => (
              <div
                key={index}
                className={clsx(
                  'h-2 flex-1 rounded-full transition-colors',
                  index + 1 < currentStep && 'bg-green-500',
                  index + 1 === currentStep && 'bg-primary-500',
                  index + 1 > currentStep && 'bg-gray-200'
                )}
              />
            ))}
          </div>
          <p className="text-gray-700">{question.steps[currentStep - 1].description}</p>
          {question.steps[currentStep - 1].expected_output && (
            <p className="text-sm text-gray-500 mt-2">
              Expected output: {question.steps[currentStep - 1].expected_output}
            </p>
          )}
        </div>
      )}

      {/* Answer Section */}
      {!result ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Solution</h2>
            {question.question_type === 'coding' && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Code className="w-4 h-4" />
                <span>Code Editor</span>
              </div>
            )}
          </div>
          
          {question.question_type === 'multiple_choice' && question.options ? (
            <>
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <label
                    key={index}
                    className={clsx(
                      'flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors',
                      answer === option 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={answer === option}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="w-5 h-5 text-primary-600"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
              
              {/* Hint Section */}
              {hint && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <p className="text-yellow-800 whitespace-pre-wrap">{hint}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-6">
                <div className="flex gap-2">
                  {question.steps && (
                    <>
                      <button
                        onClick={handleGetHint}
                        disabled={hintLoading}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Lightbulb className="w-5 h-5" />
                        {hintLoading ? 'Loading...' : 'Get Hint'}
                      </button>
                      <button
                        onClick={handleSolveStep}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Eye className="w-5 h-5" />
                        Solve This Step
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !answer}
                  className="btn-primary disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Code Editor for coding questions */}
              <CodeEditor
                onRun={handleRunCode}
                onSubmit={handleSubmitCode}
                isRunning={isRunning}
                isSubmitting={submitting}
                output={codeOutput}
              />
              
              {/* Hint Section */}
              {hint && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <p className="text-yellow-800 whitespace-pre-wrap">{hint}</p>
                  </div>
                </div>
              )}

              {question.steps && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleGetHint}
                    disabled={hintLoading}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Lightbulb className="w-5 h-5" />
                    {hintLoading ? 'Loading...' : 'Get Hint'}
                  </button>
                  <button
                    onClick={handleSolveStep}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    Solve This Step
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Result Section */
        <div className={clsx(
          'card border-2',
          result.is_correct ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
        )}>
          <div className="flex items-center gap-4 mb-4">
            {result.is_correct ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-500" />
                <div>
                  <h2 className="text-2xl font-bold text-green-700">Correct!</h2>
                  <p className="text-green-600">Great job! You earned {result.xp_earned} XP</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 text-red-500" />
                <div>
                  <h2 className="text-2xl font-bold text-red-700">Not Quite</h2>
                  <p className="text-red-600">Keep practicing! Review the solution below.</p>
                </div>
              </>
            )}
          </div>

          {!result.is_correct && result.correct_answer && (
            <div className="bg-white p-4 rounded-lg mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Correct Answer:</h3>
              <p className="font-mono text-sm text-gray-700 whitespace-pre-wrap">
                {result.correct_answer}
              </p>
            </div>
          )}

          {result.next_hint && (
            <div className="bg-yellow-100 p-4 rounded-lg mt-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Hint for next time:</h3>
              <p className="text-yellow-700">{result.next_hint}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => navigate('/app/practice')}
              className="btn-secondary"
            >
              Back to Practice
            </button>
            <button
              onClick={() => {
                setResult(null)
                setAnswer('')
                setStepAnswers(question.steps ? new Array(question.steps.length).fill('') : [])
                setTimeElapsed(0)
                setHint(null)
                setCodeOutput('')
                setCodeResult(null)
              }}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
