import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { incidentApi } from '../services/api'

export default function ReportIncident() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    latitude: null,
    longitude: null,
    address: '',
    gpsAccuracy: null,
  })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('idle') // idle, loading, success, error
  const [potentialDuplicates, setPotentialDuplicates] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    requestLocation()
  }, [])

  const requestLocation = () => {
    setGpsStatus('loading')
    if (!navigator.geolocation) {
      setGpsStatus('error')
      setError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          gpsAccuracy: position.coords.accuracy,
        }))
        setGpsStatus('success')
        // Reverse geocode to get address (simplified - in production use a geocoding service)
        setFormData(prev => ({
          ...prev,
          address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        }))
      },
      (error) => {
        setGpsStatus('error')
        setError(`Location access denied: ${error.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB')
        return
      }
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (!formData.latitude || !formData.longitude) {
      setError('Location is required')
      setSubmitting(false)
      return
    }

    try {
      const response = await incidentApi.create(formData, image)
      const duplicates = response.data.potentialDuplicates || []
      
      if (duplicates.length > 0) {
        setPotentialDuplicates(duplicates)
        // Show confirmation dialog
        const confirmed = window.confirm(
          `Found ${duplicates.length} similar incident(s) nearby. Do you still want to submit a new report?`
        )
        if (!confirmed) {
          setSubmitting(false)
          return
        }
      }

      navigate('/feed', { state: { message: 'Incident reported successfully!' } })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit incident report')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Report Incident</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incident Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="input-field"
            required
          >
            <option value="">Select type</option>
            <option value="ACCIDENT">Accident</option>
            <option value="MEDICAL">Medical Emergency</option>
            <option value="FIRE">Fire</option>
            <option value="INFRASTRUCTURE">Infrastructure Failure</option>
            <option value="CRIME">Crime</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field"
            rows={4}
            placeholder="Provide detailed description of the incident..."
            required
            minLength={10}
            maxLength={2000}
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.description.length}/2000 characters
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={requestLocation}
                className="btn-secondary text-sm"
                disabled={gpsStatus === 'loading'}
              >
                {gpsStatus === 'loading' ? 'Getting location...' : 
                 gpsStatus === 'success' ? 'Refresh Location' : 
                 'Use My Location'}
              </button>
              {gpsStatus === 'success' && (
                <span className="text-sm text-green-600">✓ Location detected</span>
              )}
              {gpsStatus === 'error' && (
                <span className="text-sm text-red-600">Location access required</span>
              )}
            </div>
            {formData.latitude && formData.longitude && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="input-field text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="input-field text-sm"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Address (optional)</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-field text-sm"
                placeholder="Street address or landmark"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="input-field"
          />
          {imagePreview && (
            <div className="mt-3">
              <img src={imagePreview} alt="Preview" className="max-w-full h-48 object-cover rounded-lg" />
            </div>
          )}
        </div>

        {potentialDuplicates.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm font-medium text-yellow-800 mb-2">
              Similar incidents found nearby:
            </div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {potentialDuplicates.map((dup) => (
                <li key={dup.incidentId}>
                  {dup.incidentId} - {dup.type} ({dup.distanceKm?.toFixed(2)} km away)
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  )
}


