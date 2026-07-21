import { Router } from 'express'
import { protect, requireRole } from '../middleware/auth.js'
import {
  getStats,
  getRequests,
  createRequest,
  cancelRequest,
  getBloodBanks,
  getBankInventory,
  getProfile,
  updateProfile,
  getBlockchainRecords,
} from '../controllers/hospitalController.js'

const router = Router()
router.use(protect, requireRole('hospital'))

router.get('/stats',                          getStats)
router.get('/requests',                       getRequests)
router.post('/requests',                      createRequest)
router.patch('/requests/:id/cancel',          cancelRequest)
router.get('/bloodbanks',                     getBloodBanks)
router.get('/bloodbanks/:id/inventory',       getBankInventory)
router.get('/profile',                        getProfile)
router.patch('/profile',                      updateProfile)
router.get('/blockchain',                     getBlockchainRecords)

export default router
