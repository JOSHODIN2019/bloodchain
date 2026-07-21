import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bloodchain_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 — only redirect if it's NOT a login/register request and NOT already on /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || ''
      const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register')
      const isOnLogin   = window.location.pathname === '/login'
      if (!isAuthRoute && !isOnLogin) {
        localStorage.removeItem('bloodchain_token')
        localStorage.removeItem('bloodchain_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export const authService = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login:    (data) => api.post('/auth/login',    data).then(r => r.data),
  getMe:    ()     => api.get('/auth/me').then(r => r.data),
}

export default api
