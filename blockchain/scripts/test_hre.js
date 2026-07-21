import { ethers, network } from 'hardhat'
console.log('ethers type:', typeof ethers)
console.log('network name:', network?.name)
const signers = await ethers.getSigners()
console.log('signers[0]:', signers[0]?.address)
