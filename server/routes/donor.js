import { Router } from 'express'
import { protect, requireRole } from '../middleware/auth.js'
import {
  getStats,
  getDonations,
  getDonationHistory,
  createDonation,
  cancelDonation,
  getBloodBanks,
  getProfile,
  updateProfile,
  getBlockchainRecords,
} from '../controllers/donorController.js'

const router = Router()
router.use(protect, requireRole('donor'))

router.get('/stats',       getStats)
router.get('/donations',   getDonations)
router.post('/donations',  createDonation)
router.delete('/donations/:id', cancelDonation)
router.get('/history',     getDonationHistory)
router.get('/bloodbanks',  getBloodBanks)
router.get('/profile',     getProfile)
router.patch('/profile',   updateProfile)
router.get('/blockchain',  getBlockchainRecords)

export default router
