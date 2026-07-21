import { useState, useEffect, useCallback } from 'react'
import { bloodbankService } from '@/services/bloodbankService'
import { Spinner, Alert, Badge } from '@/components/ui'

const STATUS_TABS = [
  { key: '',           label: 'All'       },
  { key: 'intent',     label: 'Pending'   },
  { key: 'confirmed',  label: 'Confirmed' },
  { key: 'rejected',   label: 'Rejected'  },
]

const STATUS_VARIANT = {
  intent:    'warning',
  confirmed: 'success',
  rejected:  'danger',
  cancelled: 'neutral',
}

export default function BloodBankDonations() {
  const [donations,  setDonations]  = useState([])
  const [statusTab,  setStatusTab]  = useState('')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')
  const [acting,     setActing]     = useState('')          // donationId being actioned
  const [rejectModal, setRejectModal] = useState(null)      // { id, donorName }
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusTab) params.status = statusTab
      const res = await bloodbankService.getDonations(params)
      setDonations(res.donations)
    } catch {
      setError('Could not load donations.')
    } finally {
      setLoading(false)
    }
  }, [statusTab])

  useEffect(() => { load() }, [load])

  const handleConfirm = async (id) => {
    if (!window.confirm('Confirm this donation? This will add blood units to your inventory.')) return
    setActing(id)
    setError('')
    try {
      await bloodbankService.confirmDonation(id)
      setSuccess('Donation confirmed and inventory updated.')
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to confirm donation.')
    } finally {
      setActing('')
    }
  }

  const handleRejectOpen = (donation) => {
    setRejectModal({ id: donation._id, donorName: donation.donorId?.fullName || 'Donor' })
    setRejectReason('')
    setError('')
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    setActing(rejectModal.id)
    try {
      await bloodbankService.rejectDonation(rejectModal.id, rejectReason)
      setSuccess('Donation rejected.')
      setRejectModal(null)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reject donation.')
    } finally {
      setActing('')
    }
  }

  const pendingCount = donations.filter(d => d.status === 'intent').length

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Donation Intents</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Review and confirm incoming donor visits</p>
        </div>
        {pendingCount > 0 && (
          <span className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}
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
        ) : donations.length === 0 ? (
          <EmptyDonations />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  {['Donor', 'Blood Type', 'Units', 'Scheduled', 'Received', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donations.map(d => {
                  const donor     = d.donorId
                  const isActing  = acting === d._id
                  const isPending = d.status === 'intent'
                  return (
                    <tr key={d._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-neutral-900">{donor?.fullName || '—'}</p>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{donor?.userId}</p>
                        {donor?.phone && <p className="text-[10px] text-neutral-400 mt-0.5">{donor.phone}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-red-600">{d.bloodType}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-neutral-600">{d.units} unit{d.units !== 1 ? 's' : ''}</td>
                      <td className="px-5 py-4 text-sm text-neutral-400 whitespace-nowrap">
                        {d.donationDate
                          ? new Date(d.donationDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                          : <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-neutral-400 whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={STATUS_VARIANT[d.status] || 'neutral'} withDot size="sm">
                          {d.status === 'intent' ? 'Pending' : d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={isActing}
                              onClick={() => handleConfirm(d._id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              {isActing ? '…' : 'Confirm'}
                            </button>
                            <button
                              disabled={isActing}
                              onClick={() => handleRejectOpen(d)}
                              className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-300">
                            {d.confirmedAt && `✓ ${new Date(d.confirmedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}
                            {d.rejectedReason && <span className="text-red-400 text-[10px] block max-w-[120px] truncate" title={d.rejectedReason}>{d.rejectedReason}</span>}
                          </span>
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

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-neutral-100">
              <h2 className="font-bold text-neutral-900">Reject Donation</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Rejecting donation from {rejectModal.donorName}</p>
            </div>
            <form onSubmit={handleRejectSubmit} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Reason for rejection</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Donor did not meet health screening requirements…"
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
                  {acting ? 'Rejecting…' : 'Reject Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyDonations() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 2C12 2 5 9 5 14.5a7 7 0 0014 0C19 9 12 2 12 2z"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="font-semibold text-neutral-800">No donation intents</p>
        <p className="text-sm text-neutral-400 mt-1">When donors schedule visits, their requests will appear here.</p>
      </div>
    </div>
  )
}
