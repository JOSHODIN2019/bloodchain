import mongoose from 'mongoose'

const bloodRequestSchema = new mongoose.Schema(
  {
    hospitalId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bloodBankId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bloodType:     { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
    units:         { type: Number, required: true, min: 1, max: 50 },
    priority:      { type: String, enum: ['urgent','high','normal','low'], default: 'normal' },
    status:        { type: String, enum: ['pending','processing','fulfilled','rejected','cancelled'], default: 'pending' },
    notes:         { type: String, trim: true },
    responseNotes: { type: String, trim: true },
    fulfilledAt:   { type: Date },
    txHash:        { type: String },
    blockchainHash:{ type: String },
    blockNumber:   { type: Number },
  },
  { timestamps: true }
)

bloodRequestSchema.index({ bloodBankId: 1, status: 1, createdAt: -1 })
bloodRequestSchema.index({ hospitalId: 1, createdAt: -1 })

export default mongoose.model('BloodRequest', bloodRequestSchema)
