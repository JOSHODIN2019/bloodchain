import api from './authService'

export const donorService = {
  getStats:           ()              => api.get('/donor/stats').then(r => r.data),
  getDonations:       (params = {})   => api.get('/donor/donations', { params }).then(r => r.data),
  createDonation:     (data)          => api.post('/donor/donations', data).then(r => r.data),
  cancelDonation:     (id)            => api.delete(`/donor/donations/${id}`).then(r => r.data),
  getHistory:         (params = {})   => api.get('/donor/history', { params }).then(r => r.data),
  getBloodBanks:      (params = {})   => api.get('/donor/bloodbanks', { params }).then(r => r.data),
  getProfile:         ()              => api.get('/donor/profile').then(r => r.data),
  updateProfile:      (data)          => api.patch('/donor/profile', data).then(r => r.data),
  getBlockchain:      ()              => api.get('/donor/blockchain').then(r => r.data),
}
