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
import { TOKENS_CONFIG, TokenType } from "~lib/utils/tokenUtils"

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

interface BalanceStates {
  [tokenId: string]: string
}

interface BalanceLoadingStates {
  [tokenId: string]: boolean
}

interface BalanceErrorStates {
  [tokenId: string]: string | null
}

interface USDPriceStates {
  [tokenId: string]: number | null
}

interface USDPriceLoadingStates {
  [tokenId: string]: boolean
}

interface USDPriceErrorStates {
  [tokenId: string]: string | null
}

interface WalletContextType {
  // Wallet state
  isLoading: boolean
  isAuthenticated: boolean
  principalText: string | null
  isCreatingWallet: boolean

  // Wallet actor
  walletActor: any | null

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

  // Token configuration
  extensionTokens: Array<{
    id: string
    symbol: string
    name: string
    chain: string
    icon: string
    networkKey: string
    type: string
  }>

  // Balance management
  hideBalance: boolean
  setHideBalance: (hide: boolean) => void
  networkValues: NetworkValues
  updateNetworkValues: (values: Partial<NetworkValues>) => void
  getNetworkValue: (networkName: string) => string

  // Balance states
  balances: BalanceStates
  balanceLoading: BalanceLoadingStates
  balanceErrors: BalanceErrorStates
  isRefreshingBalances: boolean
  fetchAllBalances: () => Promise<void>
  refreshAllBalances: () => Promise<void>

  // USD Price states
  usdPrices: USDPriceStates
  usdPriceLoading: USDPriceLoadingStates
  usdPriceErrors: USDPriceErrorStates
  isRefreshingPrices: boolean
  fetchAllUSDPrices: () => Promise<void>
  refreshAllUSDPrices: () => Promise<void>
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

