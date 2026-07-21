import api from './authService'
export { openFile } from './adminService'

export const doctorService = {
  getStats:          ()                    => api.get('/doctor/stats').then(r => ({ data: r.data.stats })),
  getPatients:       ()                    => api.get('/doctor/patients').then(r => ({ data: r.data.patients })),
  registerPatient:   (data)                => api.post('/doctor/patients/register', data).then(r => r.data),
  getPatientRecords: (patientId)           => api.get(`/doctor/patients/${patientId}/records`).then(r => ({ data: r.data })),
  uploadRecord:      (patientId, formData) => api.post(`/doctor/patients/${patientId}/records`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  getRecordFile:     (patientId, recordId) => `/doctor/patients/${patientId}/records/${recordId}/file`,
  verifyRecord:      (patientId, recordId) => api.get(`/doctor/patients/${patientId}/records/${recordId}/verify`).then(r => r.data),
  getAuditLogs:      ()                    => api.get('/doctor/audit').then(r => ({ data: r.data.logs })),
}
