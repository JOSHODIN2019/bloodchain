import Donation     from '../models/Donation.js'
import BloodRequest  from '../models/BloodRequest.js'
import { blockchainService } from '../services/blockchainService.js'

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
      const dbBloodType   = dbRecord.bloodType
      const dbUnits       = dbRecord.units
      const dbStatus      = dbRecord.status
      const dbDonorId     = (dbRecord.donorId?._id || dbRecord.donorId)?.toString()
      const dbBloodBankId = (dbRecord.bloodBankId?._id || dbRecord.bloodBankId)?.toString()

      if (onChain.bloodType  !== dbBloodType)           discrepancies.push(`Blood type — database: "${dbBloodType}", chain: "${onChain.bloodType}"`)
      if (Number(onChain.units) !== Number(dbUnits))    discrepancies.push(`Units — database: ${dbUnits}, chain: ${Number(onChain.units)}`)
      if (onChain.status     !== dbStatus)              discrepancies.push(`Status — database: "${dbStatus}", chain: "${onChain.status}"`)
      if (onChain.donorId    !== dbDonorId)             discrepancies.push(`Donor ID mismatch — record may have been re-assigned`)
      if (onChain.bloodBankId !== dbBloodBankId)        discrepancies.push(`Blood bank ID mismatch — record may have been re-assigned`)

      return res.json({
        success:      true,
        verified:     discrepancies.length === 0,
        type:         'donation',
        recordId:     id,
        txHash:       dbRecord.txHash,
        blockNumber:  dbRecord.blockNumber,
        checkedFields: ['bloodType', 'units', 'status', 'donorId', 'bloodBankId'],
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

    const discrepancies = []
    const dbBloodType   = dbRecord.bloodType
    const dbUnits       = dbRecord.units
    const dbStatus      = dbRecord.status
    const dbHospitalId  = (dbRecord.hospitalId?._id || dbRecord.hospitalId)?.toString()
    const dbBloodBankId = (dbRecord.bloodBankId?._id || dbRecord.bloodBankId)?.toString()

    if (onChain.bloodType   !== dbBloodType)            discrepancies.push(`Blood type — database: "${dbBloodType}", chain: "${onChain.bloodType}"`)
    if (Number(onChain.units) !== Number(dbUnits))      discrepancies.push(`Units — database: ${dbUnits}, chain: ${Number(onChain.units)}`)
    if (onChain.status      !== dbStatus)               discrepancies.push(`Status — database: "${dbStatus}", chain: "${onChain.status}"`)
    if (onChain.hospitalId  !== dbHospitalId)           discrepancies.push(`Hospital ID mismatch — record may have been re-assigned`)
    if (onChain.bloodBankId !== dbBloodBankId)          discrepancies.push(`Blood bank ID mismatch — record may have been re-assigned`)

    return res.json({
      success:      true,
      verified:     discrepancies.length === 0,
      type:         'request',
      recordId:     id,
      txHash:       dbRecord.txHash,
      blockNumber:  dbRecord.blockNumber,
      checkedFields: ['bloodType', 'units', 'status', 'hospitalId', 'bloodBankId'],
      discrepancies,
    })

  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
