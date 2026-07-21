import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '@/services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(() => {
    try { return JSON.parse(localStorage.getItem('bloodchain_user')) } catch { return null }
  })
  const [token,     setToken]     = useState(() => localStorage.getItem('bloodchain_token') || null)
  const [isLoading, setIsLoading] = useState(false)

  const isAuthenticated = !!token && !!user

  const saveSession = useCallback((token, user) => {
    localStorage.setItem('bloodchain_token', token)
    localStorage.setItem('bloodchain_user',  JSON.stringify(user))
    setToken(token)
    setUser(user)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem('bloodchain_token')
    localStorage.removeItem('bloodchain_user')
    setToken(null)
    setUser(null)
  }, [])

  const login = async (credentials) => {
    setIsLoading(true)
    try {
      const data = await authService.login(credentials)
      saveSession(data.token, data.user)
      return { success: true, user: data.user }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (formData) => {
    setIsLoading(true)
    try {
      const data = await authService.register(formData)
      saveSession(data.token, data.user)
      return { success: true, user: data.user }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  // Refresh user from server on mount if token exists
  useEffect(() => {
    if (!token) return
    authService.getMe()
      .then(data => setUser(data.user))
      .catch(() => clearSession())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('bloodchain_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
