import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY  = 'medrec_wallet'
const SEPOLIA_ID   = '0xaa36a7'  // chainId 11155111 in hex
const HARDHAT_ID   = '0x7a69'    // chainId 31337 in hex
const KNOWN_CHAINS = {
  [SEPOLIA_ID]:  { name: 'Sepolia',      label: 'Sepolia Testnet',  ok: true  },
  [HARDHAT_ID]:  { name: 'Hardhat',      label: 'Local Hardhat',    ok: true  },
  '0x1':         { name: 'Ethereum',     label: 'Ethereum Mainnet', ok: false },
  '0x89':        { name: 'Polygon',      label: 'Polygon Mainnet',  ok: false },
}

function normalizeChainId(id) {
  if (!id) return null
  return '0x' + parseInt(id, 16).toString(16)
}

export function useMetaMask() {
  const [account,   setAccount]   = useState(() => localStorage.getItem(STORAGE_KEY) || null)
  const [chainId,   setChainId]   = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState(null)

  const isInstalled = typeof window !== 'undefined' && !!window.ethereum

  // ── Resolve chain info ───────────────────────────────────────────────────
  const normalizedChain = normalizeChainId(chainId)
  const chainInfo       = KNOWN_CHAINS[normalizedChain] ?? null
  const isSupportedChain = chainInfo?.ok === true
  const networkName     = chainInfo?.label ?? (chainId ? `Chain ${parseInt(chainId, 16)}` : null)

  // ── Read current chain from MetaMask ─────────────────────────────────────
  const fetchChain = useCallback(async () => {
    if (!window.ethereum) return
    try {
      const id = await window.ethereum.request({ method: 'eth_chainId' })
      setChainId(id)
    } catch { /* ignore */ }
  }, [])

  // ── Auto-restore connection on mount ─────────────────────────────────────
  useEffect(() => {
    if (!isInstalled) return

    // Re-validate persisted account is still connected
    if (account) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then(accounts => {
          const connected = accounts.map(a => a.toLowerCase())
          if (!connected.includes(account.toLowerCase())) {
            setAccount(null)
            localStorage.removeItem(STORAGE_KEY)
          } else {
            fetchChain()
          }
        })
        .catch(() => {
          setAccount(null)
          localStorage.removeItem(STORAGE_KEY)
        })
    }

    // ── Event listeners ────────────────────────────────────────────────────
    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null)
        localStorage.removeItem(STORAGE_KEY)
      } else {
        const addr = accounts[0].toLowerCase()
        setAccount(addr)
        localStorage.setItem(STORAGE_KEY, addr)
      }
    }

    const onChainChanged = (id) => {
      setChainId(id)
    }

    const onDisconnect = () => {
      setAccount(null)
      localStorage.removeItem(STORAGE_KEY)
    }

    window.ethereum.on('accountsChanged', onAccountsChanged)
    window.ethereum.on('chainChanged',    onChainChanged)
    window.ethereum.on('disconnect',      onDisconnect)

    fetchChain()

    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged)
      window.ethereum.removeListener('chainChanged',    onChainChanged)
      window.ethereum.removeListener('disconnect',      onDisconnect)
    }
  }, [isInstalled]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setError(null)
    if (!isInstalled) {
      setError('MetaMask is not installed. Visit metamask.io to install it.')
      return null
    }
    setIsLoading(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const addr     = accounts[0]?.toLowerCase()
      setAccount(addr)
      localStorage.setItem(STORAGE_KEY, addr)
      await fetchChain()
      return addr
    } catch (err) {
      const msg = err.code === 4001
        ? 'Connection rejected. Please accept the MetaMask prompt.'
        : 'Failed to connect MetaMask.'
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isInstalled, fetchChain])

  // ── Disconnect (local state only — MetaMask has no programmatic disconnect) ──
  const disconnect = useCallback(() => {
    setAccount(null)
    setError(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // ── Switch to Sepolia ─────────────────────────────────────────────────────
  const switchToSepolia = useCallback(async () => {
    if (!isInstalled) return
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_ID }],
      })
    } catch (err) {
      if (err.code === 4902) {
        // Chain not in MetaMask — add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId:         SEPOLIA_ID,
            chainName:       'Sepolia Testnet',
            nativeCurrency:  { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls:         ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        })
      }
    }
  }, [isInstalled])

  const shortAddress = account
    ? `${account.slice(0, 6)}…${account.slice(-4)}`
    : null

  return {
    account,
    shortAddress,
    chainId,
    networkName,
    isSupportedChain,
    isInstalled,
    isLoading,
    error,
    connect,
    disconnect,
    switchToSepolia,
  }
}
