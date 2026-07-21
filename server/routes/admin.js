import { Router } from 'express'
import { protect, requireRole } from '../middleware/auth.js'
import {
  getStats,
  createDoctor, getDoctors, updateDoctor,
  createHospital, getHospitals, updateHospital,
  getPatients,
  getAllDonations, getAllRequests,
  getAuditLogs, getBlockchainStatus, getBlockchainTransactions,
} from '../controllers/adminController.js'

const router = Router()
router.use(protect, requireRole('admin'))

router.get('/stats',             getStats)

router.post('/doctors',          createDoctor)
router.get('/doctors',           getDoctors)
router.patch('/doctors/:id',     updateDoctor)

router.post('/hospitals',        createHospital)
router.get('/hospitals',         getHospitals)
router.patch('/hospitals/:id',   updateHospital)

router.get('/patients',          getPatients)

router.get('/donations',         getAllDonations)
router.get('/requests',          getAllRequests)

router.get('/audit',             getAuditLogs)
router.get('/blockchain-status', getBlockchainStatus)
router.get('/blockchain',        getBlockchainTransactions)

export default router
