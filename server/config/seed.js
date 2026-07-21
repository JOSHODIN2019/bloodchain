import User from '../models/User.js'
import AuditLog from '../models/AuditLog.js'

const DEMO_BLOOD_BANKS = [
  { fullName: 'LUTH Blood Bank',      email: 'luth@bloodbank.com',  password: 'BloodBank@123', organizationName: 'Lagos University Teaching Hospital Blood Bank', state: 'Lagos',  licenseNumber: 'BBK-2019-001' },
  { fullName: 'UCH Blood Centre',     email: 'uch@bloodbank.com',   password: 'BloodBank@123', organizationName: 'University College Hospital Blood Centre',      state: 'Oyo',    licenseNumber: 'BBK-2018-002' },
  { fullName: 'ABUTH Blood Services', email: 'abuth@bloodbank.com', password: 'BloodBank@123', organizationName: 'Ahmadu Bello University Blood Services',        state: 'Kaduna', licenseNumber: 'BBK-2020-003' },
]

const DEMO_HOSPITALS = [
  { fullName: 'National Hospital Abuja', email: 'nha@hospital.com',   password: 'Hospital@123', organizationName: 'National Hospital Abuja',              state: 'Abuja',  licenseNumber: 'HSP-2019-001' },
  { fullName: 'Lagos Island Hospital',   email: 'lih@hospital.com',   password: 'Hospital@123', organizationName: 'Lagos Island General Hospital',         state: 'Lagos',  licenseNumber: 'HSP-2018-002' },
  { fullName: 'UNTH Enugu',              email: 'unth@hospital.com',  password: 'Hospital@123', organizationName: 'University of Nigeria Teaching Hospital', state: 'Enugu',  licenseNumber: 'HSP-2020-003' },
]

const DEMO_DONORS = [
  { fullName: 'Chidi Okonkwo',    email: 'chidi@donor.com',    password: 'Donor@12345', phone: '+2348031234567', dateOfBirth: new Date('1992-05-14'), bloodType: 'O+' },
  { fullName: 'Amaka Eze',        email: 'amaka@donor.com',    password: 'Donor@12345', phone: '+2348041234567', dateOfBirth: new Date('1988-11-02'), bloodType: 'A+' },
  { fullName: 'Musa Abdullahi',   email: 'musa@donor.com',     password: 'Donor@12345', phone: '+2348051234567', dateOfBirth: new Date('1995-07-20'), bloodType: 'B+' },
  { fullName: 'Ngozi Adeyemi',    email: 'ngozi@donor.com',    password: 'Donor@12345', phone: '+2348061234567', dateOfBirth: new Date('1990-03-08'), bloodType: 'AB+' },
  { fullName: 'Tunde Bakare',     email: 'tunde@donor.com',    password: 'Donor@12345', phone: '+2348071234567', dateOfBirth: new Date('1985-09-25'), bloodType: 'O-' },
]

export const seedAdmin = async () => {
  try {
    /* Admin */
    const adminExists = await User.findOne({ role: 'admin' })
    if (!adminExists) {
      await User.create({ fullName: 'System Administrator', email: 'admin@bloodchain.com', password: 'Admin@12345', role: 'admin', isVerified: true, isActive: true })
      console.log('✅ Admin seeded — admin@bloodchain.com / Admin@12345')
    }

    /* Demo blood banks */
    for (const bb of DEMO_BLOOD_BANKS) {
      const exists = await User.findOne({ email: bb.email })
      if (!exists) {
        await User.create({ ...bb, role: 'bloodbank', isVerified: true, isActive: true })
      }
    }

    /* Demo hospitals */
    for (const h of DEMO_HOSPITALS) {
      const exists = await User.findOne({ email: h.email })
      if (!exists) {
        await User.create({ ...h, role: 'hospital', isVerified: true, isActive: true })
      }
    }

    /* Demo donors */
    for (const d of DEMO_DONORS) {
      const exists = await User.findOne({ email: d.email })
      if (!exists) {
        await User.create({ ...d, role: 'donor', isVerified: true, isActive: true })
      }
    }

    /* Seed sample audit logs */
    const auditCount = await AuditLog.countDocuments()
    if (auditCount === 0) {
      const admin = await User.findOne({ role: 'admin' })
      const chidi = await User.findOne({ email: 'chidi@donor.com' })

      const sampleLogs = [
        { userId: admin?._id,  action: 'USER_LOGIN',        category: 'auth',  userEmail: 'admin@bloodchain.com', userRole: 'admin', status: 'success', details: {} },
        { userId: admin?._id,  action: 'BLOOD_BANK_CREATED',category: 'admin', userEmail: 'admin@bloodchain.com', userRole: 'admin', status: 'success', details: { email: 'luth@bloodbank.com' } },
        { userId: chidi?._id,  action: 'USER_REGISTERED',   category: 'auth',  userEmail: 'chidi@donor.com',      userRole: 'donor', status: 'success', details: { bloodType: 'O+' } },
        { userId: chidi?._id,  action: 'USER_LOGIN',        category: 'auth',  userEmail: 'chidi@donor.com',      userRole: 'donor', status: 'success', details: {} },
      ]
      await AuditLog.insertMany(sampleLogs)
      console.log('✅ Demo audit logs seeded')
    }

    console.log('✅ BloodChain demo data seeded')
  } catch (err) {
    console.error('Seed error:', err.message)
  }
}
