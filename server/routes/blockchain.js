import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { verifyRecord } from '../controllers/blockchainController.js'

const router = Router()
router.use(protect)

router.get('/verify/:id', verifyRecord)

export default router
