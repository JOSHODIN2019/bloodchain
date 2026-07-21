import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import { seedAdmin } from './config/seed.js'
import authRoutes         from './routes/auth.js'
import adminRoutes        from './routes/admin.js'
import donorRoutes        from './routes/donor.js'
import bloodbankRoutes    from './routes/bloodbank.js'
import hospitalRoutes     from './routes/hospital.js'
import notificationRoutes from './routes/notificationRoutes.js'
import settingsRoutes     from './routes/settingsRoutes.js'
import blockchainRoutes   from './routes/blockchain.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:3001').split(',')
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MedRec API running', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth',          authRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/donor',         donorRoutes)
app.use('/api/bloodbank',     bloodbankRoutes)
app.use('/api/hospital',      hospitalRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/settings',      settingsRoutes)
app.use('/api/blockchain',    blockchainRoutes)

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
})

const start = async () => {
  await connectDB()
  await seedAdmin()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()
