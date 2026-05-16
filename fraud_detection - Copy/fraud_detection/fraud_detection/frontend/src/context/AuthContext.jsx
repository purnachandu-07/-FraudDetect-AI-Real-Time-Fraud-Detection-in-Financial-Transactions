import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('fw_token'))
  const [loading, setLoading] = useState(true)

  // Inject token into Axios on every render cycle
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) { setLoading(false); return }
      try {
        const res = await api.get('/auth/me')
        setUser(res.data)
      } catch {
        localStorage.removeItem('fw_token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    verifyToken()
  }, [])

  // Global 401 interceptor
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      r => r,
      err => {
        if (err.response?.status === 401) {
          logout()
        }
        return Promise.reject(err)
      }
    )
    return () => api.interceptors.response.eject(interceptor)
  }, [])

  const login = useCallback(async (email, password) => {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    const res = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const { access_token, user: u } = res.data
    localStorage.setItem('fw_token', access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setToken(access_token)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('fw_token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
