import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid, clear it and redirect to login
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const incidentApi = {
  create: async (data, image) => {
    const formData = new FormData()
    formData.append('type', data.type)
    formData.append('description', data.description)
    formData.append('latitude', data.latitude)
    formData.append('longitude', data.longitude)
    if (data.address) formData.append('address', data.address)
    if (data.gpsAccuracy) formData.append('gpsAccuracy', data.gpsAccuracy)
    if (image) formData.append('image', image)
    if (data.reporterUsername) formData.append('reporterUsername', data.reporterUsername)

    return api.post('/api/incidents/public/report', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  query: async (params) => {
    return api.get('/api/incidents/public/query', { params })
  },

  getById: async (incidentId) => {
    return api.get(`/api/incidents/public/${incidentId}`)
  },

  confirm: async (incidentId, latitude, longitude, username) => {
    return api.post('/api/incidents/public/confirm', {
      incidentId,
      latitude,
      longitude,
    }, {
      params: { username },
    })
  },

  getAllIncidents: async (status) => {
    return api.get('/api/incidents/admin/incidents', {
      params: { status },
    })
  },

  getPrioritized: async (status, limit = 50) => {
    return api.get('/api/incidents/admin/prioritized', {
      params: { status, limit },
    })
  },

  getTimeline: async (id) => {
    return api.get(`/api/incidents/admin/${id}/timeline`)
  },

  updateStatus: async (id, status, notes) => {
    return api.put(`/api/incidents/admin/${id}/status`, { status, notes })
  },
}

export const dashboardApi = {
  getStats: async () => {
    return api.get('/api/dashboard/stats')
  },
}

export default api

