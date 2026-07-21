import { useState, useEffect, useCallback } from 'react'
import { bloodbankService } from '@/services/bloodbankService'
import { Spinner, Alert } from '@/components/ui'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const BT_PALETTE = {
  'A+':  { ring: 'ring-red-400',    bg: 'bg-red-50',     text: 'text-red-700',     badge: 'bg-red-100',    dot: 'bg-red-400'    },
  'A-':  { ring: 'ring-rose-400',   bg: 'bg-rose-50',    text: 'text-rose-700',    badge: 'bg-rose-100',   dot: 'bg-rose-400'   },
  'B+':  { ring: 'ring-amber-400',  bg: 'bg-amber-50',   text: 'text-amber-700',   badge: 'bg-amber-100',  dot: 'bg-amber-400'  },
  'B-':  { ring: 'ring-orange-400', bg: 'bg-orange-50',  text: 'text-orange-700',  badge: 'bg-orange-100', dot: 'bg-orange-400' },
  'AB+': { ring: 'ring-purple-400', bg: 'bg-purple-50',  text: 'text-purple-700',  badge: 'bg-purple-100', dot: 'bg-purple-400' },
  'AB-': { ring: 'ring-violet-400', bg: 'bg-violet-50',  text: 'text-violet-700',  badge: 'bg-violet-100', dot: 'bg-violet-400' },
  'O+':  { ring: 'ring-emerald-400',bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100',dot: 'bg-emerald-400'},
  'O-':  { ring: 'ring-teal-400',   bg: 'bg-teal-50',    text: 'text-teal-700',    badge: 'bg-teal-100',   dot: 'bg-teal-400'   },
}

export default function BloodBankInventory() {
  const [inventory, setInventory]   = useState([])
  const [loading,   setLoading]     = useState(true)
  const [error,     setError]       = useState('')
  const [success,   setSuccess]     = useState('')
  const [editing,   setEditing]     = useState(null)   // bloodType being edited in modal
  const [saving,    setSaving]      = useState(false)

  // Modal form state
  const [adjValue,  setAdjValue]    = useState('')
  const [adjOp,     setAdjOp]       = useState('add')
  const [adjMin,    setAdjMin]      = useState('')

  const load = useCallback(async () => {
    try {
      const res = await bloodbankService.getInventory()
      setInventory(res.inventory)
    } catch {
      setError('Could not load inventory.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openEdit = (item) => {
    setEditing(item)
    setAdjValue('')
    setAdjOp('add')
    setAdjMin(String(item.minimumLevel))
    setError('')
    setSuccess('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = { operation: adjOp }
      if (adjValue !== '') body.units = Number(adjValue)
      if (adjMin   !== '') body.minimumLevel = Number(adjMin)

      await bloodbankService.updateInventory(editing.bloodType, body)
      setSuccess(`${editing.bloodType} inventory updated.`)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update inventory.')
    } finally {
      setSaving(false)
    }
  }

  const totalUnits    = inventory.reduce((s, i) => s + i.units, 0)
  const criticalTypes = inventory.filter(i => i.critical || i.units === 0)

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Blood Inventory</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage stock levels for all 8 blood types</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-neutral-900">{totalUnits}</p>
            <p className="text-xs text-neutral-400">total units</p>
          </div>
          {criticalTypes.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {criticalTypes.length} type{criticalTypes.length !== 1 ? 's' : ''} critical
            </div>
          )}
        </div>
      </div>

      {error   && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Critical banner */}
          {criticalTypes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
              <p className="text-sm font-semibold text-red-800 mb-1">Critical Stock Alert</p>
              <p className="text-xs text-red-600">
                {criticalTypes.map(i => i.bloodType).join(', ')} {criticalTypes.length === 1 ? 'is' : 'are'} below minimum level. Update inventory as soon as possible.
              </p>
            </div>
          )}

          {/* Inventory grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BLOOD_TYPES.map(bt => {
              const item    = inventory.find(i => i.bloodType === bt) || { bloodType: bt, units: 0, minimumLevel: 5, critical: true }
              const pal     = BT_PALETTE[bt]
              const isCrit  = item.critical || item.units === 0
              const pct     = item.minimumLevel > 0 ? Math.min(100, Math.round((item.units / (item.minimumLevel * 3)) * 100)) : 100
              return (
                <div
                  key={bt}
                  className={`bg-white rounded-2xl border-2 p-5 transition-all cursor-pointer hover:shadow-md ${isCrit ? 'border-red-300' : 'border-neutral-200 hover:border-neutral-300'}`}
                  onClick={() => openEdit(item)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${pal.badge} ${pal.text}`}>{bt}</span>
                    {isCrit && (
                      <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md">LOW</span>
                    )}
                  </div>

                  <p className="text-3xl font-bold text-neutral-900 leading-none">{item.units}</p>
                  <p className="text-xs text-neutral-400 mt-1">units in stock</p>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isCrit ? 'bg-red-400' : pal.dot}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1.5">
                    Min: {item.minimumLevel} · {pct}% of target
                  </p>

                  <button className={`mt-3 w-full text-xs font-semibold py-1.5 rounded-lg ${pal.bg} ${pal.text} hover:opacity-80 transition-opacity`}>
                    Update Stock
                  </button>
                </div>
              )
            })}
          </div>

          {/* Summary table */}
          <div className="bg-white rounded-2xl border border-neutral-200">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900">Inventory Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {['Blood Type', 'Units', 'Min Level', 'Status', 'Last Updated', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BLOOD_TYPES.map(bt => {
                    const item   = inventory.find(i => i.bloodType === bt) || { bloodType: bt, units: 0, minimumLevel: 5, critical: true }
                    const isCrit = item.critical || item.units === 0
                    const pal    = BT_PALETTE[bt]
                    return (
                      <tr key={bt} className="border-b border-neutral-50 hover:bg-neutral-50">
                        <td className="px-5 py-3.5">
                          <span className={`font-bold px-2 py-0.5 rounded-lg text-xs ${pal.badge} ${pal.text}`}>{bt}</span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-neutral-900 tabular-nums">{item.units}</td>
                        <td className="px-5 py-3.5 text-neutral-500 tabular-nums">{item.minimumLevel}</td>
                        <td className="px-5 py-3.5">
                          {isCrit ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Critical
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> OK
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-neutral-400">
                          {item.lastUpdated
                            ? new Date(item.lastUpdated).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => openEdit(item)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                          >
                            Edit →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-neutral-900">Update {editing.bloodType} Stock</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Current: {editing.units} units</p>
              </div>
              <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center">
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              {/* Operation selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Operation</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'add',  label: '+ Add'   },
                    { key: 'sub',  label: '− Subtract' },
                    { key: 'set',  label: '= Set'   },
                  ].map(op => (
                    <button
                      key={op.key}
                      type="button"
                      onClick={() => setAdjOp(op.key)}
                      className={[
                        'py-2 rounded-xl text-sm font-semibold border-2 transition-all',
                        adjOp === op.key
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-neutral-200 text-neutral-500 hover:border-neutral-300',
                      ].join(' ')}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Units value */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">
                  Units to {adjOp === 'set' ? 'set' : adjOp === 'add' ? 'add' : 'subtract'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjValue}
                  onChange={e => setAdjValue(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                {adjValue !== '' && adjOp !== 'set' && (
                  <p className="text-xs text-neutral-400">
                    New total: <span className="font-semibold text-neutral-700">
                      {adjOp === 'add'
                        ? editing.units + Number(adjValue)
                        : Math.max(0, editing.units - Number(adjValue))} units
                    </span>
                  </p>
                )}
              </div>

              {/* Minimum level */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Minimum Level (optional)</label>
                <input
                  type="number"
                  min="0"
                  value={adjMin}
                  onChange={e => setAdjMin(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <p className="text-xs text-neutral-400">Stock below this level will be flagged as critical.</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || adjValue === ''}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {saving ? 'Saving…' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
}
