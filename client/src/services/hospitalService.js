import api from './authService'

export const hospitalService = {
  getStats:         ()            => api.get('/hospital/stats').then(r => r.data),
  getRequests:      (params = {}) => api.get('/hospital/requests', { params }).then(r => r.data),
  createRequest:    (data)        => api.post('/hospital/requests', data).then(r => r.data),
  cancelRequest:    (id)          => api.patch(`/hospital/requests/${id}/cancel`).then(r => r.data),
  getBloodBanks:    ()            => api.get('/hospital/bloodbanks').then(r => r.data),
  getBankInventory: (id)          => api.get(`/hospital/bloodbanks/${id}/inventory`).then(r => r.data),
  getProfile:       ()            => api.get('/hospital/profile').then(r => r.data),
  updateProfile:    (data)        => api.patch('/hospital/profile', data).then(r => r.data),
  getBlockchain:    ()            => api.get('/hospital/blockchain').then(r => r.data),
  getAllInventory:   ()            => api.get('/hospital/bloodbanks').then(r => r.data),
}
