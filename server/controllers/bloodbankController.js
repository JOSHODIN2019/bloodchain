import User           from '../models/User.js'
import Donation        from '../models/Donation.js'
import BloodInventory  from '../models/BloodInventory.js'
import BloodRequest    from '../models/BloodRequest.js'
import { log }         from '../utils/auditLogger.js'
import { notify }      from '../utils/notify.js'
import { blockchainService } from '../services/blockchainService.js'

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

/* ── GET /api/bloodbank/stats ── */
export const getStats = async (req, res) => {
  try {
    const bbId = req.user.id

    const [totalDonations, pendingDonations, pendingRequests, inventory] = await Promise.all([
      Donation.countDocuments({ bloodBankId: bbId, status: 'confirmed' }),
      Donation.countDocuments({ bloodBankId: bbId, status: 'intent' }),
      BloodRequest.countDocuments({ bloodBankId: bbId, status: 'pending' }),
      BloodInventory.find({ bloodBankId: bbId }),
    ])

    const totalInventoryUnits = inventory.reduce((s, i) => s + i.units, 0)

    res.json({
      success: true,
      stats: {
        totalDonationsReceived: totalDonations,
        pendingIntents:         pendingDonations,
        totalInventoryUnits,
        pendingRequests,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/bloodbank/inventory ── */
export const getInventory = async (req, res) => {
  try {
    const existing = await BloodInventory.find({ bloodBankId: req.user.id }).lean()
    const map = {}
    existing.forEach(e => { map[e.bloodType] = e })

    const inventory = BLOOD_TYPES.map(bt => {
      const item = map[bt]
      return {
        _id:          item?._id,
        bloodType:    bt,
        units:        item?.units ?? 0,
        minimumLevel: item?.minimumLevel ?? 5,
        critical:     (item?.units ?? 0) < (item?.minimumLevel ?? 5),
        lastUpdated:  item?.lastUpdated ?? null,
      }
    })

    res.json({ success: true, inventory })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── PATCH /api/bloodbank/inventory/:bloodType ── */
export const updateInventory = async (req, res) => {
  try {
    const { bloodType } = req.params
    const { units, minimumLevel, operation } = req.body

    if (!BLOOD_TYPES.includes(bloodType)) {
      return res.status(400).json({ success: false, message: 'Invalid blood type' })
    }

    let record = await BloodInventory.findOne({ bloodBankId: req.user.id, bloodType })

    if (!record) {
      record = new BloodInventory({ bloodBankId: req.user.id, bloodType, units: 0 })
    }

    if (operation === 'add')      record.units = Math.max(0, record.units + Number(units))
    else if (operation === 'sub') record.units = Math.max(0, record.units - Number(units))
    else if (units !== undefined) record.units = Math.max(0, Number(units))

    if (minimumLevel !== undefined) record.minimumLevel = Number(minimumLevel)
    record.lastUpdated = new Date()
    await record.save()

    await log({ action: 'INVENTORY_UPDATED', category: 'bloodbank', user: req.user, details: { bloodType, units: record.units }, req })

    res.json({ success: true, inventory: record })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/bloodbank/donations ── incoming intents ── */
export const getDonations = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query
    const filter = { bloodBankId: req.user.id }
    if (status) filter.status = status

    const donations = await Donation.find(filter)
      .populate('donorId', 'fullName userId bloodType phone email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean()

    res.json({ success: true, donations })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── PATCH /api/bloodbank/donations/:id/confirm ── */
export const confirmDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, bloodBankId: req.user.id })
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' })
    if (donation.status !== 'intent') {
      return res.status(400).json({ success: false, message: 'Only pending intents can be confirmed' })
    }

    donation.status      = 'confirmed'
    donation.confirmedAt = new Date()
    donation.confirmedBy = req.user.id
    await donation.save()

    // Update donor's totalDonations and lastDonationDate
    await User.findByIdAndUpdate(donation.donorId, {
      $inc: { totalDonations: 1 },
      lastDonationDate: donation.confirmedAt,
    })

    // Add to inventory
    await BloodInventory.findOneAndUpdate(
      { bloodBankId: req.user.id, bloodType: donation.bloodType },
      { $inc: { units: donation.units }, lastUpdated: new Date() },
      { upsert: true, new: true }
    )

    await log({ action: 'DONATION_CONFIRMED', category: 'bloodbank', user: req.user, details: { donationId: donation._id, bloodType: donation.bloodType }, req })

    await notify({
      recipient: donation.donorId,
      type: 'DONATION_CONFIRMED',
      title: 'Donation Confirmed',
      message: `Your ${donation.bloodType} donation (${donation.units} unit) has been confirmed. Thank you for saving lives!`,
      data: { donationId: donation._id },
    })

    // Record on-chain (fire-and-forget — don't block response)
    blockchainService.recordDonation({
      donationId: donation._id.toString(),
      donorId:    donation.donorId.toString(),
      bloodBankId:req.user.id,
      bloodType:  donation.bloodType,
      units:      donation.units,
      status:     'confirmed',
    }).then(tx => {
      if (tx.txHash) {
        Donation.findByIdAndUpdate(donation._id, { txHash: tx.txHash, blockNumber: tx.blockNumber }).exec()
      }
    }).catch(() => {})

    const populated = await donation.populate('donorId', 'fullName userId bloodType')
    res.json({ success: true, donation: populated })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── PATCH /api/bloodbank/donations/:id/reject ── */
export const rejectDonation = async (req, res) => {
  try {
    const { reason } = req.body
    const donation = await Donation.findOne({ _id: req.params.id, bloodBankId: req.user.id })
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' })
    if (donation.status !== 'intent') {
      return res.status(400).json({ success: false, message: 'Only pending intents can be rejected' })
    }

    donation.status         = 'rejected'
    donation.rejectedReason = reason || 'Not specified'
    await donation.save()

    await log({ action: 'DONATION_REJECTED', category: 'bloodbank', user: req.user, details: { donationId: donation._id, reason }, req })

    await notify({
      recipient: donation.donorId,
      type: 'DONATION_REJECTED',
      title: 'Donation Not Accepted',
      message: `Your ${donation.bloodType} donation was not accepted. Reason: ${reason || 'Not specified'}.`,
      data: { donationId: donation._id },
    })

    blockchainService.recordDonation({
      donationId: donation._id.toString(),
      donorId:    donation.donorId.toString(),
      bloodBankId:req.user.id,
      bloodType:  donation.bloodType,
      units:      donation.units,
      status:     'rejected',
    }).then(tx => {
      if (tx.txHash) {
        Donation.findByIdAndUpdate(donation._id, { txHash: tx.txHash, blockNumber: tx.blockNumber }).exec()
      }
    }).catch(() => {})

    res.json({ success: true, donation })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/bloodbank/requests ── hospital requests ── */
export const getRequests = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query
    const filter = { bloodBankId: req.user.id }
    if (status) filter.status = status

    const requests = await BloodRequest.find(filter)
      .populate('hospitalId', 'fullName organizationName state userId phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean()

    res.json({ success: true, requests })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── PATCH /api/bloodbank/requests/:id/fulfil ── */
export const fulfilRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ _id: req.params.id, bloodBankId: req.user.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })
    if (!['pending','processing'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'Request cannot be fulfilled in current status' })
    }

    // Deduct from inventory
    const inv = await BloodInventory.findOne({ bloodBankId: req.user.id, bloodType: request.bloodType })
    if (!inv || inv.units < request.units) {
      return res.status(400).json({ success: false, message: `Insufficient ${request.bloodType} stock (have ${inv?.units ?? 0}, need ${request.units})` })
    }

    inv.units       -= request.units
    inv.lastUpdated  = new Date()
    await inv.save()

    request.status      = 'fulfilled'
    request.fulfilledAt = new Date()
    request.responseNotes = req.body.responseNotes || ''
    await request.save()

    await log({ action: 'REQUEST_FULFILLED', category: 'bloodbank', user: req.user, details: { requestId: request._id, bloodType: request.bloodType, units: request.units }, req })

    await notify({
      recipient: request.hospitalId,
      type: 'REQUEST_FULFILLED',
      title: 'Blood Request Fulfilled',
      message: `Your request for ${request.units} unit(s) of ${request.bloodType} has been fulfilled and is ready for dispatch.`,
      data: { requestId: request._id },
    })

    blockchainService.recordBloodRequest({
      requestId:  request._id.toString(),
      hospitalId: request.hospitalId.toString(),
      bloodBankId:req.user.id,
      bloodType:  request.bloodType,
      units:      request.units,
      status:     'fulfilled',
    }).then(tx => {
      if (tx.txHash) {
        BloodRequest.findByIdAndUpdate(request._id, { txHash: tx.txHash, blockNumber: tx.blockNumber }).exec()
      }
    }).catch(() => {})

    res.json({ success: true, request })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── PATCH /api/bloodbank/requests/:id/reject ── */
export const rejectRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ _id: req.params.id, bloodBankId: req.user.id })
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })
    if (!['pending','processing'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'Request cannot be rejected in current status' })
    }
    request.status        = 'rejected'
    request.responseNotes = req.body.reason || ''
    await request.save()

    await log({ action: 'REQUEST_REJECTED', category: 'bloodbank', user: req.user, details: { requestId: request._id }, req })

    await notify({
      recipient: request.hospitalId,
      type: 'REQUEST_REJECTED',
      title: 'Blood Request Rejected',
      message: `Your request for ${request.units} unit(s) of ${request.bloodType} was rejected. Reason: ${req.body.reason || 'Not specified'}.`,
      data: { requestId: request._id },
    })

    blockchainService.recordBloodRequest({
      requestId:  request._id.toString(),
      hospitalId: request.hospitalId.toString(),
      bloodBankId:req.user.id,
      bloodType:  request.bloodType,
      units:      request.units,
      status:     'rejected',
    }).then(tx => {
      if (tx.txHash) {
        BloodRequest.findByIdAndUpdate(request._id, { txHash: tx.txHash, blockNumber: tx.blockNumber }).exec()
      }
    }).catch(() => {})

    res.json({ success: true, request })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── GET /api/bloodbank/profile ── */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── PATCH /api/bloodbank/profile ── */
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

/* ── GET /api/bloodbank/blockchain ── On-chain records for this blood bank ── */
export const getBlockchainRecords = async (req, res) => {
  try {
    const bbId = req.user.id
    const [donations, requests] = await Promise.all([
      Donation.find({ bloodBankId: bbId, txHash: { $exists: true, $ne: null } })
        .populate('donorId', 'fullName userId bloodType')
        .sort({ createdAt: -1 })
        .lean(),
      BloodRequest.find({ bloodBankId: bbId, txHash: { $exists: true, $ne: null } })
        .populate('hospitalId', 'organizationName fullName userId')
        .sort({ createdAt: -1 })
        .lean(),
    ])
    res.json({ success: true, donations, requests })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
