import { useEffect, useState } from 'react'
import { patientService } from '@/services/patientService'
import { Button, Spinner, Alert, Avatar, Badge } from '@/components/ui'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PatientAccess() {
  const [doctors,  setDoctors]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(null)
  const [pending,  setPending]  = useState({})

  const loadDoctors = () => {
    setLoading(true)
    patientService.getDoctors()
      .then(r => setDoctors(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadDoctors() }, [])

  const toggleAccess = async (doctor) => {
    setPending(p => ({ ...p, [doctor._id]: true }))
    setError(null); setSuccess(null)
    try {
      if (doctor.hasAccess) {
        await patientService.revokeAccess(doctor._id)
        setSuccess(`Access revoked for ${doctor.fullName}`)
      } else {
        await patientService.grantAccess(doctor._id)
        setSuccess(`Access granted to ${doctor.fullName}`)
      }
      loadDoctors()
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setPending(p => ({ ...p, [doctor._id]: false }))
    }
  }

  const granted  = doctors.filter(d => d.hasAccess)
  const denied   = doctors.filter(d => !d.hasAccess)

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" color="blue" /></div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Access Control</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Manage which doctors can view your medical records.
          All grants are recorded on the blockchain.
        </p>
      </div>

      {error   && <Alert variant="danger"  onDismiss={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" onDismiss={() => setSuccess(null)}>{success}</Alert>}

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <InfoIcon />
        <p className="text-sm text-blue-800">
          Granting access allows a verified doctor to view <strong>all</strong> your current and future records.
          You can revoke access at any time. All changes are logged immutably on the Ethereum blockchain.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-700">{granted.length}</p>
          <p className="text-sm text-emerald-600 font-medium">Active Grants</p>
          <p className="text-xs text-emerald-500 mt-0.5">Doctors with access</p>
        </div>
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-neutral-700">{denied.length}</p>
          <p className="text-sm text-neutral-600 font-medium">No Access</p>
          <p className="text-xs text-neutral-400 mt-0.5">Doctors without access</p>
        </div>
      </div>

      {/* Doctors with access */}
      {granted.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Doctors with access ({granted.length})
          </h2>
          <div className="space-y-2">
            {granted.map(doc => <DoctorCard key={doc._id} doctor={doc} onToggle={toggleAccess} isLoading={!!pending[doc._id]} />)}
          </div>
        </section>
      )}

      {/* All other doctors */}
      {denied.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            Other verified doctors ({denied.length})
          </h2>
          <div className="space-y-2">
            {denied.map(doc => <DoctorCard key={doc._id} doctor={doc} onToggle={toggleAccess} isLoading={!!pending[doc._id]} />)}
          </div>
        </section>
      )}

      {doctors.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <p className="font-medium">No verified doctors registered yet.</p>
          <p className="text-sm mt-1">Doctors will appear here once verified by an admin.</p>
        </div>
      )}
    </div>
  )
}

function DoctorCard({ doctor, onToggle, isLoading }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-4 hover:border-neutral-300 transition-colors">
      <Avatar name={doctor.fullName} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-neutral-900">{doctor.fullName}</p>
          {doctor.specialization && (
            <Badge variant="info" size="sm">{doctor.specialization}</Badge>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">{doctor.hospital}</p>
        {doctor.hasAccess && doctor.grantedAt && (
          <p className="text-[10px] text-emerald-600 mt-0.5">Access granted: {fmtDate(doctor.grantedAt)}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {doctor.hasAccess ? (
          <Button
            variant="danger"
            size="sm"
            isLoading={isLoading}
            onClick={() => onToggle(doctor)}
          >
            Revoke
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            isLoading={isLoading}
            onClick={() => onToggle(doctor)}
          >
            Grant Access
          </Button>
        )}
      </div>
    </div>
  )
}

function InfoIcon() {
  return <svg className="flex-shrink-0 mt-0.5 text-blue-500" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 7v5M8 5v0.5"/></svg>
}
