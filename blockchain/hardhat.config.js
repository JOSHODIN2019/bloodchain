import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers'
import { defineConfig } from 'hardhat/config'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env manually (dotenv ESM workaround)
const __dirname = dirname(fileURLToPath(import.meta.url))
function loadEnv() {
  try {
    const raw = readFileSync(join(__dirname, '.env'), 'utf8')
    raw.split('\n').forEach(line => {
      const [k, ...v] = line.split('=')
      if (k && v.length) process.env[k.trim()] = v.join('=').trim()
    })
  } catch {}
}
loadEnv()

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],

  solidity: {
    profiles: {
      default:    { version: '0.8.28' },
      production: { version: '0.8.28', settings: { optimizer: { enabled: true, runs: 200 } } },
    },
  },

  networks: {
    hardhatLocal: {
      type:      'edr-simulated',
      chainType: 'l1',
    },
    sepolia: {
      type:      'http',
      chainType: 'l1',
      url:       process.env.SEPOLIA_RPC_URL,
      accounts:  [process.env.SEPOLIA_PRIVATE_KEY],
    },
  },
})
