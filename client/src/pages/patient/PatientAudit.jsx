import { useEffect, useState } from 'react'
import { patientService } from '@/services/patientService'
import { Badge, Spinner, Alert } from '@/components/ui'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ACTION_CFG = {
  USER_REGISTERED:   { label: 'Registered',     color: 'success', icon: '👤' },
  USER_LOGIN:        { label: 'Login',           color: 'info',    icon: '🔐' },
  USER_LOGOUT:       { label: 'Logout',          color: 'default', icon: '🚪' },
  ACCESS_GRANTED:    { label: 'Access Granted',  color: 'success', icon: '✅' },
  ACCESS_REVOKED:    { label: 'Access Revoked',  color: 'warning', icon: '🚫' },
  RECORD_UPLOADED:   { label: 'Record Uploaded', color: 'info',    icon: '📄' },
  RECORD_VIEWED:     { label: 'Record Viewed',   color: 'default', icon: '👁' },
  RECORD_TAMPERED:   { label: 'Tamper Alert!',   color: 'danger',  icon: '⚠️' },
}
const VARIANT_MAP = { success: 'success', info: 'info', warning: 'warning', danger: 'danger', default: 'default' }

export default function PatientAudit() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    patientService.getAuditLogs()
      .then(r => setLogs(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" color="blue" /></div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Activity Log</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Immutable record of all actions on your account, stored on the blockchain.
        </p>
      </div>

      {error && <Alert variant="danger" onDismiss={() => setError(null)}>{error}</Alert>}

      {logs.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <ClockIcon className="mx-auto mb-3 text-neutral-300 w-10 h-10" />
          <p className="font-medium">No activity yet</p>
          <p className="text-sm mt-1">Your actions will appear here.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-200" />

          <div className="space-y-3 pl-10">
            {logs.map((log, i) => {
              const cfg = ACTION_CFG[log.action] || { label: log.action, color: 'default', icon: '•' }
              return (
                <div key={log._id || i} className="relative">
                  {/* Dot */}
                  <div className={`absolute -left-[2.15rem] w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] ${dotColor(cfg.color)}`}>
                    <span>{cfg.icon}</span>
                  </div>

                  <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={VARIANT_MAP[cfg.color] || 'default'} size="sm">{cfg.label}</Badge>
                          {log.status === 'failure' && <Badge variant="danger" size="sm">Failed</Badge>}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-xs text-neutral-500 mt-1.5">
                            {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                          </p>
                        )}
                        {log.ipAddress && (
                          <p className="text-[10px] text-neutral-400 mt-1 font-mono">IP: {log.ipAddress}</p>
                        )}
                        {log.txHash && (
                          <p className="text-[10px] text-emerald-600 font-mono mt-1 truncate">Tx: {log.txHash.slice(0, 24)}…</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-neutral-500">{fmtDate(log.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-400 text-center pt-2">
        Showing latest {logs.length} events · All records are immutable
      </p>
    </div>
  )
}

function dotColor(color) {
  const map = {
    success: 'bg-emerald-100 text-emerald-700',
    info:    'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger:  'bg-red-100 text-red-700',
    default: 'bg-neutral-100 text-neutral-600',
  }
  return map[color] || map.default
}

function ClockIcon({ className }) {
  return <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="20" cy="20" r="16"/><path d="M20 12v9l5 3"/></svg>
}
