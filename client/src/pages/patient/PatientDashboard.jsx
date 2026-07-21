import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { patientService } from '@/services/patientService'
import { Card, CardBody, Badge, Spinner, Alert } from '@/components/ui'

const RECORD_TYPE_CONFIG = {
  lab:          { label: 'Lab',          color: 'blue',    icon: LabIcon    },
  imaging:      { label: 'Imaging',      color: 'purple',  icon: ImagingIcon },
  prescription: { label: 'Prescription', color: 'emerald', icon: RxIcon     },
  consultation: { label: 'Consultation', color: 'yellow',  icon: ConsultIcon },
  surgery:      { label: 'Surgery',      color: 'red',     icon: SurgIcon   },
  vaccination:  { label: 'Vaccination',  color: 'teal',    icon: VaccIcon   },
  other:        { label: 'Other',        color: 'neutral',  icon: OtherIcon  },
}

function fmt(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const [stats,   setStats]   = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    Promise.all([patientService.getStats(), patientService.getRecords()])
      .then(([s, r]) => { setStats(s.data); setRecords((r.data || []).slice(0, 4)) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" color="blue" />
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {error && <Alert variant="danger" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold mt-0.5">{user?.fullName}</h1>
          <p className="text-blue-200 text-xs mt-1 font-mono">{user?.userId}</p>
        </div>
        <div className="hidden sm:block">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <PatientIcon />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Medical Records"
          value={stats?.totalRecords ?? 0}
          sub="total on IPFS"
          icon={<RecordStatIcon />}
          color="blue"
          linkTo="/patient/records"
        />
        <StatCard
          label="Verified Records"
          value={stats?.verifiedRecords ?? 0}
          sub="blockchain confirmed"
          icon={<VerifiedIcon />}
          color="emerald"
          linkTo="/patient/records"
        />
        <StatCard
          label="Active Grants"
          value={stats?.activeGrants ?? 0}
          sub="doctors with access"
          icon={<GrantIcon />}
          color="purple"
          linkTo="/patient/access"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Recent records */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-neutral-900">Recent Records</h2>
          <Link to="/patient/records" className="text-xs text-blue-600 hover:underline font-medium">View all →</Link>
        </div>
        {records.length === 0 ? (
          <Card><CardBody><p className="text-neutral-400 text-sm text-center py-8">No records yet.</p></CardBody></Card>
        ) : (
          <div className="space-y-3">
            {records.map(rec => <RecordRow key={rec._id} rec={rec} />)}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-neutral-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/patient/access"  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-200 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><GrantIcon /></div>
            <div><p className="font-medium text-sm text-neutral-900">Manage Access</p><p className="text-xs text-neutral-500">Grant or revoke doctor access</p></div>
          </Link>
          <Link to="/patient/audit"   className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-200 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><AuditStatIcon /></div>
            <div><p className="font-medium text-sm text-neutral-900">Activity Log</p><p className="text-xs text-neutral-500">View your recent activity</p></div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon, color, linkTo, className = '' }) {
  const colorMap = {
    blue:    'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple:  'bg-purple-50 text-purple-600',
  }
  return (
    <Link to={linkTo} className={`bg-white rounded-2xl border border-neutral-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all ${className}`}>
      <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-sm font-medium text-neutral-700 mt-0.5">{label}</p>
      <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
    </Link>
  )
}

function RecordRow({ rec }) {
  const cfg = RECORD_TYPE_CONFIG[rec.recordType] || RECORD_TYPE_CONFIG.other
  const Icon = cfg.icon
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600', yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-600', teal: 'bg-teal-50 text-teal-600', neutral: 'bg-neutral-100 text-neutral-600',
  }
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-4 hover:border-blue-200 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${colorMap[cfg.color]}`}><Icon /></div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-neutral-900 truncate">{rec.title}</p>
        <p className="text-xs text-neutral-400 truncate">{rec.description}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-2 justify-end mb-1">
          <Badge variant={rec.isVerified ? 'success' : 'warning'} size="sm">
            {rec.isVerified ? 'Verified' : 'Pending'}
          </Badge>
        </div>
        <p className="text-xs text-neutral-400">{fmtDate(rec.createdAt)}</p>
        <p className="text-[10px] text-neutral-300">{fmt(rec.fileSize)}</p>
      </div>
    </div>
  )
}

function PatientIcon() { return <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="12" r="5" stroke="white" strokeWidth="1.8"/><path d="M6 28c0-5.5 4.5-9 10-9s10 3.5 10 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function RecordStatIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11.5 2H5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6.5L11.5 2z"/><path d="M11.5 2v4.5H16M6.5 9.5h5M6.5 12.5h3"/></svg> }
function VerifiedIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 1L2.5 3.5v5c0 4 3 6.5 6.5 8 3.5-1.5 6.5-4 6.5-8v-5L9 1z"/><path d="M6 9l2 2L12 7"/></svg> }
function GrantIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="6" r="3"/><path d="M2 16c0-3 2.5-5 5-5"/><path d="M13 10.5l1.5 1.5L17 9.5"/><circle cx="14" cy="12" r="3.5"/></svg> }
function AuditStatIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="7.5"/><path d="M9 5.5v4l2.5 1.5"/></svg> }
function LabIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M6 2v5L2 13a1 1 0 00.9 1.5h10.2A1 1 0 0014 13L10 7V2M5 2h6"/></svg> }
function ImagingIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="11" rx="2"/><circle cx="8" cy="8" r="2.5"/></svg> }
function RxIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M5.5 6.5h5M5.5 9.5h3M5.5 12h2"/></svg> }
function ConsultIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M13 2H3a1 1 0 00-1 1v7a1 1 0 001 1h3l2 3 2-3h3a1 1 0 001-1V3a1 1 0 00-1-1z"/></svg> }
function SurgIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M13 3L3 13M3 3l4 4M9 9l4 4M6.5 11.5L4.5 13.5"/></svg> }
function VaccIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M10.5 2.5l3 3M8 5l3 3-5 5-3-3L8 5zM2 14l2.5-2.5M11.5 3.5L12.5 2.5"/></svg> }
function OtherIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v4M8 11v1"/></svg> }
