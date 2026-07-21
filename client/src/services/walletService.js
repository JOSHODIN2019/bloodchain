import api from './authService'

export const walletService = {
  linkWallet:   (walletAddress) => api.put('/auth/wallet/link',   { walletAddress }).then(r => r.data),
  unlinkWallet: ()              => api.put('/auth/wallet/unlink',  {}).then(r => r.data),
}
