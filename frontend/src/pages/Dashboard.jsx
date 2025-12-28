import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const response = await dashboardApi.getStats()
      setStats(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load stats:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <div className="text-red-600 mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to load dashboard</h3>
        <p className="text-sm text-slate-600 mb-4">Please check your connection and try again.</p>
        <button onClick={loadStats} className="btn-primary">
          Retry
        </button>
      </div>
    )
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Public Trust Dashboard</h1>
          <p className="text-slate-600 text-sm">Real-time incident reporting and verification metrics</p>
        </div>
        <Link to="/report" className="btn-primary whitespace-nowrap">
          Report Incident
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-600">Total Incidents</div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalIncidents}</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-600">Verified</div>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{stats.verifiedIncidents}</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-600">Resolved</div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">{stats.resolvedIncidents}</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-600">Accuracy Rate</div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-600">
            {stats.accuracyRate.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Average Response Time</h2>
          <p className="text-sm text-slate-600 mb-4">Time from report to resolution</p>
          <div className="text-3xl font-bold text-slate-900">
            {stats.averageResponseTimeHours > 0 
              ? `${stats.averageResponseTimeHours.toFixed(1)} hours`
              : <span className="text-slate-400">No data yet</span>
            }
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Recent Activity</h2>
          <p className="text-sm text-slate-600 mb-4">Latest incident reports</p>
          <div className="space-y-2">
            {stats.recentIncidents && stats.recentIncidents.length > 0 ? (
              stats.recentIncidents.slice(0, 5).map((incident) => (
                <div key={incident.incidentId} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-slate-900 truncate">{incident.incidentId}</span>
                      <span className={`badge ${
                        incident.confidenceScore >= 70 ? 'badge-success' :
                        incident.confidenceScore >= 40 ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {incident.confidenceScore}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {incident.type} • {new Date(incident.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`badge ml-2 ${
                    incident.status === 'VERIFIED' ? 'badge-success' :
                    incident.status === 'RESOLVED' ? 'badge-info' :
                    'badge-neutral'
                  }`}>
                    {incident.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 text-center py-4">No recent incidents</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

