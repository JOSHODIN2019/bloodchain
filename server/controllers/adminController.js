import User         from '../models/User.js'
import Donation     from '../models/Donation.js'
import BloodRequest from '../models/BloodRequest.js'
import AuditLog     from '../models/AuditLog.js'
import { log }      from '../utils/auditLogger.js'
import { notify }   from '../utils/notify.js'
import { blockchainService } from '../services/blockchainService.js'

/* ── GET /api/admin/stats ── */
export const getStats = async (req, res) => {
  const [totalDonors, totalBloodBanks, totalHospitals, pendingVerifications, totalAudit] = await Promise.all([
    User.countDocuments({ role: 'donor',    isActive: true }),
    User.countDocuments({ role: 'bloodbank' }),
    User.countDocuments({ role: 'hospital' }),
    User.countDocuments({ role: { $in: ['bloodbank', 'hospital'] }, isVerified: false }),
    AuditLog.countDocuments(),
  ])
  res.json({ success: true, stats: { totalDonors, totalBloodBanks, totalHospitals, pendingVerifications, totalAudit } })
}

/* ── POST /api/admin/doctors ── Create blood bank account ── */
export const createDoctor = async (req, res) => {
  try {
    const { fullName, organizationName, email, password, phone, licenseNumber, state } = req.body
    if (!fullName || !email || !password || !organizationName) {
      return res.status(400).json({ success: false, message: 'Full name, organisation, email and password are required' })
    }
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' })

    const bank = await User.create({
      fullName, organizationName, email, password,
      phone, licenseNumber, state,
      role: 'bloodbank', isVerified: false, isActive: true,
    })
    await log({ action: 'BLOODBANK_CREATED', category: 'admin', user: req.user, details: { bankId: bank._id, email }, req })
    await notify({ recipient: bank._id, type: 'ACCOUNT_CREATED', title: 'Account Created', message: `Your BloodChain blood bank account has been created. An admin will verify it shortly.` })
    res.status(201).json({ success: true, doctor: bank.toSafeObject() })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/admin/doctors ── Blood Banks list ── */
export const getDoctors = async (req, res) => {
  const doctors = await User.find({ role: 'bloodbank' }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, doctors })
}

/* ── PATCH /api/admin/doctors/:id ── Verify / activate / deactivate blood bank ── */
export const updateDoctor = async (req, res) => {
  const { isVerified, isActive } = req.body
  const bank = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'bloodbank' },
    {
      ...(isVerified !== undefined && { isVerified }),
      ...(isActive   !== undefined && { isActive   }),
    },
    { new: true }
  )
  if (!bank) return res.status(404).json({ success: false, message: 'Blood bank not found' })

  const action = isActive === false ? 'BLOODBANK_DEACTIVATED'
               : isActive === true  ? 'BLOODBANK_ACTIVATED'
               : isVerified         ? 'BLOODBANK_VERIFIED'
                                    : 'BLOODBANK_UPDATED'
  await log({ action, category: 'admin', user: req.user, details: { bankId: bank._id, bankEmail: bank.email }, req })

  if (isVerified === true) {
    await notify({
      recipient: bank._id,
      type: 'BLOODBANK_VERIFIED',
      title: 'Account Verified',
      message: 'Your blood bank account has been verified by the administrator. You can now receive and manage donations.',
    })
  }

  res.json({ success: true, doctor: bank.toSafeObject() })
}

/* ── POST /api/admin/hospitals ── Create hospital account ── */
export const createHospital = async (req, res) => {
  try {
    const { fullName, organizationName, email, password, phone, licenseNumber, state } = req.body
    if (!fullName || !email || !password || !organizationName) {
      return res.status(400).json({ success: false, message: 'Full name, organisation, email and password are required' })
    }
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' })

    const hospital = await User.create({
      fullName, organizationName, email, password,
      phone, licenseNumber, state,
      role: 'hospital', isVerified: false, isActive: true,
    })
    await log({ action: 'HOSPITAL_CREATED', category: 'admin', user: req.user, details: { hospitalId: hospital._id, email }, req })
    await notify({ recipient: hospital._id, type: 'ACCOUNT_CREATED', title: 'Account Created', message: `Your BloodChain hospital account has been created. An admin will verify it shortly.` })
    res.status(201).json({ success: true, hospital: hospital.toSafeObject() })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/admin/hospitals ── */
export const getHospitals = async (req, res) => {
  const hospitals = await User.find({ role: 'hospital' }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, hospitals })
}

/* ── PATCH /api/admin/hospitals/:id ── */
export const updateHospital = async (req, res) => {
  const { isVerified, isActive } = req.body
  const hospital = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'hospital' },
    {
      ...(isVerified !== undefined && { isVerified }),
      ...(isActive   !== undefined && { isActive   }),
    },
    { new: true }
  )
  if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' })

  const action = isActive === false ? 'HOSPITAL_DEACTIVATED'
               : isActive === true  ? 'HOSPITAL_ACTIVATED'
               : isVerified         ? 'HOSPITAL_VERIFIED'
                                    : 'HOSPITAL_UPDATED'
  await log({ action, category: 'admin', user: req.user, details: { hospitalId: hospital._id, hospitalEmail: hospital.email }, req })

  if (isVerified === true) {
    await notify({
      recipient: hospital._id,
      type: 'HOSPITAL_VERIFIED',
      title: 'Account Verified',
      message: 'Your hospital account has been verified by the administrator. You can now submit blood requests.',
    })
  }

  res.json({ success: true, hospital: hospital.toSafeObject() })
}

