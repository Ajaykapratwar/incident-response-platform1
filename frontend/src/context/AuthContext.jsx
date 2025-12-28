import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setIsAuthenticated(true)
      // Decode token to get user info (simplified)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({ username: payload.sub, role: payload.role })
      } catch (e) {
        // Invalid token
        logout()
      }
    }
  }, [token])

  const login = async (username, password) => {
    // #region agent log
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const requestUrl = '/api/auth/login';
    const fullUrl = apiUrl + requestUrl;
    fetch('http://127.0.0.1:7242/ingest/95600096-ca9a-4ff5-ba34-e127cb1076ba',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:26',message:'Login attempt started',data:{apiUrl,requestUrl,fullUrl,username,hasPassword:!!password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/95600096-ca9a-4ff5-ba34-e127cb1076ba',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:28',message:'Before API call - using configured api instance',data:{usingApiInstance:true,baseURL:api.defaults.baseURL,url:'/api/auth/login'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const response = await api.post('/api/auth/login', { username, password })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/95600096-ca9a-4ff5-ba34-e127cb1076ba',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:29',message:'API call succeeded',data:{status:response.status,hasToken:!!response.data?.token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const { token: newToken, username: userUsername, role } = response.data
      if (!newToken) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/95600096-ca9a-4ff5-ba34-e127cb1076ba',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:31',message:'No token in response',data:{responseData:response.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return { success: false, error: 'No token received from server' }
      }
      setToken(newToken)
      localStorage.setItem('token', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      setUser({ username: userUsername, role })
      setIsAuthenticated(true)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/95600096-ca9a-4ff5-ba34-e127cb1076ba',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:38',message:'Login successful',data:{username:userUsername,role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return { success: true }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/95600096-ca9a-4ff5-ba34-e127cb1076ba',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:39',message:'Login error caught',data:{errorMessage:error.message,status:error.response?.status,statusText:error.response?.statusText,responseData:error.response?.data,requestUrl:error.config?.url,requestBaseURL:error.config?.baseURL,isNetworkError:!error.response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials.'
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

