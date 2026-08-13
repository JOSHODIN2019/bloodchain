import { createHash } from 'crypto'
import Donation     from '../models/Donation.js'
import BloodRequest  from '../models/BloodRequest.js'
import { blockchainService } from '../services/blockchainService.js'

function hashDonation({ donationId, donorId, bloodBankId, bloodType, units, status }) {
  return createHash('sha256')
    .update([donationId, donorId, bloodBankId, bloodType, String(units), status].join('::'))
    .digest('hex')
}

function hashRequest({ requestId, hospitalId, bloodBankId, bloodType, units, status }) {
  return createHash('sha256')
    .update([requestId, hospitalId, bloodBankId, bloodType, String(units), status].join('::'))
    .digest('hex')
}

/* ── GET /api/blockchain/verify/:id?type=donation|request ── */
export const verifyRecord = async (req, res) => {
  const { type = 'donation' } = req.query
  const { id } = req.params

  if (!['donation', 'request'].includes(type)) {
    return res.status(400).json({ success: false, message: 'type must be "donation" or "request"' })
  }

  try {
    if (type === 'donation') {
      const dbRecord = await Donation.findById(id)
        .populate('donorId',    'userId fullName')
        .populate('bloodBankId','userId organizationName fullName')

      if (!dbRecord) return res.status(404).json({ success: false, message: 'Donation not found' })

      if (!dbRecord.txHash) {
        return res.json({
          success: true, verified: false,
          reason: 'no_chain_record',
          message: 'This record has not been written to the blockchain yet.',
          discrepancies: [],
        })
      }

      const onChain = await blockchainService.getDonation(id)

      if (!onChain || !onChain.exists) {
        return res.json({
          success: true, verified: false,
          reason: 'not_found_on_chain',
          message: 'Record not found on the blockchain.',
          discrepancies: ['Record ID not present in smart contract'],
        })
      }

      const discrepancies = []
      const dbDonorId     = (dbRecord.donorId?._id || dbRecord.donorId)?.toString()
      const dbBloodBankId = (dbRecord.bloodBankId?._id || dbRecord.bloodBankId)?.toString()

      // Primary check: SHA-256 hash of all key fields (catches any field change)
      if (dbRecord.blockchainHash) {
        const currentHash = hashDonation({
          donationId:  id,
          donorId:     dbDonorId,
          bloodBankId: dbBloodBankId,
          bloodType:   dbRecord.bloodType,
          units:       dbRecord.units,
          status:      dbRecord.status,
        })
        if (currentHash !== dbRecord.blockchainHash) {
          discrepancies.push(`Data integrity hash mismatch — one or more fields have been altered since this record was anchored to the blockchain`)
        }
      } else {
        // Fallback for old records: compare individual fields from blockchain
        if (onChain.bloodType   !== dbRecord.bloodType)                    discrepancies.push(`Blood type — database: "${dbRecord.bloodType}", chain: "${onChain.bloodType}"`)
        if (Number(onChain.units) !== Number(dbRecord.units))              discrepancies.push(`Units — database: ${dbRecord.units}, chain: ${Number(onChain.units)}`)
        if (onChain.status      !== dbRecord.status)                       discrepancies.push(`Status — database: "${dbRecord.status}", chain: "${onChain.status}"`)
        if (onChain.donorId     !== dbDonorId)                             discrepancies.push(`Donor ID mismatch — record may have been re-assigned`)
        if (onChain.bloodBankId !== dbBloodBankId)                         discrepancies.push(`Blood bank ID mismatch — record may have been re-assigned`)
      }

      return res.json({
        success:      true,
        verified:     discrepancies.length === 0,
        type:         'donation',
        recordId:     id,
        txHash:       dbRecord.txHash,
        blockNumber:  dbRecord.blockNumber,
        checkedFields: dbRecord.blockchainHash
          ? ['bloodType', 'units', 'status', 'donorId', 'bloodBankId', 'blockchainHash']
          : ['bloodType', 'units', 'status', 'donorId', 'bloodBankId'],
        discrepancies,
      })
    }

    /* ── request ── */
    const dbRecord = await BloodRequest.findById(id)
      .populate('hospitalId', 'userId organizationName fullName')
      .populate('bloodBankId','userId organizationName fullName')

    if (!dbRecord) return res.status(404).json({ success: false, message: 'Blood request not found' })

    if (!dbRecord.txHash) {
      return res.json({
        success: true, verified: false,
        reason: 'no_chain_record',
        message: 'This record has not been written to the blockchain yet.',
        discrepancies: [],
      })
    }

    const onChain = await blockchainService.getRequest(id)

    if (!onChain || !onChain.exists) {
      return res.json({
        success: true, verified: false,
        reason: 'not_found_on_chain',
        message: 'Record not found on the blockchain.',
        discrepancies: ['Record ID not present in smart contract'],
      })
    }

    const discrepancies  = []
    const dbHospitalId  = (dbRecord.hospitalId?._id  || dbRecord.hospitalId)?.toString()
    const dbBloodBankId = (dbRecord.bloodBankId?._id || dbRecord.bloodBankId)?.toString()

    // Primary check: SHA-256 hash of all key fields
    if (dbRecord.blockchainHash) {
      const currentHash = hashRequest({
        requestId:   id,
        hospitalId:  dbHospitalId,
        bloodBankId: dbBloodBankId,
        bloodType:   dbRecord.bloodType,
        units:       dbRecord.units,
        status:      dbRecord.status,
      })
      if (currentHash !== dbRecord.blockchainHash) {
        discrepancies.push(`Data integrity hash mismatch — one or more fields have been altered since this record was anchored to the blockchain`)
      }
    } else {
      // Fallback for old records: compare individual fields from blockchain
      if (onChain.bloodType   !== dbRecord.bloodType)                    discrepancies.push(`Blood type — database: "${dbRecord.bloodType}", chain: "${onChain.bloodType}"`)
      if (Number(onChain.units) !== Number(dbRecord.units))              discrepancies.push(`Units — database: ${dbRecord.units}, chain: ${Number(onChain.units)}`)
      if (onChain.status      !== dbRecord.status)                       discrepancies.push(`Status — database: "${dbRecord.status}", chain: "${onChain.status}"`)
      if (onChain.hospitalId  !== dbHospitalId)                          discrepancies.push(`Hospital ID mismatch — record may have been re-assigned`)
      if (onChain.bloodBankId !== dbBloodBankId)                         discrepancies.push(`Blood bank ID mismatch — record may have been re-assigned`)
    }

    return res.json({
      success:      true,
      verified:     discrepancies.length === 0,
      type:         'request',
      recordId:     id,
      txHash:       dbRecord.txHash,
      blockNumber:  dbRecord.blockNumber,
      checkedFields: dbRecord.blockchainHash
        ? ['bloodType', 'units', 'status', 'hospitalId', 'bloodBankId', 'blockchainHash']
        : ['bloodType', 'units', 'status', 'hospitalId', 'bloodBankId'],
      discrepancies,
    })

  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
