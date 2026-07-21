import { existsSync, readFileSync } from 'fs'
import { createHash } from 'crypto'

/**
 * Get the file buffer for integrity checking.
 *
 * Priority:
 *   1. Local disk (fast — works in development and on servers with persistent storage)
 *   2. IPFS via Pinata gateway (fallback — works on cloud servers that lost the file on restart)
 *
 * Returns: { buffer, source: 'disk' | 'ipfs' }
 * Throws if neither source is available.
 */
export async function fetchFileBuffer(record) {
  // ── 1. Try local disk ──────────────────────────────────────────────────────
  if (record.filePath && existsSync(record.filePath)) {
    return { buffer: readFileSync(record.filePath), source: 'disk' }
  }

  // ── 2. Fall back to IPFS ───────────────────────────────────────────────────
  const gatewayUrl = record.ipfsGatewayUrl
  const ipfsHash   = record.ipfsHash

  // Only attempt real IPFS fetch when the CID looks genuine (not a mock)
  const isRealCid = ipfsHash && ipfsHash.startsWith('Qm') && !record.ipfsSimulated

  if (isRealCid && gatewayUrl) {
    try {
      const response = await fetch(gatewayUrl, { signal: AbortSignal.timeout(15000) })
      if (!response.ok) throw new Error(`IPFS gateway returned ${response.status}`)
      const arrayBuf = await response.arrayBuffer()
      return { buffer: Buffer.from(arrayBuf), source: 'ipfs' }
    } catch (err) {
      throw new Error(`File not found on disk and IPFS fetch failed: ${err.message}`)
    }
  }

  throw new Error('File not found on disk and no real IPFS CID available')
}

/**
 * Compute SHA-256 of a buffer.
 */
export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}
