import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { incidentApi } from '../services/api'
import { connectWebSocket, disconnectWebSocket } from '../services/websocket'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function IncidentFeed() {
  const [incidents, setIncidents] = useState([])
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    radius: '',
    minConfidence: '',
    latitude: null,
    longitude: null,
  })
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mapInstance, setMapInstance] = useState(null)

  useEffect(() => {
    requestUserLocation()
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
            return [incident, ...prev]
          })
        },
        (error) => {
          console.warn('WebSocket error (non-critical):', error)
          // Don't show error to user, WebSocket is optional for real-time updates
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
  }, [filters])

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
          setFilters(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }))
        },
        () => {}
      )
    }
  }

  const loadIncidents = async () => {
    setLoading(true)
    try {
      const params = {
        ...filters,
        limit: 100,
        offset: 0,
      }
      if (params.radius) params.radiusKm = params.radius
      if (params.minConfidence) params.minConfidenceScore = parseInt(params.minConfidence)
      
      // Clean up empty values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) delete params[key]
      })

      const response = await incidentApi.query(params)
      setIncidents(response.data)
    } catch (error) {
      console.error('Failed to load incidents:', error)
    } finally {
      setLoading(false)
    }
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

  const getTypeColor = (type) => {
    const colors = {
      ACCIDENT: 'red',
      MEDICAL: 'blue',
      FIRE: 'orange',
      INFRASTRUCTURE: 'purple',
      CRIME: 'darkred',
    }
    return colors[type] || 'gray'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Live Incident Feed</h1>
        <button
          onClick={requestUserLocation}
          className="btn-secondary text-sm"
        >
          Use My Location
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="">All Types</option>
                  <option value="ACCIDENT">Accident</option>
                  <option value="MEDICAL">Medical</option>
                  <option value="FIRE">Fire</option>
                  <option value="INFRASTRUCTURE">Infrastructure</option>
                  <option value="CRIME">Crime</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="UNVERIFIED">Unverified</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radius (km) {filters.latitude && filters.longitude ? '' : '(Enable location)'}
                </label>
                <input
                  type="number"
                  value={filters.radius}
                  onChange={(e) => setFilters({ ...filters, radius: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g., 5"
                  disabled={!filters.latitude || !filters.longitude}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Confidence</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minConfidence}
                  onChange={(e) => setFilters({ ...filters, minConfidence: e.target.value })}
                  className="input-field text-sm"
                  placeholder="0-100"
                />
              </div>
              <button
                onClick={loadIncidents}
                className="btn-primary w-full text-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Incidents ({incidents.length})</h2>
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No incidents found</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (mapInstance) {
                        mapInstance.setView([incident.latitude, incident.longitude], 15)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{incident.incidentId}</span>
                      <span className={`badge ${getStatusBadge(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{incident.type}</div>
                    <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                      {incident.description}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`badge ${getConfidenceBadge(incident.confidenceScore)}`}>
                        {incident.confidenceScore}% confidence
                      </span>
                      {incident.distanceKm && (
                        <span className="text-xs text-gray-500">
                          {incident.distanceKm.toFixed(2)} km away
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(incident.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden" style={{ height: '800px' }}>
            {userLocation ? (
              <MapContainer
                center={userLocation}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                whenCreated={setMapInstance}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {incidents.map((incident) => (
                  <Marker
                    key={incident.id}
                    position={[incident.latitude, incident.longitude]}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-bold mb-1">{incident.incidentId}</div>
                        <div className="text-gray-600 mb-1">{incident.type}</div>
                        <div className="text-xs text-gray-500 mb-2">{incident.description}</div>
                        <div className="flex items-center space-x-2">
                          <span className={`badge ${getStatusBadge(incident.status)}`}>
                            {incident.status}
                          </span>
                          <span className={`badge ${getConfidenceBadge(incident.confidenceScore)}`}>
                            {incident.confidenceScore}%
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="mb-2">Enable location to view map</p>
                  <button onClick={requestUserLocation} className="btn-primary">
                    Enable Location
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

