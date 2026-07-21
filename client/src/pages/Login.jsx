import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Alert } from '@/components/ui'

const ROLES = [
  { key: 'donor',     label: 'Donor',          icon: DonorIcon     },
  { key: 'bloodbank', label: 'Blood Bank',      icon: BloodBankIcon },
  { key: 'hospital',  label: 'Hospital',        icon: HospitalIcon  },
  { key: 'admin',     label: 'Administrator',   icon: AdminIcon     },
]

const ROLE_LABELS = { donor: 'Donor', bloodbank: 'Blood Bank', hospital: 'Hospital', admin: 'Administrator' }

const PLACEHOLDERS = {
  donor:     'donor@example.com',
  bloodbank: 'info@bloodbank.com',
  hospital:  'admin@hospital.com',
  admin:     'admin@medrec.com',
}

const IMG = 'https://images.pexels.com/photos/10794860/pexels-photo-10794860.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'

export default function Login() {
  const navigate   = useNavigate()
  const { login, logout, isLoading } = useAuth()
  const [activeRole, setActiveRole]  = useState('donor')
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setServerError('')
    const result = await login(data)
    if (result.success) {
      if (result.user.role !== activeRole) {
        logout()
        setServerError(
          `This account is registered as "${ROLE_LABELS[result.user.role]}", not "${ROLE_LABELS[activeRole]}". Please select the correct tab.`
        )
        return
      }
      const routes = { donor: '/donor', bloodbank: '/bloodbank', hospital: '/hospital', admin: '/admin' }
      navigate(routes[result.user.role] || '/')
    } else {
      setServerError(result.message)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col">
        <img src={IMG} alt="Blood donation" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/92 via-neutral-900/80 to-neutral-900/70" />

        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <BloodDropIcon />
            </div>
            <span className="font-bold text-white text-lg">Blood<span className="text-red-300">Chain</span></span>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-xs font-semibold text-red-300 uppercase tracking-widest mb-4">
              Blockchain Blood Donation
            </p>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              Every Drop<br />Recorded.<br />On Blockchain.
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed max-w-xs">
              Track donations, verify transfers, and save lives — every donation event stored on-chain, permanently auditable, never alterable.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-10">
              {[
                { v: '1,200+', l: 'Registered Donors'   },
                { v: '3.5k',   l: 'Donations Logged'    },
                { v: '100%',   l: 'Record Integrity'     },
                { v: 'IPFS',   l: 'Decentralized'        },
              ].map(({ v, l }) => (
                <div key={l} className="bg-white/10 border border-white/10 rounded-xl px-4 py-3">
                  <p className="text-white font-bold text-lg">{v}</p>
                  <p className="text-neutral-400 text-xs">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-neutral-500 text-xs">© 2025 BloodChain · Final Year Project</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-7">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <BloodDropIcon />
            </div>
            <span className="font-bold text-neutral-900">Blood<span className="text-red-600">Chain</span></span>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
            <p className="text-sm text-neutral-500 mt-1">Sign in to your BloodChain account</p>
          </div>

          {/* Role tabs */}
          <div className="flex bg-neutral-100 p-1 rounded-xl gap-1">
            {ROLES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setActiveRole(key); setServerError('') }}
                className={[
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-semibold transition-all duration-200',
                  activeRole === key
                    ? 'bg-white text-red-600 shadow-[0_1px_3px_rgb(0,0,0,0.1)]'
                    : 'text-neutral-500 hover:text-neutral-700',
                ].join(' ')}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {serverError && <Alert variant="error">{serverError}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder={PLACEHOLDERS[activeRole]}
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern:  { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              required
              error={errors.password?.message}
              hint={activeRole === 'admin' ? 'Default: Admin@12345' : undefined}
              {...register('password', {
                required:  'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />

            <div className="flex items-center justify-end">
              <button type="button" className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors">
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Signing in…' : `Sign In as ${ROLE_LABELS[activeRole]}`}
            </Button>
          </form>

          {activeRole === 'donor' && (
            <p className="text-sm text-center text-neutral-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-red-600 font-semibold hover:text-red-700 transition-colors">
                Register as Donor
              </Link>
            </p>
          )}

          {activeRole !== 'donor' && (
            <p className="text-xs text-center text-neutral-400">
              {activeRole === 'bloodbank' && 'Blood Bank accounts are registered by the Administrator.'}
              {activeRole === 'hospital'  && 'Hospital accounts are registered by the Administrator.'}
              {activeRole === 'admin'     && 'Admin accounts are pre-configured by the system.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Icons ── */
function BloodDropIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0010 0C13 7.5 8 2 8 2z" fill="white" fillOpacity="0.9"/>
      <path d="M6 11c0 1.1.9 2 2 2" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
function DonorIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="5.5" r="2.5"/>
      <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
      <path d="M8 9.5v2M7 10.5h2" />
    </svg>
  )
}
function BloodBankIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="11" rx="1.5"/>
      <path d="M5 3V2M11 3V2"/>
      <path d="M8 6.5C8 6.5 6 8.5 6 9.5a2 2 0 004 0C10 8.5 8 6.5 8 6.5z"/>
    </svg>
  )
}
function HospitalIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="12" height="13" rx="1"/>
      <path d="M8 5v6M5 8h6"/>
    </svg>
  )
}
function AdminIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 1.5L2.5 4v4c0 3 2.5 4.5 5.5 5.5 3-1 5.5-2.5 5.5-5.5V4L8 1.5z"/>
      <path d="M5.5 8l2 2 3-3"/>
    </svg>
  )
}
