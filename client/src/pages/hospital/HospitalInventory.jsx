import { useState, useEffect } from 'react'
import { hospitalService } from '@/services/hospitalService'
import { Spinner, Alert } from '@/components/ui'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const BT_PALETTE = {
  'A+':  { ring: 'ring-red-300',    bg: 'bg-red-50',     text: 'text-red-700',    bar: 'bg-red-500'    },
  'A-':  { ring: 'ring-red-200',    bg: 'bg-red-50',     text: 'text-red-600',    bar: 'bg-red-400'    },
  'B+':  { ring: 'ring-orange-300', bg: 'bg-orange-50',  text: 'text-orange-700', bar: 'bg-orange-500' },
  'B-':  { ring: 'ring-orange-200', bg: 'bg-orange-50',  text: 'text-orange-600', bar: 'bg-orange-400' },
  'AB+': { ring: 'ring-purple-300', bg: 'bg-purple-50',  text: 'text-purple-700', bar: 'bg-purple-500' },
  'AB-': { ring: 'ring-purple-200', bg: 'bg-purple-50',  text: 'text-purple-600', bar: 'bg-purple-400' },
  'O+':  { ring: 'ring-emerald-300',bg: 'bg-emerald-50', text: 'text-emerald-700',bar: 'bg-emerald-500'},
  'O-':  { ring: 'ring-emerald-200',bg: 'bg-emerald-50', text: 'text-emerald-600',bar: 'bg-emerald-400'},
}

export default function HospitalInventory() {
  const [banks,   setBanks]   = useState([])
  const [invMap,  setInvMap]  = useState({})
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')
  const [btFilter, setBtFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hospitalService.getAllInventory()
        const bloodBanks = res.banks || res.bloodBanks || []
        setBanks(bloodBanks)
        // Load inventory for all blood banks
        const results = await Promise.allSettled(
          bloodBanks.map(b => hospitalService.getBankInventory(b._id).then(r => ({ id: b._id, inventory: r.inventory })))
        )
        const map = {}
        results.forEach(r => {
          if (r.status === 'fulfilled') map[r.value.id] = r.value.inventory
        })
        setInvMap(map)
      } catch {
        setError('Could not load blood bank inventory — start the backend server.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = banks.filter(b =>
    `${b.organizationName || ''} ${b.fullName || ''} ${b.state || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const getUnits = (bankId, bt) => {
    const inv = invMap[bankId] || []
    const entry = inv.find(i => i.bloodType === bt)
    return entry?.units ?? null
  }

  const totalByType = (bt) =>
    banks.reduce((sum, b) => sum + (getUnits(b._id, bt) ?? 0), 0)

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Blood Stock</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Live inventory across {banks.length} connected blood bank{banks.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      {/* System-wide totals */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {BLOOD_TYPES.map(bt => {
          const total = totalByType(bt)
          const pal   = BT_PALETTE[bt]
          const isLow = total < 5
          return (
            <div
              key={bt}
              onClick={() => setBtFilter(btFilter === bt ? 'all' : bt)}
              className={`cursor-pointer rounded-xl p-3 text-center transition-all ring-1 ${
                btFilter === bt ? `${pal.bg} ${pal.ring} ring-2` : 'bg-white ring-neutral-200'
              }`}
            >
              <p className={`text-sm font-bold ${pal.text}`}>{bt}</p>
              <p className={`text-xl font-bold mt-1 tabular-nums ${isLow ? 'text-red-600' : 'text-neutral-900'}`}>{total}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">units</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            placeholder="Search blood banks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        {btFilter !== 'all' && (
          <button
            onClick={() => setBtFilter('all')}
            className="text-xs px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 transition-colors"
          >
            Showing {btFilter} · Clear filter ×
          </button>
        )}
      </div>

      {/* Per-bank inventory cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 py-16 text-center text-neutral-400 text-sm">
            No blood banks match your search.
          </div>
        ) : filtered.map(bank => {
          const inv = invMap[bank._id] || []
          const showTypes = btFilter === 'all' ? BLOOD_TYPES : [btFilter]
          const hasAny = showTypes.some(bt => (getUnits(bank._id, bt) ?? 0) > 0)

          return (
            <div key={bank._id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-neutral-900">{bank.organizationName || bank.fullName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">{bank.userId}</span>
                    <span className="text-xs text-neutral-400">{bank.state}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-neutral-500">Verified</span>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {showTypes.map(bt => {
                    const units = getUnits(bank._id, bt)
                    const pal   = BT_PALETTE[bt]
                    const isLow = units !== null && units < 5
                    const isZero = units === 0
                    return (
                      <div key={bt} className={`rounded-xl p-3 text-center ring-1 ${
                        isZero ? 'bg-neutral-50 ring-neutral-100' : `${pal.bg} ${pal.ring}`
                      }`}>
                        <p className={`text-xs font-bold ${isZero ? 'text-neutral-300' : pal.text}`}>{bt}</p>
                        <p className={`text-xl font-bold mt-1 tabular-nums ${
                          units === null ? 'text-neutral-300' : isZero ? 'text-neutral-400' : isLow ? 'text-red-600' : 'text-neutral-900'
                        }`}>
                          {units === null ? '—' : units}
                        </p>
                        {isLow && units > 0 && (
                          <p className="text-[9px] text-red-500 mt-0.5 font-semibold">LOW</p>
                        )}
                        {isZero && (
                          <p className="text-[9px] text-neutral-400 mt-0.5">NONE</p>
                        )}
                      </div>
                    )
                  })}
                </div>

                {!hasAny && btFilter !== 'all' && (
                  <p className="text-sm text-neutral-400 text-center mt-3">No {btFilter} stock available at this bank.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4.5h.01"/></svg>
        <p className="text-xs text-blue-600 leading-relaxed">
          Stock levels are updated in real-time when blood banks confirm donations or fulfil requests. Click on a blood type badge above to filter by type across all banks.
        </p>
      </div>
    </div>
  )
}

function SearchIcon({ className }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <circle cx="7" cy="7" r="5.5"/><path d="M11 11l3 3"/>
    </svg>
  )
}
