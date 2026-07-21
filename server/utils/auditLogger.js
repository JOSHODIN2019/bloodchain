import AuditLog from '../models/AuditLog.js'

export const log = async ({ action, category, user, details = {}, txHash, req, status = 'success' }) => {
  try {
    await AuditLog.create({
      action,
      category,
      userId:    user?._id,
      userEmail: user?.email,
      userRole:  user?.role,
      details,
      txHash,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
      status,
    })
  } catch (err) {
    console.error('Audit log error:', err.message)
  }
}
