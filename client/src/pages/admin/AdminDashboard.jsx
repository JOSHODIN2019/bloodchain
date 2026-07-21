import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { Card, CardBody, Badge, StatusBadge, RoleBadge, Avatar, Spinner, Alert } from '@/components/ui'

export default function AdminDashboard() {
  const [stats,      setStats]      = useState(null)
  const [doctors,    setDoctors]    = useState([])
  const [patients,   setPatients]   = useState([])
  const [audit,      setAudit]      = useState([])
  const [blockchain, setBlockchain] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [bcRefreshing, setBcRefreshing] = useState(false)

  const loadBlockchain = useCallback(async () => {
    try {
      const r = await adminService.getBlockchainStatus()
      setBlockchain(r.blockchain)
    } catch {
      setBlockchain(null)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d, p, a] = await Promise.all([
          adminService.getStats(),
          adminService.getDoctors(),
          adminService.getPatients(),
          adminService.getAuditLogs({ limit: 6 }),
        ])
        setStats(s.stats)
        setDoctors(d.doctors.slice(0, 5))
        setPatients(p.patients.slice(0, 5))
        setAudit(a.logs)
      } catch {
        setError('Could not connect to the server. Start the backend with: cd server && npm run dev')
      } finally {
        setLoading(false)
      }
    }
    load()
    loadBlockchain()
  }, [loadBlockchain])

  const handleBcRefresh = async () => {
    setBcRefreshing(true)
    await loadBlockchain()
    setBcRefreshing(false)
  }

  if (loading) return <LoadingState />

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Dashboard Overview</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Welcome back, Administrator — here's what's happening.</p>
      </div>

      {error && <Alert variant="warning" title="Server offline">{error}</Alert>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Donors',       value: stats?.totalDonors         ?? '—', icon: <PatientStatIcon />, color: 'bg-red-50',    iconBg: 'bg-red-100',    text: 'text-red-600'    },
          { label: 'Blood Banks',        value: stats?.totalBloodBanks     ?? '—', icon: <DoctorStatIcon />,  color: 'bg-emerald-50',iconBg: 'bg-emerald-100',text: 'text-emerald-600'},
          { label: 'Hospitals',          value: stats?.totalHospitals      ?? '—', icon: <PendingIcon />,     color: 'bg-blue-50',   iconBg: 'bg-blue-100',   text: 'text-blue-600'   },
          { label: 'Audit Events',       value: stats?.totalAudit          ?? '—', icon: <AuditStatIcon />,   color: 'bg-purple-50', iconBg: 'bg-purple-100', text: 'text-purple-600' },
        ].map(({ label, value, icon, color, iconBg, text }) => (
          <div key={label} className={`${color} rounded-2xl p-5 border border-white`}>
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
              <span className={text}>{icon}</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            <p className="text-xs text-neutral-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Blockchain Status Panel */}
      <BlockchainStatusPanel data={blockchain} onRefresh={handleBcRefresh} refreshing={bcRefreshing} />

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent Blood Banks */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Recent Blood Banks</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Latest registered blood banks</p>
              </div>
              <Link to="/admin/bloodbanks" className="text-xs text-red-600 font-semibold hover:text-red-700">
                View all →
              </Link>
            </div>
            <CardBody padded={false}>
              {doctors.length === 0 ? (
                <EmptyRow message="No blood banks registered yet" />
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      {['Blood Bank', 'License', 'State', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doc) => (
                      <tr key={doc._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={doc.fullName} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{doc.organizationName || doc.fullName}</p>
                              <p className="text-xs text-neutral-400">{doc.userId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-neutral-600 font-mono">{doc.licenseNumber || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-neutral-500">{doc.state || '—'}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={doc.isVerified ? 'verified' : 'pending'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Recent Activity</h2>
              <Link to="/admin/audit" className="text-xs text-red-600 font-semibold hover:text-red-700">
                View all →
              </Link>
            </div>
            <CardBody>
              {audit.length === 0 ? (
                <EmptyRow message="No events yet" />
              ) : (
                <div className="space-y-4">
                  {audit.map((log, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${categoryColor(log.category)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-800">{formatAction(log.action)}</p>
                        <p className="text-xs text-neutral-400 truncate">{log.userEmail}</p>
                        <p className="text-[10px] text-neutral-300 mt-0.5">{formatDate(log.createdAt)}</p>
                      </div>
                      <Badge variant={log.status === 'success' ? 'success' : 'danger'} size="sm">
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Recent Donors */}
      <Card>
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Recent Donors</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Latest registered blood donors</p>
          </div>
          <Link to="/admin/donors" className="text-xs text-red-600 font-semibold hover:text-red-700">
            View all →
          </Link>
        </div>
        <CardBody padded={false}>
          {patients.length === 0 ? (
            <EmptyRow message="No donors registered yet" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  {['Donor', 'Donor ID', 'Blood Type', 'Phone', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.fullName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{p.fullName}</p>
                          <p className="text-xs text-neutral-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded">{p.userId}</span></td>
                    <td className="px-5 py-3.5">
                      {p.bloodType ? (
                        <span className="font-bold text-red-600 text-sm">{p.bloodType}</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-neutral-500">{p.phone || '—'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

/* ── Helpers ── */
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Loading dashboard…</p>
      </div>
    </div>
  )
}
function EmptyRow({ message }) {
  return <p className="text-sm text-neutral-400 text-center py-8">{message}</p>
}
function categoryColor(cat) {
  return { auth: 'bg-blue-500', admin: 'bg-purple-500', record: 'bg-emerald-500', access: 'bg-amber-500' }[cat] ?? 'bg-neutral-400'
}
function formatAction(action) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/* ── Blockchain Status Panel ── */
function BlockchainStatusPanel({ data, onRefresh, refreshing }) {
  const [copied,      setCopied]      = useState(false)
  const [hintOpen,    setHintOpen]    = useState(false)

  const copyAddress = () => {
    if (!data?.address) return
    navigator.clipboard.writeText(data.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const balance    = parseFloat(data?.balanceEth ?? '0')
  const isLow      = data?.balanceEth !== null && balance < 0.1
  const isCritical = data?.balanceEth !== null && balance < 0.01
  const isSimulated = data?.isSimulated ?? true

  const networkLabel = data?.network
    ? data.network.charAt(0).toUpperCase() + data.network.slice(1)
    : '—'

  return (
    <div className="rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <ChainIcon />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Blockchain Status</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Server wallet &amp; network overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Live badge */}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>

          {/* Hint icon */}
          <div className="relative">
            <button
              onClick={() => setHintOpen(v => !v)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              title="About this panel"
            >
              <HintIcon />
            </button>
            {hintOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setHintOpen(false)} />
                <div className="fixed top-24 right-6 z-50 w-80 max-h-[480px] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <InfoIcon className="text-blue-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-white">About this data</p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    This system is currently operating in <span className="text-amber-300 font-semibold">blockchain simulation mode</span>. No real Ethereum node is connected. The following values are estimated for demonstration purposes:
                  </p>
                  <div className="space-y-2 mb-3">
                    {[
                      { field: 'Server Wallet Address', reason: 'No DEPLOYER_PRIVATE_KEY configured in server/.env' },
                      { field: 'ETH Balance',           reason: 'Estimated healthy balance — no real wallet connected' },
                      { field: 'Transactions Sent',     reason: 'Estimated count — real value tracks nonce on-chain' },
                      { field: 'Latest Block',          reason: 'Estimated Sepolia block number' },
                    ].map(({ field, reason }) => (
                      <div key={field} className="bg-slate-800 rounded-lg px-3 py-2">
                        <p className="text-[10px] font-semibold text-slate-300">{field}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{reason}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-blue-300 leading-relaxed">
                      To connect a real blockchain: set <code className="text-blue-200">DEPLOYER_PRIVATE_KEY</code> and <code className="text-blue-200">HARDHAT_RPC_URL</code> in <code className="text-blue-200">server/.env</code>, then run the Hardhat node and deploy the contract.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshIcon spinning={refreshing} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="bg-slate-50 px-5 py-4 rounded-b-2xl">
        {/* Only show real warnings when truly live and balance is low */}
        {!isSimulated && isCritical && (
          <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <WarningIcon className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-700">Critical: Wallet nearly empty</p>
              <p className="text-[11px] text-red-600 mt-0.5">Balance is below 0.01 ETH. Blockchain writes will fail. Top up immediately.</p>
            </div>
          </div>
        )}
        {!isSimulated && isLow && !isCritical && (
          <div className="mb-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <WarningIcon className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700">Low balance — top up soon</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Balance is below 0.1 ETH. Send ETH to the server wallet address below to continue logging records.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Wallet Address */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Server Wallet Address</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono text-slate-700 break-all flex-1">{data?.address ?? '—'}</p>
              {data?.address && (
                <button
                  onClick={copyAddress}
                  className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  title="Copy address"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
              )}
            </div>
          </div>

          {/* ETH Balance */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">ETH Balance</p>
            <p className={`text-xl font-bold tabular-nums ${!isSimulated && isCritical ? 'text-red-600' : !isSimulated && isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
              {data?.balanceEth ?? '—'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">ETH</p>
          </div>

          {/* Transactions Sent */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Transactions Sent</p>
            <p className="text-xl font-bold text-slate-800 tabular-nums">{data?.txCount ?? '—'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">on-chain writes</p>
          </div>
        </div>

        {/* Second row */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <NetworkIcon />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Network</p>
              <p className="text-sm font-semibold text-slate-800">{networkLabel}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <BlockIcon />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Latest Block</p>
              <p className="text-sm font-semibold text-slate-800 tabular-nums">{data?.blockNumber?.toLocaleString() ?? '—'}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <RecordCountIcon />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Donations Logged</p>
              <p className="text-sm font-semibold text-slate-800 tabular-nums">{data?.totalDonations ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Stat Icons ── */
function PatientStatIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="6" r="3"/><path d="M3 16c0-3 2.7-5 6-5s6 2 6 5"/></svg>
}
function DoctorStatIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="5.5" r="2.5"/><path d="M3 15c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5"/><path d="M7 11h4M9 9.5v4"/></svg>
}
function PendingIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l2.5 2.5"/></svg>
}
function AuditStatIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11.5 2H5a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 005 16h8a1.5 1.5 0 001.5-1.5V6L11.5 2z"/><path d="M11.5 2V6H15M6.5 9.5h5M6.5 12.5h3"/></svg>
}

/* ── Blockchain Panel Icons ── */
function ChainIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 9.5l3-3"/><path d="M4.5 11.5a2.121 2.121 0 010-3l1-1a2.121 2.121 0 013 3l-.5.5"/><path d="M11.5 4.5a2.121 2.121 0 010 3l-1 1a2.121 2.121 0 01-3-3l.5-.5"/></svg>
}
function HintIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="5.5"/><path d="M6.5 9V6.5"/><circle cx="6.5" cy="4.5" r="0.5" fill="white" stroke="none"/></svg>
}
function RefreshIcon({ spinning }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round"
      style={{ animation: spinning ? 'spin 0.8s linear infinite' : 'none' }}>
      <path d="M11.5 2.5A5.5 5.5 0 106.5 12"/>
      <path d="M11.5 2.5V5.5H8.5"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}
function WarningIcon({ className }) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}><path d="M7 1L1 12h12L7 1z"/><path d="M7 5.5v3M7 10.5h.01"/></svg>
}
function InfoIcon({ className }) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}><circle cx="7" cy="7" r="6"/><path d="M7 6.5v4M7 4.5h.01"/></svg>
}
function CopyIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="4.5" y="4.5" width="6" height="6" rx="1"/><path d="M1.5 7.5V2a.5.5 0 01.5-.5h5.5"/></svg>
}
function CheckIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-emerald-600"><path d="M2 6l3 3 5-5"/></svg>
}
function NetworkIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-slate-500"><circle cx="7.5" cy="7.5" r="6"/><path d="M7.5 1.5c-2 2-3 3.7-3 6s1 4 3 6c2-2 3-3.7 3-6s-1-4-3-6z"/><path d="M1.5 7.5h12"/></svg>
}
function BlockIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-slate-500"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="8" y="2" width="5" height="5" rx="1"/><rect x="2" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg>
}
function RecordCountIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-slate-500"><path d="M10.5 2H4a1.5 1.5 0 00-1.5 1.5v8A1.5 1.5 0 004 13h7a1.5 1.5 0 001.5-1.5V5l-2-3z"/><path d="M10.5 2v3h2.5M5 7.5h5M5 10h3"/></svg>
}
