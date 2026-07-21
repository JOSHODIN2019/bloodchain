import mongoose from 'mongoose'

const donationSchema = new mongoose.Schema(
  {
    donorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    bloodType: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
    units:     { type: Number, default: 1, min: 1, max: 5 },

    status: {
      type: String,
      enum: ['intent', 'confirmed', 'rejected', 'cancelled'],
      default: 'intent',
    },

    donationDate:  { type: Date },
    confirmedAt:   { type: Date },
    confirmedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedReason:{ type: String },
    notes:         { type: String, trim: true },

    // Blockchain
    blockchainHash: { type: String },
    txHash:         { type: String },
    blockNumber:    { type: Number },
  },
  { timestamps: true }
)

donationSchema.index({ donorId: 1, createdAt: -1 })
donationSchema.index({ bloodBankId: 1, status: 1 })

export default mongoose.model('Donation', donationSchema)
