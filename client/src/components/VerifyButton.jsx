import { useState } from 'react'
import api from '@/services/authService'

/**
 * VerifyButton — checks a donation or request against the on-chain record.
 * Props:
 *   id   — MongoDB _id of the donation or request
 *   type — 'donation' | 'request'
 */
export default function VerifyButton({ id, type }) {
  const [status, setStatus] = useState('idle') // idle | loading | verified | tampered | no_chain | error
  const [result, setResult] = useState(null)

  const verify = async () => {
    setStatus('loading')
    setResult(null)
    try {
      const { data } = await api.get(`/blockchain/verify/${id}?type=${type}`)
      setResult(data)
      if (data.reason === 'no_chain_record') { setStatus('no_chain'); return }
      setStatus(data.verified ? 'verified' : 'tampered')
    } catch (err) {
      setResult({ message: err?.response?.data?.message || 'Verification failed — server error.' })
      setStatus('error')
    }
  }

  const reset = () => { setStatus('idle'); setResult(null) }

  if (status === 'idle') return (
    <button
      onClick={verify}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-neutral-200 bg-white rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-colors text-neutral-600"
    >
      <ShieldIcon className="text-neutral-400" />
      Verify on-chain
    </button>
  )

  if (status === 'loading') return (
    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
      <span className="w-3 h-3 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      Checking chain…
    </span>
  )

  if (status === 'verified') return (
    <div className="space-y-1">
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
        <CheckIcon />
        Authentic — matches on-chain record
      </div>
      <div className="flex items-center gap-2 pl-1">
        <span className="text-[11px] text-neutral-400">Fields verified: {result?.checkedFields?.join(', ')}</span>
        <button onClick={reset} className="text-[11px] text-neutral-400 hover:text-neutral-600 underline">reset</button>
      </div>
    </div>
  )

  if (status === 'tampered') return (
    <div className="space-y-1.5">
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
        <WarnIcon />
        Tampering detected
      </div>
      <ul className="space-y-0.5 pl-1">
        {result?.discrepancies?.map((d, i) => (
          <li key={i} className="text-[11px] text-red-600 flex items-start gap-1">
            <span className="mt-0.5 flex-shrink-0">•</span>{d}
          </li>
        ))}
      </ul>
      <button onClick={reset} className="text-[11px] text-neutral-400 hover:text-neutral-600 underline pl-1">reset</button>
    </div>
  )

  if (status === 'no_chain') return (
    <div className="space-y-1">
      <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
        <ClockIcon />
        Not yet on-chain
      </div>
      <button onClick={reset} className="text-[11px] text-neutral-400 hover:text-neutral-600 underline pl-1">reset</button>
    </div>
  )

  // error
  return (
    <div className="space-y-1">
      <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium">
        <WarnIcon /> {result?.message}
      </span>
      <button onClick={reset} className="text-[11px] text-neutral-400 hover:text-neutral-600 underline pl-1">retry</button>
    </div>
  )
}

function ShieldIcon({ className }) {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <path d="M7 1L2 3v4c0 3 2.5 5.5 5 6 2.5-.5 5-3 5-6V3L7 1z"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
      <path d="M2 6l3 3 5-5"/>
    </svg>
  )
}
function WarnIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M6 1L1 10h10L6 1z"/><path d="M6 5v2.5M6 9v.5"/>
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="6" r="5"/><path d="M6 3.5V6l2 1.5"/>
    </svg>
  )
}
