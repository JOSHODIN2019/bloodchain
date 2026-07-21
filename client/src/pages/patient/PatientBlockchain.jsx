import { useEffect, useState } from 'react'
import api from '@/services/authService'
import { Spinner, Alert } from '@/components/ui'

const TYPE_CFG = {
  RECORD_UPLOAD:   { label: 'Record Uploaded',  icon: '📄', color: 'emerald' },
  RECORD_UPLOADED: { label: 'Record Uploaded',  icon: '📄', color: 'emerald' },
  ACCESS_GRANTED:  { label: 'Access Granted',   icon: '🔓', color: 'blue'    },
  ACCESS_REVOKED:  { label: 'Access Revoked',   icon: '🔒', color: 'red'     },
  RECORD_VERIFIED: { label: 'Record Verified',  icon: '✅', color: 'purple'  },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function truncHash(h, n = 14) {
  if (!h) return '—'
  return `${h.slice(0, n)}…${h.slice(-6)}`
}

export default function PatientBlockchain() {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [copied,   setCopied]   = useState(null)

  useEffect(() => {
    api.get('/patient/blockchain')
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Blockchain Transaction History</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Every transaction involving your medical records on the blockchain</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total On-Chain',  value: stats.total        ?? 0, color: 'bg-blue-50 text-blue-600'    },
          { label: 'Record Uploads',  value: stats.recordUploads ?? 0, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Access Events',   value: stats.accessEvents  ?? 0, color: 'bg-purple-50 text-purple-600'  },
          { label: 'Verified',        value: stats.verified      ?? 0, color: 'bg-yellow-50 text-yellow-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
            <p className="text-xs text-neutral-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Network badge */}
      <div className="flex items-center gap-3 bg-neutral-900 text-white rounded-2xl px-5 py-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-semibold text-emerald-400">Ethereum Sepolia Testnet</span>
        <span className="text-neutral-500 text-xs ml-auto">Simulation Mode — your data is cryptographically protected</span>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <span className="text-blue-500 mt-0.5 flex-shrink-0">ℹ</span>
        <p className="text-sm text-blue-800">
          Every time a doctor uploads a record, its <strong>SHA-256 hash</strong> and <strong>IPFS address</strong> are
          permanently written to the blockchain. This means your records can never be silently modified — any tampering
          is instantly detectable.
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <ChainIcon className="mx-auto mb-3 text-neutral-200 w-10 h-10" />
          <p className="text-neutral-400 font-medium">No blockchain transactions yet</p>
          <p className="text-sm text-neutral-400 mt-1">Transactions will appear here when your doctor uploads records.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx, i) => {
            const cfg   = TYPE_CFG[tx.type] || { label: tx.type, icon: '⛓', color: 'neutral' }
            const isOpen = expanded === i
            const colorMap = {
              emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              blue:    'bg-blue-50 text-blue-700 border-blue-200',
              red:     'bg-red-50 text-red-700 border-red-200',
              purple:  'bg-purple-50 text-purple-700 border-purple-200',
              neutral: 'bg-neutral-100 text-neutral-600',
            }
            const iconBg = {
              emerald: 'bg-emerald-50', blue: 'bg-blue-50', red: 'bg-red-50', purple: 'bg-purple-50', neutral: 'bg-neutral-100',
            }

            return (
              <div key={i} className={`bg-white rounded-xl border overflow-hidden transition-colors ${isOpen ? 'border-blue-300 shadow-sm' : 'border-neutral-200 hover:border-blue-200'}`}>
                <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setExpanded(isOpen ? null : i)}>
                  <div className={`w-10 h-10 rounded-xl ${iconBg[cfg.color] || 'bg-neutral-100'} flex items-center justify-center flex-shrink-0 text-lg`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colorMap[cfg.color] || colorMap.neutral}`}>
                        {cfg.label}
                      </span>
                      {tx.isVerified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Verified</span>
                      )}
                    </div>
                    {tx.title
                      ? <p className="text-xs font-medium text-neutral-700 mt-0.5">{tx.title}</p>
                      : <p className="text-[11px] font-mono text-neutral-400 mt-0.5">{truncHash(tx.txHash, 20)}</p>
                    }
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-neutral-500">{tx.from || '—'}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{fmtDate(tx.timestamp)}</p>
                  </div>
                  <ChevronIcon className={`flex-shrink-0 text-neutral-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <HashField label="Transaction Hash" value={tx.txHash}     onCopy={() => copyHash(tx.txHash,     `tx-${i}`)}   copied={copied === `tx-${i}`} />
                      {tx.sha256Hash && <HashField label="SHA-256 File Hash" value={tx.sha256Hash} onCopy={() => copyHash(tx.sha256Hash, `sha-${i}`)} copied={copied === `sha-${i}`} />}
                      {tx.ipfsHash   && <HashField label="IPFS CID"         value={tx.ipfsHash}   onCopy={() => copyHash(tx.ipfsHash,   `ipfs-${i}`)} copied={copied === `ipfs-${i}`} />}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <InfoField label="Block Number" value={tx.blockNumber ? `#${tx.blockNumber}` : 'Pending'} />
                      <InfoField label="Network"      value="Ethereum Sepolia" />
                      <InfoField label="Initiated By" value={tx.from || '—'} />
                    </div>
                    <div className="bg-neutral-800 rounded-xl px-4 py-3">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Smart Contract (Simulated)</p>
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
        <button onClick={onCopy} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">
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
function ChainIcon({ className })   { return <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 12l-1.5 1.5a3 3 0 004.24 4.24l3-3a3 3 0 000-4.24l-1-1"/><path d="M12 8l1.5-1.5a3 3 0 00-4.24-4.24l-3 3a3 3 0 000 4.24l1 1"/></svg> }
function ChevronIcon({ className }) { return <svg className={`w-4 h-4 ${className}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6l4 4 4-4"/></svg> }
