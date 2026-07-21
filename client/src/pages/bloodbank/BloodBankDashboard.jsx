import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { bloodbankService } from '@/services/bloodbankService'
import { Spinner, Alert, Badge } from '@/components/ui'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const BT_COLORS   = {
  'A+':  'bg-red-50   border-red-200   text-red-700',
  'A-':  'bg-rose-50  border-rose-200  text-rose-700',
  'B+':  'bg-amber-50 border-amber-200 text-amber-700',
  'B-':  'bg-orange-50 border-orange-200 text-orange-700',
  'AB+': 'bg-purple-50 border-purple-200 text-purple-700',
  'AB-': 'bg-violet-50 border-violet-200 text-violet-700',
  'O+':  'bg-emerald-50 border-emerald-200 text-emerald-700',
  'O-':  'bg-teal-50  border-teal-200  text-teal-700',
}

export default function BloodBankDashboard() {
  const { user }                  = useAuth()
  const [stats,     setStats]     = useState(null)
  const [inventory, setInventory] = useState([])
  const [donations, setDonations] = useState([])
  const [requests,  setRequests]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [s, inv, don, req] = await Promise.all([
          bloodbankService.getStats(),
          bloodbankService.getInventory(),
          bloodbankService.getDonations(),
          bloodbankService.getRequests(),
        ])
        setStats(s.stats)
        setInventory(inv.inventory)
        setDonations(don.donations)
        setRequests(req.requests)
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
          <p className="text-sm text-neutral-500">Loading blood bank data…</p>
        </div>
      </div>
    )
  }

  const orgName = user?.organizationName || user?.fullName

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Blood Bank Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{orgName} · {user?.state}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg">{user?.userId}</span>
          <Badge variant="success">Verified</Badge>
        </div>
      </div>

      {error && <Alert variant="warning" title="Server offline">{error}</Alert>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Donations Received',  value: stats?.totalDonationsReceived ?? 0, icon: <DropStat />,   bg: 'bg-red-50',     ib: 'bg-red-100',     tc: 'text-red-600'     },
          { label: 'Total Units',         value: stats?.totalInventoryUnits    ?? 0, icon: <UnitsIcon />,  bg: 'bg-emerald-50', ib: 'bg-emerald-100', tc: 'text-emerald-600' },
          { label: 'Pending Requests',    value: stats?.pendingRequests        ?? 0, icon: <PendingIcon />,bg: 'bg-amber-50',   ib: 'bg-amber-100',   tc: 'text-amber-600'   },
          { label: 'Verified Donors',     value: stats?.verifiedDonors        ?? 0,  icon: <DonorStat />,  bg: 'bg-blue-50',    ib: 'bg-blue-100',    tc: 'text-blue-600'    },
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

      {/* Blood Inventory Grid */}
      <div className="bg-white rounded-2xl border border-neutral-200">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Blood Inventory</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Current stock by blood type</p>
          </div>
          <button className="text-xs text-emerald-600 font-semibold hover:text-emerald-700">Update Stock →</button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {BLOOD_TYPES.map(bt => {
              const item   = inventory.find(i => i.bloodType === bt) || { units: 0, critical: false }
              const isCrit = item.units === 0 || item.critical
              return (
                <div key={bt} className={`rounded-xl border-2 p-3 text-center transition-all ${isCrit ? 'border-red-300 bg-red-50' : BT_COLORS[bt] || 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}>
                  <p className="text-lg font-bold leading-none">{bt}</p>
                  <p className="text-2xl font-bold mt-2 leading-none">{item.units}</p>
                  <p className="text-[10px] mt-1 opacity-70">units</p>
                  {isCrit && <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 mx-auto animate-pulse" />}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-neutral-400 mt-3">
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Critical</span>
            {' '}— blood type is at zero or flagged low.
          </p>
        </div>
      </div>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent Donations */}
        <div className="bg-white rounded-2xl border border-neutral-200">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Recent Donations</h2>
            <Badge variant="neutral" size="sm">{donations.length}</Badge>
          </div>
          <div className="p-4">
            {donations.length === 0 ? (
              <EmptyState message="No donations recorded yet" sub="Donations logged here when a donor visits." />
            ) : (
              <table className="w-full text-sm">
                <thead><tr>{['Donor','Type','Units','Received'].map(h=><th key={h} className="pb-2 text-left text-xs font-semibold text-neutral-400">{h}</th>)}</tr></thead>
                <tbody>{donations.map((d,i)=>(
                  <tr key={i} className="border-t border-neutral-50">
                    <td className="py-2.5 text-neutral-800 truncate max-w-[100px]">{d.donorId?.fullName || '—'}</td>
                    <td className="py-2.5 font-semibold text-red-600">{d.bloodType}</td>
                    <td className="py-2.5 text-neutral-600">{d.units}</td>
                    <td className="py-2.5 text-neutral-400 text-xs">{new Date(d.createdAt).toLocaleDateString('en-NG',{day:'numeric',month:'short'})}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>

        {/* Hospital Requests */}
        <div className="bg-white rounded-2xl border border-neutral-200">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Hospital Requests</h2>
            <Badge variant={requests.length > 0 ? 'warning' : 'neutral'} size="sm">{requests.length} pending</Badge>
          </div>
          <div className="p-4">
            {requests.length === 0 ? (
              <EmptyState message="No pending requests" sub="Hospital requests for blood units appear here." />
            ) : (
              <table className="w-full text-sm">
                <thead><tr>{['Hospital','Type','Units','Priority'].map(h=><th key={h} className="pb-2 text-left text-xs font-semibold text-neutral-400">{h}</th>)}</tr></thead>
                <tbody>{requests.map((r,i)=>(
                  <tr key={i} className="border-t border-neutral-50">
                    <td className="py-2.5 text-neutral-800 truncate max-w-[100px]">{r.hospitalId?.organizationName || r.hospitalId?.fullName || '—'}</td>
                    <td className="py-2.5 font-semibold text-red-600">{r.bloodType}</td>
                    <td className="py-2.5 text-neutral-600">{r.units}</td>
                    <td className="py-2.5"><Badge variant={r.priority==='urgent'?'danger':r.priority==='high'?'warning':'neutral'} size="sm">{r.priority}</Badge></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <p className="text-sm font-semibold text-neutral-700">{message}</p>
      <p className="text-xs text-neutral-400 text-center">{sub}</p>
    </div>
  )
}

function DropStat() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 2C9 2 4 8 4 11.5a5 5 0 0010 0C14 8 9 2 9 2z"/></svg> }
function UnitsIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="14" height="11" rx="1.5"/><path d="M6 5V4a1 1 0 011-1h4a1 1 0 011 1v1"/><path d="M2 9h14"/></svg> }
function PendingIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5.5v3.5l2.5 2"/></svg> }
function DonorStat() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="6" r="3"/><path d="M3 16c0-3 2.7-5 6-5s6 2 6 5"/></svg> }
