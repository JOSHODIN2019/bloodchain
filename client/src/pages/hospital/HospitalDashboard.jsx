import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { hospitalService } from '@/services/hospitalService'
import { Spinner, Alert, Badge } from '@/components/ui'

export default function HospitalDashboard() {
  const { user }                = useAuth()
  const navigate                = useNavigate()
  const [stats,    setStats]    = useState(null)
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r] = await Promise.all([
          hospitalService.getStats(),
          hospitalService.getRequests(),
        ])
        setStats(s.stats)
        setRequests(r.requests)
      } catch {
        setError('Could not reach the server. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">Loading hospital data…</p>
        </div>
      </div>
    )
  }

  const orgName = user?.organizationName || user?.fullName

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Hospital Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{orgName} · {user?.state}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg">{user?.userId}</span>
          <Badge variant="info">Verified</Badge>
        </div>
      </div>

      {error && <Alert variant="warning" title="Server offline">{error}</Alert>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Requests',    value: stats?.activeRequests    ?? 0, icon: <ActiveIcon />,     bg: 'bg-blue-50',    ib: 'bg-blue-100',    tc: 'text-blue-600'    },
          { label: 'Fulfilled Requests', value: stats?.fulfilledRequests ?? 0, icon: <CheckStat />,      bg: 'bg-emerald-50', ib: 'bg-emerald-100', tc: 'text-emerald-600' },
          { label: 'Pending Requests',   value: stats?.pendingRequests   ?? 0, icon: <PendStat />,       bg: 'bg-amber-50',   ib: 'bg-amber-100',   tc: 'text-amber-600'   },
          { label: 'Connected Banks',    value: stats?.connectedBanks    ?? 0, icon: <BankStat />,       bg: 'bg-purple-50',  ib: 'bg-purple-100',  tc: 'text-purple-600'  },
        ].map(({ label, value, icon, bg, ib, tc }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
            <div className={`w-10 h-10 rounded-xl ${ib} flex items-center justify-center mb-4`}>
              <span className={tc}>{icon}</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            <p className="text-xs text-neutral-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Blood Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Blood Requests</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Requests sent to blood banks</p>
            </div>
            <button
              onClick={() => navigate('/hospital/requests')}
              className="text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Request
            </button>
          </div>
          <div className="p-5">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                    <path d="M14 2v6h6M12 18v-4M10 16h4"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-800">No requests yet</p>
                  <p className="text-xs text-neutral-400 mt-1">Submit a blood request to your connected blood banks.</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {['Blood Bank', 'Type', 'Units', 'Priority', 'Status', 'Date'].map(h => (
                      <th key={h} className="pb-2.5 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => (
                    <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="py-3 text-neutral-800 truncate max-w-[120px]">{r.bloodBankId?.organizationName || r.bloodBankId?.fullName || '—'}</td>
                      <td className="py-3 font-semibold text-red-600">{r.bloodType}</td>
                      <td className="py-3 text-neutral-600">{r.units}</td>
                      <td className="py-3"><PriorityBadge level={r.priority} /></td>
                      <td className="py-3"><Badge variant={statusVariant(r.status)} size="sm">{r.status}</Badge></td>
                      <td className="py-3 text-xs text-neutral-400">{new Date(r.createdAt).toLocaleDateString('en-NG',{day:'numeric',month:'short'})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <HospitalActionBtn icon={<ReqIcon />} label="Request Blood" sub="Submit urgent blood request" color="blue" onClick={() => navigate('/hospital/requests')} />
              <HospitalActionBtn icon={<BankIcon />} label="Find Blood Banks" sub="Browse verified banks" color="emerald" onClick={() => navigate('/hospital/requests')} />
              <HospitalActionBtn icon={<ChainIcon />} label="View Blockchain" sub="On-chain request history" color="purple" onClick={() => navigate('/hospital/blockchain')} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Hospital Info</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Hospital ID',    value: user?.userId              },
                { label: 'Organisation',   value: user?.organizationName    },
                { label: 'License',        value: user?.licenseNumber       },
                { label: 'State',          value: user?.state               },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center gap-2">
                  <span className="text-xs text-neutral-400 font-medium flex-shrink-0">{label}</span>
                  <span className="text-xs text-neutral-800 font-semibold text-right truncate">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PriorityBadge({ level }) {
  const map = { urgent: 'danger', high: 'warning', normal: 'neutral', low: 'neutral' }
  return <Badge variant={map[level] || 'neutral'} size="sm">{level || 'normal'}</Badge>
}
function statusVariant(s) {
  return { pending: 'warning', fulfilled: 'success', rejected: 'danger', processing: 'info' }[s] || 'neutral'
}
function HospitalActionBtn({ icon, label, sub, color, onClick }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', purple: 'bg-purple-50 text-purple-600' }
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors text-left group">
      <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center flex-shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-800">{label}</p>
        <p className="text-xs text-neutral-400">{sub}</p>
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-neutral-400"><path d="M4.5 2.5l4 3.5-4 3.5"/></svg>
    </button>
  )
}

function ActiveIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/><path d="M9 7v4M7 10l2 2 4-4"/></svg> }
function CheckStat() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="7.5"/><path d="M5.5 9l2.5 2.5 4.5-4.5"/></svg> }
function PendStat() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5.5v3.5l2.5 2"/></svg> }
function BankStat() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="7" width="14" height="9" rx="1"/><path d="M9 3l8 4H1l8-4z"/><path d="M6 11v4M9 11v4M12 11v4"/></svg> }
function ReqIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V5l-3.5-3.5z"/><path d="M8 7v3M7 9h2"/></svg> }
function BankIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0010 0C13 7.5 8 2 8 2z"/></svg> }
function ChainIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 9.5l-1 1a2.5 2.5 0 003.54 3.54l2.5-2.5a2.5 2.5 0 000-3.54l-.75-.75"/><path d="M9.5 6.5l1-1a2.5 2.5 0 00-3.54-3.54l-2.5 2.5a2.5 2.5 0 000 3.54l.75.75"/></svg> }
