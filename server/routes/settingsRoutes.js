import express from 'express'
import { protect } from '../middleware/auth.js'
import { getProfile, updateProfile, changePassword, updateWallet } from '../controllers/settingsController.js'

const router = express.Router()

router.use(protect)

router.get('/',             getProfile)
router.put('/profile',      updateProfile)
router.put('/password',     changePassword)
router.put('/wallet',       updateWallet)

export default router
