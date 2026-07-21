import { useEffect, useState } from 'react'
import { adminService } from '@/services/adminService'
import { Spinner, Alert, Badge } from '@/components/ui'
import VerifyButton from '@/components/VerifyButton'

const TYPE_FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'DONATION', label: 'Donations' },
  { key: 'REQUEST',  label: 'Blood Requests' },
]

const SUBTYPE_VARIANT = {
  CONFIRMED: 'success', FULFILLED: 'success',
  INTENT:    'warning',  PENDING:   'warning',
  PROCESSING:'info',
  REJECTED:  'danger',   CANCELLED: 'neutral',
}

function truncHash(h, n = 14) {
  if (!h) return '—'
  return `${h.slice(0, n)}…${h.slice(-6)}`
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminBlockchain() {
  const [transactions,  setTransactions]  = useState([])
  const [stats,         setStats]         = useState(null)
  const [chainStatus,   setChainStatus]   = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [typeFilter,    setTypeFilter]    = useState('all')
  const [expanded,      setExpanded]      = useState(null)
  const [copied,        setCopied]        = useState(null)

  useEffect(() => {
    Promise.all([
      adminService.getBlockchainTransactions(),
      adminService.getBlockchainStatus(),
    ]).then(([txData, statusData]) => {
      setTransactions(txData.transactions)
      setStats(txData.stats)
      setChainStatus(statusData.blockchain)
    }).catch(() => setError('Could not load blockchain data — start the backend server.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = typeFilter === 'all'
    ? transactions
    : transactions.filter(t => t.type === typeFilter)

  const copyHash = (hash, key) => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const toggle = (id) => setExpanded(prev => prev === id ? null : id)

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Blockchain</h1>
        <p className="text-sm text-neutral-500 mt-0.5">On-chain transactions recorded for donations and blood requests</p>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total On-Chain', value: stats.total,    color: 'bg-slate-50 border-slate-200' },
            { label: 'Donations',      value: stats.donations, color: 'bg-red-50 border-red-200' },
            { label: 'Blood Requests', value: stats.requests,  color: 'bg-purple-50 border-purple-200' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} border rounded-2xl px-5 py-4`}>
              <p className="text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
              <p className="text-xs text-neutral-500 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chain status banner */}
      {chainStatus && (
        chainStatus.isSimulated ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <InfoIcon className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              <span className="font-semibold">Simulation mode active.</span>{' '}
              Configure <code className="font-mono">SEPOLIA_PRIVATE_KEY</code> in <code className="font-mono">server/.env</code> and deploy the contract to enable real Sepolia testnet writes.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
            <p className="text-xs text-emerald-700">
              <span className="font-semibold">Sepolia testnet connected.</span>{' '}
              Real on-chain writes active — contract{' '}
              <code className="font-mono">{chainStatus.address?.slice(0, 10)}…</code>
              {' '}· block <span className="font-semibold tabular-nums">{chainStatus.blockNumber?.toLocaleString()}</span>
              {chainStatus.balanceEth && <> · wallet <span className="font-semibold tabular-nums">{chainStatus.balanceEth} ETH</span></>}
            </p>
          </div>
        )
      )}

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === key
                ? 'bg-red-600 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {label}
            {key !== 'all' && stats && (
              <span className={`ml-1.5 ${typeFilter === key ? 'text-red-200' : 'text-neutral-400'}`}>
                ({key === 'DONATION' ? stats.donations : stats.requests})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Accordion list */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-14 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <ChainIcon className="text-slate-300 w-7 h-7" />
          </div>
          <div>
            <p className="font-semibold text-neutral-700">No on-chain transactions yet</p>
            <p className="text-sm text-neutral-400 mt-1">Records appear here when donations or requests are confirmed with blockchain writes.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => {
            const isOpen = expanded === tx._id
            const isDonation = tx.type === 'DONATION'
            return (
              <div
                key={tx._id}
                className={`bg-white border rounded-xl overflow-hidden transition-all ${
                  isOpen ? 'border-neutral-300 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Summary row — clickable */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
                  onClick={() => toggle(tx._id)}
                >
                  {/* Type icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isDonation ? 'bg-red-50' : 'bg-purple-50'
                  }`}>
                    {isDonation ? <BloodIcon /> : <RequestIcon />}
                  </div>

                  {/* Type + hash */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isDonation ? 'bg-red-50 text-red-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {isDonation ? 'Donation' : 'Blood Request'}
                      </span>
                      <Badge variant={SUBTYPE_VARIANT[tx.subtype] || 'neutral'} size="sm">
                        {(tx.subtype || '').toLowerCase()}
                      </Badge>
                      {tx.blockNumber
                        ? <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">block {tx.blockNumber.toLocaleString()}</span>
                        : <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">simulated</span>
                      }
                    </div>
                    <p className="text-xs font-mono text-neutral-400 mt-0.5 truncate">{truncHash(tx.txHash)}</p>
                  </div>

                  {/* From → To */}
                  <div className="hidden md:block text-right flex-shrink-0">
                    <p className="text-xs font-medium text-neutral-700 truncate max-w-[140px]">{tx.from}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5 truncate max-w-[140px]">→ {tx.to}</p>
                  </div>

                  {/* Blood type + units */}
                  <div className="flex-shrink-0 text-right hidden sm:block">
                    <span className="font-bold text-red-600">{tx.bloodType}</span>
                    <span className="text-neutral-400 text-xs ml-1">{tx.units}u</span>
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0 text-right hidden lg:block">
                    <p className="text-xs text-neutral-400">{fmtDate(tx.timestamp)}</p>
                  </div>

                  <ChevronIcon className={`flex-shrink-0 text-neutral-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded detail panel */}
                {isOpen && (
                  <div className="border-t border-neutral-100 bg-neutral-50/60 px-5 py-5 space-y-4">

                    {/* Detail grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <InfoCell label="Blood Type"  value={<span className="font-bold text-red-600">{tx.bloodType}</span>} />
                      <InfoCell label="Units"       value={`${tx.units} unit${tx.units !== 1 ? 's' : ''}`} />
                      <InfoCell label="From"        value={tx.from} sub={tx.fromId} />
                      <InfoCell label="To"          value={tx.to}   sub={tx.toId} />
                    </div>

                    {/* Hashes */}
                    <div className="space-y-2">
                      <HashRow
                        label="Transaction Hash"
                        value={tx.txHash}
                        link={tx.blockNumber ? `https://sepolia.etherscan.io/tx/${tx.txHash}` : null}
                        copied={copied === `tx-${tx._id}`}
                        onCopy={() => copyHash(tx.txHash, `tx-${tx._id}`)}
                      />
                      {tx.blockNumber && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-white border border-neutral-100 rounded-lg">
                          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide w-32 flex-shrink-0">Block</p>
                          <p className="text-xs font-mono text-emerald-700 font-semibold">{tx.blockNumber.toLocaleString()}</p>
                          <p className="text-[11px] text-neutral-400 ml-auto">{fmtDate(tx.timestamp)}</p>
                        </div>
                      )}
                    </div>

                    {/* Smart contract call */}
                    <div className="bg-neutral-900 rounded-xl px-4 py-3">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1.5">Smart Contract Call</p>
                      <p className="text-xs font-mono text-emerald-400">
                        BloodChainRecord → {isDonation ? 'recordDonation' : 'recordBloodRequest'}(id, {isDonation ? 'donorId' : 'hospitalId'}, bloodBankId, "{tx.bloodType}", {tx.units}, "{(tx.subtype || '').toLowerCase()}")
                      </p>
                    </div>

                    {/* Integrity verification */}
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">Integrity Check</p>
                      {tx.blockNumber
                        ? <VerifyButton id={tx._id} type={isDonation ? 'donation' : 'request'} />
                        : <p className="text-xs text-neutral-400 italic">Verification not available — no on-chain block recorded.</p>
                      }
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-neutral-400 text-center pb-2">
          Showing {filtered.length} of {transactions.length} transactions
        </p>
      )}
    </div>
  )
}

function InfoCell({ label, value, sub }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-neutral-800 mt-0.5">{value}</p>
      {sub && <p className="text-[11px] font-mono text-neutral-400">{sub}</p>}
    </div>
  )
}

function HashRow({ label, value, link, copied, onCopy }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white border border-neutral-100 rounded-lg">
      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide w-32 flex-shrink-0">{label}</p>
      <p className="text-xs font-mono text-neutral-700 flex-1 truncate">{value}</p>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onCopy} className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 transition-colors" title="Copy">
          {copied
            ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"><path d="M2 5l2.5 2.5L8 2"/></svg>
            : <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><rect x="3.5" y="3.5" width="5" height="5" rx="0.8"/><path d="M1 6V1.8A.8.8 0 011.8 1H6"/></svg>
          }
        </button>
        {link && (
          <a href={link} target="_blank" rel="noreferrer"
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-emerald-600 text-[10px] font-bold"
            title="View on Etherscan">↗</a>
        )}
      </div>
    </div>
  )
}

function InfoIcon({ className }) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4.5h.01"/></svg>
}
function ChainIcon({ className }) {
  return <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 12l-1.5 1.5a3 3 0 004.24 4.24l3-3a3 3 0 000-4.24l-1-1"/><path d="M12 8l1.5-1.5a3 3 0 00-4.24-4.24l-3 3a3 3 0 000 4.24l1 1"/></svg>
}
function BloodIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0010 0C13 7.5 8 2 8 2z"/></svg>
}
function RequestIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="12" height="13" rx="1"/><path d="M8 5v6M5 8h6"/></svg>
}
function ChevronIcon({ className }) {
  return <svg className={`w-4 h-4 ${className}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6l4 4 4-4"/></svg>
}
