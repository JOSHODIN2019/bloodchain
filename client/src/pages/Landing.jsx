import { Link } from 'react-router-dom'
import { Button, Badge } from '@/components/ui'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const IMG = {
  heroBg:   'https://images.pexels.com/photos/10794860/pexels-photo-10794860.jpeg?auto=compress&cs=tinysrgb&w=900&h=1000&fit=crop',
  donor1:   'https://images.pexels.com/photos/5452224/pexels-photo-5452224.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  donor2:   'https://images.pexels.com/photos/5452298/pexels-photo-5452298.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  donor3:   'https://images.pexels.com/photos/4989134/pexels-photo-4989134.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  donor4:   'https://images.pexels.com/photos/4989132/pexels-photo-4989132.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  staff1:   'https://images.pexels.com/photos/7580257/pexels-photo-7580257.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  staff2:   'https://images.pexels.com/photos/5234487/pexels-photo-5234487.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
  staff3:   'https://images.pexels.com/photos/4989139/pexels-photo-4989139.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
  facility: 'https://images.pexels.com/photos/4989171/pexels-photo-4989171.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop',
  cta1:     'https://images.pexels.com/photos/4989132/pexels-photo-4989132.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
  cta2:     'https://images.pexels.com/photos/4989134/pexels-photo-4989134.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
  cta3:     'https://images.pexels.com/photos/5234487/pexels-photo-5234487.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <NetworkSection />
      <HowItWorksSection />
      <RolesSection />
      <CtaSection />
      <Footer />
    </div>
  )
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function HeroSection() {
  return (
    <section id="hero" className="min-h-screen flex items-center pt-16 overflow-hidden bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16 w-full">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT — Text */}
          <div className="space-y-8 order-2 md:order-1">
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Powered by Ethereum Blockchain
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl lg:text-[3.5rem] font-bold text-neutral-900 leading-[1.1] tracking-tight">
                Every Drop<br />
                Recorded.<br />
                <span className="text-red-600">On Blockchain.</span>
              </h1>
              <p className="text-lg text-neutral-500 leading-relaxed max-w-md">
                Track blood donations, verify transfers, and save lives — every donation event stored on-chain, permanently auditable, never alterable.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" variant="primary" className="bg-red-600 hover:bg-red-700 border-red-600">
                  Register as Donor <Arrow />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">Log In</Button>
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex -space-x-2.5">
                {[IMG.donor1, IMG.donor2, IMG.donor3, IMG.donor4].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Blood donor"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">1,200+ Donors & Hospitals</p>
                <p className="text-xs text-neutral-400">Trusted across Nigerian blood banks</p>
              </div>
            </div>
          </div>

          {/* RIGHT — Photo + overlays */}
          <div className="relative order-1 md:order-2 flex justify-center">
            <div className="relative w-full max-w-md">

              {/* Main photo */}
              <div className="relative rounded-3xl overflow-hidden h-[480px] md:h-[560px] shadow-2xl">
                <img
                  src={IMG.heroBg}
                  alt="Blood donation in progress"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/10 to-transparent" />

                {/* Bottom-left overlay — donor card */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl flex items-center gap-3">
                    <img
                      src={IMG.donor1}
                      alt="Donor"
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-900">Chidi Okonkwo</p>
                      <p className="text-xs text-neutral-500 truncate">Blood Type O+ · LUTH Blood Bank</p>
                    </div>
                    <div className="flex-shrink-0 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
                      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        On-Chain
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top-right floating — blockchain badge */}
              <div className="absolute -top-4 -right-4 bg-white border border-neutral-200 rounded-2xl px-4 py-3 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                    <ChainBadgeIcon />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900">Donation</p>
                    <p className="text-xs text-neutral-400">Hash Verified</p>
                  </div>
                </div>
              </div>

              {/* Left-side floating — hash badge */}
              <div className="absolute top-1/2 -left-5 -translate-y-1/2 bg-white border border-neutral-200 rounded-2xl px-4 py-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <HashIcon />
                  <div>
                    <p className="text-xs font-bold text-neutral-900">SHA-256</p>
                    <p className="text-xs text-neutral-400">Immutable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   STATS
───────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { value: '1,200+', label: 'Registered Donors',    sub: 'Across all blood groups'    },
    { value: '3.5k+',  label: 'Donations Logged',     sub: 'Recorded on-chain'           },
    { value: '100%',   label: 'Transfer Integrity',   sub: 'SHA-256 hash verified'       },
    { value: '0',      label: 'Unverified Transfers', sub: 'Blockchain enforced'          },
  ]

  return (
    <section className="bg-neutral-50 border-y border-neutral-100">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Side images */}
          <div className="flex-shrink-0 hidden lg:block">
            <div className="relative">
              <img
                src={IMG.staff2}
                alt="Blood bank staff"
                className="w-48 h-56 object-cover rounded-2xl shadow-lg"
              />
              <img
                src={IMG.staff3}
                alt="Medical professional"
                className="absolute -bottom-4 -right-6 w-32 h-40 object-cover rounded-xl shadow-xl border-4 border-white"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-8">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Trusted & Proven</p>
              <h2 className="text-2xl font-bold text-neutral-900 mt-1">
                Milestones that reflect our commitment<br />to safe and traceable blood supply.
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map(({ value, label, sub }) => (
                <div key={label}>
                  <p className="text-4xl font-bold text-neutral-900 tracking-tight">{value}</p>
                  <p className="text-sm font-semibold text-neutral-700 mt-1">{label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   FEATURES
───────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: <BlockchainIcon />,
      title: 'Blockchain Donation Trail',
      desc: 'Every donation event — collection, testing, storage, transfer, transfusion — is recorded immutably on Ethereum Sepolia. Nothing can be altered without detection.',
      badge: 'Immutable', variant: 'primary',
    },
    {
      icon: <HashFeatIcon />,
      title: 'SHA-256 Verification',
      desc: 'Each donation record is hashed using SHA-256 and stored on-chain at the time of logging. Any modification to the record is instantly detected during verification.',
      badge: 'Tamper-Proof', variant: 'success',
    },
    {
      icon: <InventoryIcon />,
      title: 'Real-Time Blood Inventory',
      desc: 'Blood banks maintain live inventory levels per blood group. Every unit added or dispatched updates the on-chain record, giving hospitals accurate availability at all times.',
      badge: 'Live Tracking', variant: 'info',
    },
    {
      icon: <TransferIcon />,
      title: 'Verified Blood Transfers',
      desc: 'When blood units move from a blood bank to a hospital, the transfer is logged as a blockchain transaction. Both parties can verify the transfer was legitimate and untampered.',
      badge: 'Chain of Custody', variant: 'warning',
    },
    {
      icon: <IpfsFeatIcon />,
      title: 'Decentralized Record Storage',
      desc: 'Donation certificates, test results, and receipts are stored on IPFS via Pinata — no single point of failure, always retrievable, and linked to the on-chain record.',
      badge: 'IPFS', variant: 'purple',
    },
    {
      icon: <RoleIcon />,
      title: 'Role-Based Access',
      desc: 'Separate dashboards for Donors, Blood Banks, Hospitals, and Administrators. JWT authentication ensures each role sees only what their function requires.',
      badge: '4 Roles', variant: 'neutral',
    },
  ]

  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="primary" className="mb-4">Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">
            Everything you need to manage<br className="hidden md:block" /> blood donation on-chain
          </h2>
          <p className="text-neutral-500 mt-4 max-w-xl mx-auto">
            Built on Ethereum blockchain to give donors, blood banks, hospitals, and administrators complete confidence in every unit of blood.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon, title, desc, badge, variant }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl border border-neutral-200 bg-white hover:border-red-200 hover:shadow-[0_8px_24px_rgb(220,38,38,0.08)] transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4 group-hover:bg-red-50 group-hover:border-red-100 transition-all duration-300">
                {icon}
              </div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
                <Badge variant={variant} size="sm">{badge}</Badge>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   NETWORK
───────────────────────────────────────────── */
function NetworkSection() {
  const people = [
    { name: 'Adaeze Okonkwo',  role: 'Regular Donor',          org: 'O+ · 12 donations',       img: IMG.donor3 },
    { name: 'Emeka Okafor',    role: 'Blood Bank Manager',     org: 'LUTH Blood Bank, Lagos',  img: IMG.donor2 },
    { name: 'Fatima Bello',    role: 'Transfusion Officer',    org: 'ABUTH, Zaria',             img: IMG.donor1 },
    { name: 'Dr. Chukwuma Eze', role: 'Hospital Coordinator',  org: 'UNTH, Enugu',              img: IMG.staff3 },
  ]

  return (
    <section className="py-24 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Wide facility banner */}
        <div className="relative rounded-3xl overflow-hidden h-52 md:h-64 mb-14 shadow-lg">
          <img
            src={IMG.facility}
            alt="Nigerian hospital facility"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/80 via-neutral-900/40 to-transparent flex items-center px-10">
            <div>
              <p className="text-xs font-semibold text-red-300 uppercase tracking-widest mb-2">Our Network</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                Trusted by blood banks and hospitals<br className="hidden md:block" /> across Nigeria
              </h2>
              <p className="text-neutral-300 text-sm mt-2 max-w-xs">
                From Lagos to Abuja, blood banks trust BloodChain to track every unit and verify every transfer on-chain.
              </p>
            </div>
          </div>
        </div>

        {/* People cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {people.map(({ name, role, org, img }) => (
            <div key={name} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)] transition-all duration-300 group">
              <div className="relative h-44 overflow-hidden">
                <img
                  src={img}
                  alt={name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/50 to-transparent" />
                <div className="absolute bottom-2 left-2">
                  <span className="text-[10px] font-semibold bg-white/90 text-red-700 px-2 py-0.5 rounded-full">
                    {role}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-neutral-900">{name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{org}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   HOW IT WORKS
───────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Register & Get Verified',
      desc: 'Donors register directly and complete their profile with blood type and health history. Blood banks and hospitals are registered by the Administrator. Every account is role-verified before access is granted.',
      icon: <RegisterIcon />,
    },
    {
      number: '02',
      title: 'Donate & Log On-Chain',
      desc: 'When a donation is collected, the blood bank logs the event. A SHA-256 hash of the donation record is instantly written to the Ethereum Sepolia blockchain as permanent, tamper-proof proof of the transaction.',
      icon: <DonateIcon />,
    },
    {
      number: '03',
      title: 'Request, Transfer & Verify',
      desc: 'Hospitals request blood units from blood banks. Every transfer is recorded on-chain with a transaction hash. At any point, any stakeholder can verify the integrity of a record and trace its full chain of custody.',
      icon: <VerifyIcon />,
    },
  ]

  return (
    <section id="how" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="neutral" className="mb-4">Process</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">How it works</h2>
          <p className="text-neutral-500 mt-4 max-w-lg mx-auto">
            Three steps from donation to verified transfusion — every event permanently recorded on the Ethereum blockchain.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-10 left-[calc(16.7%+1.5rem)] right-[calc(16.7%+1.5rem)] h-px bg-neutral-200 z-0" />
          {steps.map(({ number, title, desc, icon }, i) => (
            <div key={number} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-[0_4px_12px_rgb(0,0,0,0.06)] flex items-center justify-center mb-6 relative">
                {icon}
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">{title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   ROLES — 4 portals
───────────────────────────────────────────── */
function RolesSection() {
  const roles = [
    {
      role: 'Donor',
      headerImg: IMG.donor4,
      accentColor: 'bg-red-600',
      borderColor: 'border-red-100',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      capabilities: [
        'Register and manage your donor profile',
        'View your complete donation history',
        'Download blockchain-verified certificates',
        'Track which hospital received your blood',
        'Verify your donation record on-chain',
      ],
      cta: 'Register as Donor',
      href: '/register',
      variant: 'primary',
      btnClass: 'bg-red-600 hover:bg-red-700 border-red-600',
    },
    {
      role: 'Blood Bank',
      headerImg: IMG.staff2,
      accentColor: 'bg-emerald-600',
      borderColor: 'border-emerald-100',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      capabilities: [
        'Log incoming donations on-chain',
        'Manage blood inventory by group',
        'Process and approve transfer requests',
        'Generate SHA-256 verified receipts',
        'View full donation audit trail',
      ],
      cta: 'Blood Bank Login',
      href: '/login',
      variant: 'success',
      btnClass: '',
    },
    {
      role: 'Hospital',
      headerImg: IMG.staff3,
      accentColor: 'bg-blue-600',
      borderColor: 'border-blue-100',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      capabilities: [
        'Request blood units by type and quantity',
        'Track incoming transfers in real time',
        'Confirm receipt and log transfusions',
        'Verify every unit against blockchain hash',
        'Access full chain-of-custody reports',
      ],
      cta: 'Hospital Login',
      href: '/login',
      variant: 'info',
      btnClass: '',
    },
    {
      role: 'Administrator',
      headerImg: IMG.donor2,
      accentColor: 'bg-purple-600',
      borderColor: 'border-purple-100',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      capabilities: [
        'Register blood banks and hospitals',
        'Manage all users and role assignments',
        'View full system-wide audit logs',
        'Monitor blockchain transaction activity',
        'Oversee inventory and transfer reports',
      ],
      cta: 'Admin Login',
      href: '/login',
      variant: 'outline',
      btnClass: '',
    },
  ]

  return (
    <section id="roles" className="py-24 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="purple" className="mb-4">Portals</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">
            Built for every stakeholder
          </h2>
          <p className="text-neutral-500 mt-4 max-w-lg mx-auto">
            Four distinct portals, each with the exact tools and permissions their role requires — all backed by the same blockchain.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {roles.map(({ role, headerImg, accentColor, borderColor, capabilities, cta, href, variant, btnClass }) => (
            <div
              key={role}
              className={`rounded-2xl border ${borderColor} bg-white overflow-hidden flex flex-col hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)] transition-all duration-300`}
            >
              {/* Photo header */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={headerImg}
                  alt={role}
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <span className={`text-xs font-bold text-white px-3 py-1 rounded-full ${accentColor}`}>
                    {role}
                  </span>
                </div>
              </div>

              <div className="px-5 py-5 flex-1">
                <ul className="space-y-2.5">
                  {capabilities.map(cap => (
                    <li key={cap} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm text-neutral-600">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-5 pb-5">
                <Link to={href}>
                  <Button variant={variant} fullWidth size="md" className={btnClass}>
                    {cta} <Arrow />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   CTA BANNER
───────────────────────────────────────────── */
function CtaSection() {
  return (
    <section className="py-24 bg-neutral-900">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-neutral-800 border border-neutral-700 text-neutral-300 px-4 py-2 rounded-full text-sm">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Open Source · Academic Project
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
              Ready to save a life<br />with your donation?
            </h2>
            <p className="text-neutral-400 leading-relaxed">
              Join the platform that puts donors, blood banks, and hospitals on the same blockchain-verified network. Every unit tracked, every transfer proven.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" variant="primary" className="bg-red-600 hover:bg-red-700 border-red-600">
                  Register as Donor <Arrow />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" className="border border-neutral-700 text-neutral-300 hover:bg-neutral-800 bg-transparent">
                  Log In
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: stacked photos */}
          <div className="hidden md:flex items-end gap-4 justify-end">
            <img src={IMG.cta1} alt="Donor" className="w-36 h-48 object-cover rounded-2xl shadow-2xl mb-6" />
            <img src={IMG.cta2} alt="Blood bank staff" className="w-44 h-60 object-cover rounded-2xl shadow-2xl" />
            <img src={IMG.cta3} alt="Hospital staff" className="w-36 h-48 object-cover rounded-2xl shadow-2xl mb-6" />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */
function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 7h10M8 4l4 3-4 3" />
    </svg>
  )
}
function ChainBadgeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0010 0C13 7.5 8 2 8 2z" fill="white" fillOpacity="0.9"/>
    </svg>
  )
}
function HashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 6h10M4 12h10M7 3v12M11 3v12"/>
    </svg>
  )
}
function BlockchainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="5" height="5" rx="1"/><rect x="8" y="2" width="5" height="5" rx="1"/>
      <rect x="14" y="7" width="5" height="5" rx="1"/><rect x="8" y="13" width="5" height="5" rx="1"/>
      <path d="M7 9.5H8M12 9.5h2M10.5 7V4.5M10.5 13v-3.5"/>
    </svg>
  )
}
function HashFeatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 7h12M4 13h12M8 3v14M12 3v14"/>
    </svg>
  )
}
function InventoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="14" height="14" rx="2"/>
      <path d="M3 8h14M8 8v9M12 8v9"/>
    </svg>
  )
}
function TransferIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h14M13 3l4 4-4 4M17 13H3M7 9l-4 4 4 4"/>
    </svg>
  )
}
function IpfsFeatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2l8 4.5v7L10 18l-8-4.5v-7L10 2z"/><path d="M10 2v16M2 6.5l8 4.5 8-4.5"/>
    </svg>
  )
}
function RoleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="8" r="2.5"/><circle cx="14" cy="8" r="2.5"/>
      <path d="M1 17c0-2.5 2-4 5-4M14 13c3 0 5 1.5 5 4"/><path d="M9 17c0-2.8 2.2-5 5-5"/>
    </svg>
  )
}
function RegisterIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 20c0-3.3 2.7-6 6-6"/>
      <path d="M16 11v6M13 14h6"/>
    </svg>
  )
}
function DonateIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3C12 3 5 9.5 5 14a7 7 0 0014 0C19 9.5 12 3 12 3z"/>
      <path d="M9 15.5c0 1.7 1.3 3 3 3"/>
    </svg>
  )
}
function VerifyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L3 6v6c0 5.5 4 9.5 9 11 5-1.5 9-5.5 9-11V6L12 2z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  )
}
