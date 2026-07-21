import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Self-load .env (same hoisting fix as blockchainService — imports run before dotenv.config())
try {
  const raw = readFileSync(join(__dirname, '../.env'), 'utf8')
  raw.split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k?.trim() && v.length) process.env[k.trim()] ??= v.join('=').trim()
  })
} catch {}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasCredentials() {
  const key    = process.env.PINATA_API_KEY
  const secret = process.env.PINATA_SECRET_KEY
  return (
    key    && key    !== 'your_pinata_api_key' &&
    secret && secret !== 'your_pinata_secret_key'
  )
}

function mockCid() {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let cid = 'Qm'
  for (let i = 0; i < 44; i++) cid += chars[Math.floor(Math.random() * chars.length)]
  return cid
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const ipfsService = {

  get isConfigured() { return hasCredentials() },

  /**
   * Pin a file buffer to IPFS via Pinata.
   * Falls back to a mock CID if no credentials are configured.
   *
   * @param {Buffer} buffer
   * @param {string} filename
   * @param {string} mimeType
   * @returns {{ cid: string, simulated: boolean, gatewayUrl: string, error?: string }}
   */
  async pinFile(buffer, filename, mimeType = 'application/octet-stream') {
    if (!hasCredentials()) {
      const cid = mockCid()
      console.log(`  [SIMULATED] ipfsService.pinFile — no Pinata credentials, mock CID: ${cid.slice(0, 20)}…`)
      return { cid, simulated: true, gatewayUrl: ipfsService.getGatewayUrl(cid) }
    }

    try {
      const formData = new FormData()
      const blob = new Blob([buffer], { type: mimeType })
      formData.append('file', blob, filename)
      formData.append('pinataMetadata', JSON.stringify({ name: filename }))
      formData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }))

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key':        process.env.PINATA_API_KEY,
          'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
        },
        body: formData,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Pinata API ${response.status}: ${text.slice(0, 300)}`)
      }

      const data = await response.json()
      const cid  = data.IpfsHash
      console.log(`  ✅ IPFS pinned — CID: ${cid}`)
      return { cid, simulated: false, gatewayUrl: ipfsService.getGatewayUrl(cid) }
    } catch (err) {
      console.error('ipfsService.pinFile error:', err.message)
      const cid = mockCid()
      console.log(`  → Falling back to mock CID: ${cid.slice(0, 20)}…`)
      return { cid, simulated: true, gatewayUrl: ipfsService.getGatewayUrl(cid), error: err.message }
    }
  },

  /**
   * Check whether a CID is pinned on Pinata.
   * Returns null when credentials are missing or the check fails.
   */
  async isPinned(cid) {
    if (!hasCredentials()) return null
    try {
      const response = await fetch(
        `https://api.pinata.cloud/pinning/pinJobs?ipfs_pin_hash=${cid}&status=pinned`,
        {
          headers: {
            'pinata_api_key':        process.env.PINATA_API_KEY,
            'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
          },
        }
      )
      if (!response.ok) return null
      const data = await response.json()
      return data.count > 0
    } catch {
      return null
    }
  },

  /** Build the public gateway URL for a CID. */
  getGatewayUrl(cid) {
    const gateway = (process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud').replace(/\/$/, '')
    return `${gateway}/ipfs/${cid}`
  },
}

// Log IPFS status on startup
if (hasCredentials()) {
  console.log('✅ IPFSService configured — Pinata credentials loaded')
} else {
  console.log('⚠️  IPFSService: no Pinata credentials — uploads will use mock CIDs')
  console.log('   Add PINATA_API_KEY + PINATA_SECRET_KEY to server/.env to enable real IPFS')
}

export default ipfsService
