import { Link } from 'react-router-dom'

const columns = [
  {
    heading: 'Platform',
    links: [
      { label: 'Features',     href: '#features' },
      { label: 'How It Works', href: '#how'      },
      { label: 'Security',     href: '#features' },
      { label: 'Blockchain',   href: '#how'      },
    ],
  },
  {
    heading: 'Portals',
    links: [
      { label: 'Donor Portal',      href: '/register' },
      { label: 'Blood Bank Login',  href: '/login'    },
      { label: 'Hospital Login',    href: '/login'    },
      { label: 'Admin Access',      href: '/login'    },
    ],
  },
  {
    heading: 'Technology',
    links: [
      { label: 'Blockchain (Sepolia)', href: '#how'      },
      { label: 'IPFS Storage',         href: '#how'      },
      { label: 'SHA-256 Hashing',      href: '#features' },
      { label: 'Smart Contracts',      href: '#how'      },
    ],
  },
]

export default function Footer() {
  const scrollTo = (href) => {
    if (href.startsWith('#')) document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-neutral-900 text-neutral-400">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-neutral-800">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0010 0C13 7.5 8 2 8 2z" fill="white" fillOpacity="0.9"/>
                  <path d="M6 11c0 1.1.9 2 2 2" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-bold text-white text-base">
                Blood<span className="text-red-400">Chain</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-neutral-500">
              A blockchain-based blood donation management system built on Ethereum, ensuring every donation is permanently recorded and verifiable.
            </p>
          </div>

          {/* Link columns */}
          {columns.map(({ heading, links }) => (
            <div key={heading}>
              <p className="text-xs font-semibold text-neutral-300 uppercase tracking-widest mb-4">{heading}</p>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('#') ? (
                      <button
                        onClick={() => scrollTo(href)}
                        className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors"
                      >
                        {label}
                      </button>
                    ) : (
                      <Link to={href} className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-600">
            © 2025 BloodChain. Final Year Project — Blockchain-Based Blood Donation Management System.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-neutral-500">Sepolia Testnet · Live</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
