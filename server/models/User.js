import mongoose from 'mongoose'
import { hash, compare } from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    fullName:      { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true, minlength: 8, select: false },
    role:          { type: String, enum: ['donor', 'bloodbank', 'hospital', 'admin'], default: 'donor' },
    phone:         { type: String, trim: true },
    dateOfBirth:   { type: Date },
    walletAddress: { type: String, lowercase: true, trim: true },
    userId:        { type: String, unique: true },  // DON-XXXXXX / BBK-XXXXXX / HSP-XXXXXX / ADM-XXXXXX
    isActive:      { type: Boolean, default: true },
    isVerified:    { type: Boolean, default: false },

    // Donor-specific
    bloodType:         { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
    lastDonationDate:  { type: Date },
    totalDonations:    { type: Number, default: 0 },

    // Blood Bank / Hospital specific
    organizationName:  { type: String },
    licenseNumber:     { type: String },
    address:           { type: String },
    state:             { type: String },
  },
  { timestamps: true }
)

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 12)
  }

  if (!this.userId) {
    const prefixMap = { donor: 'DON', bloodbank: 'BBK', hospital: 'HSP', admin: 'ADM' }
    const prefix = prefixMap[this.role] ?? 'USR'
    const suffix = Math.floor(100000 + Math.random() * 900000)
    this.userId = `${prefix}-${suffix}`
  }
})

userSchema.methods.comparePassword = async function (candidate) {
  return compare(candidate, this.password)
}

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export default mongoose.model('User', userSchema)
