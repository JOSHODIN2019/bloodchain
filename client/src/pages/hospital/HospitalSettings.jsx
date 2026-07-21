import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { hospitalService } from '@/services/hospitalService'
import { Alert } from '@/components/ui'

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Abuja','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
]

export default function HospitalSettings() {
  const { user, updateUser } = useAuth()

  const [form,    setForm]    = useState({ organizationName: '', phone: '', address: '', state: '' })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hospitalService.getProfile()
        const u   = res.user
        setForm({
          organizationName: u.organizationName || '',
          phone:            u.phone            || '',
          address:          u.address          || '',
          state:            u.state            || '',
        })
      } catch {
        setError('Could not load profile.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await hospitalService.updateProfile(form)
      updateUser(res.user)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const initials = (user?.organizationName || user?.fullName || 'H')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your hospital profile and account details</p>
      </div>

      {error   && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Profile card */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-lg leading-tight truncate">{user?.organizationName || user?.fullName}</p>
            <p className="text-blue-100 text-sm mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg font-mono">{user?.userId}</span>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg">Hospital</span>
              {user?.state && <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg">{user.state}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
        <div className="px-6 py-4">
          <h2 className="text-sm font-bold text-neutral-900">Organisation Details</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Update your hospital's public information</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700">Organisation Name</label>
            <input
              type="text"
              value={form.organizationName}
              onChange={handleChange('organizationName')}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange('phone')}
              placeholder="+234 800 000 0000"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700">Address</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={handleChange('address')}
              placeholder="Full address including street and LGA"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700">State</label>
            <select
              value={form.state}
              onChange={handleChange('state')}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            >
              <option value="">— Select State —</option>
              {NIGERIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-6 py-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
        <div className="px-6 py-4">
          <h2 className="text-sm font-bold text-neutral-900">Account Information</h2>
          <p className="text-xs text-neutral-400 mt-0.5">System-managed fields — contact admin to change</p>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Email',       value: user?.email },
            { label: 'Hospital ID', value: user?.userId },
            { label: 'License No.', value: user?.licenseNumber || '—' },
            { label: 'Status',      value: user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : '—' },
            { label: 'Verified',    value: user?.isVerified ? 'Yes' : 'Pending' },
            { label: 'Joined',      value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'}) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-medium text-neutral-800 break-all">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
