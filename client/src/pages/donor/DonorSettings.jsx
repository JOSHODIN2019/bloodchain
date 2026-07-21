import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { donorService } from '@/services/donorService'
import { Spinner, Alert, Input } from '@/components/ui'

export default function DonorSettings() {
  const { user, updateUser }    = useAuth()
  const [form,    setForm]      = useState({ fullName: '', phone: '', dateOfBirth: '' })
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [error,   setError]     = useState('')
  const [success, setSuccess]   = useState('')

  useEffect(() => {
    donorService.getProfile()
      .then(r => {
        const u = r.user
        setForm({
          fullName:    u.fullName    || '',
          phone:       u.phone       || '',
          dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split('T')[0] : '',
        })
      })
      .catch(() => setError('Could not load profile.'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) return setError('Full name is required.')
    setSaving(true)
    setError('')
    try {
      const res = await donorService.updateProfile(form)
      setSuccess('Profile updated successfully.')
      updateUser(res.user)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Profile Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your donor profile information</p>
      </div>

      {/* Read-only donor card */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {user?.bloodType || '?'}
        </div>
        <div>
          <p className="text-white font-bold text-base">{user?.fullName}</p>
          <p className="text-red-100 text-sm">{user?.email}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded">{user?.userId}</span>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded">Blood Type: {user?.bloodType || '—'}</span>
          </div>
        </div>
      </div>

      {error   && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-5">
        <p className="text-sm font-bold text-neutral-800">Personal Information</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-600">Full Name *</label>
            <input
              type="text"
              value={form.fullName}
              onChange={handleChange('fullName')}
              required
              placeholder="Your full name"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-600">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange('phone')}
              placeholder="+234 800 000 0000"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-600">Date of Birth</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={handleChange('dateOfBirth')}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-600">Blood Type</label>
            <div className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-neutral-50 text-neutral-500 flex items-center gap-2">
              <span className="font-bold text-red-600">{user?.bloodType || '—'}</span>
              <span className="text-neutral-400">· Set at registration (contact admin to change)</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Read-only account info */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
        <p className="text-sm font-bold text-neutral-800">Account Information</p>
        <div className="space-y-3">
          {[
            { label: 'Email Address', value: user?.email,     note: 'Contact admin to change email' },
            { label: 'Donor ID',      value: user?.userId,    mono: true },
            { label: 'Account Status',value: user?.isActive ? 'Active' : 'Inactive' },
            { label: 'Verified',      value: user?.isVerified ? 'Yes' : 'Pending verification' },
          ].map(({ label, value, note, mono }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-neutral-50 last:border-0">
              <div>
                <p className="text-xs font-semibold text-neutral-500">{label}</p>
                {note && <p className="text-[10px] text-neutral-400">{note}</p>}
              </div>
              <p className={`text-sm text-neutral-800 ${mono ? 'font-mono bg-neutral-100 px-2 py-0.5 rounded text-xs' : 'font-semibold'}`}>
                {value || '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-200 rounded-2xl p-6">
        <p className="text-sm font-bold text-red-700 mb-1">Danger Zone</p>
        <p className="text-xs text-neutral-500 mb-4">These actions are irreversible. Please be sure before proceeding.</p>
        <button
          type="button"
          className="border border-red-300 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
          onClick={() => alert('Please contact the administrator to deactivate your account.')}
        >
          Deactivate Account
        </button>
      </div>
    </div>
  )
}
