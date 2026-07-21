import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { Badge, Spinner, Alert } from '@/components/ui'

const CATEGORIES = ['all', 'auth', 'donation', 'request', 'admin']

const ACTION_VARIANT = {
  USER_REGISTERED:       'success',
  USER_LOGIN:            'info',
  USER_LOGOUT:           'neutral',
  DONATION_INTENT:       'warning',
  DONATION_CONFIRMED:    'success',
  DONATION_REJECTED:     'danger',
  DONATION_CANCELLED:    'neutral',
  REQUEST_CREATED:       'warning',
  REQUEST_FULFILLED:     'success',
  REQUEST_REJECTED:      'danger',
  REQUEST_CANCELLED:     'neutral',
  BLOODBANK_VERIFIED:    'success',
  BLOODBANK_ACTIVATED:   'success',
  BLOODBANK_DEACTIVATED: 'danger',
  HOSPITAL_VERIFIED:     'success',
  HOSPITAL_ACTIVATED:    'success',
  HOSPITAL_DEACTIVATED:  'danger',
  INVENTORY_UPDATED:     'info',
}

const CAT_COLOR = {
  auth:     'bg-blue-500',
  donation: 'bg-red-500',
  request:  'bg-purple-500',
  admin:    'bg-amber-500',
}

function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminAudit() {
  const [logs,     setLogs]     = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [category, setCategory] = useState('all')

  const load = async (cat) => {
    setLoading(true)
    try {
      const params = cat !== 'all' ? { category: cat, limit: 100 } : { limit: 100 }
      const data = await adminService.getAuditLogs(params)
      setLogs(data.logs)
      setTotal(data.total)
    } catch {
      setError('Could not load audit logs — start the backend server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(category) }, [category])

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Audit Log</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{total} event{total !== 1 ? 's' : ''} recorded</p>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              category === cat
                ? 'bg-red-600 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {['Category', 'Action', 'User', 'IP', 'Status', 'Time'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-neutral-400 text-sm">
                      No audit events found for this category.
                    </td>
                  </tr>
                ) : logs.map((log, i) => (
                  <tr key={log._id || i} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CAT_COLOR[log.category] || 'bg-neutral-400'}`} />
                        <span className="text-xs font-semibold text-neutral-600 capitalize">{log.category || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={ACTION_VARIANT[log.action] || 'neutral'} size="sm">
                        {(log.action || '').replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-neutral-800 font-medium">{log.userEmail || '—'}</p>
                      <p className="text-[11px] text-neutral-400 capitalize">{log.userRole || ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-neutral-400">{log.ipAddress || '—'}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={log.status === 'success' ? 'success' : 'danger'} size="sm">
                        {log.status || 'success'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-neutral-400 whitespace-nowrap">{fmtDateTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > logs.length && (
            <div className="px-5 py-3 border-t border-neutral-100 text-xs text-neutral-400 text-center">
              Showing {logs.length} of {total} events · increase limit to see more
            </div>
          )}
        </div>
      )}
    </div>
  )
}
