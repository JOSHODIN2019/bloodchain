import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { hospitalService } from '@/services/hospitalService'
import { Spinner, Alert, Badge } from '@/components/ui'

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

const STATUS_TABS = [
  { key: '',           label: 'All'         },
  { key: 'pending',    label: 'Pending'     },
  { key: 'processing', label: 'Processing'  },
  { key: 'fulfilled',  label: 'Fulfilled'   },
  { key: 'rejected',   label: 'Rejected'    },
  { key: 'cancelled',  label: 'Cancelled'   },
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

export default function HospitalRequests() {
  const { user }                      = useAuth()
  const [requests,   setRequests]     = useState([])
  const [banks,      setBanks]        = useState([])
  const [statusTab,  setStatusTab]    = useState('')
  const [loading,    setLoading]      = useState(true)
  const [error,      setError]        = useState('')
  const [success,    setSuccess]      = useState('')
  const [acting,     setActing]       = useState('')
  const [showModal,  setShowModal]    = useState(false)
  const [submitting, setSubmitting]   = useState(false)

  // Form
  const [selBank,     setSelBank]     = useState('')
  const [selType,     setSelType]     = useState('')
  const [selUnits,    setSelUnits]    = useState('1')
  const [selPriority, setSelPriority] = useState('normal')
  const [selNotes,    setSelNotes]    = useState('')
  const [bankInv,     setBankInv]     = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusTab) params.status = statusTab
      const [r, b] = await Promise.all([
        hospitalService.getRequests(params),
        hospitalService.getBloodBanks(),
      ])
      setRequests(r.requests)
      setBanks(b.banks)
    } catch {
      setError('Could not load requests.')
    } finally {
      setLoading(false)
    }
  }, [statusTab])

  useEffect(() => { load() }, [load])

  // Load inventory preview when bank selected
  useEffect(() => {
    if (!selBank) { setBankInv([]); return }
    hospitalService.getBankInventory(selBank)
      .then(r => setBankInv(r.inventory || []))
      .catch(() => setBankInv([]))
  }, [selBank])

  const openModal = () => {
    setShowModal(true); setSelBank(''); setSelType(''); setSelUnits('1')
    setSelPriority('normal'); setSelNotes(''); setBankInv([])
    setError(''); setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selBank || !selType || !selUnits) return
    setSubmitting(true); setError('')
    try {
      await hospitalService.createRequest({
        bloodBankId: selBank,
        bloodType:   selType,
        units:       Number(selUnits),
        priority:    selPriority,
        notes:       selNotes || undefined,
      })
      setSuccess('Blood request submitted successfully.')
      setShowModal(false)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this blood request?')) return
    setActing(id); setError('')
    try {
      await hospitalService.cancelRequest(id)
      setSuccess('Request cancelled.')
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to cancel request.')
    } finally {
      setActing('')
    }
  }

  const pendingCount = requests.filter(r => ['pending','processing'].includes(r.status)).length
  const selectedBankStock = selType ? (bankInv.find(i => i.bloodType === selType)?.units ?? null) : null

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Blood Requests</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage your hospital's blood unit requests</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {pendingCount} active
            </span>
          )}
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-[0_2px_8px_rgb(37,99,235,0.3)]"
          >
            <PlusIcon /> New Request
          </button>
        </div>
      </div>

      {error   && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Status tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit overflow-x-auto">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setStatusTab(key); setError(''); setSuccess('') }}
            className={[
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
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
          <EmptyRequests onNew={openModal} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  {['Blood Bank', 'Blood Type', 'Units', 'Priority', 'Submitted', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const bank    = r.bloodBankId
                  const canAct  = ['pending','processing'].includes(r.status)
                  const isAct   = acting === r._id
                  return (
                    <tr key={r._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-neutral-900 truncate max-w-[150px]">
                          {bank?.organizationName || bank?.fullName || '—'}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{bank?.userId}</p>
                        {bank?.state && <p className="text-[10px] text-neutral-400">{bank.state}</p>}
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
                          <button
                            disabled={isAct}
                            onClick={() => handleCancel(r._id)}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                          >
                            {isAct ? '…' : 'Cancel'}
                          </button>
                        ) : (
                          <div className="text-xs text-neutral-300">
                            {r.fulfilledAt && `✓ ${new Date(r.fulfilledAt).toLocaleDateString('en-NG',{day:'numeric',month:'short'})}`}
                            {r.responseNotes && (
                              <span className="block text-neutral-400 max-w-[100px] truncate" title={r.responseNotes}>{r.responseNotes}</span>
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

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

            <div className="sticky top-0 bg-white px-6 py-5 border-b border-neutral-100 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="font-bold text-neutral-900">New Blood Request</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Request blood units from a blood bank</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100">
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* Hospital info */}
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {(user?.organizationName || user?.fullName || 'H').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{user?.organizationName || user?.fullName}</p>
                  <p className="text-xs text-neutral-400">{user?.userId} · {user?.state}</p>
                </div>
              </div>

              {/* Blood bank selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Blood Bank *</label>
                <select
                  required
                  value={selBank}
                  onChange={e => setSelBank(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
                >
                  <option value="">— Select a blood bank —</option>
                  {banks.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.organizationName || b.fullName} · {b.state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Blood type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Blood Type *</label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_TYPES.map(bt => {
                    const stock = bankInv.find(i => i.bloodType === bt)
                    return (
                      <button
                        key={bt}
                        type="button"
                        onClick={() => setSelType(bt)}
                        className={[
                          'py-2.5 rounded-xl text-sm font-bold border-2 transition-all relative',
                          selType === bt
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-neutral-200 text-neutral-600 hover:border-neutral-300',
                        ].join(' ')}
                      >
                        {bt}
                        {selBank && stock !== undefined && (
                          <span className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1 rounded-full ${stock.units === 0 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                            {stock.units}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {selBank && selType && selectedBankStock !== null && (
                  <p className={`text-xs font-medium ${selectedBankStock === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedBankStock === 0
                      ? 'This blood type is currently out of stock at the selected bank.'
                      : `${selectedBankStock} unit(s) available at selected bank.`}
                  </p>
                )}
              </div>

              {/* Units */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Units Needed *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="50"
                  value={selUnits}
                  onChange={e => setSelUnits(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {['urgent','high','normal','low'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelPriority(p)}
                      className={[
                        'py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize',
                        selPriority === p
                          ? p === 'urgent' ? 'border-red-500 bg-red-50 text-red-700'
                          : p === 'high'   ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : p === 'normal' ? 'border-blue-400 bg-blue-50 text-blue-700'
                          :                  'border-neutral-400 bg-neutral-50 text-neutral-700'
                          : 'border-neutral-200 text-neutral-500 hover:border-neutral-300',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Notes (optional)</label>
                <textarea
                  rows={2}
                  value={selNotes}
                  onChange={e => setSelNotes(e.target.value)}
                  placeholder="Clinical context, patient details, or special requirements…"
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                />
              </div>

              {selPriority === 'urgent' && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-700 font-medium">
                  Urgent requests are prioritised by the blood bank and trigger immediate notification.
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selBank || !selType || !selUnits}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyRequests({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
          <path d="M14 2v6h6M12 18v-4M10 16h4"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="font-semibold text-neutral-800">No requests yet</p>
        <p className="text-sm text-neutral-400 mt-1">Submit a blood request to your connected blood banks.</p>
      </div>
      <button
        onClick={onNew}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        <PlusIcon /> New Request
      </button>
    </div>
  )
}

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
}
function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
}
