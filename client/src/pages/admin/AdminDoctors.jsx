import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { Spinner, Alert, Badge } from '@/components/ui'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const EMPTY_FORM = { fullName: '', organizationName: '', email: '', password: '', phone: '', licenseNumber: '', state: '' }

export default function AdminDoctors() {
  const [banks,    setBanks]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [search,   setSearch]   = useState('')
  const [updating, setUpdating] = useState(null)
  const [showAdd,  setShowAdd]  = useState(false)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    adminService.getDoctors()
      .then(d => setBanks(d.doctors))
      .catch(() => setError('Could not load blood banks — start the backend server.'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdate = async (id, patch) => {
    setUpdating(id); setError(''); setSuccess('')
    try {
      const res = await adminService.updateBloodBank(id, patch)
      setBanks(prev => prev.map(b => b._id === id ? { ...b, ...res.doctor } : b))
      setSuccess('Blood bank updated.')
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
      const res = await adminService.createBloodBank(form)
      setBanks(prev => [res.doctor, ...prev])
      setSuccess(`Blood bank "${res.doctor.organizationName}" created. Verify it to grant full access.`)
      setShowAdd(false)
      setForm(EMPTY_FORM)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create blood bank.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = banks.filter(b =>
    `${b.organizationName || ''} ${b.fullName || ''} ${b.email || ''} ${b.userId || ''} ${b.state || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const pendingCount = banks.filter(b => !b.isVerified).length

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>
  )

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Blood Banks</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{banks.length} registered · {pendingCount} pending verification</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setError('') }}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Blood Bank
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
                {['Blood Bank', 'License No.', 'State', 'Phone', 'Verified', 'Active', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-neutral-400 text-sm">
                    {search ? `No blood banks matching "${search}"` : 'No blood banks registered yet.'}
                  </td>
                </tr>
              ) : filtered.map(b => (
                <tr key={b._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-neutral-900">{b.organizationName || b.fullName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">{b.userId}</span>
                        <span className="text-xs text-neutral-400 truncate max-w-[160px]">{b.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono text-neutral-600">{b.licenseNumber || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-neutral-500">{b.state || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-neutral-500 whitespace-nowrap">{b.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={b.isVerified ? 'success' : 'warning'} size="sm">{b.isVerified ? 'Verified' : 'Pending'}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={b.isActive !== false ? 'success' : 'danger'} size="sm">{b.isActive !== false ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-neutral-400 whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {!b.isVerified && (
                        <button
                          onClick={() => handleUpdate(b._id, { isVerified: true })}
                          disabled={updating === b._id}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {updating === b._id ? '…' : 'Verify'}
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdate(b._id, { isActive: b.isActive === false })}
                        disabled={updating === b._id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap border ${
                          b.isActive !== false
                            ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {b.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Blood Bank Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Add Blood Bank</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Account will be created unverified — verify manually after review.</p>
              </div>
              <button onClick={() => { setShowAdd(false); setError('') }} className="text-neutral-400 hover:text-neutral-700 text-xl font-light">×</button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Contact Name *" value={form.fullName} onChange={v => setForm(f => ({...f, fullName: v}))} placeholder="Dr. Amina Kolo" required />
                <Field label="Organisation Name *" value={form.organizationName} onChange={v => setForm(f => ({...f, organizationName: v}))} placeholder="LUTH Blood Bank" required />
                <Field label="Email *" type="email" value={form.email} onChange={v => setForm(f => ({...f, email: v}))} placeholder="blood@hospital.com" required />
                <Field label="Password *" type="password" value={form.password} onChange={v => setForm(f => ({...f, password: v}))} placeholder="Min 8 characters" required />
                <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({...f, phone: v}))} placeholder="+234 801 234 5678" />
                <Field label="License No." value={form.licenseNumber} onChange={v => setForm(f => ({...f, licenseNumber: v}))} placeholder="BBK-2024-001" />
              </div>
              <Field label="State" value={form.state} onChange={v => setForm(f => ({...f, state: v}))} placeholder="Lagos" />

              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-blue-500 flex-shrink-0 mt-0.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6.5"/><path d="M8 7v4M8 5.5v.5"/>
                </svg>
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-semibold">Share login details with the blood bank.</span>{' '}
                  After creating this account, send them their email address and the password you set above — they will use these to log in to their portal.
                </p>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowAdd(false); setError('') }} className="flex-1 py-2.5 text-sm font-semibold border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl transition-colors">
                  {saving ? 'Creating…' : 'Create Blood Bank'}
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
