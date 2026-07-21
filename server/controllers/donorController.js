import User     from '../models/User.js'
import Donation from '../models/Donation.js'
import AuditLog from '../models/AuditLog.js'
import { log }  from '../utils/auditLogger.js'

/* ── GET /api/donor/stats ── */
export const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')

    const lastDonation = user.lastDonationDate ? new Date(user.lastDonationDate) : null
    let nextEligible = null
    let eligibleToday = true

    if (lastDonation) {
      nextEligible = new Date(lastDonation)
      nextEligible.setDate(nextEligible.getDate() + 84) // 12 weeks
      eligibleToday = new Date() >= nextEligible
    }

    const totalDonations = await Donation.countDocuments({ donorId: req.user.id, status: 'confirmed' })

    res.json({
      success: true,
      stats: {
        totalDonations,
        livesImpacted:   totalDonations * 3,
        nextEligibleDate: nextEligible ? nextEligible.toISOString() : null,
        eligibleToday,
        donorId:   user.userId,
        bloodType: user.bloodType,
        lastDonationDate: lastDonation ? lastDonation.toISOString() : null,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/donor/donations ── */
export const getDonations = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query
    const filter = { donorId: req.user.id }
    if (status) filter.status = status

    const donations = await Donation.find(filter)
      .populate('bloodBankId', 'fullName organizationName state userId')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean()

    const total = await Donation.countDocuments(filter)

    res.json({ success: true, donations, total, page: Number(page) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── POST /api/donor/donations ── express donation intent ── */
export const createDonation = async (req, res) => {
  try {
    const { bloodBankId, donationDate, notes } = req.body

    if (!bloodBankId) {
      return res.status(400).json({ success: false, message: 'Blood bank is required' })
    }

    const donor    = await User.findById(req.user.id).select('-password')
    const bloodBank = await User.findOne({ _id: bloodBankId, role: 'bloodbank', isActive: true })

    if (!bloodBank) {
      return res.status(404).json({ success: false, message: 'Blood bank not found' })
    }
    if (!donor.bloodType) {
      return res.status(400).json({ success: false, message: 'Blood type not set on your profile' })
    }

    const donation = await Donation.create({
      donorId:    donor._id,
      bloodBankId: bloodBank._id,
      bloodType:  donor.bloodType,
      units:      1,
      status:     'intent',
      donationDate: donationDate ? new Date(donationDate) : null,
      notes,
    })

    const populated = await donation.populate('bloodBankId', 'fullName organizationName state userId')

    await log({
      action:    'DONATION_INTENT_CREATED',
      category:  'donation',
      user:       req.user,
      details:   { bloodBankId: bloodBank._id, bloodBankName: bloodBank.organizationName || bloodBank.fullName },
      req,
    })

    res.status(201).json({ success: true, donation: populated })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── DELETE /api/donor/donations/:id ── cancel intent ── */
export const cancelDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, donorId: req.user.id })
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' })
    if (donation.status !== 'intent') {
      return res.status(400).json({ success: false, message: 'Only pending intents can be cancelled' })
    }
    donation.status = 'cancelled'
    await donation.save()
    res.json({ success: true, donation })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/donor/bloodbanks ── list verified blood banks ── */
export const getBloodBanks = async (req, res) => {
  try {
    const { state, search } = req.query
    const filter = { role: 'bloodbank', isActive: true, isVerified: true }
    if (state)  filter.state = new RegExp(state, 'i')
    if (search) filter.$or = [
      { fullName:         new RegExp(search, 'i') },
      { organizationName: new RegExp(search, 'i') },
      { state:            new RegExp(search, 'i') },
    ]

    const banks = await User.find(filter)
      .select('fullName organizationName state licenseNumber userId address phone email')
      .sort({ organizationName: 1 })
      .lean()

    res.json({ success: true, banks })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/donor/history ── alias for getDonations ── */
export const getDonationHistory = getDonations

/* ── GET /api/donor/profile ── */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── PATCH /api/donor/profile ── */
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, dateOfBirth, emergencyContactName, emergencyContactPhone } = req.body
    const allowed = {}
    if (fullName)              allowed.fullName              = fullName
    if (phone)                 allowed.phone                 = phone
    if (dateOfBirth)           allowed.dateOfBirth           = new Date(dateOfBirth)
    if (emergencyContactName)  allowed.emergencyContactName  = emergencyContactName
    if (emergencyContactPhone) allowed.emergencyContactPhone = emergencyContactPhone

    const user = await User.findByIdAndUpdate(req.user.id, allowed, { new: true }).select('-password')
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/donor/blockchain ── on-chain donation records ── */
export const getBlockchainRecords = async (req, res) => {
  try {
    const donations = await Donation.find({
      donorId: req.user.id,
      status: 'confirmed',
      txHash: { $exists: true, $ne: null },
    })
      .populate('bloodBankId', 'organizationName fullName')
      .sort({ confirmedAt: -1 })
      .lean()

    res.json({ success: true, records: donations })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
