import { useState, useEffect, useCallback } from 'react'
import { bloodbankService } from '@/services/bloodbankService'
import { Spinner, Alert, Badge } from '@/components/ui'

const STATUS_TABS = [
  { key: '',           label: 'All'         },
  { key: 'pending',    label: 'Pending'     },
  { key: 'processing', label: 'Processing'  },
  { key: 'fulfilled',  label: 'Fulfilled'   },
  { key: 'rejected',   label: 'Rejected'    },
]

const STATUS_VARIANT = {
  pending:    'warning',
  processing: 'info',
  fulfilled:  'success',
  rejected:   'danger',
  cancelled:  'neutral',
}

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700 border border-red-200',
  high:   'bg-orange-100 text-orange-700 border border-orange-200',
  normal: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
  low:    'bg-blue-50 text-blue-600 border border-blue-200',
}

export default function BloodBankRequests() {
  const [requests,    setRequests]    = useState([])
  const [statusTab,   setStatusTab]   = useState('')
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [acting,      setActing]      = useState('')

  // Fulfil modal
  const [fulfilModal, setFulfilModal] = useState(null)
  const [fulfilNotes, setFulfilNotes] = useState('')

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusTab) params.status = statusTab
      const res = await bloodbankService.getRequests(params)
      setRequests(res.requests)
    } catch {
      setError('Could not load hospital requests.')
    } finally {
      setLoading(false)
    }
  }, [statusTab])

  useEffect(() => { load() }, [load])

  const handleFulfilSubmit = async (e) => {
    e.preventDefault()
    setActing(fulfilModal._id)
    setError('')
    try {
      await bloodbankService.fulfilRequest(fulfilModal._id, fulfilNotes)
      setSuccess(`Request fulfilled — ${fulfilModal.units} unit(s) of ${fulfilModal.bloodType} dispatched.`)
      setFulfilModal(null)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fulfil request.')
    } finally {
      setActing('')
    }
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    setActing(rejectModal._id)
    setError('')
    try {
      await bloodbankService.rejectRequest(rejectModal._id, rejectReason)
      setSuccess('Request rejected.')
      setRejectModal(null)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reject request.')
    } finally {
      setActing('')
    }
  }

  const pendingCount = requests.filter(r => ['pending', 'processing'].includes(r.status)).length

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Hospital Requests</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage blood unit requests from hospitals</p>
        </div>
        {pendingCount > 0 && (
          <span className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {pendingCount} awaiting action
          </span>
        )}
      </div>

      {error   && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Status tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setStatusTab(key); setError(''); setSuccess('') }}
            className={[
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
              statusTab === key
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-200">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : requests.length === 0 ? (
          <EmptyRequests />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  {['Hospital', 'Blood Type', 'Units', 'Priority', 'Requested', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const hosp     = r.hospitalId
                  const isActing = acting === r._id
                  const canAct   = ['pending', 'processing'].includes(r.status)
                  return (
                    <tr key={r._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-neutral-900 truncate max-w-[160px]">
                          {hosp?.organizationName || hosp?.fullName || '—'}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{hosp?.userId}</p>
                        {hosp?.state && <p className="text-[10px] text-neutral-400">{hosp.state}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-red-600">{r.bloodType}</span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-neutral-800 tabular-nums">{r.units}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg capitalize ${PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.normal}`}>
                          {r.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-neutral-400 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={STATUS_VARIANT[r.status] || 'neutral'} withDot size="sm">
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {canAct ? (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={isActing}
                              onClick={() => { setFulfilModal(r); setFulfilNotes(''); setError(''); setSuccess('') }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              Fulfil
                            </button>
                            <button
                              disabled={isActing}
                              onClick={() => { setRejectModal(r); setRejectReason(''); setError(''); setSuccess('') }}
                              className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-300">
                            {r.fulfilledAt && `✓ ${new Date(r.fulfilledAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}
                            {r.responseNotes && (
                              <span className="block text-neutral-400 max-w-[120px] truncate" title={r.responseNotes}>{r.responseNotes}</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fulfil Modal */}
      {fulfilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFulfilModal(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-neutral-900">Fulfil Blood Request</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Dispatch {fulfilModal.units} unit(s) of <span className="font-bold text-red-600">{fulfilModal.bloodType}</span> to{' '}
                  {fulfilModal.hospitalId?.organizationName || fulfilModal.hospitalId?.fullName}
                </p>
              </div>
              <button onClick={() => setFulfilModal(null)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center">
                <XIcon />
              </button>
            </div>
            <form onSubmit={handleFulfilSubmit} className="px-6 py-5 space-y-4">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Blood type</span>
                  <span className="font-bold text-red-600">{fulfilModal.bloodType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Units requested</span>
                  <span className="font-semibold text-neutral-800">{fulfilModal.units}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Priority</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg capitalize ${PRIORITY_COLORS[fulfilModal.priority]}`}>{fulfilModal.priority}</span>
                </div>
                {fulfilModal.notes && (
                  <div className="pt-1 border-t border-blue-100 text-xs text-neutral-500 italic">{fulfilModal.notes}</div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Response Notes (optional)</label>
                <textarea
                  rows={2}
                  value={fulfilNotes}
                  onChange={e => setFulfilNotes(e.target.value)}
                  placeholder="Any notes for the hospital regarding this dispatch…"
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                />
              </div>

              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                This will deduct {fulfilModal.units} unit(s) of {fulfilModal.bloodType} from your inventory.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFulfilModal(null)}
                  className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!acting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {acting ? 'Fulfilling…' : 'Confirm & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-neutral-100">
              <h2 className="font-bold text-neutral-900">Reject Request</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Rejecting {rejectModal.bloodType} request from {rejectModal.hospitalId?.organizationName || rejectModal.hospitalId?.fullName}
              </p>
            </div>
            <form onSubmit={handleRejectSubmit} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Reason for rejection</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Insufficient stock of this blood type…"
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!acting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {acting ? 'Rejecting…' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyRequests() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="5" width="18" height="15" rx="2"/>
          <path d="M3 10h18M8 3v4M16 3v4"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="font-semibold text-neutral-800">No requests</p>
        <p className="text-sm text-neutral-400 mt-1">Hospital blood requests will appear here once submitted.</p>
      </div>
    </div>
  )
}

function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
}
