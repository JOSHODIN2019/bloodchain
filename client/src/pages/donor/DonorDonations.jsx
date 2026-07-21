import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { donorService } from '@/services/donorService'
import { Spinner, Alert, Badge } from '@/components/ui'

const STATUS_TABS = [
  { key: '',           label: 'All'       },
  { key: 'intent',     label: 'Pending'   },
  { key: 'confirmed',  label: 'Confirmed' },
  { key: 'cancelled',  label: 'Cancelled' },
  { key: 'rejected',   label: 'Rejected'  },
]

const STATUS_VARIANT = {
  intent:    'warning',
  confirmed: 'success',
  cancelled: 'neutral',
  rejected:  'danger',
}

export default function DonorDonations() {
  const { user }                      = useAuth()
  const [donations,  setDonations]    = useState([])
  const [banks,      setBanks]        = useState([])
  const [loading,    setLoading]      = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [error,      setError]        = useState('')
  const [success,    setSuccess]      = useState('')
  const [statusTab,  setStatusTab]    = useState('')
  const [showModal,  setShowModal]    = useState(false)

  // Form state
  const [selBank,  setSelBank]  = useState('')
  const [selDate,  setSelDate]  = useState('')
  const [selNotes, setSelNotes] = useState('')

  const load = useCallback(async () => {
    try {
      const params = {}
      if (statusTab) params.status = statusTab
      const [d, b] = await Promise.all([
        donorService.getDonations(params),
        donorService.getBloodBanks(),
      ])
      setDonations(d.donations)
      setBanks(b.banks)
    } catch {
      setError('Could not load donations.')
    } finally {
      setLoading(false)
    }
  }, [statusTab])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selBank) return
    setSubmitting(true)
    setError('')
    try {
      await donorService.createDonation({
        bloodBankId:  selBank,
        donationDate: selDate || undefined,
        notes:        selNotes || undefined,
      })
      setSuccess('Donation intent submitted! The blood bank will confirm your visit.')
      setShowModal(false)
      setSelBank('')
      setSelDate('')
      setSelNotes('')
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit donation.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this donation intent?')) return
    try {
      await donorService.cancelDonation(id)
      await load()
    } catch {
      setError('Could not cancel donation.')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Donations</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Track all your blood donation records</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(''); setSuccess('') }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-[0_2px_8px_rgb(220,38,38,0.3)]"
        >
          <PlusIcon />
          Schedule Donation
        </button>
      </div>

      {error   && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Status tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setStatusTab(key); setLoading(true) }}
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
          <EmptyState onSchedule={() => setShowModal(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  {['Blood Bank', 'State', 'Blood Type', 'Units', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-neutral-900 truncate max-w-[160px]">
                        {d.bloodBankId?.organizationName || d.bloodBankId?.fullName || '—'}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono">{d.bloodBankId?.userId}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-500">{d.bloodBankId?.state || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-red-600">{d.bloodType}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-600">{d.units} unit{d.units !== 1 ? 's' : ''}</td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_VARIANT[d.status] || 'neutral'} withDot size="sm">
                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-400 whitespace-nowrap">
                      {d.donationDate
                        ? new Date(d.donationDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                        : d.confirmedAt
                          ? new Date(d.confirmedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                          : new Date(d.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      {d.status === 'intent' && (
                        <button
                          onClick={() => handleCancel(d._id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      {d.txHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${d.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          On-Chain ↗
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Donation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md">

            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-neutral-900">Schedule Donation</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Submit your donation intent to a blood bank</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100">
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Blood type preview */}
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user?.bloodType || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Your blood type: {user?.bloodType || 'Unknown'}</p>
                  <p className="text-xs text-neutral-400">1 unit will be donated</p>
                </div>
              </div>

              {/* Blood bank selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Select Blood Bank *</label>
                <select
                  required
                  value={selBank}
                  onChange={e => setSelBank(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 bg-white"
                >
                  <option value="">— Choose a blood bank —</option>
                  {banks.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.organizationName || b.fullName} · {b.state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date (optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Preferred Date (optional)</label>
                <input
                  type="date"
                  value={selDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSelDate(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Notes (optional)</label>
                <textarea
                  value={selNotes}
                  onChange={e => setSelNotes(e.target.value)}
                  rows={2}
                  placeholder="Any special requirements or notes for the blood bank…"
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selBank}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Submit Intent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ onSchedule }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
          <path d="M14 3C14 3 6 11 6 17a8 8 0 0016 0C22 11 14 3 14 3z"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="font-semibold text-neutral-800">No donations yet</p>
        <p className="text-sm text-neutral-400 mt-1 max-w-xs">Schedule your first donation to get started. Every drop saves lives.</p>
      </div>
      <button
        onClick={onSchedule}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        <PlusIcon />
        Schedule First Donation
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
