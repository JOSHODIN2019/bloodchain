import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

import Landing  from '@/pages/Landing'
import Login    from '@/pages/Login'
import Register from '@/pages/Register'

/* Admin portal */
import AdminLayout    from '@/pages/admin/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminDoctors   from '@/pages/admin/AdminDoctors'
import AdminHospitals from '@/pages/admin/AdminHospitals'
import AdminPatients  from '@/pages/admin/AdminPatients'
import AdminAudit       from '@/pages/admin/AdminAudit'
import AdminRecords     from '@/pages/admin/AdminRecords'
import AdminBlockchain  from '@/pages/admin/AdminBlockchain'

/* Donor portal */
import DonorLayout      from '@/pages/donor/DonorLayout'
import DonorDashboard   from '@/pages/donor/DonorDashboard'
import DonorDonations   from '@/pages/donor/DonorDonations'
import DonorHistory     from '@/pages/donor/DonorHistory'
import DonorBlockchain  from '@/pages/donor/DonorBlockchain'
import DonorSettings    from '@/pages/donor/DonorSettings'

/* Blood Bank portal */
import BloodBankLayout     from '@/pages/bloodbank/BloodBankLayout'
import BloodBankDashboard  from '@/pages/bloodbank/BloodBankDashboard'
import BloodBankDonations  from '@/pages/bloodbank/BloodBankDonations'
import BloodBankInventory  from '@/pages/bloodbank/BloodBankInventory'
import BloodBankRequests   from '@/pages/bloodbank/BloodBankRequests'
import BloodBankBlockchain from '@/pages/bloodbank/BloodBankBlockchain'
import BloodBankSettings   from '@/pages/bloodbank/BloodBankSettings'

/* Hospital portal */
import HospitalLayout    from '@/pages/hospital/HospitalLayout'
import HospitalDashboard from '@/pages/hospital/HospitalDashboard'
import HospitalRequests  from '@/pages/hospital/HospitalRequests'
import HospitalInventory from '@/pages/hospital/HospitalInventory'
import HospitalBlockchain from '@/pages/hospital/HospitalBlockchain'
import HospitalSettings  from '@/pages/hospital/HospitalSettings'

import Settings from '@/pages/Settings'

const ROLE_ROUTES = { donor: '/donor', bloodbank: '/bloodbank', hospital: '/hospital', admin: '/admin' }

function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return children
  return <Navigate to={ROLE_ROUTES[user?.role] || '/'} replace />
}

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to={ROLE_ROUTES[user?.role] || '/'} replace />
  return children
}

const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center h-full min-h-64 p-8">
    <div className="text-center space-y-2">
      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mx-auto">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="9" cy="9" r="7.5"/><path d="M9 5v4l2.5 2"/></svg>
      </div>
      <p className="text-sm font-semibold text-neutral-800">{title}</p>
      <p className="text-xs text-neutral-400">Coming in the next stage.</p>
    </div>
  </div>
)

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />

      {/* Auth */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* ── Admin portal ── */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index              element={<AdminDashboard />} />
        <Route path="bloodbanks"  element={<AdminDoctors />} />
        <Route path="hospitals"   element={<AdminHospitals />} />
        <Route path="donors"      element={<AdminPatients />} />
        <Route path="records"     element={<AdminRecords />} />
        <Route path="blockchain"  element={<AdminBlockchain />} />
        <Route path="audit"       element={<AdminAudit />} />
        <Route path="settings"    element={<Settings />} />
      </Route>

      {/* ── Donor portal ── */}
      <Route path="/donor" element={<ProtectedRoute role="donor"><DonorLayout /></ProtectedRoute>}>
        <Route index              element={<DonorDashboard />} />
        <Route path="donations"   element={<DonorDonations />} />
        <Route path="history"     element={<DonorHistory />} />
        <Route path="blockchain"  element={<DonorBlockchain />} />
        <Route path="settings"    element={<DonorSettings />} />
      </Route>

      {/* ── Blood Bank portal ── */}
      <Route path="/bloodbank" element={<ProtectedRoute role="bloodbank"><BloodBankLayout /></ProtectedRoute>}>
        <Route index              element={<BloodBankDashboard />} />
        <Route path="donations"   element={<BloodBankDonations />} />
        <Route path="inventory"   element={<BloodBankInventory />} />
        <Route path="requests"    element={<BloodBankRequests />} />
        <Route path="blockchain"  element={<BloodBankBlockchain />} />
        <Route path="settings"    element={<BloodBankSettings />} />
      </Route>

      {/* ── Hospital portal ── */}
      <Route path="/hospital" element={<ProtectedRoute role="hospital"><HospitalLayout /></ProtectedRoute>}>
        <Route index              element={<HospitalDashboard />} />
        <Route path="requests"    element={<HospitalRequests />} />
        <Route path="inventory"   element={<HospitalInventory />} />
        <Route path="blockchain"  element={<HospitalBlockchain />} />
        <Route path="settings"    element={<HospitalSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
