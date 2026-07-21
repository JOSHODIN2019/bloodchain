import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Alert } from '@/components/ui'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const IMG = 'https://images.pexels.com/photos/10794860/pexels-photo-10794860.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'

export default function Register() {
  const navigate = useNavigate()
  const { register: signup, isLoading } = useAuth()
  const [serverError, setServerError]   = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    setServerError('')
    const { confirmPassword, ...rest } = data
    const result = await signup(rest)
    if (result.success) {
      navigate('/donor')
    } else {
      setServerError(result.message)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col">
        <img src={IMG} alt="Blood donation" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/92 via-neutral-900/85 to-neutral-900/70" />

        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <BloodDropIcon />
            </div>
            <span className="font-bold text-white text-lg">Blood<span className="text-red-300">Chain</span></span>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-xs font-semibold text-red-300 uppercase tracking-widest mb-4">
              Donor Registration
            </p>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              Your donation<br />saves lives.<br />Start today.
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed max-w-xs">
              Register once. Every donation you make is recorded on the Ethereum blockchain — permanently verifiable, tamper-proof, and traceable.
            </p>

            <div className="mt-10 space-y-3">
              {[
                { icon: '🩸', text: 'Donation history on-chain'         },
                { icon: '🔒', text: 'SHA-256 integrity hashing'          },
                { icon: '📋', text: 'Blood type & eligibility tracked'   },
                { icon: '🏥', text: 'Connected to hospitals nationwide'  },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="text-base">{icon}</span>
                  <span className="text-sm text-neutral-300">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-neutral-500 text-xs">© 2025 BloodChain · Final Year Project</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-6">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <BloodDropIcon />
            </div>
            <span className="font-bold text-neutral-900">Blood<span className="text-red-600">Chain</span></span>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Register as Donor</h1>
            <p className="text-sm text-neutral-500 mt-1">Create your free donor account</p>
          </div>

          {serverError && <Alert variant="error">{serverError}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            <Input
              label="Full Name"
              placeholder="e.g. Chidi Okonkwo"
              required
              error={errors.fullName?.message}
              {...register('fullName', {
                required:  'Full name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern:  { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
              })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+234 800 000 0000"
                error={errors.phone?.message}
                {...register('phone', {
                  pattern: { value: /^[+\d\s\-()]{7,15}$/, message: 'Enter a valid phone number' },
                })}
              />
              <Input
                label="Date of Birth"
                type="date"
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
            </div>

            {/* Blood Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">
                Blood Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_TYPES.map((bt) => (
                  <label key={bt} className="cursor-pointer">
                    <input
                      type="radio"
                      value={bt}
                      className="sr-only peer"
                      {...register('bloodType', { required: 'Please select your blood type' })}
                    />
                    <div className="text-center py-2 px-1 rounded-lg border-2 border-neutral-200 text-sm font-semibold text-neutral-600 transition-all peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-600 hover:border-neutral-300">
                      {bt}
                    </div>
                  </label>
                ))}
              </div>
              {errors.bloodType && (
                <p className="text-xs text-red-600 mt-1">{errors.bloodType.message}</p>
              )}
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              required
              hint="Must include uppercase, lowercase, and a number"
              error={errors.password?.message}
              {...register('password', {
                required:  'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                pattern: {
                  value:   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Must include uppercase, lowercase, and a number',
                },
              })}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === password || 'Passwords do not match',
              })}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Creating account…' : 'Create Donor Account'}
            </Button>
          </form>

          <p className="text-sm text-center text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="text-red-600 font-semibold hover:text-red-700 transition-colors">
              Sign in
            </Link>
          </p>

          <p className="text-xs text-center text-neutral-400 leading-relaxed">
            Blood Bank and Hospital accounts are registered by the Administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

function BloodDropIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0010 0C13 7.5 8 2 8 2z" fill="white" fillOpacity="0.9"/>
      <path d="M6 11c0 1.1.9 2 2 2" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
