import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { doctorService } from '@/services/doctorService'
import { Spinner, Alert, Avatar } from '@/components/ui'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function calcAge(dob) {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

export default function DoctorDashboard() {
  const { user }  = useAuth()
  const [stats,    setStats]    = useState(null)
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    Promise.all([doctorService.getStats(), doctorService.getPatients()])
      .then(([s, p]) => { setStats(s.data); setPatients((p.data || []).slice(0, 5)) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" color="blue" /></div>

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {error && <Alert variant="danger" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 flex items-center justify-between">
        <div>
          <p className="text-emerald-100 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold mt-0.5">{user?.fullName}</h1>
          <p className="text-emerald-200 text-xs mt-1">{user?.specialization} · {user?.hospital}</p>
        </div>
        <div className="hidden sm:block">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <DoctorHeroIcon />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Active Patients" value={stats?.activePatients ?? 0} sub="granted you access" icon={<PatIcon />} color="emerald" linkTo="/doctor/patients" />
        <StatCard label="Records Viewed"  value={stats?.totalRecordsViewed ?? 0} sub="in this session" icon={<EyeIcon />} color="blue" linkTo="/doctor/patients" />
        <StatCard label="Audit Events"    value={stats?.auditEvents ?? 0} sub="all activity" icon={<ClockIcon />} color="purple" linkTo="/doctor/audit" className="col-span-2 sm:col-span-1" />
      </div>

      {/* Recent patients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-neutral-900">My Patients</h2>
          <Link to="/doctor/patients" className="text-xs text-emerald-600 hover:underline font-medium">View all →</Link>
        </div>
        {patients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center">
            <p className="text-neutral-400 font-medium">No patients have granted you access yet.</p>
            <p className="text-sm text-neutral-300 mt-1">Patients can grant access from their portal.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map(p => (
              <Link key={p._id} to={`/doctor/patients/${p._id}`} className="flex items-center gap-4 bg-white rounded-xl border border-neutral-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all">
                <Avatar name={p.fullName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-neutral-900">{p.fullName}</p>
                  <p className="text-xs text-neutral-400 font-mono">{p.userId}</p>
                  {p.dateOfBirth && <p className="text-xs text-neutral-400">{calcAge(p.dateOfBirth)} yrs old</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                    {p.recordCount} record{p.recordCount !== 1 ? 's' : ''}
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-1">Since {fmtDate(p.grantedAt)}</p>
                </div>
                <ChevronIcon />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-neutral-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/doctor/patients" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-200 hover:border-emerald-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><PatIcon /></div>
            <div><p className="font-medium text-sm text-neutral-900">View Patients</p><p className="text-xs text-neutral-500">Browse patient records</p></div>
          </Link>
          <Link to="/doctor/audit" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-200 hover:border-emerald-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><ClockIcon /></div>
            <div><p className="font-medium text-sm text-neutral-900">Activity Log</p><p className="text-xs text-neutral-500">View your recent actions</p></div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon, color, linkTo, className = '' }) {
  const cm = { emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600' }
  return (
    <Link to={linkTo} className={`bg-white rounded-2xl border border-neutral-200 p-5 hover:border-emerald-200 hover:shadow-sm transition-all ${className}`}>
      <div className={`w-10 h-10 rounded-xl ${cm[color]} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-sm font-medium text-neutral-700 mt-0.5">{label}</p>
      <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
    </Link>
  )
}

function DoctorHeroIcon() { return <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M10 6C10 6 6 6 6 11C6 16 10 16 10 21C10 24 12 26 15 26C18 26 20 24 20 21V28" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><circle cx="20" cy="24" r="3" stroke="white" strokeWidth="1.8"/></svg> }
function PatIcon()   { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="6" r="3"/><path d="M1 16c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="14" cy="6" r="2"/><path d="M17 16c0-2-1.2-3.5-3-4"/></svg> }
function EyeIcon()   { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/><circle cx="9" cy="9" r="2.5"/></svg> }
function ClockIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="7.5"/><path d="M9 5.5v4l2.5 1.5"/></svg> }
function ChevronIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="flex-shrink-0 text-neutral-400"><path d="M5 3l4 4-4 4"/></svg> }
