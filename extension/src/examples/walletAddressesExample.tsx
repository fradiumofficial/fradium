import React, { useEffect, useState } from 'react'
import { useWallet } from '~lib/context/walletContext'

/**
 * Contoh penggunaan API wallet addresses
 * 
 * API yang tersedia:
 * 1. fetchWalletAddresses() - Menggunakan background script API
 * 2. fetchAddresses() - Menggunakan direct actor call
 * 
 * Kedua fungsi mengembalikan semua addresses dari wallet canister:
 * - bitcoin: Bitcoin P2PKH address
 * - ethereum: Ethereum address
 * - solana: Solana address
 * - icp_principal: ICP Principal ID
 * - icp_account: ICP Account ID (untuk exchanges)
 */

const WalletAddressesExample: React.FC = () => {
  const { 
    fetchWalletAddresses, 
    fetchAddresses, 
    addresses, 
    isFetchingAddresses,
    isAuthenticated 
  } = useWallet()
  
  const [lastFetchMethod, setLastFetchMethod] = useState<string>('')

  // Contoh menggunakan background script API
  const handleFetchViaBackground = async () => {
    console.log('Fetching addresses via background script...')
    setLastFetchMethod('Background Script API')
    const result = await fetchWalletAddresses()
    
    if (result) {
      console.log('Addresses fetched successfully:', result)
    } else {
      console.error('Failed to fetch addresses via background script')
    }
  }

  // Contoh menggunakan direct actor call
  const handleFetchViaActor = async () => {
    console.log('Fetching addresses via direct actor call...')
    setLastFetchMethod('Direct Actor Call')
    await fetchAddresses()
  }

  // Auto-fetch addresses saat component mount
  useEffect(() => {
    if (isAuthenticated && !addresses) {
      handleFetchViaBackground()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Wallet Addresses Example</h3>
        <p className="text-gray-600">Please authenticate first to view wallet addresses.</p>
      </div>
    )
  }

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Wallet Addresses Example</h3>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleFetchViaBackground}
          disabled={isFetchingAddresses}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isFetchingAddresses ? 'Loading...' : 'Fetch via Background API'}
        </button>
        
        <button
          onClick={handleFetchViaActor}
          disabled={isFetchingAddresses}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isFetchingAddresses ? 'Loading...' : 'Fetch via Actor Call'}
        </button>
      </div>

      {/* Last fetch method */}
      {lastFetchMethod && (
        <p className="text-sm text-gray-600">
          Last fetch method: <span className="font-mono">{lastFetchMethod}</span>
        </p>
      )}

      {/* Addresses Display */}
      {addresses && (
        <div className="space-y-3">
          <h4 className="font-medium">Wallet Addresses:</h4>
          
          <div className="grid gap-2 text-sm">
            {addresses.bitcoin && (
              <div className="p-2 bg-gray-100 rounded">
                <span className="font-medium">Bitcoin:</span>
                <div className="font-mono text-xs break-all">{addresses.bitcoin}</div>
              </div>
            )}
            
            {addresses.ethereum && (
              <div className="p-2 bg-gray-100 rounded">
                <span className="font-medium">Ethereum:</span>
                <div className="font-mono text-xs break-all">{addresses.ethereum}</div>
              </div>
            )}
            
            {addresses.solana && (
              <div className="p-2 bg-gray-100 rounded">
                <span className="font-medium">Solana:</span>
                <div className="font-mono text-xs break-all">{addresses.solana}</div>
              </div>
            )}
            
            {addresses.icp_principal && (
              <div className="p-2 bg-gray-100 rounded">
                <span className="font-medium">ICP Principal:</span>
                <div className="font-mono text-xs break-all">{addresses.icp_principal}</div>
              </div>
            )}
            
            {addresses.icp_account && (
              <div className="p-2 bg-gray-100 rounded">
                <span className="font-medium">ICP Account ID:</span>
                <div className="font-mono text-xs break-all">{addresses.icp_account}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <h5 className="font-medium mb-2">API Usage:</h5>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li><code>fetchWalletAddresses()</code> - Uses background script API (recommended)</li>
          <li><code>fetchAddresses()</code> - Uses direct actor call</li>
          <li>Both methods return the same data structure</li>
          <li>Addresses are automatically stored in context state</li>
        </ul>
      </div>
    </div>
  )
}

export default WalletAddressesExample
