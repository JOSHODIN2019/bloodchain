import jwt    from 'jsonwebtoken'
import User   from '../models/User.js'
import { notify } from '../utils/notify.js'

const signToken = (id, role, walletAddress) =>
  jwt.sign({ id, role, walletAddress }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

const authResponse = (res, user, statusCode = 200) => {
  const token = signToken(user._id, user.role, user.walletAddress)
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeObject(),
  })
}

/* ── POST /api/auth/register ── */
export const register = async (req, res) => {
  const { fullName, email, password, phone, dateOfBirth, walletAddress, bloodType } = req.body

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Full name, email and password are required' })
  }

  const existing = await User.findOne({ email })
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' })
  }

  const user = await User.create({
    fullName,
    email,
    password,
    phone,
    dateOfBirth,
    walletAddress,
    bloodType,
    role: 'donor',
    isVerified: true,
  })

  await notify({
    recipient: user._id,
    type: 'ACCOUNT_CREATED',
    title: 'Welcome to BloodChain!',
    message: `Hi ${fullName.split(' ')[0]}! Your donor account is active. Every donation you make can save up to 3 lives.`,
  })

  authResponse(res, user, 201)
}

/* ── POST /api/auth/login ── */
export const login = async (req, res) => {
  const { email, password, walletAddress } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' })
  }

  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' })
  }

  // Update wallet address if provided
  if (walletAddress && walletAddress !== user.walletAddress) {
    user.walletAddress = walletAddress
    await user.save({ validateBeforeSave: false })
  }

  authResponse(res, user)
}

/* ── GET /api/auth/me ── */
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() })
}

/* ── PUT /api/auth/wallet/link ── */
export const linkWallet = async (req, res) => {
  const { walletAddress } = req.body
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).json({ success: false, message: 'Invalid wallet address' })
  }

  const existing = await User.findOne({ walletAddress: walletAddress.toLowerCase(), _id: { $ne: req.user._id } })
  if (existing) {
    return res.status(409).json({ success: false, message: 'This wallet is already linked to another account' })
  }

  req.user.walletAddress = walletAddress.toLowerCase()
  await req.user.save({ validateBeforeSave: false })

  res.json({ success: true, user: req.user.toSafeObject(), message: 'Wallet linked successfully' })
}

/* ── PUT /api/auth/wallet/unlink ── */
export const unlinkWallet = async (req, res) => {
  req.user.walletAddress = undefined
  await req.user.save({ validateBeforeSave: false })
  res.json({ success: true, user: req.user.toSafeObject(), message: 'Wallet unlinked' })
}
