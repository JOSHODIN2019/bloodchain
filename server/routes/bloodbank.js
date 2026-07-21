import { Router } from 'express'
import { protect, requireRole } from '../middleware/auth.js'
import {
  getStats,
  getInventory,
  updateInventory,
  getDonations,
  confirmDonation,
  rejectDonation,
  getRequests,
  fulfilRequest,
  rejectRequest,
  getProfile,
  updateProfile,
  getBlockchainRecords,
} from '../controllers/bloodbankController.js'

const router = Router()
router.use(protect, requireRole('bloodbank'))

router.get('/stats',                        getStats)
router.get('/inventory',                    getInventory)
router.patch('/inventory/:bloodType',       updateInventory)
router.get('/donations',                    getDonations)
router.patch('/donations/:id/confirm',      confirmDonation)
router.patch('/donations/:id/reject',       rejectDonation)
router.get('/requests',                     getRequests)
router.patch('/requests/:id/fulfil',        fulfilRequest)
router.patch('/requests/:id/reject',        rejectRequest)
router.get('/profile',                      getProfile)
router.patch('/profile',                    updateProfile)
router.get('/blockchain',                   getBlockchainRecords)

export default router
