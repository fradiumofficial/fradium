import React, { useEffect, useState } from 'react'
import { useWallet } from '~lib/context/walletContext'

/**
 * Contoh implementasi halaman Receive yang telah diperbaiki
 * 
 * Fitur yang telah diimplementasikan:
 * 1. ✅ Menampilkan semua addresses dari wallet canister
 * 2. ✅ Loading state yang proper
 * 3. ✅ Error handling
 * 4. ✅ Refresh functionality
 * 5. ✅ Copy to clipboard
 * 6. ✅ Support untuk 5 blockchain: Bitcoin, Ethereum, Solana, ICP Principal, ICP Account
 */

const ReceivePageExample: React.FC = () => {
  const { 
    addresses, 
    isFetchingAddresses, 
    fetchAddresses, 
    fetchWalletAddresses,
    isAuthenticated 
  } = useWallet();
  
  const [localAddresses, setLocalAddresses] = useState<{
    bitcoin?: string;
    ethereum?: string;
    solana?: string;
    icp_principal?: string;
    icp_account?: string;
  } | null>(null);

  const copy = async (text?: string) => {
    if (!text) return
    try { 
      await navigator.clipboard.writeText(text)
      console.log('Copied to clipboard:', text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Fetch addresses when component mounts or when authenticated
  useEffect(() => {
    const loadAddresses = async () => {
      if (isAuthenticated) {
        console.log('Loading addresses for authenticated user...')
        
        // Try background script API first (recommended)
        const walletAddresses = await fetchWalletAddresses?.();
        if (walletAddresses) {
          console.log('Addresses loaded via background script:', walletAddresses)
          setLocalAddresses(walletAddresses);
        } else {
          console.log('Background script failed, trying direct actor call...')
          // Fallback to direct actor call
          await fetchAddresses?.();
          if (addresses) {
            console.log('Addresses loaded via direct actor call:', addresses)
            setLocalAddresses(addresses);
          }
        }
      }
    };

    loadAddresses();
  }, [isAuthenticated, fetchWalletAddresses, fetchAddresses, addresses]);

  // Update local addresses when context addresses change
  useEffect(() => {
    if (addresses) {
      setLocalAddresses(addresses);
    }
  }, [addresses]);

  const handleRefresh = async () => {
    console.log('Refreshing addresses...')
    const walletAddresses = await fetchWalletAddresses?.();
    if (walletAddresses) {
      setLocalAddresses(walletAddresses);
      console.log('Addresses refreshed successfully')
    } else {
      console.error('Failed to refresh addresses')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Receive Page Example</h3>
        <p className="text-gray-600">Please authenticate first to view wallet addresses.</p>
      </div>
    )
  }

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto">
      <div className="p-4">
        <h1 className="text-[20px] font-semibold text-white mb-4">Receive Coin Example</h1>
        
        {/* Status and Refresh */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-white/60">
            {isFetchingAddresses ? "Fetching addresses..." : localAddresses ? "Addresses loaded" : "No addresses available"}
          </span>
          <button 
            onClick={handleRefresh}
            className="text-xs text-[#9BE4A0] hover:underline px-2 py-1 border border-[#9BE4A0] rounded"
            disabled={isFetchingAddresses}
          >
            {isFetchingAddresses ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Address Fields */}
        <div className="space-y-4">
          {/* Bitcoin */}
          <div>
            <h2 className="text-[14px] font-medium text-white mb-2">Bitcoin:</h2>
            <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between">
              <input 
                type="text" 
                placeholder={isFetchingAddresses ? "Loading..." : "Bitcoin address will appear here"} 
                className="bg-transparent outline-none flex-1 text-sm" 
                value={localAddresses?.bitcoin || ""} 
                readOnly 
                disabled={!localAddresses?.bitcoin} 
              />
              <button 
                onClick={() => copy(localAddresses?.bitcoin)} 
                className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                disabled={!localAddresses?.bitcoin}
              >
                Copy
              </button>
            </div>
          </div>

          {/* Ethereum */}
          <div>
            <h2 className="text-[14px] font-medium text-white mb-2">Ethereum:</h2>
            <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between">
              <input 
                type="text" 
                placeholder={isFetchingAddresses ? "Loading..." : "Ethereum address will appear here"} 
                className="bg-transparent outline-none flex-1 text-sm" 
                value={localAddresses?.ethereum || ""} 
                readOnly 
                disabled={!localAddresses?.ethereum} 
              />
              <button 
                onClick={() => copy(localAddresses?.ethereum)} 
                className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                disabled={!localAddresses?.ethereum}
              >
                Copy
              </button>
            </div>
          </div>

          {/* Solana */}
          <div>
            <h2 className="text-[14px] font-medium text-white mb-2">Solana:</h2>
            <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between">
              <input 
                type="text" 
                placeholder={isFetchingAddresses ? "Loading..." : "Solana address will appear here"} 
                className="bg-transparent outline-none flex-1 text-sm" 
                value={localAddresses?.solana || ""} 
                readOnly 
                disabled={!localAddresses?.solana} 
              />
              <button 
                onClick={() => copy(localAddresses?.solana)} 
                className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                disabled={!localAddresses?.solana}
              >
                Copy
              </button>
            </div>
          </div>

          {/* ICP Principal */}
          <div>
            <h2 className="text-[14px] font-medium text-white mb-2">ICP Principal:</h2>
            <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between">
              <input 
                type="text" 
                placeholder={isFetchingAddresses ? "Loading..." : "ICP Principal will appear here"} 
                className="bg-transparent outline-none flex-1 text-sm" 
                value={localAddresses?.icp_principal || ""} 
                readOnly 
                disabled={!localAddresses?.icp_principal} 
              />
              <button 
                onClick={() => copy(localAddresses?.icp_principal)} 
                className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                disabled={!localAddresses?.icp_principal}
              >
                Copy
              </button>
            </div>
          </div>

          {/* ICP Account ID */}
          <div>
            <h2 className="text-[14px] font-medium text-white mb-2">ICP Account ID:</h2>
            <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between">
              <input 
                type="text" 
                placeholder={isFetchingAddresses ? "Loading..." : "ICP Account ID will appear here"} 
                className="bg-transparent outline-none flex-1 text-sm" 
                value={localAddresses?.icp_account || ""} 
                readOnly 
                disabled={!localAddresses?.icp_account} 
              />
              <button 
                onClick={() => copy(localAddresses?.icp_account)} 
                className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                disabled={!localAddresses?.icp_account}
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
          <h3 className="font-medium mb-2">Debug Info:</h3>
          <div className="space-y-1 text-gray-300">
            <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
            <div>Fetching: {isFetchingAddresses ? 'Yes' : 'No'}</div>
            <div>Addresses loaded: {localAddresses ? 'Yes' : 'No'}</div>
            {localAddresses && (
              <div>
                <div>Bitcoin: {localAddresses.bitcoin ? '✓' : '✗'}</div>
                <div>Ethereum: {localAddresses.ethereum ? '✓' : '✗'}</div>
                <div>Solana: {localAddresses.solana ? '✓' : '✗'}</div>
                <div>ICP Principal: {localAddresses.icp_principal ? '✓' : '✗'}</div>
                <div>ICP Account: {localAddresses.icp_account ? '✓' : '✗'}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceivePageExample
