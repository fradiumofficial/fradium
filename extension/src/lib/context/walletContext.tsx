import { HttpAgent } from "@dfinity/agent"
import { Principal } from "@dfinity/principal"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react"

import { useAuth } from "~lib/context/authContext"
import { TOKENS_CONFIG, TokenType } from "~lib/utils/tokenUtils"
import { createAgentForCanister, createHttpAgent } from "~lib/utils/utils"
import { fetchUsdPrices } from "~service/priceService"

import {
  canisterId as ckbtcIndexCanisterId,
  createActor as createCkbTcIndexActor
} from "../../declarations/ckbtc_index"
import {
  canisterId as ckbtcKytCanisterId,
  createActor as createCkbTcKytActor
} from "../../declarations/ckbtc_kyt"
import {
  canisterId as ckbtcLedgerCanisterId,
  createActor as createCkbTcLedgerActor
} from "../../declarations/ckbtc_ledger"
import {
  canisterId as ckbtcMinterCanisterId,
  createActor as createCkbTcMinterActor
} from "../../declarations/ckbtc_minter"
import {
  createActor as createFradiumIndexActor,
  canisterId as fradiumIndexCanisterId
} from "../../declarations/fradium_index"
import {
  createActor as createFradiumLedgerActor,
  canisterId as fradiumLedgerCanisterId
} from "../../declarations/fradium_ledger"
import {
  createActor as createIcpIndexActor,
  canisterId as icpIndexCanisterId
} from "../../declarations/icp_index"
import {
  createActor as createIcpLedgerActor,
  canisterId as icpLedgerCanisterId
} from "../../declarations/icp_ledger"
import {
  createActor as createWalletActor,
  canisterId as walletCanisterId
} from "../../declarations/wallet"

// Resolve canister ID for extension builds where env injection may be missing
const EFFECTIVE_WALLET_CANISTER_ID =
  walletCanisterId ||
  // Common env prefixes across toolchains
  (typeof process !== "undefined" &&
    ((process as any).env?.VITE_CANISTER_ID_WALLET ||
      (process as any).env?.NEXT_PUBLIC_CANISTER_ID_WALLET ||
      (process as any).env?.PLASMO_PUBLI_CANISTER_ID_WALLET)) ||
  // As a last resort, fall back to mainnet canister ID in canister_ids.json
  "ufxgi-4p777-77774-qaadq-cai"