  // Balance states
  const [balances, setBalances] = useState<BalanceStates>({})
  const [balanceLoading, setBalanceLoading] = useState<BalanceLoadingStates>({})
  const [balanceErrors, setBalanceErrors] = useState<BalanceErrorStates>({})
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false)

  // USD Price states
  const [usdPrices, setUsdPrices] = useState<USDPriceStates>({})
  const [usdPriceLoading, setUsdPriceLoading] = useState<USDPriceLoadingStates>({})
  const [usdPriceErrors, setUsdPriceErrors] = useState<USDPriceErrorStates>({})
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false)

  // Token configuration for balance fetching
  const EXTENSION_TOKENS = [
    {
      id: "bitcoin",
      symbol: "BTC",
      name: "Bitcoin",
      chain: "Bitcoin",
      icon: TOKENS_CONFIG[TokenType.BITCOIN].icon,
      networkKey: "btc",
      type: "native"
    },
    {
      id: "ethereum",
      symbol: "ETH",
      name: "Ethereum",
      chain: "Ethereum",
      icon: TOKENS_CONFIG[TokenType.ETHEREUM].icon,
      networkKey: "eth",
      type: "native"
    },
    {
      id: "solana",
      symbol: "SOL",
      name: "Solana",
      chain: "Solana",
      icon: TOKENS_CONFIG[TokenType.SOLANA].icon,
      networkKey: "sol",
      type: "native"
    },
    {
      id: "fradium",
      symbol: "FUM",
      name: "Fradium",
      chain: "Fradium",
      icon: TOKENS_CONFIG[TokenType.FUM].icon,
      networkKey: "fra",
      type: "native"
    }
  ]

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

  // Individual balance fetching functions - each runs independently
  const fetchTokenBalance = useCallback(async (token: { id: string; symbol: string; name: string; chain: string; icon: string; networkKey: string; type: string }) => {
    if (!walletActor || !isAuthenticated || !identity) return

    // Set loading state for this specific token
    setBalanceLoading(prev => ({ ...prev, [token.id]: true }))
    setBalanceErrors(prev => ({ ...prev, [token.id]: null }))

    try {
      let balance: string

      // Fetch balance based on token type
      switch (token.id) {
        case "bitcoin":
          const btcBalance = await walletActor.bitcoin_balance()
          const btcValue = Number(btcBalance) / 100000000 // Convert satoshi to BTC
          balance = btcValue.toFixed(8)
          break

        case "ethereum":
          const ethBalance = await walletActor.ethereum_balance()
          // Convert wei to ETH (1 ETH = 10^18 wei)
          const ethValue = Number(ethBalance) / 1000000000000000000
          balance = ethValue.toFixed(6)
          break

        case "solana":
          const solBalance = await walletActor.solana_balance()
          const solValue = Number(solBalance) / 1000000000 // Convert lamports to SOL
          balance = solValue.toFixed(9)
          break

        case "fradium":
          // Fradium balance - placeholder for now
          balance = "0.00"
          break

        default:
          balance = "0.000000"
      }

      setBalances(prev => ({ ...prev, [token.id]: balance }))
    } catch (error) {
      console.error(`Error fetching ${token.symbol} balance:`, error)
      setBalanceErrors(prev => ({ ...prev, [token.id]: error.message || "Failed to fetch balance" }))
      setBalances(prev => ({ ...prev, [token.id]: "0.000000" }))
    } finally {
      setBalanceLoading(prev => ({ ...prev, [token.id]: false }))
    }
  }, [walletActor, isAuthenticated, identity])

  // Fetch all balances independently (each token fetches in parallel)
  const fetchAllBalances = useCallback(async () => {
    if (!walletActor || !isAuthenticated || !identity) return

    // Start all balance fetches in parallel - they run independently
    const balancePromises = EXTENSION_TOKENS.map(token => fetchTokenBalance(token))
    await Promise.allSettled(balancePromises) // Use allSettled so one failure doesn't stop others
  }, [walletActor, isAuthenticated, identity, fetchTokenBalance])

  // Refresh all balances with loading state management
  const refreshAllBalances = useCallback(async () => {
    if (isRefreshingBalances || !walletActor || !isAuthenticated || !identity) return

    setIsRefreshingBalances(true)

    // Set all tokens to loading state
    const loadingState: BalanceLoadingStates = {}
    EXTENSION_TOKENS.forEach(token => {
      loadingState[token.id] = true
    })
    setBalanceLoading(loadingState)

    try {
      // Start all balance fetches in parallel
      const balancePromises = EXTENSION_TOKENS.map(token => fetchTokenBalance(token))
      await Promise.allSettled(balancePromises)
    } finally {
      setIsRefreshingBalances(false)
    }
  }, [isRefreshingBalances, walletActor, isAuthenticated, identity, fetchTokenBalance])

  // USD Price functions (placeholder for now)
  const fetchTokenUSDPrice = useCallback(async (tokenId: string) => {
    // Placeholder - implement USD price fetching later
    setUsdPrices(prev => ({ ...prev, [tokenId]: 0 }))
  }, [])

  const fetchAllUSDPrices = useCallback(async () => {
    const pricePromises = EXTENSION_TOKENS.map(token => fetchTokenUSDPrice(token.id))
    await Promise.allSettled(pricePromises)
  }, [fetchTokenUSDPrice])

  const refreshAllUSDPrices = useCallback(async () => {
    if (isRefreshingPrices) return

    setIsRefreshingPrices(true)

    const loadingState: USDPriceLoadingStates = {}
    EXTENSION_TOKENS.forEach(token => {
      loadingState[token.id] = true
    })
    setUsdPriceLoading(loadingState)

    try {
      await fetchAllUSDPrices()
    } finally {
      setIsRefreshingPrices(false)
    }
  }, [isRefreshingPrices, fetchAllUSDPrices])

  // Auto-fetch balances when wallet actor becomes available
  useEffect(() => {
    if (identity && walletActor && isAuthenticated) {
      // Run all fetch operations in parallel
      Promise.all([
        fetchWalletAddresses(),
        fetchAllBalances(),
        fetchAllUSDPrices()
      ]).catch((error) => {
        console.error("Error in parallel fetch operations:", error)
      })
    } else {
      // Reset all states when user logs out or actor is not available
      setAddresses(null)
      setAddressesLoaded(false)
      setHasLoadedAddressesOnce(false)
      setIsFetchingAddresses(false)

      // Reset balance states
      setBalances({})
      setBalanceLoading({})
      setBalanceErrors({})
      setIsRefreshingBalances(false)

      // Reset USD price states
      setUsdPrices({})
      setUsdPriceLoading({})
      setUsdPriceErrors({})
      setIsRefreshingPrices(false)
    }
  }, [identity, walletActor, isAuthenticated, fetchWalletAddresses, fetchAllBalances, fetchAllUSDPrices])

  const walletContextValue = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      principalText,
      isCreatingWallet,
      walletActor,
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
      // Token configuration
      extensionTokens: EXTENSION_TOKENS,
      // Balance management
      balances,
      balanceLoading,
      balanceErrors,
      isRefreshingBalances,
      fetchAllBalances,
      refreshAllBalances,
      // USD Price management
      usdPrices,
      usdPriceLoading,
      usdPriceErrors,
      isRefreshingPrices,
      fetchAllUSDPrices,
      refreshAllUSDPrices,
    }),
    [
      isLoading,
      isAuthenticated,
      principalText,
      walletActor,
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
      // Token configuration
      EXTENSION_TOKENS,
      // Balance management
      balances,
      balanceLoading,
      balanceErrors,
      isRefreshingBalances,
      fetchAllBalances,
      refreshAllBalances,
      // USD Price management
      usdPrices,
      usdPriceLoading,
      usdPriceErrors,
      isRefreshingPrices,
      fetchAllUSDPrices,
      refreshAllUSDPrices,
    ]
  )

  return (
    <WalletContext.Provider value={walletContextValue}>
      {children}
    </WalletContext.Provider>
  )
}
