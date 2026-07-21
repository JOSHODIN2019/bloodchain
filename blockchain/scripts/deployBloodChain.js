import { ethers } from 'ethers'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env
const raw = readFileSync(join(__dirname, '../.env'), 'utf8')
raw.split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k?.trim() && v.length) process.env[k.trim()] ??= v.join('=').trim()
})

const rpcUrl     = process.env.SEPOLIA_RPC_URL
const privateKey = process.env.SEPOLIA_PRIVATE_KEY

if (!rpcUrl || !privateKey) {
  console.error('Missing SEPOLIA_RPC_URL or SEPOLIA_PRIVATE_KEY')
  process.exit(1)
}

const artifactPath = join(__dirname, '../artifacts/contracts/BloodChainRecord.sol/BloodChainRecord.json')
const artifact     = JSON.parse(readFileSync(artifactPath, 'utf8'))

const provider = new ethers.JsonRpcProvider(rpcUrl)
const wallet   = new ethers.Wallet(privateKey, provider)

console.log('Deploying BloodChainRecord from:', wallet.address)
const network = await provider.getNetwork()
console.log('Network: chain', network.chainId)

const balance = await provider.getBalance(wallet.address)
console.log('Balance:', ethers.formatEther(balance), 'ETH')

const factory  = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet)
const contract = await factory.deploy()
console.log('Tx hash:', contract.deploymentTransaction().hash)
console.log('Waiting for confirmation…')

const receipt = await contract.deploymentTransaction().wait(1)
console.log('✅ Deployed at:', receipt.contractAddress, 'block', receipt.blockNumber)

// Save artifacts to server/config/
const serverConfigDir = join(__dirname, '../../server/config')

const deployment = {
  contractName: 'BloodChainRecord',
  address:      receipt.contractAddress,
  network:      'sepolia',
  chainId:      String(network.chainId),
  deployedAt:   new Date().toISOString(),
  deployer:     wallet.address,
  txHash:       receipt.hash,
  blockNumber:  receipt.blockNumber,
}

writeFileSync(join(serverConfigDir, 'contractDeployment.json'), JSON.stringify(deployment, null, 2))
writeFileSync(join(serverConfigDir, 'contractABI.json'),        JSON.stringify(artifact.abi, null, 2))

// Also update CONTRACT_ADDRESS in server .env
const serverEnvPath = join(__dirname, '../../server/.env')
let envContent = readFileSync(serverEnvPath, 'utf8')
envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${receipt.contractAddress}`)
writeFileSync(serverEnvPath, envContent)

console.log('Saved deployment.json, ABI, and updated server/.env')
console.log('New CONTRACT_ADDRESS:', receipt.contractAddress)
