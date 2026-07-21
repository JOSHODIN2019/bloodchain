import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { hospitalService } from '@/services/hospitalService'
import { Spinner, Alert, Badge } from '@/components/ui'
import VerifyButton from '@/components/VerifyButton'

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  normal: 'bg-neutral-100 text-neutral-600',
  low:    'bg-blue-50 text-blue-600',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function HospitalBlockchain() {
  const { user }              = useAuth()
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    hospitalService.getBlockchain()
      .then(d => setRequests(d.requests))
      .catch(() => setError('Could not load blockchain records.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Blockchain Trail</h1>
        <p className="text-sm text-neutral-500 mt-0.5">On-chain blood request records on Ethereum Sepolia</p>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      {/* Network banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <ChainIcon />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Ethereum Sepolia Testnet</p>
            <p className="text-slate-400 text-xs mt-0.5">{user?.organizationName || user?.fullName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-white font-bold text-lg leading-none">{requests.length}</p>
            <p className="text-slate-400 text-[10px] mt-1">On-Chain</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Identity block */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5">
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Hospital Identity</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Hospital ID',    value: user?.userId,           mono: true  },
            { label: 'Organisation',   value: user?.organizationName, mono: false },
            { label: 'State',          value: user?.state,            mono: false },
          ].map(({ label, value, mono }) => (
            <div key={label} className="bg-neutral-50 rounded-xl px-4 py-3">
              <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide">{label}</p>
              <p className={`text-sm font-bold text-neutral-900 mt-1 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Records */}
      {requests.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 7l7-4 7 4v10l-7 4-7-4V7z"/><path d="M14 3v18M7 7l7 4 7-4"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold text-neutral-700">No on-chain records yet</p>
            <p className="text-sm text-neutral-400 mt-1 max-w-xs">Fulfilled blood requests get recorded on the Ethereum Sepolia blockchain. Once a blood bank fulfils your request, a transaction hash will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{requests.length} on-chain record{requests.length !== 1 ? 's' : ''}</p>
          {requests.map((r, i) => (
            <div key={r._id} className="bg-white border border-neutral-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-700">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {r.bloodBankId?.organizationName || r.bloodBankId?.fullName}
                    </p>
                    <p className="text-xs text-neutral-400">{fmtDate(r.fulfilledAt || r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-600">{r.bloodType}</span>
                  <span className="text-xs text-neutral-500">{r.units} unit{r.units !== 1 ? 's' : ''}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg capitalize ${PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.normal}`}>{r.priority}</span>
                  <Badge variant="success" size="sm">Fulfilled</Badge>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {r.txHash && <HashRow label="Transaction Hash" value={r.txHash} link={`https://sepolia.etherscan.io/tx/${r.txHash}`} />}
                {r.blockchainHash && <HashRow label="Data Hash" value={r.blockchainHash} />}
                {r.blockNumber && (
                  <div className="flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-lg">
                    <p className="text-xs text-neutral-400 font-medium w-36 flex-shrink-0">Block Number</p>
                    <p className="text-xs font-mono text-neutral-700">{r.blockNumber.toLocaleString()}</p>
                  </div>
                )}
                {!r.txHash && !r.blockNumber && (
                  <div className="px-3 py-2 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-600 italic">Simulation mode — configure blockchain credentials to record real on-chain transactions.</p>
                  </div>
                )}
              </div>
              {r.blockNumber && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <VerifyButton id={r._id} type="request" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4.5h.01"/></svg>
        <p className="text-xs text-blue-600 leading-relaxed">
          Blockchain records are permanent and tamper-proof. Each fulfilled blood request creates an immutable transaction on Ethereum Sepolia, providing a verifiable audit trail for emergency supply chains.
        </p>
      </div>
    </div>
  )
}

function HashRow({ label, value, link }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-lg">
      <p className="text-xs text-neutral-400 font-medium w-36 flex-shrink-0">{label}</p>
      <p className="text-xs font-mono text-neutral-700 flex-1 truncate">{value}</p>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={copy} className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-200 transition-colors" title="Copy">
          {copied
            ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"><path d="M1.5 5l2.5 2.5L8.5 2"/></svg>
            : <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><rect x="3.5" y="3.5" width="5" height="5" rx="0.8"/><path d="M1 6V1.8A.8.8 0 011.8 1H6"/></svg>
          }
        </button>
        {link && (
          <a href={link} target="_blank" rel="noreferrer" className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-200 transition-colors text-neutral-400 hover:text-emerald-600 text-[10px] font-bold" title="View on Etherscan">↗</a>
        )}
      </div>
    </div>
  )
}

function ChainIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 9.5l-1 1a2.5 2.5 0 003.54 3.54l2.5-2.5a2.5 2.5 0 000-3.54l-.75-.75"/><path d="M9.5 6.5l1-1a2.5 2.5 0 00-3.54-3.54l-2.5 2.5a2.5 2.5 0 000 3.54l.75.75"/></svg> }
