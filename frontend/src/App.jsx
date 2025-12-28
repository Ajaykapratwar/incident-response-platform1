import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ReportIncident from './pages/ReportIncident'
import IncidentFeed from './pages/IncidentFeed'
import AdminPanel from './pages/AdminPanel'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/report" element={<Layout><ReportIncident /></Layout>} />
      <Route path="/feed" element={<Layout><IncidentFeed /></Layout>} />
      <Route path="/login" element={<Login />} />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <Layout><AdminPanel /></Layout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