// Resolve ICP and Fradium ledger canister IDs for extension builds
const EFFECTIVE_ICP_LEDGER_CANISTER_ID =
  icpLedgerCanisterId ||
  (typeof process !== "undefined" &&
    ((process as any).env?.VITE_CANISTER_ID_ICP_LEDGER ||
      (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_ICP_LEDGER ||
      (process as any).env?.NEXT_PUBLIC_CANISTER_ID_ICP_LEDGER ||
      (process as any).env?.CANISTER_ID_ICP_LEDGER)) ||
  // ICP mainnet ledger as final fallback
  "ryjl3-tyaaa-aaaaa-aaaba-cai"

const EFFECTIVE_FRADIUM_LEDGER_CANISTER_ID =
  fradiumLedgerCanisterId ||
  (typeof process !== "undefined" &&
    (
      (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_FRADIUM_LEDGER ||
      (process as any).env?.NEXT_PUBLIC_CANISTER_ID_FRADIUM_LEDGER ||
      (process as any).env?.CANISTER_ID_FRADIUM_LEDGER)) ||
  // Project mainnet value from canister_ids.json
  "sr4wk-4qaaa-aaaae-qfdta-cai"

const EFFECTIVE_CKBTC_LEDGER_CANISTER_ID =
  ckbtcLedgerCanisterId ||
  (typeof process !== "undefined" &&
    ((process as any).env?.VITE_CANISTER_ID_CKBTC_LEDGER ||
      (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_CKBTC_LEDGER ||
      (process as any).env?.NEXT_PUBLIC_CANISTER_ID_CKBTC_LEDGER ||
      (process as any).env?.CANISTER_ID_CKBTC_LEDGER)) ||
  // ckBTC mainnet ledger
  "mc6ru-gyaaa-aaaar-qaaaq-cai"

const EFFECTIVE_CKBTC_INDEX_CANISTER_ID =
  ckbtcIndexCanisterId ||
  (typeof process !== "undefined" &&
    ((process as any).env?.VITE_CANISTER_ID_CKBTC_INDEX ||
      (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_CKBTC_INDEX ||
      (process as any).env?.NEXT_PUBLIC_CANISTER_ID_CKBTC_INDEX ||
      (process as any).env?.CANISTER_ID_CKBTC_INDEX)) ||
  // ckBTC mainnet index
  "mm444-5iaaa-aaaar-qaabq-cai"

const EFFECTIVE_ICP_INDEX_CANISTER_ID =
  icpIndexCanisterId ||
  (typeof process !== "undefined" &&
    ((process as any).env?.VITE_CANISTER_ID_ICP_INDEX ||
      (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_ICP_INDEX ||
      (process as any).env?.NEXT_PUBLIC_CANISTER_ID_ICP_INDEX ||
      (process as any).env?.CANISTER_ID_ICP_INDEX)) ||
  // ICP mainnet index
  "qhbym-qaaaa-aaaaa-aaafq-cai"

const EFFECTIVE_FRADIUM_INDEX_CANISTER_ID =
  fradiumIndexCanisterId ||
  (typeof process !== "undefined" &&
    ((process as any).env?.VITE_CANISTER_ID_FRADIUM_INDEX ||
      (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_FRADIUM_INDEX ||
      (process as any).env?.NEXT_PUBLIC_CANISTER_ID_FRADIUM_INDEX ||
      (process as any).env?.CANISTER_ID_FRADIUM_INDEX)) ||
  // Project mainnet value from canister_ids.json
  "vjrnc-hiaaa-aaaam-aejza-cai"

const EFFECTIVE_CKBTC_MINTER_CANISTER_ID =
  ckbtcMinterCanisterId ||
  (typeof process !== "undefined" &&
    ((process as any).env?.VITE_CANISTER_ID_CKBTC_MINTER ||
      (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_CKBTC_MINTER ||
      (process as any).env?.NEXT_PUBLIC_CANISTER_ID_CKBTC_MINTER ||
      (process as any).env?.CANISTER_ID_CKBTC_MINTER)) ||
  // ckBTC mainnet minter
  "ml52i-qqaaa-aaaar-qaaba-cai"

const EFFECTIVE_CKBTC_KYT_CANISTER_ID =
  ckbtcKytCanisterId ||
  (typeof process !== "undefined" &&
    ((process as any).env?.VITE_CANISTER_ID_CKBTC_KYT ||
      (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_CKBTC_KYT ||
      (process as any).env?.NEXT_PUBLIC_CANISTER_ID_CKBTC_KYT ||
      (process as any).env?.CANISTER_ID_CKBTC_KYT)) ||
  // ckBTC mainnet KYT
  "pvm5g-xaaaa-aaaar-qaaia-cai"

interface NetworkFilters {
  Bitcoin: boolean
  Solana: boolean
  Fradium: boolean
  Ethereum: boolean
  ICP: boolean
  ckBTC: boolean
}

interface NetworkValues {
  "All Networks": number
  Bitcoin: number
  Solana: number
  Fradium: number
  Ethereum: number
  ckBTC: number
}

interface WalletAddresses {
  bitcoin?: string
  ethereum?: string
  solana?: string
  icp_principal?: string
  icp_account?: string
  ckbtc?: string
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
  updateNetworkFilters: (filters: NetworkFilters) => void

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

  // ICRC actions
  sendIcrcTransfer: (
    token: "icp" | "fradium" | "ckbtc",
    toPrincipalText: string,
    amount: number
  ) => Promise<{ success: boolean; error?: string }>
  fetchIcrcHistory: (
    token: "icp" | "fradium" | "ckbtc",
    limit?: number
  ) => Promise<any[]>

  // ckBTC specific actions
  getCkbTcDepositAddress: () => Promise<string>
  retrieveBtc: (
    btcAddress: string,
    amount: number
  ) => Promise<{ success: boolean; blockIndex?: string; error?: string }>
  getBtcWithdrawalStatus: (blockIndex: string) => Promise<any>
  checkBtcAddressCompliance: (
    btcAddress: string
  ) => Promise<{ compliant: boolean; alerts?: any[] }>
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
  children
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
    ckBTC: 0
  })

  // Initialize network filters with default values
  const [networkFilters, setNetworkFilters] = useState<NetworkFilters>({
    Bitcoin: true,
    Solana: true,
    Fradium: true,
    Ethereum: true,
    ICP: true,
    ckBTC: true
  })

  // Load network filters from storage on mount
  useEffect(() => {
    const loadNetworkFilters = () => {
      try {
        if (typeof chrome !== "undefined" && chrome.storage) {
          // For extension environment, load from chrome storage
          chrome.storage.local.get(["networkFilters"], (result) => {
            if (result.networkFilters) {
              setNetworkFilters(result.networkFilters)
            }
          })
        } else {
          // For development, load from localStorage
          const stored = localStorage.getItem("networkFilters")
          if (stored) {
            setNetworkFilters(JSON.parse(stored))
          }
        }
      } catch (error) {
        console.error("Error loading network filters:", error)
      }
    }

    loadNetworkFilters()
  }, [])

  // Function to update and persist network filters
  const updateNetworkFilters = useCallback((filters: NetworkFilters) => {
    setNetworkFilters(filters)
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({ networkFilters: filters })
      } else {
        localStorage.setItem("networkFilters", JSON.stringify(filters))
      }
    } catch (error) {
      console.error("Error saving network filters:", error)
    }
  }, [])

  // Balance states
  const [balances, setBalances] = useState<BalanceStates>({})
  const [balanceLoading, setBalanceLoading] = useState<BalanceLoadingStates>({})
  const [balanceErrors, setBalanceErrors] = useState<BalanceErrorStates>({})
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false)

  // USD Price states
  const [usdPrices, setUsdPrices] = useState<USDPriceStates>({})
  const [usdPriceLoading, setUsdPriceLoading] = useState<USDPriceLoadingStates>(
    {}
  )
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
      id: "icp",
      symbol: "ICP",
      name: "Internet Computer",
      chain: "Internet Computer",
      icon: TOKENS_CONFIG[TokenType.ICP].icon,
      networkKey: "icp",
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
    },
    {
      id: "ckbtc",
      symbol: "ckBTC",
      name: "Chain Key BTC",
      chain: "Internet Computer",
      icon: TOKENS_CONFIG[TokenType.BITCOIN].icon, // Reuse BTC icon for ckBTC
      networkKey: "ckbtc",
      type: "icrc"
    }
  ]

  // Create authenticated wallet actor when identity changes
  useEffect(() => {
    if (identity && EFFECTIVE_WALLET_CANISTER_ID) {
      try {
        const agent = createHttpAgent(identity)

        const actor = createWalletActor(EFFECTIVE_WALLET_CANISTER_ID, {
          agent: agent
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
            (networkFilters.Fradium ? updated.Fradium : 0) +
            (networkFilters.ckBTC ? updated.ckBTC : 0)
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
    if (!walletActor || isFetchingAddresses) return

    setIsFetchingAddresses(true)
    console.log("Fetching addresses...")
    try {
      const result = await walletActor.wallet_addresses()
      console.log("Wallet addresses result:", result)

      // Fetch ckBTC deposit BTC address in parallel (best effort)
      let ckbtcAddr = ""
      try {
        if (identity && EFFECTIVE_CKBTC_MINTER_CANISTER_ID) {
          const minterAgent = createAgentForCanister(
            EFFECTIVE_CKBTC_MINTER_CANISTER_ID as any,
            undefined
          )
          const minterActor = createCkbTcMinterActor(
            EFFECTIVE_CKBTC_MINTER_CANISTER_ID as any,
            { agent: minterAgent as any }
          ) as any
          ckbtcAddr = await minterActor.get_btc_address({
            owner: [identity.getPrincipal()],
            subaccount: []
          })
        }
      } catch (e) {
        console.warn("Failed to fetch ckBTC deposit address:", e)
      }

      const newAddresses: WalletAddresses = {
        bitcoin: result.bitcoin,
        ethereum: result.ethereum,
        solana: result.solana,
        icp_principal: result.icp_principal,
        icp_account: result.icp_account,
        ckbtc: ckbtcAddr || undefined
      }

      setAddresses(newAddresses)
      setAddressesLoaded(true)
      setHasLoadedAddressesOnce(true)
    } catch (error) {
      console.error("Error fetching addresses:", error)
    } finally {
      setIsFetchingAddresses(false)
    }
  }, [walletActor, isFetchingAddresses])

  // Function to get loading state for addresses
  const getAddressesLoadingState = useCallback(() => {
    return isFetchingAddresses && !hasLoadedAddressesOnce
  }, [isFetchingAddresses, hasLoadedAddressesOnce])

  // Backfill ckBTC deposit address if older sessions populated addresses before this feature
  useEffect(() => {
    if (!identity || !addressesLoaded || !addresses || addresses.ckbtc) return
    ;(async () => {
      try {
        if (!EFFECTIVE_CKBTC_MINTER_CANISTER_ID) return
        const minterAgent = createAgentForCanister(
          EFFECTIVE_CKBTC_MINTER_CANISTER_ID as any,
          identity
        )
        const minterActor = createCkbTcMinterActor(
          EFFECTIVE_CKBTC_MINTER_CANISTER_ID as any,
          { agent: minterAgent as any }
        ) as any
        const addr = await minterActor.get_btc_address({
          owner: [identity.getPrincipal()],
          subaccount: []
        })
        if (addr && typeof addr === "string") {
          setAddresses((prev) => (prev ? { ...prev, ckbtc: addr } : prev))
        }
      } catch (e) {
        // ignore
      }
    })()
  }, [identity, addressesLoaded, addresses])

  // Fetch wallet addresses using authenticated actor
  const fetchWalletAddresses =
    useCallback(async (): Promise<WalletAddresses | null> => {
      if (!isAuthenticated || !identity || !walletActor) return addresses

      console.log(
        "WalletContext: Fetching wallet addresses via authenticated actor..."
      )
      console.log("WalletContext: isAuthenticated:", isAuthenticated)
      console.log(
        "WalletContext: identity:",
        identity ? identity.getPrincipal().toString() : "null"
      )

      // Call fetchAddresses and return current addresses state
      await fetchAddresses?.()
      return addresses
    }, [isAuthenticated, identity, walletActor, fetchAddresses, addresses])

  // Individual balance fetching functions - each runs independently
  const fetchTokenBalance = useCallback(
    async (token: {
      id: string
      symbol: string
      name: string
      chain: string
      icon: string
      networkKey: string
      type: string
    }) => {
      // Ensure loading is reflected even if we need to bail out
      setBalanceLoading((prev) => ({ ...prev, [token.id]: true }))
      setBalanceErrors((prev) => ({ ...prev, [token.id]: null }))

      if (!walletActor || !isAuthenticated || !identity) {
        setBalanceLoading((prev) => ({ ...prev, [token.id]: false }))
        return
      }

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

          case "icp":
            try {
              const resolvedIndexId = EFFECTIVE_ICP_INDEX_CANISTER_ID || icpIndexCanisterId
              if (!resolvedIndexId) throw new Error("ICP index canister ID not configured")
              const agentIndex = createAgentForCanister(resolvedIndexId as any, undefined)
              console.log("ICP Index Agent:", agentIndex)
              const icpIndexActor = createIcpIndexActor(resolvedIndexId as any, { agent: agentIndex as any }) as any
              const owner = identity.getPrincipal()
              const icpRaw = await icpIndexActor.icrc1_balance_of({ owner, subaccount: [] })
              const resolvedLedgerId = EFFECTIVE_ICP_LEDGER_CANISTER_ID
              const agentLedger = createAgentForCanister(resolvedLedgerId as any, undefined)
              const icpLedgerActor = createIcpLedgerActor(resolvedLedgerId as any, { agent: agentLedger as any }) as any
              let decimals = 8
              try { decimals = (await icpLedgerActor.icrc1_decimals?.()) ?? (await icpLedgerActor.decimals?.()) ?? 8 } catch {}
              const icpValue = Number(icpRaw) / Math.pow(10, Number(decimals))
              balance = icpValue.toFixed(6)
            } catch (e) {
              console.warn("Failed to fetch ICP balance via index:", e)
              balance = "0.000000"
            }
            break

          case "fradium":
            try {
              const resolvedLedgerId = EFFECTIVE_FRADIUM_LEDGER_CANISTER_ID || fradiumLedgerCanisterId
              const resolvedIndexId = EFFECTIVE_FRADIUM_INDEX_CANISTER_ID || fradiumIndexCanisterId
              if (!resolvedLedgerId) throw new Error("Fradium ledger canister ID not configured")
              const agent = createAgentForCanister(resolvedLedgerId as any, undefined)
              console.log("FUM Agent:", agent)
              const agentIndex = createAgentForCanister(resolvedIndexId as any, undefined)
              console.log("FUM Index Agent:", agentIndex)
              const fradiumIndexActor = createFradiumIndexActor(resolvedIndexId as any, { agent: agentIndex as any}) as any
              const fradiumActor = createFradiumLedgerActor(resolvedLedgerId as any, { agent: agent as any}) as any
              const owner = identity.getPrincipal()
              const fumRaw = await fradiumIndexActor.icrc1_balance_of({owner, subaccount: []})
              console.log("FUM Raw:", fumRaw)
              let decimals = 8
              try { decimals = (await fradiumActor.icrc1_decimals?.()) ?? 8} catch {}
              const fumValue = Number(fumRaw) / Math.pow(10, Number(decimals))
              balance = fumValue.toFixed(6)
            } catch (e) {
              console.warn("Failed to fetch Fradium balance:", e)
              balance = "0.000000"
            }
            break

          case "ckbtc":
            try {
              const resolvedLedgerId = EFFECTIVE_CKBTC_LEDGER_CANISTER_ID
              if (!resolvedLedgerId) throw new Error("ckBTC ledger canister ID not configured")
              try {
                const minterAgent = createAgentForCanister(EFFECTIVE_CKBTC_MINTER_CANISTER_ID as any, undefined)
                const minter = createCkbTcMinterActor(EFFECTIVE_CKBTC_MINTER_CANISTER_ID as any, { agent: minterAgent as any }) as any
                await minter.update_balance({ owner: [identity.getPrincipal()], subaccount: [] })
              } catch (_e) {}
              const agent = createAgentForCanister(resolvedLedgerId as any, undefined)
              const ckbtcActor = createCkbTcLedgerActor(resolvedLedgerId as any, { agent: agent as any }) as any
              const owner = identity.getPrincipal()
              const ckbtcRaw = await ckbtcActor.icrc1_balance_of({ owner, subaccount: [] })
              let decimals = 8
              try { decimals = (await ckbtcActor.icrc1_decimals?.()) ?? 8 } catch {}
              const ckbtcValue = Number(ckbtcRaw) / Math.pow(10, Number(decimals))
              balance = ckbtcValue.toFixed(8)
            } catch (e) {
              console.warn("Failed to fetch ckBTC balance:", e)
              balance = "0.000000"
            }
            break

          default:
            balance = "0.000000"
        }

        setBalances((prev) => ({ ...prev, [token.id]: balance }))
      } catch (error) {
        console.error(`Error fetching ${token.symbol} balance:`, error)
        setBalanceErrors((prev) => ({
          ...prev,
          [token.id]: error.message || "Failed to fetch balance"
        }))
        setBalances((prev) => ({ ...prev, [token.id]: "0.000000" }))
      } finally {
        setBalanceLoading((prev) => ({ ...prev, [token.id]: false }))
      }
    },
    [walletActor, isAuthenticated, identity]
  )

  // Fetch all balances independently (each token fetches in parallel)
  const fetchAllBalances = useCallback(async () => {
    if (!walletActor || !isAuthenticated || !identity) return

    // Start all balance fetches in parallel - they run independently
    const balancePromises = EXTENSION_TOKENS.map((token) =>
      fetchTokenBalance(token)
    )
    await Promise.allSettled(balancePromises) // Use allSettled so one failure doesn't stop others
  }, [walletActor, isAuthenticated, identity, fetchTokenBalance])

  // Refresh all balances with loading state management
  const refreshAllBalances = useCallback(async () => {
    if (isRefreshingBalances || !walletActor || !isAuthenticated || !identity)
      return

    setIsRefreshingBalances(true)

    // Set all tokens to loading state
    const loadingState: BalanceLoadingStates = {}
    EXTENSION_TOKENS.forEach((token) => {
      loadingState[token.id] = true
    })
    setBalanceLoading(loadingState)

    try {
      // Start all balance fetches in parallel
      const balancePromises = EXTENSION_TOKENS.map((token) =>
        fetchTokenBalance(token)
      )
      await Promise.allSettled(balancePromises)
    } finally {
      setIsRefreshingBalances(false)
    }
  }, [
    isRefreshingBalances,
    walletActor,
    isAuthenticated,
    identity,
    fetchTokenBalance
  ])

  const fetchAllUSDPrices = useCallback(async () => {
    try {
      const ids = EXTENSION_TOKENS.map((t) => t.id)
      const result = await fetchUsdPrices(ids)
      setUsdPrices((prev) => ({ ...prev, ...result }))
    } catch {
      // keep previous prices
    } finally {
      setUsdPriceLoading({})
    }
  }, [])

  const refreshAllUSDPrices = useCallback(async () => {
    if (isRefreshingPrices) return

    setIsRefreshingPrices(true)

    const loadingState: USDPriceLoadingStates = {}
    EXTENSION_TOKENS.forEach((token) => {
      loadingState[token.id] = true
    })
    setUsdPriceLoading(loadingState)

    try {
      await fetchAllUSDPrices()
    } finally {
      setIsRefreshingPrices(false)
    }
  }, [isRefreshingPrices, fetchAllUSDPrices])

  // Send ICRC transfer (ICP, Fradium, or ckBTC)
  const sendIcrcTransfer = useCallback(
    async (
      token: "icp" | "fradium" | "ckbtc",
      toPrincipalText: string,
      amount: number
    ) => {
      try {
        if (!identity) throw new Error("Not authenticated")
        const to = Principal.fromText(toPrincipalText)

        // Resolve proper ledger canister ID per token
        const ledgerCanisterId =
          token === "icp"
            ? (EFFECTIVE_ICP_LEDGER_CANISTER_ID as any)
            : token === "fradium"
              ? (EFFECTIVE_FRADIUM_LEDGER_CANISTER_ID as any)
              : (EFFECTIVE_CKBTC_LEDGER_CANISTER_ID as any)

        if (!ledgerCanisterId) throw new Error("Ledger canister ID not configured")

        // Use authenticated agent for update (transfer)
        const agent = createHttpAgent(identity)
        
        // Fetch root key for local development
        if (process.env.DFX_NETWORK !== "ic") {
          try { 
            await agent.fetchRootKey() 
          } catch (err) {
            console.warn("Unable to fetch root key:", err)
          }
        }

        const actor =
          token === "icp"
            ? (createIcpLedgerActor(ledgerCanisterId, { agent: agent as any }) as any)
            : token === "fradium"
              ? (createFradiumLedgerActor(ledgerCanisterId, { agent: agent as any }) as any)
              : (createCkbTcLedgerActor(ledgerCanisterId, { agent: agent as any }) as any)

        // decimals -> convert to e8s
        let decimals = 8
        try {
          decimals = (await actor.icrc1_decimals?.()) ?? (await actor.decimals?.()) ?? 8
        } catch {}
        const amountE8s = BigInt(Math.floor(amount * Math.pow(10, Number(decimals))))

        const res = await actor.icrc1_transfer({
          from_subaccount: [],
          to: { owner: to, subaccount: [] },
          amount: amountE8s,
          fee: [],
          memo: [],
          created_at_time: []
        })
        if (res && (res as any).Err) throw new Error(JSON.stringify((res as any).Err))
        const blockIndex = (res as any)?.Ok ? String((res as any).Ok) : undefined
        // Kickoff a background refresh
        refreshAllBalances().catch(() => {})
        return { success: true, blockIndex }
      } catch (e: any) {
        return { success: false, error: e?.message || String(e) }
      }
    },
    [identity, refreshAllBalances]
  )

  // Fetch ICRC history via index canisters (raw entries)
  const fetchIcrcHistory = useCallback(
    async (token: "icp" | "fradium" | "ckbtc", limit = 20) => {
      try {
        if (!identity) return []
        const agent = createAgentForCanister(
          token === "icp"
            ? (EFFECTIVE_ICP_INDEX_CANISTER_ID as any)
            : token === "fradium"
              ? (EFFECTIVE_FRADIUM_INDEX_CANISTER_ID as any)
              : (EFFECTIVE_CKBTC_INDEX_CANISTER_ID as any),
          undefined
        )
        const owner = identity.getPrincipal()
        if (token === "icp") {
          if (!EFFECTIVE_ICP_INDEX_CANISTER_ID) return []
          const indexActor = createIcpIndexActor(EFFECTIVE_ICP_INDEX_CANISTER_ID as any, {
            agent: agent as any
          }) as any
          const res = await indexActor.get_account_transactions({
            account: { owner, subaccount: [] },
            start: [],
            max_results: BigInt(limit)
          })
          if (res && res.Ok && res.Ok.transactions) return res.Ok.transactions
          return []
        } else if (token === "fradium") {
          if (!EFFECTIVE_FRADIUM_INDEX_CANISTER_ID) return []
          const indexActor = createFradiumIndexActor(
            EFFECTIVE_FRADIUM_INDEX_CANISTER_ID as any,
            { agent: agent as any }
          ) as any
          const res = await indexActor.get_account_transactions({
            account: { owner, subaccount: [] },
            start: [],
            max_results: BigInt(limit)
          })
          if (res && res.Ok && res.Ok.transactions) return res.Ok.transactions
          return []
        } else if (token === "ckbtc") {
          if (!EFFECTIVE_CKBTC_INDEX_CANISTER_ID) return []
          const indexActor = createCkbTcIndexActor(
            EFFECTIVE_CKBTC_INDEX_CANISTER_ID as any,
            { agent: agent as any }
          ) as any
          const res = await indexActor.get_account_transactions({
            account: { owner, subaccount: [] },
            start: [],
            max_results: BigInt(limit)
          })
          if (res && res.Ok && res.Ok.transactions) return res.Ok.transactions
          return []
        }
        return []
      } catch {
        return []
      }
    },
    [identity]
  )

  // Get ckBTC deposit address from minter canister
  const getCkbTcDepositAddress = useCallback(async (): Promise<string> => {
    try {
      if (!identity) throw new Error("Not authenticated")
      const agent = createAgentForCanister(
        EFFECTIVE_CKBTC_MINTER_CANISTER_ID as any,
        undefined
      )
      const minterActor = createCkbTcMinterActor(
        EFFECTIVE_CKBTC_MINTER_CANISTER_ID as any,
        { agent: agent as any }
      ) as any
      const address = await minterActor.get_btc_address({
        owner: [identity.getPrincipal()],
        subaccount: []
      })
      return address
    } catch (e: any) {
      console.error("Failed to get ckBTC deposit address:", e)
      throw new Error(e?.message || "Failed to get deposit address")
    }
  }, [identity])

  // Withdraw ckBTC to BTC
  const retrieveBtc = useCallback(
    async (
      btcAddress: string,
      amount: number
    ): Promise<{ success: boolean; blockIndex?: string; error?: string }> => {
      try {
        if (!identity) throw new Error("Not authenticated")
        const agent = createAgentForCanister(
          EFFECTIVE_CKBTC_MINTER_CANISTER_ID as any,
          identity
        )
        const minterActor = createCkbTcMinterActor(
          EFFECTIVE_CKBTC_MINTER_CANISTER_ID as any,
          { agent: agent as any }
        ) as any

        // Convert amount to satoshis (8 decimals for ckBTC)
        const amountSatoshis = BigInt(Math.floor(amount * 100000000))

        const result = await minterActor.retrieve_btc({
          address: btcAddress,
          amount: amountSatoshis
        })

        if (result.Ok) {
          // Refresh balances after successful withdrawal
          refreshAllBalances().catch(() => {})
          return { success: true, blockIndex: result.Ok.block_index.toString() }
        } else {
          return { success: false, error: JSON.stringify(result.Err) }
        }
      } catch (e: any) {
        console.error("Failed to retrieve BTC:", e)
        return { success: false, error: e?.message || "Failed to retrieve BTC" }
      }
    },
    [identity, refreshAllBalances]
  )

  // Get BTC withdrawal status
  const getBtcWithdrawalStatus = useCallback(
    async (blockIndex: string): Promise<any> => {
      try {
        if (!identity) throw new Error("Not authenticated")
        const agent = createAgentForCanister(
          EFFECTIVE_CKBTC_KYT_CANISTER_ID as any,
          identity
        )
        const minterActor = createCkbTcMinterActor(
          EFFECTIVE_CKBTC_MINTER_CANISTER_ID as any,
          { agent: agent as any }
        ) as any
        const status = await minterActor.retrieve_btc_status_v2({
          block_index: BigInt(blockIndex)
        })
        return status
      } catch (e: any) {
        console.error("Failed to get BTC withdrawal status:", e)
        throw new Error(e?.message || "Failed to get withdrawal status")
      }
    },
    [identity]
  )

  // Check BTC address compliance using KYT
  const checkBtcAddressCompliance = useCallback(
    async (
      btcAddress: string
    ): Promise<{ compliant: boolean; alerts?: any[] }> => {
      try {
        if (!identity) throw new Error("Not authenticated")
        const agent = createHttpAgent(identity)
        const kytActor = createCkbTcKytActor(
          EFFECTIVE_CKBTC_KYT_CANISTER_ID as any,
          { agent: agent as any }
        ) as any

        // Create a mock withdrawal attempt for compliance check
        const withdrawalAttempt = {
          caller: identity.getPrincipal(),
          id: `compliance-check-${Date.now()}`,
          amount: 1000n, // Small amount for compliance check
          address: btcAddress,
          timestamp_nanos: BigInt(Date.now() * 1000000)
        }

        const result = await kytActor.fetch_withdrawal_alerts(withdrawalAttempt)

        if (result.Ok) {
          const alerts = result.Ok.alerts || []
          // Check if any alert has severe or high level
          const hasSevereAlerts = alerts.some(
            (alert: any) => alert.level === "Severe" || alert.level === "High"
          )

          return {
            compliant: !hasSevereAlerts,
            alerts: alerts
          }
        } else {
          // If KYT check fails, assume compliant for now (graceful degradation)
          console.warn("KYT check failed, assuming compliant:", result.Err)
          return { compliant: true }
        }
      } catch (e: any) {
        console.error("Failed to check BTC address compliance:", e)
        // Graceful degradation - if KYT fails, allow the operation
        return { compliant: true }
      }
    },
    [identity]
  )

  // Auto-fetch when actor becomes available (run once per session)
  useEffect(() => {
    if (identity && walletActor && isAuthenticated && !hasLoadedAddressesOnce) {
      ;(async () => {
        try {
          await Promise.all([
            fetchAddresses?.(),
            fetchAllBalances?.(),
            fetchAllUSDPrices?.()
          ])
        } catch (error) {
          console.error("Error in parallel fetch operations:", error)
        }
      })()
    } else if (!identity || !walletActor || !isAuthenticated) {
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
  }, [
    identity,
    walletActor,
    isAuthenticated,
    hasLoadedAddressesOnce,
    fetchAddresses,
    fetchAllBalances,
    fetchAllUSDPrices
  ])

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
      updateNetworkFilters,
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
      // ICRC actions
      sendIcrcTransfer,
      fetchIcrcHistory,
      // ckBTC specific actions
      getCkbTcDepositAddress,
      retrieveBtc,
      getBtcWithdrawalStatus,
      checkBtcAddressCompliance
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
      updateNetworkFilters,
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
      sendIcrcTransfer,
      fetchIcrcHistory,
      getCkbTcDepositAddress,
      retrieveBtc,
      getBtcWithdrawalStatus,
      checkBtcAddressCompliance
    ]
  )

  return (
    <WalletContext.Provider value={walletContextValue}>
      {children}
    </WalletContext.Provider>
  )
}
