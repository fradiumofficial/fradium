import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useAuth } from "~lib/context/authContext"
import {
  createActor as createWalletActor,
  wallet,
} from "../../../../src/declarations/wallet"

import { CANISTERS } from "~config/canisters"
import { getInternetIdentityNetwork } from "~lib/utils/utils"

interface NetworkFilters {
  Bitcoin: boolean
  Solana: boolean
  Fradium: boolean
  Ethereum: boolean
}

interface NetworkValues {
  "All Networks": number
  Bitcoin: number
  Solana: number
  Fradium: number
  Ethereum: number
}

interface WalletAddresses {
  bitcoin?: string
  ethereum?: string
  solana?: string
  icp_principal?: string
  icp_account?: string
}

interface WalletContextType {
  // Wallet state
  isLoading: boolean
  isAuthenticated: boolean
  principalText: string | null
  isCreatingWallet: boolean

  // Addresses
  addresses: WalletAddresses | null
  isFetchingAddresses: boolean
  addressesLoaded: boolean
  hasLoadedAddressesOnce: boolean
  fetchAddresses: () => Promise<void>
  fetchWalletAddresses: () => Promise<WalletAddresses | null>
  getAddressesLoadingState: () => boolean

  // Wallet operations
  addAddressToWallet: (
    network: string,
    tokenType: string,
    address: string
  ) => Promise<boolean>

  // Network management
  network: string
  setNetwork: (network: string) => void
  networkFilters: NetworkFilters

  // Balance management
  hideBalance: boolean
  setHideBalance: (hide: boolean) => void
  networkValues: NetworkValues
  updateNetworkValues: (values: Partial<NetworkValues>) => void
  getNetworkValue: (networkName: string) => string
}

const WalletContext = createContext<WalletContextType | null>(null)

