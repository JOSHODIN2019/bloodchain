import api from './authService'

export const bloodbankService = {
  getStats:        ()                    => api.get('/bloodbank/stats').then(r => r.data),
  getInventory:    ()                    => api.get('/bloodbank/inventory').then(r => r.data),
  updateInventory: (bloodType, data)     => api.patch(`/bloodbank/inventory/${bloodType}`, data).then(r => r.data),
  getDonations:    (params = {})         => api.get('/bloodbank/donations', { params }).then(r => r.data),
  confirmDonation: (id)                  => api.patch(`/bloodbank/donations/${id}/confirm`).then(r => r.data),
  rejectDonation:  (id, reason)          => api.patch(`/bloodbank/donations/${id}/reject`, { reason }).then(r => r.data),
  getRequests:     (params = {})         => api.get('/bloodbank/requests', { params }).then(r => r.data),
  fulfilRequest:   (id, responseNotes)   => api.patch(`/bloodbank/requests/${id}/fulfil`, { responseNotes }).then(r => r.data),
  rejectRequest:   (id, reason)          => api.patch(`/bloodbank/requests/${id}/reject`, { reason }).then(r => r.data),
  getProfile:      ()                    => api.get('/bloodbank/profile').then(r => r.data),
  updateProfile:   (data)                => api.patch('/bloodbank/profile', data).then(r => r.data),
  getBlockchain:   ()                    => api.get('/bloodbank/blockchain').then(r => r.data),
}
