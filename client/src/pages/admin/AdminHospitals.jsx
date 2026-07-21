import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { Spinner, Alert, Badge } from '@/components/ui'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const EMPTY_FORM = { fullName: '', organizationName: '', email: '', password: '', phone: '', licenseNumber: '', state: '' }

export default function AdminHospitals() {
  const [hospitals, setHospitals] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')
  const [search,    setSearch]    = useState('')
  const [updating,  setUpdating]  = useState(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    adminService.getHospitals()
      .then(d => setHospitals(d.hospitals))
      .catch(() => setError('Could not load hospitals — start the backend server.'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdate = async (id, patch) => {
    setUpdating(id); setError(''); setSuccess('')
    try {
      const res = await adminService.updateHospital(id, patch)
      setHospitals(prev => prev.map(h => h._id === id ? { ...h, ...res.hospital } : h))
      setSuccess('Hospital updated.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed.')
    } finally {
      setUpdating(null)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const res = await adminService.createHospital(form)
      setHospitals(prev => [res.hospital, ...prev])
      setSuccess(`Hospital "${res.hospital.organizationName}" created. Verify it to grant full access.`)
      setShowAdd(false)
      setForm(EMPTY_FORM)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create hospital.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = hospitals.filter(h =>
    `${h.organizationName || ''} ${h.fullName || ''} ${h.email || ''} ${h.userId || ''} ${h.state || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const pendingCount = hospitals.filter(h => !h.isVerified).length

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>
  )

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Hospitals</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{hospitals.length} registered · {pendingCount} pending verification</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setError('') }}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Hospital
        </button>
      </div>

      {error   && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="max-w-sm">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            placeholder="Search by name, email, ID, state…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                {['Hospital', 'License No.', 'State', 'Phone', 'Verified', 'Active', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-neutral-400 text-sm">
                    {search ? `No hospitals matching "${search}"` : 'No hospitals registered yet.'}
                  </td>
                </tr>
              ) : filtered.map(h => (
                <tr key={h._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-neutral-900">{h.organizationName || h.fullName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">{h.userId}</span>
                        <span className="text-xs text-neutral-400 truncate max-w-[160px]">{h.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono text-neutral-600">{h.licenseNumber || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-neutral-500">{h.state || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-neutral-500 whitespace-nowrap">{h.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={h.isVerified ? 'success' : 'warning'} size="sm">{h.isVerified ? 'Verified' : 'Pending'}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={h.isActive !== false ? 'success' : 'danger'} size="sm">{h.isActive !== false ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-neutral-400 whitespace-nowrap">{fmtDate(h.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {!h.isVerified && (
                        <button
                          onClick={() => handleUpdate(h._id, { isVerified: true })}
                          disabled={updating === h._id}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {updating === h._id ? '…' : 'Verify'}
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdate(h._id, { isActive: h.isActive === false })}
                        disabled={updating === h._id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap border ${
                          h.isActive !== false
                            ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {h.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Hospital Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Add Hospital</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Account will be created unverified — verify manually after review.</p>
              </div>
              <button onClick={() => { setShowAdd(false); setError('') }} className="text-neutral-400 hover:text-neutral-700 text-xl font-light">×</button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Contact Name *" value={form.fullName} onChange={v => setForm(f => ({...f, fullName: v}))} placeholder="Dr. Ngozi Adeyemi" required />
                <Field label="Hospital Name *" value={form.organizationName} onChange={v => setForm(f => ({...f, organizationName: v}))} placeholder="Lagos Island Hospital" required />
                <Field label="Email *" type="email" value={form.email} onChange={v => setForm(f => ({...f, email: v}))} placeholder="admin@hospital.gov.ng" required />
                <Field label="Password *" type="password" value={form.password} onChange={v => setForm(f => ({...f, password: v}))} placeholder="Min 8 characters" required />
                <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({...f, phone: v}))} placeholder="+234 801 234 5678" />
                <Field label="License No." value={form.licenseNumber} onChange={v => setForm(f => ({...f, licenseNumber: v}))} placeholder="HSP-2024-001" />
              </div>
              <Field label="State" value={form.state} onChange={v => setForm(f => ({...f, state: v}))} placeholder="Lagos" />

              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-blue-500 flex-shrink-0 mt-0.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6.5"/><path d="M8 7v4M8 5.5v.5"/>
                </svg>
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-semibold">Share login details with the hospital.</span>{' '}
                  After creating this account, send them their email address and the password you set above — they will use these to log in to their portal.
                </p>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowAdd(false); setError('') }} className="flex-1 py-2.5 text-sm font-semibold border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl transition-colors">
                  {saving ? 'Creating…' : 'Create Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
      />
    </div>
  )
}

function SearchIcon({ className }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <circle cx="7" cy="7" r="5.5"/><path d="M11 11l3 3"/>
    </svg>
  )
}
