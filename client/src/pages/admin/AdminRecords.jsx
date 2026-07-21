import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { Spinner, Alert, Badge } from '@/components/ui'

const DONATION_STATUS_TABS = ['all', 'intent', 'confirmed', 'rejected', 'cancelled']
const REQUEST_STATUS_TABS  = ['all', 'pending', 'processing', 'fulfilled', 'rejected', 'cancelled']

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  normal: 'bg-neutral-100 text-neutral-600',
  low:    'bg-blue-50 text-blue-600',
}

function statusVariant(s) {
  return {
    intent:    'warning',
    confirmed: 'success',
    fulfilled: 'success',
    rejected:  'danger',
    cancelled: 'neutral',
    pending:   'warning',
    processing:'info',
  }[s] || 'neutral'
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminRecords() {
  const [tab, setTab] = useState('donations')

  const [donations,  setDonations]  = useState([])
  const [requests,   setRequests]   = useState([])
  const [dTotal,     setDTotal]     = useState(0)
  const [rTotal,     setRTotal]     = useState(0)
  const [dStatus,    setDStatus]    = useState('all')
  const [rStatus,    setRStatus]    = useState('all')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [d, r] = await Promise.all([
          adminService.getAllDonations(),
          adminService.getAllRequests(),
        ])
        setDonations(d.donations); setDTotal(d.total)
        setRequests(r.requests);   setRTotal(r.total)
      } catch {
        setError('Could not load records — start the backend server.')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  const filteredDonations = dStatus === 'all' ? donations : donations.filter(d => d.status === dStatus)
  const filteredRequests  = rStatus === 'all' ? requests  : requests.filter(r => r.status === rStatus)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>
  )

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Records</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{dTotal} donations · {rTotal} blood requests system-wide</p>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      {/* Top-level tab */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
        {[
          { key: 'donations', label: `Donations (${dTotal})` },
          { key: 'requests',  label: `Blood Requests (${rTotal})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'donations' && (
        <>
          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {DONATION_STATUS_TABS.map(s => (
              <button
                key={s}
                onClick={() => setDStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  dStatus === s
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {s === 'all' ? `All (${dTotal})` : s}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    {['Donor', 'Blood Bank', 'Blood Type', 'Units', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDonations.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-neutral-400 text-sm">No donations found.</td></tr>
                  ) : filteredDonations.map(d => (
                    <tr key={d._id} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-neutral-900">{d.donorId?.fullName || '—'}</p>
                        <span className="text-[11px] font-mono text-neutral-400">{d.donorId?.userId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-neutral-700">{d.bloodBankId?.organizationName || d.bloodBankId?.fullName || '—'}</p>
                        <span className="text-[11px] font-mono text-neutral-400">{d.bloodBankId?.userId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-red-600">{d.bloodType}</span>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-700 tabular-nums">{d.units}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={statusVariant(d.status)} size="sm">{d.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-neutral-400 whitespace-nowrap">{fmtDate(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'requests' && (
        <>
          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {REQUEST_STATUS_TABS.map(s => (
              <button
                key={s}
                onClick={() => setRStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  rStatus === s
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {s === 'all' ? `All (${rTotal})` : s}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    {['Hospital', 'Blood Bank', 'Blood Type', 'Units', 'Priority', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-neutral-400 text-sm">No blood requests found.</td></tr>
                  ) : filteredRequests.map(r => (
                    <tr key={r._id} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-neutral-900">{r.hospitalId?.organizationName || r.hospitalId?.fullName || '—'}</p>
                        <span className="text-[11px] font-mono text-neutral-400">{r.hospitalId?.userId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-neutral-700">{r.bloodBankId?.organizationName || r.bloodBankId?.fullName || '—'}</p>
                        <span className="text-[11px] font-mono text-neutral-400">{r.bloodBankId?.userId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-red-600">{r.bloodType}</span>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-700 tabular-nums">{r.units}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg capitalize ${PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.normal}`}>
                          {r.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={statusVariant(r.status)} size="sm">{r.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-neutral-400 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
