import mongoose from 'mongoose'

const bloodInventorySchema = new mongoose.Schema(
  {
    bloodBankId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bloodType:    { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
    units:        { type: Number, default: 0, min: 0 },
    minimumLevel: { type: Number, default: 5 },
    lastUpdated:  { type: Date, default: Date.now },
  },
  { timestamps: true }
)

bloodInventorySchema.index({ bloodBankId: 1, bloodType: 1 }, { unique: true })

export default mongoose.model('BloodInventory', bloodInventorySchema)
