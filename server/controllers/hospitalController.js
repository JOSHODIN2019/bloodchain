import User         from '../models/User.js'
import BloodRequest  from '../models/BloodRequest.js'
import BloodInventory from '../models/BloodInventory.js'
import { log }       from '../utils/auditLogger.js'

/* ── GET /api/hospital/stats ── */
export const getStats = async (req, res) => {
  try {
    const hId = req.user.id

    const [active, fulfilled, pending, connectedBanks] = await Promise.all([
      BloodRequest.countDocuments({ hospitalId: hId, status: 'processing' }),
      BloodRequest.countDocuments({ hospitalId: hId, status: 'fulfilled' }),
      BloodRequest.countDocuments({ hospitalId: hId, status: 'pending' }),
      User.countDocuments({ role: 'bloodbank', isVerified: true, isActive: true }),
    ])

    res.json({
      success: true,
      stats: { activeRequests: active, fulfilledRequests: fulfilled, pendingRequests: pending, connectedBanks },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/hospital/requests ── */
export const getRequests = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query
    const filter = { hospitalId: req.user.id }
    if (status) filter.status = status

    const requests = await BloodRequest.find(filter)
      .populate('bloodBankId', 'fullName organizationName state userId phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean()

    res.json({ success: true, requests })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── POST /api/hospital/requests ── */
export const createRequest = async (req, res) => {
  try {
    const { bloodBankId, bloodType, units, priority, notes } = req.body

    if (!bloodBankId || !bloodType || !units) {
      return res.status(400).json({ success: false, message: 'bloodBankId, bloodType, and units are required' })
    }

    const bank = await User.findOne({ _id: bloodBankId, role: 'bloodbank', isActive: true })
    if (!bank) return res.status(404).json({ success: false, message: 'Blood bank not found' })

    const request = await BloodRequest.create({
      hospitalId: req.user.id,
      bloodBankId,
      bloodType,
      units:    Number(units),
      priority: priority || 'normal',
      notes:    notes || '',
    })

    await log({ action: 'REQUEST_CREATED', category: 'hospital', user: req.user, details: { bloodType, units, bloodBankId }, req })

    const populated = await request.populate('bloodBankId', 'fullName organizationName state userId')
    res.status(201).json({ success: true, request: populated })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── PATCH /api/hospital/requests/:id/cancel ── */
export const cancelRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ _id: req.params.id, hospitalId: req.user.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })
    if (!['pending', 'processing'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'Only pending or processing requests can be cancelled' })
    }

    request.status = 'cancelled'
    await request.save()

    await log({ action: 'REQUEST_CANCELLED', category: 'hospital', user: req.user, details: { requestId: request._id }, req })

    res.json({ success: true, request })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/hospital/bloodbanks ── list available blood banks ── */
export const getBloodBanks = async (req, res) => {
  try {
    const banks = await User.find({ role: 'bloodbank', isVerified: true, isActive: true })
      .select('fullName organizationName state userId phone address')
      .sort({ organizationName: 1 })
      .lean()

    res.json({ success: true, banks })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/hospital/bloodbanks/:id/inventory ── check stock before requesting ── */
export const getBankInventory = async (req, res) => {
  try {
    const inventory = await BloodInventory.find({ bloodBankId: req.params.id }).lean()
    res.json({ success: true, inventory })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/hospital/profile ── */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── PATCH /api/hospital/profile ── */
export const updateProfile = async (req, res) => {
  try {
    const { organizationName, phone, address, state } = req.body
    const allowed = {}
    if (organizationName) allowed.organizationName = organizationName
    if (phone)            allowed.phone            = phone
    if (address)          allowed.address          = address
    if (state)            allowed.state            = state

    const user = await User.findByIdAndUpdate(req.user.id, allowed, { new: true }).select('-password')
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/hospital/blockchain ── On-chain blood requests for this hospital ── */
export const getBlockchainRecords = async (req, res) => {
  try {
    const requests = await BloodRequest.find({
      hospitalId: req.user.id,
      txHash: { $exists: true, $ne: null },
    })
      .populate('bloodBankId', 'organizationName fullName userId')
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, requests })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
