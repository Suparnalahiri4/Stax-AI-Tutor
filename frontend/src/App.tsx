// ABOUTME: Main application component with routing
// ABOUTME: Defines all routes and protected route logic

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Practice from './pages/Practice'
import Question from './pages/Question'
import Assignments from './pages/Assignments'
import Contests from './pages/Contests'
import ContestDetail from './pages/ContestDetail'
import Duels from './pages/Duels'
import DuelArena from './pages/DuelArena'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes */}
      <Route path="/app" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="practice" element={<Practice />} />
        <Route path="question/:id" element={<Question />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="contests" element={<Contests />} />
        <Route path="contests/:id" element={<ContestDetail />} />
        <Route path="duels" element={<Duels />} />
        <Route path="duels/:id" element={<DuelArena />} />
        <Route path="profile" element={<Profile />} />
        <Route path="leaderboard" element={<Leaderboard />} />
      </Route>
    </Routes>
  )
}

export default App
