import { ethers } from 'ethers'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

try {
  const raw = readFileSync(join(__dirname, '../.env'), 'utf8')
  raw.split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k?.trim() && v.length) process.env[k.trim()] ??= v.join('=').trim()
  })
} catch {}

const deploymentPath = join(__dirname, '../config/contractDeployment.json')
const abiPath        = join(__dirname, '../config/contractABI.json')

let _provider  = null
let _contract  = null
let _wallet    = null
let _isReady   = false

function loadDeployment() {
  try {
    if (!existsSync(deploymentPath) || !existsSync(abiPath)) return null
    const deployment = JSON.parse(readFileSync(deploymentPath, 'utf8'))
    const abi        = JSON.parse(readFileSync(abiPath, 'utf8'))
    return { deployment, abi }
  } catch {
    return null
  }
}

async function init() {
  const rpcUrl          = process.env.SEPOLIA_RPC_URL || process.env.HARDHAT_RPC_URL
  const contractAddress = process.env.CONTRACT_ADDRESS
  const privateKey      = process.env.SEPOLIA_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY
  const artifacts       = loadDeployment()

  if (!rpcUrl || !contractAddress || !artifacts) {
    console.log('⚠️  BlockchainService: running in simulation mode (no RPC / contract config)')
    return
  }

  try {
    _provider = new ethers.JsonRpcProvider(rpcUrl)
    await _provider.getBlockNumber()

    const { abi } = artifacts

    if (privateKey) {
      _wallet   = new ethers.Wallet(privateKey, _provider)
      _contract = new ethers.Contract(contractAddress, abi, _wallet)
    } else {
      _contract = new ethers.Contract(contractAddress, abi, _provider)
    }

    const network = await _provider.getNetwork()
    console.log(`✅ BlockchainService connected — chain ${network.chainId}, contract ${contractAddress}`)
    _isReady = true
  } catch (err) {
    console.log('⚠️  BlockchainService: could not connect to node —', err.message)
  }
}

init().catch(() => {})

export const blockchainService = {

  get isReady() { return _isReady },

  /**
   * Record a confirmed blood donation on-chain.
   */
  async recordDonation({ donationId, donorId, bloodBankId, bloodType, units, status }) {
    if (!_isReady || !_wallet) return _simulateTx('recordDonation')
    try {
      const tx      = await _contract.recordDonation(donationId, donorId, bloodBankId, bloodType, BigInt(units), status)
      const receipt = await tx.wait()
      return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber, simulated: false }
    } catch (err) {
      console.error('BlockchainService.recordDonation error:', err.message)
      return { success: false, error: err.message, simulated: false }
    }
  },

  /**
   * Record a fulfilled blood request on-chain.
   */
  async recordBloodRequest({ requestId, hospitalId, bloodBankId, bloodType, units, status }) {
    if (!_isReady || !_wallet) return _simulateTx('recordBloodRequest')
    try {
      const tx      = await _contract.recordBloodRequest(requestId, hospitalId, bloodBankId, bloodType, BigInt(units), status)
      const receipt = await tx.wait()
      return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber, simulated: false }
    } catch (err) {
      console.error('BlockchainService.recordBloodRequest error:', err.message)
      return { success: false, error: err.message, simulated: false }
    }
  },

  /**
   * Read a donation record from the chain.
   */
  async getDonation(donationId) {
    if (!_isReady || !_contract) return null
    try {
      const r = await _contract.getDonation(donationId)
      return r.exists ? r : null
    } catch { return null }
  },

  /**
   * Read a request record from the chain.
   */
  async getRequest(requestId) {
    if (!_isReady || !_contract) return null
    try {
      const r = await _contract.getRequest(requestId)
      return r.exists ? r : null
    } catch { return null }
  },

  async getBlockNumber() {
    if (!_isReady) return null
    try { return await _provider.getBlockNumber() } catch { return null }
  },

  async getWalletStatus() {
    if (!_isReady || !_provider) {
      return {
        isConnected: false,
        isSimulated: true,
        address:     null,
        balanceEth:  null,
        txCount:     null,
        blockNumber: null,
        network:     'sepolia',
        chainId:     11155111,
      }
    }
    try {
      const walletAddress = _wallet ? _wallet.address : null
      const [blockNumber, network] = await Promise.all([
        _provider.getBlockNumber(),
        _provider.getNetwork(),
      ])
      let balanceEth = null
      let txCount    = null
      if (walletAddress) {
        const [balance, count] = await Promise.all([
          _provider.getBalance(walletAddress),
          _provider.getTransactionCount(walletAddress),
        ])
        balanceEth = parseFloat(ethers.formatEther(balance)).toFixed(6)
        txCount    = count
      }
      return {
        isConnected: true,
        isSimulated: false,
        address:     walletAddress,
        balanceEth,
        txCount,
        blockNumber,
        network:     network.name === 'unknown'
          ? (Number(network.chainId) === 31337 ? 'Hardhat Local' : `Chain ${network.chainId}`)
          : network.name,
        chainId:     Number(network.chainId),
      }
    } catch (err) {
      console.error('BlockchainService.getWalletStatus error:', err.message)
      return { isConnected: false, isSimulated: false, error: err.message }
    }
  },
}

function _simulateTx(op) {
  const mockTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  console.log(`  [SIMULATED] blockchainService.${op} → tx ${mockTx.slice(0, 20)}…`)
  return { success: true, txHash: mockTx, blockNumber: null, simulated: true }
}

export default blockchainService
