import { network, artifacts } from 'hardhat'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  // Hardhat 3: ethers is accessed through the network connection
  const connection = await network.connect()
  const ethers = connection.ethers

  const [deployer] = await ethers.getSigners()
  const balance    = await ethers.provider.getBalance(deployer.address)

  console.log('\n🚀 Deploying MedicalRecordRegistry')
  console.log('   Network :', connection.networkName)
  console.log('   Deployer:', deployer.address)
  console.log('   Balance :', ethers.formatEther(balance), 'ETH\n')

  const Factory  = await ethers.getContractFactory('MedicalRecordRegistry')
  const contract = await Factory.deploy()
  await contract.waitForDeployment()

  const address  = await contract.getAddress()
  const netInfo  = await ethers.provider.getNetwork()
  const txHash   = contract.deploymentTransaction()?.hash ?? ''
  const receipt  = txHash ? await ethers.provider.getTransactionReceipt(txHash) : null

  console.log('✅ Contract deployed!')
  console.log('   Address :', address)
  if (txHash) console.log('   Tx hash :', txHash)
  if (receipt?.blockNumber) console.log('   Block   :', receipt.blockNumber)

  // ── Deployment manifest ──────────────────────────────────────────────────
  const manifest = {
    contractName: 'MedicalRecordRegistry',
    address,
    network:     connection.networkName,
    chainId:     netInfo.chainId.toString(),
    deployedAt:  new Date().toISOString(),
    deployer:    deployer.address,
    txHash,
    blockNumber: receipt?.blockNumber ?? null,
  }

  // ── Save to server config ────────────────────────────────────────────────
  const serverConfigDir = join(__dirname, '../../server/config')
  if (!existsSync(serverConfigDir)) mkdirSync(serverConfigDir, { recursive: true })
  writeFileSync(join(serverConfigDir, 'contractDeployment.json'), JSON.stringify(manifest, null, 2))
  console.log('\n📄 server/config/contractDeployment.json saved')

  // ── Copy ABI to server ───────────────────────────────────────────────────
  const artifactPath = join(__dirname, '../artifacts/contracts/MedicalRecordRegistry.sol/MedicalRecordRegistry.json')
  if (existsSync(artifactPath)) {
    const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))
    writeFileSync(join(serverConfigDir, 'contractABI.json'), JSON.stringify(artifact.abi, null, 2))
    console.log('📄 server/config/contractABI.json saved')
  }

  // ── Save to client/public ────────────────────────────────────────────────
  const clientPublicDir = join(__dirname, '../../client/public')
  if (!existsSync(clientPublicDir)) mkdirSync(clientPublicDir, { recursive: true })
  writeFileSync(join(clientPublicDir, 'contract.json'), JSON.stringify({
    address,
    chainId: netInfo.chainId.toString(),
    network: network.name,
  }, null, 2))
  console.log('📄 client/public/contract.json saved')

  console.log('\n🎉 Deployment complete!')
  console.log(`\n   Add to server/.env:\n   CONTRACT_ADDRESS=${address}`)
  if (connection.networkName !== 'sepolia') {
    console.log('\n   ⚠️  Local network — run `npm run node` in blockchain/ to keep it alive.')
  }
}

main().catch(err => {
  console.error('❌ Deployment failed:', err.message)
  process.exit(1)
})
