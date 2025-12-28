import { useState, useEffect } from 'react'
import { incidentApi } from '../services/api'
import { connectWebSocket, disconnectWebSocket } from '../services/websocket'
import { useAuth } from '../context/AuthContext'

export default function AdminPanel() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isResponder = user?.role === 'RESPONDER'
  const [incidents, setIncidents] = useState([])
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadIncidents()
    
    let wsClient = null
    try {
      wsClient = connectWebSocket(
        (incident) => {
          setIncidents(prev => {
            const existing = prev.findIndex(i => i.id === incident.id)
            if (existing >= 0) {
              const updated = [...prev]
              updated[existing] = incident
              return updated
            }
            return [incident, ...prev].sort((a, b) => {
              if (b.confidenceScore !== a.confidenceScore) {
                return b.confidenceScore - a.confidenceScore
              }
              return new Date(b.createdAt) - new Date(a.createdAt)
            })
          })
        },
        (error) => {
          console.warn('WebSocket error (non-critical):', error)
        }
      )
    } catch (error) {
      console.warn('Failed to connect WebSocket (non-critical):', error)
    }

    return () => {
      if (wsClient) {
        disconnectWebSocket()
      }
    }
  }, [])

  useEffect(() => {
    loadIncidents()
  }, [statusFilter])

  const loadIncidents = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await incidentApi.getAllIncidents(statusFilter || undefined)
      if (Array.isArray(response.data)) {
        setIncidents(response.data)
      } else {
        setError('Invalid response format from server')
        setIncidents([])
      }
    } catch (error) {
      console.error('Failed to load incidents:', error)
      setError(error.response?.data?.error || 'Failed to load incidents. Please check your connection.')
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async (incidentId) => {
    try {
      const response = await incidentApi.getTimeline(incidentId)
      setTimeline(response.data || [])
    } catch (error) {
      console.error('Failed to load timeline:', error)
      setTimeline([])
    }
  }

  const handleStatusUpdate = async (incidentId, newStatus) => {
    setUpdating(true)
    try {
      await incidentApi.updateStatus(incidentId, newStatus, notes)
      await loadIncidents()
      // Update selected incident if it's the one being updated
      if (selectedIncident?.id === incidentId) {
        // Reload incidents to get updated data
        const allIncidents = await incidentApi.getAllIncidents(statusFilter || undefined)
        const updated = allIncidents.data.find(i => i.id === incidentId)
        if (updated) {
          setSelectedIncident(updated)
        }
        await loadTimeline(incidentId)
      }
      setNotes('')
    } catch (error) {
      console.error('Failed to update status:', error)
      alert(error.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleIncidentSelect = async (incident) => {
    setSelectedIncident(incident)
    await loadTimeline(incident.id)
  }

  const getStatusBadge = (status) => {
    const styles = {
      UNVERIFIED: 'bg-gray-100 text-gray-800',
      VERIFIED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-emergency-success text-white',
      FALSE: 'bg-red-100 text-red-800',
    }
    return styles[status] || styles.UNVERIFIED
  }

  const getConfidenceBadge = (score) => {
    if (score >= 70) return 'bg-green-100 text-green-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getSeverityLevel = (score) => {
    if (score >= 70) return 'HIGH'
    if (score >= 40) return 'MEDIUM'
    return 'LOW'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'Admin Panel' : 'Responder Panel'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as: <span className="font-medium">{user?.username}</span> ({user?.role})
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All Statuses</option>
            <option value="UNVERIFIED">Unverified</option>
            <option value="VERIFIED">Verified</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE">False</option>
          </select>
          <button onClick={loadIncidents} className="btn-secondary text-sm">
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Prioritized Incidents ({incidents.length})
            </h2>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                <div>Loading incidents...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">{error}</div>
                <button onClick={loadIncidents} className="btn-primary text-sm">
                  Retry
                </button>
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No incidents found</p>
                <p className="text-sm text-gray-400">Incidents will appear here once reported</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedIncident?.id === incident.id
                        ? 'border-emergency-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleIncidentSelect(incident)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-bold text-gray-900">{incident.incidentId}</span>
                          <span className={`badge ${getStatusBadge(incident.status)}`}>
                            {incident.status}
                          </span>
                          <span className={`badge ${getConfidenceBadge(incident.confidenceScore)}`}>
                            {getSeverityLevel(incident.confidenceScore)} ({incident.confidenceScore}%)
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">{incident.type}</div>
                        <div className="text-sm text-gray-700">{incident.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <div>
                        Location: {incident.latitude?.toFixed(6)}, {incident.longitude?.toFixed(6)}
                        {incident.address && ` • ${incident.address}`}
                      </div>
                      <div>
                        {incident.confirmationCount} confirmations • {new Date(incident.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {incident.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${incident.imageUrl}`}
                          alt="Incident"
                          className="max-w-xs h-32 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedIncident ? (
            <div className="card space-y-4 sticky top-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Incident Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {selectedIncident.incidentId}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedIncident.type}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`badge ${getStatusBadge(selectedIncident.status)}`}>
                      {selectedIncident.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Confidence:</span>{' '}
                    <span className={`badge ${getConfidenceBadge(selectedIncident.confidenceScore)}`}>
                      {selectedIncident.confidenceScore}%
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Confirmations:</span> {selectedIncident.confirmationCount}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span><br />
                    {selectedIncident.latitude?.toFixed(6)}, {selectedIncident.longitude?.toFixed(6)}
                    {selectedIncident.address && <><br />{selectedIncident.address}</>}
                  </div>
                  <div>
                    <span className="font-medium">GPS Accuracy:</span> {selectedIncident.gpsAccuracy?.toFixed(0)}m
                  </div>
                  <div>
                    <span className="font-medium">Reporter:</span> {selectedIncident.reporterUsername || 'Anonymous'}
                  </div>
                  <div>
                    <span className="font-medium">Reported:</span> {new Date(selectedIncident.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-700">{selectedIncident.description}</p>
              </div>

              {selectedIncident.adminNotes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Admin Notes</h3>
                  <p className="text-sm text-gray-700">{selectedIncident.adminNotes}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Incident Timeline</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {timeline.length === 0 ? (
                    <p className="text-xs text-gray-500">No timeline entries yet</p>
                  ) : (
                    timeline.map((entry, idx) => (
                      <div key={entry.id || idx} className="text-xs border-l-2 border-blue-200 pl-3 py-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`badge ${getStatusBadge(entry.status)}`}>
                            {entry.status}
                          </span>
                          <span className="text-gray-400">
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-gray-600 mb-1">{entry.notes}</p>
                        )}
                        {entry.updatedBy && (
                          <p className="text-gray-400">by {entry.updatedBy}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Update Status</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field text-sm mb-3"
                  rows={3}
                  placeholder="Add notes (optional)"
                />
                <div className="grid grid-cols-2 gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => handleStatusUpdate(selectedIncident.id, 'VERIFIED')}
                      className="btn-primary text-sm"
                      disabled={updating || selectedIncident.status === 'VERIFIED'}
                    >
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident.id, 'IN_PROGRESS')}
                    className="btn-primary text-sm"
                    disabled={updating || selectedIncident.status === 'IN_PROGRESS'}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident.id, 'RESOLVED')}
                    className="btn-primary text-sm"
                    disabled={updating || selectedIncident.status === 'RESOLVED'}
                  >
                    Resolve
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleStatusUpdate(selectedIncident.id, 'FALSE')}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                      disabled={updating || selectedIncident.status === 'FALSE'}
                    >
                      Mark False
                    </button>
                  )}
                </div>
                {!isAdmin && (
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Only administrators can verify or mark incidents as false.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center text-gray-500 py-8">
              Select an incident to view details and update status
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

