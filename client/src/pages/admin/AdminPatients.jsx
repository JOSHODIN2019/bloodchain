import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { Spinner, Alert, Badge } from '@/components/ui'

const BT_COLOR = {
  'A+': 'bg-red-100 text-red-700', 'A-': 'bg-red-50 text-red-600',
  'B+': 'bg-orange-100 text-orange-700', 'B-': 'bg-orange-50 text-orange-600',
  'AB+': 'bg-purple-100 text-purple-700', 'AB-': 'bg-purple-50 text-purple-600',
  'O+': 'bg-emerald-100 text-emerald-700', 'O-': 'bg-emerald-50 text-emerald-600',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminPatients() {
  const [donors,  setDonors]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    adminService.getPatients()
      .then(d => setDonors(d.patients))
      .catch(() => setError('Could not load donors — start the backend server.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = donors.filter(d =>
    `${d.fullName || ''} ${d.email || ''} ${d.userId || ''} ${d.bloodType || ''} ${d.phone || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>
  )

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Donors</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{donors.length} registered donor{donors.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      <div className="max-w-sm">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            placeholder="Search by name, email, ID, blood type…"
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
                {['Donor', 'Donor ID', 'Blood Type', 'Phone', 'Joined', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-neutral-400 text-sm">
                    {search ? `No donors matching "${search}"` : 'No donors registered yet.'}
                  </td>
                </tr>
              ) : filtered.map(d => (
                <tr key={d._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-neutral-900">{d.fullName}</p>
                      <p className="text-xs text-neutral-400">{d.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded">{d.userId}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {d.bloodType ? (
                      <span className={`font-bold text-sm px-2.5 py-1 rounded-lg ${BT_COLOR[d.bloodType] || 'bg-neutral-100 text-neutral-700'}`}>
                        {d.bloodType}
                      </span>
                    ) : <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-neutral-500 whitespace-nowrap">{d.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-neutral-400 whitespace-nowrap">{fmtDate(d.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={d.isActive !== false ? 'success' : 'danger'} size="sm">
                      {d.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
