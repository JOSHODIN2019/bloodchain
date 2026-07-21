import { useEffect, useState } from 'react'
import api from '@/services/authService'
import { Spinner, Alert } from '@/components/ui'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function truncHash(h, n = 14) {
  if (!h) return '—'
  return `${h.slice(0, n)}…${h.slice(-6)}`
}

export default function DoctorBlockchain() {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [copied,   setCopied]   = useState(null)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    api.get('/doctor/blockchain')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }, [])

  const copyHash = (hash, id) => {
    navigator.clipboard.writeText(hash)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" color="blue" /></div>
  if (error)   return <div className="p-6"><Alert variant="danger">{error}</Alert></div>

  const { transactions = [], stats = {} } = data || {}

  const shown = transactions.filter(tx =>
    !search ||
    tx.txHash?.toLowerCase().includes(search.toLowerCase()) ||
    tx.patient?.toLowerCase().includes(search.toLowerCase()) ||
    tx.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Blockchain Transaction History</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Records you have submitted to the blockchain</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Submissions', value: stats.total   ?? 0, color: 'blue'    },
          { label: 'Pending Verification', value: stats.pending  ?? 0, color: 'amber'   },
          { label: 'Verified On-Chain',    value: stats.verified ?? 0, color: 'emerald' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color === 'blue' ? 'text-blue-600' : s.color === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`}>{s.value}</p>
            <p className="text-xs text-neutral-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Network */}
      <div className="flex items-center gap-3 bg-neutral-900 text-white rounded-2xl px-5 py-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-semibold text-emerald-400">Ethereum Sepolia Testnet</span>
        <span className="text-neutral-500 text-xs ml-auto">Simulation Mode</span>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by hash, patient or record title…"
          className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <ChainIcon className="mx-auto mb-3 text-neutral-200 w-10 h-10" />
          <p className="text-neutral-400 font-medium">No blockchain transactions yet</p>
          <p className="text-sm text-neutral-400 mt-1">Upload a medical record to create your first blockchain entry.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((tx, i) => {
            const isOpen = expanded === i
            return (
              <div key={i} className={`bg-white rounded-xl border overflow-hidden transition-colors ${isOpen ? 'border-emerald-300 shadow-sm' : 'border-neutral-200 hover:border-emerald-200'}`}>
                <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setExpanded(isOpen ? null : i)}>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-lg">📄</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{tx.title || 'Medical Record'}</p>
                      {tx.isVerified
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Verified</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">⏳ Pending</span>
                      }
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">Simulated</span>
                    </div>
                    <p className="text-[11px] font-mono text-neutral-400 mt-0.5">{truncHash(tx.txHash, 20)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-neutral-600">Patient: {tx.patient || '—'}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{fmtDate(tx.timestamp)}</p>
                  </div>
                  <ChevronIcon className={`flex-shrink-0 text-neutral-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <HashField label="Transaction Hash" value={tx.txHash}     onCopy={() => copyHash(tx.txHash,     `tx-${i}`)}   copied={copied === `tx-${i}`} />
                      <HashField label="SHA-256 Hash"     value={tx.sha256Hash} onCopy={() => copyHash(tx.sha256Hash, `sha-${i}`)}  copied={copied === `sha-${i}`} />
                      <HashField label="IPFS CID"         value={tx.ipfsHash}   onCopy={() => copyHash(tx.ipfsHash,   `ipfs-${i}`)} copied={copied === `ipfs-${i}`} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <InfoField label="Block Number"  value={tx.blockNumber ? `#${tx.blockNumber}` : 'Pending'} />
                      <InfoField label="Network"       value="Ethereum Sepolia" />
                      <InfoField label="Patient"       value={tx.patient || '—'} />
                      <InfoField label="Patient ID"    value={tx.patientId || '—'} />
                    </div>
                    <div className="bg-neutral-800 rounded-xl px-4 py-3">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Smart Contract Call</p>
                      <p className="text-xs font-mono text-emerald-400">MedRecords.sol → registerRecord(sha256Hash, ipfsHash, patientAddress)</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function HashField({ label, value, onCopy, copied }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
        <button onClick={onCopy} className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-[11px] font-mono text-neutral-700 break-all leading-relaxed">{value || '—'}</p>
    </div>
  )
}
function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
      <p className="text-xs text-neutral-800 mt-0.5 font-medium">{value || '—'}</p>
    </div>
  )
}
function SearchIcon({ className })  { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg> }
function ChainIcon({ className })   { return <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 12l-1.5 1.5a3 3 0 004.24 4.24l3-3a3 3 0 000-4.24l-1-1"/><path d="M12 8l1.5-1.5a3 3 0 00-4.24-4.24l-3 3a3 3 0 000 4.24l1 1"/></svg> }
function ChevronIcon({ className }) { return <svg className={`w-4 h-4 ${className}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6l4 4 4-4"/></svg> }
