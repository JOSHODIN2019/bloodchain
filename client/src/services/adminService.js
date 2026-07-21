import api from './authService'

export const adminService = {
  getStats:                ()              => api.get('/admin/stats').then(r => r.data),

  createBloodBank:         (data)          => api.post('/admin/doctors', data).then(r => r.data),
  getDoctors:              ()              => api.get('/admin/doctors').then(r => r.data),
  updateBloodBank:         (id, data)      => api.patch(`/admin/doctors/${id}`, data).then(r => r.data),

  createHospital:          (data)          => api.post('/admin/hospitals', data).then(r => r.data),
  getHospitals:            ()              => api.get('/admin/hospitals').then(r => r.data),
  updateHospital:          (id, data)      => api.patch(`/admin/hospitals/${id}`, data).then(r => r.data),

  getPatients:             ()              => api.get('/admin/patients').then(r => r.data),

  getAllDonations:          (params = {})   => api.get('/admin/donations', { params }).then(r => r.data),
  getAllRequests:           (params = {})   => api.get('/admin/requests',  { params }).then(r => r.data),

  getAuditLogs:            (params = {})   => api.get('/admin/audit', { params }).then(r => r.data),
  getBlockchainStatus:     ()              => api.get('/admin/blockchain-status').then(r => r.data),
  getBlockchainTransactions:(params = {})  => api.get('/admin/blockchain', { params }).then(r => r.data),
}
