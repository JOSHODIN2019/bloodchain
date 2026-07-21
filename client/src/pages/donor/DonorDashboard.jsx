import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { donorService } from '@/services/donorService'
import { Spinner, Alert, Badge } from '@/components/ui'

export default function DonorDashboard() {
  const { user }        = useAuth()
  const [stats, setStats]   = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [s, h] = await Promise.all([
          donorService.getStats(),
          donorService.getHistory(),
        ])
        setStats(s.stats)
        setHistory(h.donations)
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
          <p className="text-sm text-neutral-500">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  const nextDate = stats?.nextEligibleDate ? new Date(stats.nextEligibleDate) : null
  const eligibleToday = stats?.eligibleToday ?? true

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Welcome banner */}
      <div className="relative bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 flex items-center px-6 opacity-10">
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
            <path d="M50 8C50 8 18 40 18 62a32 32 0 0064 0C82 40 50 8 50 8z" fill="white"/>
          </svg>
        </div>
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-red-200 text-sm font-medium">Welcome back,</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">{user?.fullName}</h1>
            <p className="text-red-100 text-sm mt-1">
              {eligibleToday
                ? 'You are eligible to donate today.'
                : `Next eligible: ${nextDate?.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-center">
              <p className="text-white text-xl font-bold leading-none">{user?.bloodType ?? '—'}</p>
              <p className="text-red-100 text-[10px] mt-1 font-medium">Blood Type</p>
            </div>
            <div className="bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-center">
              <p className="text-white text-xl font-bold leading-none">{eligibleToday ? '✓' : '○'}</p>
              <p className="text-red-100 text-[10px] mt-1 font-medium">Eligible</p>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert variant="warning" title="Server offline">{error}</Alert>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Donations',   value: stats?.totalDonations  ?? 0, icon: <DropStatIcon />,   bg: 'bg-red-50',     ib: 'bg-red-100',     tc: 'text-red-600'    },
          { label: 'Lives Impacted',    value: stats?.livesImpacted   ?? 0, icon: <HeartStatIcon />,  bg: 'bg-rose-50',    ib: 'bg-rose-100',    tc: 'text-rose-600'   },
          { label: 'Days Until Eligible', value: eligibleToday ? 'Today' : daysUntil(nextDate), icon: <CalIcon />, bg: 'bg-amber-50', ib: 'bg-amber-100', tc: 'text-amber-600' },
          { label: 'Donor ID',          value: user?.userId ?? '—',    icon: <IdIcon />,         bg: 'bg-neutral-50', ib: 'bg-neutral-200', tc: 'text-neutral-600' },
        ].map(({ label, value, icon, bg, ib, tc }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
            <div className={`w-10 h-10 rounded-xl ${ib} flex items-center justify-center mb-4`}>
              <span className={tc}>{icon}</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900 truncate">{value}</p>
            <p className="text-xs text-neutral-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Eligibility notice */}
      {eligibleToday && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
          <span className="text-emerald-600 mt-0.5"><CheckCircleIcon /></span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">You are eligible to donate today!</p>
            <p className="text-xs text-emerald-600 mt-0.5">Visit your nearest blood bank or schedule an appointment to donate.</p>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Donation History */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Donation History</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Your recorded blood donations</p>
            </div>
            <Badge variant="neutral" size="sm">{history.length} records</Badge>
          </div>
          <div className="p-5">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 3C12 3 5 10.5 5 15a7 7 0 0014 0C19 10.5 12 3 12 3z"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-800">No donations yet</p>
                  <p className="text-xs text-neutral-400 mt-1">Your first donation will appear here once recorded by a blood bank.</p>
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {['Date', 'Blood Bank', 'Blood Type', 'Units', 'Status'].map(h => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((d, i) => (
                    <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="py-3 text-sm text-neutral-700">{d.donationDate ? new Date(d.donationDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(d.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="py-3 text-sm text-neutral-700">{d.bloodBankId?.organizationName || d.bloodBankId?.fullName || '—'}</td>
                      <td className="py-3"><span className="font-semibold text-red-600 text-sm">{d.bloodType}</span></td>
                      <td className="py-3 text-sm text-neutral-700">{d.units} unit{d.units !== 1 ? 's' : ''}</td>
                      <td className="py-3"><Badge variant={d.status === 'confirmed' ? 'success' : d.status === 'rejected' ? 'danger' : 'neutral'} size="sm" className="capitalize">{d.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions + Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <ActionButton icon={<DropIcon />} label="Schedule Donation" sub="Find a blood bank near you" color="red" />
              <ActionButton icon={<SearchIcon />} label="Find Blood Bank" sub="Browse verified facilities" color="blue" />
              <ActionButton icon={<ChainIcon />} label="View Blockchain" sub="Your on-chain donation trail" color="emerald" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Your Info</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Donor ID',    value: user?.userId    },
                { label: 'Blood Type',  value: user?.bloodType },
                { label: 'Email',       value: user?.email     },
                { label: 'Phone',       value: user?.phone || 'Not set' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400 font-medium">{label}</span>
                  <span className="text-xs text-neutral-800 font-semibold font-mono">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon, label, sub, color }) {
  const colors = {
    red:     'bg-red-50 text-red-600',
    blue:    'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors text-left group">
      <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-800 group-hover:text-neutral-900">{label}</p>
        <p className="text-xs text-neutral-400">{sub}</p>
      </div>
      <ArrowIcon />
    </button>
  )
}

function daysUntil(date) {
  if (!date) return 'Today'
  const d = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24))
  return d <= 0 ? 'Today' : `${d}d`
}

function DropStatIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 2C9 2 4 8 4 11.5a5 5 0 0010 0C14 8 9 2 9 2z"/></svg>
}
function HeartStatIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 15C9 15 2 10.5 2 6.5A4 4 0 019 4a4 4 0 017 2.5C16 10.5 9 15 9 15z"/></svg>
}
function CalIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3.5" width="14" height="12" rx="1.5"/><path d="M6 2v3M12 2v3M2 8h14"/></svg>
}
function IdIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="4" width="15" height="10" rx="1.5"/><path d="M5 8h2M5 11h8M9 8h4"/></svg>
}
function CheckCircleIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="7.5"/><path d="M6 9l2.5 2.5L12 7"/></svg>
}
function DropIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0010 0C13 7.5 8 2 8 2z"/></svg>
}
function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>
}
function ChainIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 9.5l-1 1a2.5 2.5 0 003.54 3.54l2.5-2.5a2.5 2.5 0 000-3.54l-.75-.75"/><path d="M9.5 6.5l1-1a2.5 2.5 0 00-3.54-3.54l-2.5 2.5a2.5 2.5 0 000 3.54l.75.75"/></svg>
}
function ArrowIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-neutral-400"><path d="M4.5 2.5l4 3.5-4 3.5"/></svg>
}