/* ── GET /api/admin/patients ── Donors list ── */
export const getPatients = async (req, res) => {
  const patients = await User.find({ role: 'donor' }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, patients })
}

/* ── GET /api/admin/donations ── All donations system-wide ── */
export const getAllDonations = async (req, res) => {
  const { status, page = 1, limit = 40 } = req.query
  const filter = status && status !== 'all' ? { status } : {}
  const [donations, total] = await Promise.all([
    Donation.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('donorId',    'fullName userId bloodType phone')
      .populate('bloodBankId','organizationName fullName userId state')
      .lean(),
    Donation.countDocuments(filter),
  ])
  res.json({ success: true, donations, total, page: Number(page) })
}

/* ── GET /api/admin/requests ── All blood requests system-wide ── */
export const getAllRequests = async (req, res) => {
  const { status, page = 1, limit = 40 } = req.query
  const filter = status && status !== 'all' ? { status } : {}
  const [requests, total] = await Promise.all([
    BloodRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('hospitalId', 'organizationName fullName userId state')
      .populate('bloodBankId','organizationName fullName userId state')
      .lean(),
    BloodRequest.countDocuments(filter),
  ])
  res.json({ success: true, requests, total, page: Number(page) })
}

/* ── GET /api/admin/audit ── */
export const getAuditLogs = async (req, res) => {
  const { category, limit = 50, page = 1 } = req.query
  const filter = category && category !== 'all' ? { category } : {}
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).lean(),
    AuditLog.countDocuments(filter),
  ])
  res.json({ success: true, logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
}

/* ── GET /api/admin/blockchain-status ── */
export const getBlockchainStatus = async (req, res) => {
  const [walletStatus, totalDonations, totalRequests] = await Promise.all([
    blockchainService.getWalletStatus(),
    Donation.countDocuments(),
    BloodRequest.countDocuments(),
  ])
  res.json({ success: true, blockchain: { ...walletStatus, totalDonations, totalRequests } })
}

/* ── GET /api/admin/blockchain ── All on-chain transactions ── */
export const getBlockchainTransactions = async (req, res) => {
  const { type } = req.query

  const [donations, requests] = await Promise.all([
    Donation.find({ txHash: { $exists: true, $ne: null } })
      .populate('donorId',    'fullName userId bloodType')
      .populate('bloodBankId','organizationName fullName userId')
      .sort({ createdAt: -1 })
      .lean(),
    BloodRequest.find({ txHash: { $exists: true, $ne: null } })
      .populate('hospitalId', 'organizationName fullName userId')
      .populate('bloodBankId','organizationName fullName userId')
      .sort({ createdAt: -1 })
      .lean(),
  ])

  const donationTxs = donations.map(d => ({
    _id:         d._id,
    txHash:      d.txHash,
    type:        'DONATION',
    subtype:     d.status.toUpperCase(),
    bloodType:   d.bloodType,
    units:       d.units,
    from:        d.donorId?.fullName               || 'Unknown Donor',
    fromId:      d.donorId?.userId,
    to:          d.bloodBankId?.organizationName   || d.bloodBankId?.fullName || 'Unknown Bank',
    toId:        d.bloodBankId?.userId,
    blockNumber: d.blockNumber,
    simulated:   !d.blockNumber,
    timestamp:   d.createdAt,
  }))

  const requestTxs = requests.map(r => ({
    _id:         r._id,
    txHash:      r.txHash,
    type:        'REQUEST',
    subtype:     r.status.toUpperCase(),
    bloodType:   r.bloodType,
    units:       r.units,
    priority:    r.priority,
    from:        r.hospitalId?.organizationName    || r.hospitalId?.fullName    || 'Unknown Hospital',
    fromId:      r.hospitalId?.userId,
    to:          r.bloodBankId?.organizationName   || r.bloodBankId?.fullName   || 'Unknown Bank',
    toId:        r.bloodBankId?.userId,
    blockNumber: r.blockNumber,
    simulated:   !r.blockNumber,
    timestamp:   r.createdAt,
  }))

  let transactions = [...donationTxs, ...requestTxs]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  if (type && type !== 'all') {
    transactions = transactions.filter(t => t.type === type)
  }

  res.json({
    success: true,
    transactions,
    stats: {
      total:     transactions.length,
      donations: donationTxs.length,
      requests:  requestTxs.length,
    },
  })
}
