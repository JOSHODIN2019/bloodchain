import { useState } from 'react'
import { useMetaMask } from '@/hooks/useMetaMask'
import { useAuth }     from '@/contexts/AuthContext'
import { walletService } from '@/services/walletService'

/**
 * Compact wallet status widget for sidebar placement.
 * Shows: not installed / not connected / connected + network info.
 * Allows linking the connected wallet to the MedRec account.
 */
export default function WalletConnect() {
  const { account, shortAddress, networkName, isSupportedChain,
          isInstalled, isLoading, error,
          connect, disconnect, switchToSepolia } = useMetaMask()
  const { user, login } = useAuth()

  const [linking,  setLinking]  = useState(false)
  const [linkMsg,  setLinkMsg]  = useState('')
  const [expanded, setExpanded] = useState(false)

  const isLinked      = !!user?.walletAddress && user.walletAddress === account
  const hasOtherWallet = !!user?.walletAddress && user.walletAddress !== account

  // ── Link/unlink ──────────────────────────────────────────────────────────
  const handleLink = async () => {
    if (!account) return
    setLinking(true)
    setLinkMsg('')
    try {
      const result = await walletService.linkWallet(account)
      if (result.success) {
        setLinkMsg('Wallet linked!')
        setTimeout(() => setLinkMsg(''), 3000)
      }
    } catch (err) {
      setLinkMsg(err.response?.data?.message || 'Link failed')
    } finally {
      setLinking(false)
    }
  }

  const handleUnlink = async () => {
    setLinking(true)
    setLinkMsg('')
    try {
      await walletService.unlinkWallet()
      setLinkMsg('Wallet unlinked')
      setTimeout(() => setLinkMsg(''), 3000)
    } catch {
      setLinkMsg('Unlink failed')
    } finally {
      setLinking(false)
    }
  }

  // ── MetaMask not installed ───────────────────────────────────────────────
  if (!isInstalled) {
    return (
      <div className="mx-3 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <MetaMaskIcon size={16} />
          <span className="text-xs font-semibold text-amber-800">MetaMask</span>
        </div>
        <p className="text-[10px] text-amber-700 leading-relaxed mb-2">
          Install MetaMask to sign blockchain transactions.
        </p>
        <a
          href="https://metamask.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-semibold text-amber-700 underline"
        >
          Install MetaMask →
        </a>
      </div>
    )
  }

  // ── Not connected ────────────────────────────────────────────────────────
  if (!account) {
    return (
      <div className="mx-3 mb-3">
        <button
          onClick={connect}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-xl text-xs font-semibold text-orange-700 transition-colors disabled:opacity-60"
        >
          <MetaMaskIcon size={14} />
          {isLoading ? 'Connecting…' : 'Connect Wallet'}
        </button>
        {error && <p className="text-[10px] text-red-500 mt-1.5 text-center">{error}</p>}
      </div>
    )
  }

  // ── Connected ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-3 mb-3">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSupportedChain ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
        <MetaMaskIcon size={14} />
        <div className="flex-1 text-left min-w-0">
          <p className="text-[11px] font-mono font-semibold text-neutral-800 truncate">{shortAddress}</p>
          <p className={`text-[9px] truncate ${isSupportedChain ? 'text-emerald-600' : 'text-yellow-600'}`}>
            {networkName ?? 'Unknown network'}
          </p>
        </div>
        <ChevronIcon className={`flex-shrink-0 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-1.5 p-3 bg-white border border-neutral-200 rounded-xl space-y-2.5 shadow-sm">
          {/* Full address */}
          <div>
            <p className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">Wallet Address</p>
            <p className="text-[10px] font-mono text-neutral-700 break-all">{account}</p>
          </div>

          {/* Network warning */}
          {!isSupportedChain && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <p className="text-[10px] text-yellow-700 font-medium mb-1.5">Wrong network detected</p>
              <button
                onClick={switchToSepolia}
                className="text-[10px] font-semibold text-yellow-700 underline"
              >
                Switch to Sepolia →
              </button>
            </div>
          )}

          {/* Link status */}
          {linkMsg && (
            <p className={`text-[10px] font-medium text-center ${linkMsg.includes('failed') || linkMsg.includes('Failed') ? 'text-red-500' : 'text-emerald-600'}`}>
              {linkMsg}
            </p>
          )}

          {isLinked ? (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-emerald-500 text-xs">✓</span>
                <p className="text-[10px] text-emerald-700 font-medium">Linked to your account</p>
              </div>
              <button
                onClick={handleUnlink}
                disabled={linking}
                className="w-full text-[10px] text-red-500 hover:text-red-600 font-medium py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                {linking ? 'Unlinking…' : 'Unlink Wallet'}
              </button>
            </div>
          ) : (
            <div>
              {hasOtherWallet && (
                <p className="text-[10px] text-amber-600 mb-1.5">
                  Your account has a different wallet linked.
                </p>
              )}
              <button
                onClick={handleLink}
                disabled={linking}
                className="w-full text-[10px] text-emerald-700 font-semibold py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60"
              >
                {linking ? 'Linking…' : 'Link to Account'}
              </button>
            </div>
          )}

          {/* Disconnect */}
          <button
            onClick={() => { disconnect(); setExpanded(false) }}
            className="w-full text-[10px] text-neutral-500 hover:text-neutral-700 font-medium py-1 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

function MetaMaskIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 35 33" fill="none" className="flex-shrink-0">
      <path d="M32.9 1L19.4 10.7l2.4-5.7L32.9 1z" fill="#E17726" stroke="#E17726" strokeWidth=".25"/>
      <path d="M2.1 1l13.4 9.8-2.3-5.8L2.1 1z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
      <path d="M28.2 23.5l-3.6 5.5 7.7 2.1 2.2-7.5-6.3-.1zM.5 23.6l2.2 7.5 7.7-2.1-3.6-5.5-6.3.1z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
      <path d="M10 14.5l-2.1 3.2 7.5.3-.3-8-5.1 4.5zM25 14.5l-5.2-4.6-.2 8.1 7.5-.3L25 14.5z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
      <path d="M10.4 29l4.5-2.2-3.9-3-.6 5.2zM20.1 26.8l4.5 2.2-.6-5.2-3.9 3z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
    </svg>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className}>
      <path d="M2 4l4 4 4-4"/>
    </svg>
  )
}
