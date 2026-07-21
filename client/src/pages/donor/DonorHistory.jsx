import { useState, useEffect } from 'react'
import { donorService } from '@/services/donorService'
import { Spinner, Alert, Badge } from '@/components/ui'

const STATUS_COLOR = {
  intent:    'bg-amber-500',
  confirmed: 'bg-emerald-500',
  cancelled: 'bg-neutral-400',
  rejected:  'bg-red-500',
}
const STATUS_VARIANT = {
  intent: 'warning', confirmed: 'success', cancelled: 'neutral', rejected: 'danger',
}

export default function DonorHistory() {
  const [donations, setDonations] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  useEffect(() => {
    donorService.getDonations({ limit: 100 })
      .then(d => setDonations(d.donations))
      .catch(() => setError('Could not load history.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const grouped = groupByMonth(donations)

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Donation History</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{donations.length} total record{donations.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      {donations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border border-neutral-200">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l3 3"/>
            </svg>
          </div>
          <p className="font-semibold text-neutral-700">No donation records yet</p>
          <p className="text-xs text-neutral-400 text-center max-w-xs">Your donation timeline will appear here once you schedule your first donation.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">{month}</p>
              <div className="relative">
                <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-neutral-100" />
                <div className="space-y-4">
                  {items.map(d => (
                    <div key={d._id} className="flex gap-4 items-start">
                      <div className={`w-8 h-8 rounded-full ${STATUS_COLOR[d.status]} flex items-center justify-center flex-shrink-0 z-10 mt-0.5`}>
                        <StatusIcon status={d.status} />
                      </div>
                      <div className="flex-1 bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">
                              {d.bloodBankId?.organizationName || d.bloodBankId?.fullName || 'Unknown Blood Bank'}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">{d.bloodBankId?.state}</p>
                          </div>
                          <Badge variant={STATUS_VARIANT[d.status]} size="sm" withDot>
                            {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3">
                          <div>
                            <p className="text-[10px] text-neutral-400 font-medium">Blood Type</p>
                            <p className="text-sm font-bold text-red-600 mt-0.5">{d.bloodType}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-neutral-400 font-medium">Units</p>
                            <p className="text-sm font-semibold text-neutral-800 mt-0.5">{d.units}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-neutral-400 font-medium">Date</p>
                            <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                              {formatDate(d.donationDate || d.confirmedAt || d.createdAt)}
                            </p>
                          </div>
                          {d.txHash && (
                            <div>
                              <p className="text-[10px] text-neutral-400 font-medium">Blockchain</p>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${d.txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 mt-0.5 block"
                              >
                                View on-chain ↗
                              </a>
                            </div>
                          )}
                        </div>
                        {d.notes && (
                          <p className="mt-2 text-xs text-neutral-500 italic">"{d.notes}"</p>
                        )}
                        {d.rejectedReason && (
                          <p className="mt-2 text-xs text-red-500">Reason: {d.rejectedReason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function groupByMonth(donations) {
  const groups = {}
  donations.forEach(d => {
    const date = new Date(d.donationDate || d.confirmedAt || d.createdAt)
    const key  = date.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(d)
  })
  return groups
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusIcon({ status }) {
  if (status === 'confirmed') return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>
  if (status === 'rejected')  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2L2 10"/></svg>
  if (status === 'cancelled') return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M6 2v4M6 8v.5"/></svg>
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="6" cy="6" r="4"/><path d="M6 4v2l1.5 1"/></svg>
}
