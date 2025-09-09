import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useAuth } from "~lib/context/authContext"
import { HttpAgent } from "@dfinity/agent"
import {
  createActor as createWalletActor,
  canisterId as walletCanisterId,
} from "../../../../src/declarations/wallet"

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

  // Create authenticated wallet actor
  const [walletActor, setWalletActor] = useState<any>(null)

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

  // Create authenticated wallet actor when identity changes
  useEffect(() => {
    if (identity && walletCanisterId) {
      try {
        const agent = new HttpAgent({
          identity,
        })

        // Fetch root key for certificate validation during development
        if (process.env.DFX_NETWORK !== "ic") {
          agent.fetchRootKey().catch((err) => {
            console.warn(
              "Unable to fetch root key. Check to ensure that your local replica is running"
            )
            console.error(err)
          })
        }

        const actor = createWalletActor(walletCanisterId, {
          agent: agent as any,
        })

        setWalletActor(actor)
        console.log("Wallet actor created with authenticated identity")
      } catch (error) {
        console.error("Failed to create wallet actor:", error)
        setWalletActor(null)
      }
    } else {
      setWalletActor(null)
    }
  }, [identity])

  // Load state on mount
  useEffect(() => {
    // Initialize without persisted state
    setIsLoading(false)
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

  // Fetch addresses using authenticated actor
  const fetchAddresses = useCallback(async () => {
    if (!walletActor || addressesLoaded || isFetchingAddresses) return;

    setIsFetchingAddresses(true)
    console.log("Fetching addresses...")
    try {
      const result = await walletActor.wallet_addresses()
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
  }, [walletActor, addressesLoaded, isFetchingAddresses])

  // Function to get loading state for addresses
  const getAddressesLoadingState = useCallback(() => {
    return isFetchingAddresses && !hasLoadedAddressesOnce
  }, [isFetchingAddresses, hasLoadedAddressesOnce])

  // Fetch wallet addresses using authenticated actor
  const fetchWalletAddresses = useCallback(async (): Promise<WalletAddresses | null> => {
    if (!isAuthenticated || addressesLoaded || isFetchingAddresses || !identity || !walletActor) return addresses

    console.log("WalletContext: Fetching wallet addresses via authenticated actor...")
    console.log("WalletContext: isAuthenticated:", isAuthenticated)
    console.log("WalletContext: identity:", identity ? identity.getPrincipal().toString() : "null")

    // Call fetchAddresses and return current addresses state
    await fetchAddresses?.()
    return addresses
  }, [isAuthenticated, addressesLoaded, isFetchingAddresses, identity, walletActor, fetchAddresses, addresses])

  useEffect(() => {
    if (identity && walletActor) {
      // Run fetch operations in parallel to prevent blocking
      Promise.all([fetchWalletAddresses()]).catch((error) => {
        console.error("Error in parallel fetch operations:", error)
      })
    } else {
      // Reset address states when user logs out or actor is not available
      setAddresses(null)
      setAddressesLoaded(false)
      setHasLoadedAddressesOnce(false)
      setIsFetchingAddresses(false)
    }
  }, [identity, walletActor, fetchWalletAddresses])

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
