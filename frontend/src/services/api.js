import axios from 'axios'

// Normalize API URL - remove trailing slash if present
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '')

// #region agent log
if (typeof window !== 'undefined') {
  console.log('[DEBUG] API Config:', { rawApiUrl, API_BASE_URL, hasEnvVar: !!import.meta.env.VITE_API_URL });
  fetch('http://127.0.0.1:7242/ingest/95600096-ca9a-4ff5-ba34-e127cb1076ba',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:6',message:'API configuration initialized',data:{rawApiUrl,API_BASE_URL,hasEnvVar:!!import.meta.env.VITE_API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
}
// #endregion

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    // #region agent log
    if (typeof window !== 'undefined') {
      const fullURL = config.baseURL + config.url;
      console.log('[DEBUG] API Request:', { url: config.url, baseURL: config.baseURL, fullURL, method: config.method });
      fetch('http://127.0.0.1:7242/ingest/95600096-ca9a-4ff5-ba34-e127cb1076ba',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:14',message:'API request interceptor',data:{url:config.url,baseURL:config.baseURL,fullURL,method:config.method,hasToken:!!localStorage.getItem('token')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }
    // #endregion
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
    // #region agent log
    if (typeof window !== 'undefined') {
      const fullURL = error.config?.baseURL + error.config?.url;
      console.error('[DEBUG] API Error:', { 
        status: error.response?.status, 
        statusText: error.response?.statusText, 
        message: error.message, 
        url: error.config?.url, 
        baseURL: error.config?.baseURL, 
        fullURL,
        isNetworkError: !error.response,
        responseData: error.response?.data 
      });
      fetch('http://127.0.0.1:7242/ingest/95600096-ca9a-4ff5-ba34-e127cb1076ba',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:29',message:'API error intercepted',data:{status:error.response?.status,statusText:error.response?.statusText,message:error.message,url:error.config?.url,baseURL:error.config?.baseURL,fullURL,isNetworkError:!error.response,responseData:error.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
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

