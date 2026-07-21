import { Router } from 'express'
import { register, login, getMe, linkWallet, unlinkWallet } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.post('/register',       register)
router.post('/login',          login)
router.get('/me',              protect, getMe)
router.put('/wallet/link',     protect, linkWallet)
router.put('/wallet/unlink',   protect, unlinkWallet)

export default router