// Custom hook
export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, principalText, identity } = useAuth()

  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [network, setNetwork] = useState("All Networks")
  const [hideBalance, setHideBalance] = useState(false)
  const [hasConfirmedWallet, setHasConfirmedWallet] = useState(false)
  const [addresses, setAddresses] = useState<WalletAddresses | null>(null)
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(false)
  const [addressesLoaded, setAddressesLoaded] = useState(false)
  const [hasLoadedAddressesOnce, setHasLoadedAddressesOnce] = useState(false)

  const [networkValues, setNetworkValues] = useState<NetworkValues>({
    "All Networks": 0,
    Bitcoin: 0,
    Solana: 0,
    Fradium: 0,
    Ethereum: 0,
  })

  const [networkFilters] = useState<NetworkFilters>({
    Bitcoin: true,
    Solana: true,
    Fradium: true,
    Ethereum: true,
  })

  // Persisted storage key
  const STORAGE_KEY_HAS_WALLET = "fradium_has_confirmed_wallet"

  // Load persisted state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HAS_WALLET)
      if (stored) setHasConfirmedWallet(stored === "true")
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update balances
  const updateNetworkValues = useCallback(
    (values: Partial<NetworkValues>) => {
      setNetworkValues((prev) => {
        const updated = { ...prev, ...values }

        if (!values["All Networks"]) {
          updated["All Networks"] =
            (networkFilters.Bitcoin ? updated.Bitcoin : 0) +
            (networkFilters.Ethereum ? updated.Ethereum : 0) +
            (networkFilters.Solana ? updated.Solana : 0) +
            (networkFilters.Fradium ? updated.Fradium : 0)
        }
        return updated
      })
    },
    [networkFilters]
  )

  // Format balance display
  const getNetworkValue = useCallback(
    (networkName: string) => {
      const value = networkValues[networkName as keyof NetworkValues] || 0
      return hideBalance ? "••••" : `$${value.toFixed(2)}`
    },
    [networkValues, hideBalance]
  )

  // Placeholder wallet op
  const addAddressToWallet = useCallback(
    async (_network: string, _tokenType: string, _address: string) => {
      console.warn("addAddressToWallet is not implemented in this build")
      return false
    },
    []
  )

  // Fetch addresses using direct actor call
  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated || addressesLoaded || isFetchingAddresses || !identity) return;
    
    setIsFetchingAddresses(true)
    try {
      console.log("Creating wallet actor with identity:", identity.getPrincipal().toString())
      
      const actor: any = await createWalletActor(CANISTERS.wallet, {
        agentOptions: { identity },
      } as any)
      
      if (!actor?.wallet_addresses) {
        console.warn("Wallet actor not available or method missing")
        return
      }
      
      console.log("Calling wallet_addresses method...")
      const result = await actor.wallet_addresses()
      console.log("Wallet addresses result:", result)
      
      const newAddresses: WalletAddresses = {
        bitcoin: result.bitcoin,
        ethereum: result.ethereum,
        solana: result.solana,
        icp_principal: result.icp_principal,
        icp_account: result.icp_account,
      }
      
      setAddresses(newAddresses)
      setAddressesLoaded(true)
      setHasLoadedAddressesOnce(true)
    } catch (error) {
      console.error("Error fetching addresses:", error)
    } finally {
      setIsFetchingAddresses(false)
    }
  }, [isAuthenticated, addressesLoaded, isFetchingAddresses, identity])

  // Function to get loading state for addresses
  const getAddressesLoadingState = useCallback(() => {
    return isFetchingAddresses && !hasLoadedAddressesOnce
  }, [isFetchingAddresses, hasLoadedAddressesOnce])

  // Fetch wallet addresses using background script API
  const fetchWalletAddresses = useCallback(async (): Promise<WalletAddresses | null> => {
    if (!isAuthenticated || addressesLoaded || isFetchingAddresses) return addresses
    
    console.log("WalletContext: Fetching wallet addresses via background script...")
    console.log("WalletContext: isAuthenticated:", isAuthenticated)
    console.log("WalletContext: identity:", identity ? identity.getPrincipal().toString() : "null")
    
    setIsFetchingAddresses(true)
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_WALLET_ADDRESSES"
      })

      console.log("WalletContext: Background script response:", response)

      if (response && response.ok && response.addresses) {
        const walletAddresses: WalletAddresses = {
          bitcoin: response.addresses.bitcoin,
          ethereum: response.addresses.ethereum,
          solana: response.addresses.solana,
          icp_principal: response.addresses.icp_principal,
          icp_account: response.addresses.icp_account,
        }
        
        setAddresses(walletAddresses)
        setAddressesLoaded(true)
        setHasLoadedAddressesOnce(true)
        return walletAddresses
      } else {
        console.warn("WalletContext: Failed to fetch wallet addresses:", response?.error || "Unknown error")
        // Try fallback to direct actor call
        console.log("WalletContext: Trying fallback to direct actor call...")
        await fetchAddresses?.()
        return addresses
      }
    } catch (e) {
      console.warn("WalletContext: Failed to fetch wallet addresses via background script", e)
      // Try fallback to direct actor call
      console.log("WalletContext: Trying fallback to direct actor call...")
      try {
        await fetchAddresses?.()
        return addresses
      } catch (fallbackError) {
        console.error("WalletContext: Fallback also failed:", fallbackError)
        return null
      }
    } finally {
      setIsFetchingAddresses(false)
    }
  }, [isAuthenticated, addressesLoaded, isFetchingAddresses, fetchAddresses, addresses, identity])

  useEffect(() => {
    if (identity) {
      // Run fetch operations in parallel to prevent blocking
      Promise.all([fetchWalletAddresses()]).catch((error) => {
        console.error("Error in parallel fetch operations:", error)
      })
    } else {
      // Reset address states when user logs out
      setAddresses(null)
      setAddressesLoaded(false)
      setHasLoadedAddressesOnce(false)
      setIsFetchingAddresses(false)
    }
  }, [isAuthenticated, fetchWalletAddresses])

  const walletContextValue = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      principalText,
      isCreatingWallet,
      addresses,
      isFetchingAddresses,
      addressesLoaded,
      hasLoadedAddressesOnce,
      fetchAddresses,
      fetchWalletAddresses,
      getAddressesLoadingState,
      addAddressToWallet,
      network,
      setNetwork,
      hideBalance,
      setHideBalance,
      networkValues,
      updateNetworkValues,
      getNetworkValue,
      networkFilters,
    }),
    [
      isLoading,
      isAuthenticated,
      principalText,
      addresses,
      isFetchingAddresses,
      addressesLoaded,
      hasLoadedAddressesOnce,
      fetchAddresses,
      fetchWalletAddresses,
      getAddressesLoadingState,
      addAddressToWallet,
      network,
      hideBalance,
      networkValues,
      updateNetworkValues,
      getNetworkValue,
      networkFilters,
    ]
  )

  return (
    <WalletContext.Provider value={walletContextValue}>
      {children}
    </WalletContext.Provider>
  )
}
