import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useAuth } from "~lib/context/authContext"
import { AuthClient } from "@dfinity/auth-client"
import {
  createActor as createWalletActor,
  canisterId as walletCanisterId,
} from "../../../../src/declarations/wallet"
import {
  getCanisterId as getConfiguredCanisterId,
  createAgentWithFallback,
} from "~config/networkConfig"

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

interface WalletContextType {
  // Wallet state
  isLoading: boolean
  isAuthenticated: boolean
  principalText: string | null
  isCreatingWallet: boolean
  setIsCreatingWallet: (creating: boolean) => void
  hasConfirmedWallet: boolean
  setHasConfirmedWallet: (confirmed: boolean) => void
  confirmWallet: () => Promise<boolean>

  // Addresses
  addresses: { bitcoin?: string; ethereum?: string; solana?: string } | null
  isFetchingAddresses: boolean
  fetchAddresses: () => Promise<void>

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
  const { isAuthenticated, principalText } = useAuth()

  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [network, setNetwork] = useState("All Networks")
  const [hideBalance, setHideBalance] = useState(false)
  const [hasConfirmedWallet, setHasConfirmedWallet] = useState(false)
  const [addresses, setAddresses] = useState<{
    bitcoin?: string
    ethereum?: string
    solana?: string
  } | null>(null)
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(false)

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

  // Resolve canister ID
  const resolveWalletCanisterId = useCallback(() => {
    const configured = getConfiguredCanisterId("wallet")
    if (configured && configured.length >= 8) return configured

    const envId =
      (walletCanisterId as string | undefined)?.toString?.() || walletCanisterId
    if (envId && typeof envId === "string" && envId.trim().length > 0)
      return envId.trim()

    return undefined
  }, [])

  // Create actor
  const getWalletActor = useCallback(async () => {
    const canister = resolveWalletCanisterId()
    if (!canister) {
      console.warn("WALLET canisterId is not configured")
      return undefined as any
    }

    const host = await createAgentWithFallback()
    const client = await AuthClient.create({})
    const identity = client.getIdentity()

    return createWalletActor(canister, {
      agentOptions: { identity, host },
    } as any)
  }, [resolveWalletCanisterId])

  // Fetch addresses
  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated || !hasConfirmedWallet || isFetchingAddresses) return
    setIsFetchingAddresses(true)
    try {
      const actor: any = await getWalletActor()
      if (!actor?.wallet_addresses) {
        console.warn("Wallet actor not available or method missing")
        return
      }
      const res = await actor.wallet_addresses()
      setAddresses({
        bitcoin: res?.bitcoin,
        ethereum: res?.ethereum,
        solana: res?.solana,
      })
    } catch (e) {
      console.warn("Failed to fetch addresses", e)
    } finally {
      setIsFetchingAddresses(false)
    }
  }, [getWalletActor, isAuthenticated, hasConfirmedWallet, isFetchingAddresses])

  // Confirm wallet
  const confirmWallet = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      console.warn("User must be authenticated before creating a wallet")
      return false
    }
    try {
      const actor: any = await getWalletActor()
      if (!actor) return false
      const res = await actor.wallet_addresses()
      setAddresses({
        bitcoin: res?.bitcoin,
        ethereum: res?.ethereum,
        solana: res?.solana,
      })
      setHasConfirmedWallet(true)
      try {
        localStorage.setItem(STORAGE_KEY_HAS_WALLET, "true")
      } catch {}
      return true
    } catch (e) {
      console.warn("confirmWallet failed", e)
      return false
    }
  }, [getWalletActor, isAuthenticated])

  const walletContextValue = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      principalText,
      isCreatingWallet,
      setIsCreatingWallet,
      hasConfirmedWallet,
      setHasConfirmedWallet,
      confirmWallet,
      addresses,
      isFetchingAddresses,
      fetchAddresses,
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
      isCreatingWallet,
      hasConfirmedWallet,
      confirmWallet,
      addresses,
      isFetchingAddresses,
      fetchAddresses,
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
