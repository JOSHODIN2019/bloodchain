import api from './authService'
export { openFile } from './adminService'

export const patientService = {
  getStats:     ()         => api.get('/patient/stats').then(r => ({ data: r.data.stats })),
  getRecords:   ()         => api.get('/patient/records').then(r => ({ data: r.data.records })),
  uploadRecord:  (formData) => api.post('/patient/records', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  verifyRecord:  (id)       => api.get(`/patient/records/${id}/verify`).then(r => r.data),
  getRecordFile: (id)       => `/patient/records/${id}/file`,
  getDoctors:   ()         => api.get('/patient/doctors').then(r => ({
    data: (r.data.doctors || []).map(d => ({
      ...d,
      hasAccess: d.grant?.isActive === true,
      grantedAt: d.grant?.grantedAt || null,
    }))
  })),
  grantAccess:  (doctorId) => api.post(`/patient/access/${doctorId}`).then(r => r.data),
  revokeAccess: (doctorId) => api.delete(`/patient/access/${doctorId}`).then(r => r.data),
  getAuditLogs: ()         => api.get('/patient/audit').then(r => ({ data: r.data.logs })),
}
