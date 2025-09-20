// Transaction History Service for the browser extension
// Adapted from src/frontend/src/core/services/historyTransactionService.js

import { Principal } from '@dfinity/principal'
import { createActor as createIcpIndexActor, canisterId as icpIndexCanisterId } from '../declarations/icp_index'
import { createActor as createFradiumIndexActor, canisterId as fradiumIndexCanisterId } from '../declarations/fradium_index'
import { createActor as createCkbtcIndexActor, canisterId as ckbtcIndexCanisterId } from '../declarations/ckbtc_index'
import { createActor as createCkethIndexActor, canisterId as ckethIndexCanisterId } from '../declarations/cketh_index'
import { createAgentForCanister } from '~lib/utils/utils'

export type NetworkKey = 'ethereum' | 'bitcoin' | 'solana' | 'icp' | 'fradium' | 'ckbtc' | 'cketh' | 'internet_computer'

export type UnifiedTx = {
  hash: string
  chain: 'Ethereum' | 'Bitcoin' | 'Solana' | 'Internet Computer'
  title: string
  amount: number
  status: 'Completed' | 'Failed' | 'Pending' | 'Confirming'
  timestamp: number
  from: string
  to: string
  // Optional extras per-chain
  gasUsed?: string
  gasPrice?: string
  blockNumber?: string
  confirmations?: string | number
  fee?: number
  slot?: number
  blockHeight?: number
  size?: number
  weight?: number
  // ICRC token discriminator for IC chain tokens
  tokenType?: 'icp' | 'fradium' | 'ckbtc' | 'cketh'
}

// Pageable ICP history response
export type IcrcPage = {
  items: UnifiedTx[]
  nextStart?: string
}

// Environment configuration (use same keys as other extension services)
const ETHERSCAN_API_KEY = (typeof process !== 'undefined' && (
  (process as any)?.env?.PLASMO_PUBLIC_ETHERSCAN_API_KEY ||
  (process as any)?.env?.VITE_ETHERSCAN_API_KEY ||
  (process as any)?.env?.ETHERSCAN_API_KEY ||
  ''
)) || ''

const API_URLS = {
  ethereum: {
    sepolia: `https://api-sepolia.etherscan.io/api?module=account&action=txlist&apikey=${ETHERSCAN_API_KEY}`,
    mainnet: `https://api.etherscan.io/api?module=account&action=txlist&apikey=${ETHERSCAN_API_KEY}`
  },
  bitcoin: {
    testnet: 'https://api.blockcypher.com/v1/btc/test3',
    mainnet: 'https://api.blockcypher.com/v1/btc/main'
  },
  solana: {
    devnet: 'https://api.devnet.solana.com',
    mainnet: 'https://api.mainnet-beta.solana.com'
  }
}

// ---------------------------------
// Resolve effective canister IDs with sane fallbacks (mirrors walletContext)
// ---------------------------------
const EFFECTIVE_ICP_INDEX_CANISTER_ID =
  icpIndexCanisterId ||
  (typeof process !== 'undefined' && (
    (process as any).env?.VITE_CANISTER_ID_ICP_INDEX ||
    (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_ICP_INDEX ||
    (process as any).env?.NEXT_PUBLIC_CANISTER_ID_ICP_INDEX ||
    (process as any).env?.CANISTER_ID_ICP_INDEX
  )) ||
  'qhbym-qaaaa-aaaaa-aaafq-cai'

const EFFECTIVE_FRADIUM_INDEX_CANISTER_ID =
  fradiumIndexCanisterId ||
  (typeof process !== 'undefined' && (
    (process as any).env?.VITE_CANISTER_ID_FRADIUM_INDEX ||
    (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_FRADIUM_INDEX ||
    (process as any).env?.NEXT_PUBLIC_CANISTER_ID_FRADIUM_INDEX ||
    (process as any).env?.CANISTER_ID_FRADIUM_INDEX
  )) ||
  'vjrnc-hiaaa-aaaam-aejza-cai'

const EFFECTIVE_CKBTC_INDEX_CANISTER_ID =
  ckbtcIndexCanisterId ||
  (typeof process !== 'undefined' && (
    (process as any).env?.VITE_CANISTER_ID_CKBTC_INDEX ||
    (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_CKBTC_INDEX ||
    (process as any).env?.NEXT_PUBLIC_CANISTER_ID_CKBTC_INDEX ||
    (process as any).env?.CANISTER_ID_CKBTC_INDEX
  )) ||
  'mm444-5iaaa-aaaar-qaabq-cai'

const EFFECTIVE_CKETH_INDEX_CANISTER_ID =
  ckethIndexCanisterId ||
  (typeof process !== 'undefined' && (
    (process as any).env?.VITE_CANISTER_ID_CKETH_INDEX ||
    (process as any).env?.PLASMO_PUBLIC_CANISTER_ID_CKETH_INDEX ||
    (process as any).env?.NEXT_PUBLIC_CANISTER_ID_CKETH_INDEX ||
    (process as any).env?.CANISTER_ID_CKETH_INDEX
  )) ||
  'sh5u2-cqaaa-aaaar-qacna-cai'

// ---------------------------------
// Simple persistence (best-effort)
// ---------------------------------
const STORAGE_PREFIX = 'txHistory'

async function saveTransactionsSnapshot(key: string, items: UnifiedTx[]): Promise<void> {
  const payload = { items, savedAt: Date.now() }
  try {
    if (typeof chrome !== 'undefined' && (chrome as any).storage?.local) {
      await new Promise<void>((resolve) => {
        ;(chrome as any).storage.local.set({ [key]: payload }, () => resolve())
      })
    } else {
      localStorage.setItem(key, JSON.stringify(payload))
    }
  } catch (_) {
    // ignore persistence errors
  }
}

async function loadTransactionsSnapshot(key: string): Promise<{ items: UnifiedTx[]; savedAt: number } | null> {
  try {
    if (typeof chrome !== 'undefined' && (chrome as any).storage?.local) {
      const res = await new Promise<any>((resolve) => {
        ;(chrome as any).storage.local.get([key], (data: any) => resolve(data?.[key]))
      })
      if (res && res.items) return res
      return null
    } else {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (parsed && parsed.items) return parsed
      return null
    }
  } catch (_) {
    return null
  }
}

function buildHistoryStorageKey(addressOrPrincipal: string, network: NetworkKey, extra?: string | null): string {
  const norm = String(addressOrPrincipal || '').toLowerCase()
  const suffix = extra ? `:${extra}` : ''
  return `${STORAGE_PREFIX}:${network}:${norm}${suffix}`
}

export async function getCachedTransactionHistory(addressOrPrincipal: string, network: NetworkKey, options?: { icpAccount?: string | null }): Promise<UnifiedTx[]> {
  const key = buildHistoryStorageKey(addressOrPrincipal, network, options?.icpAccount || null)
  const cached = await loadTransactionsSnapshot(key)
  return cached?.items || []
}

// -----------------------------
// Ethereum via Etherscan
// -----------------------------
export async function getETHTransactionHistory(address: string, network: 'sepolia' | 'mainnet' = 'sepolia', limit = 20): Promise<UnifiedTx[]> {
  try {
    const apiUrl = (API_URLS as any).ethereum?.[network]
    if (!apiUrl) throw new Error(`Unsupported Ethereum network: ${network}`)

    if (!ETHERSCAN_API_KEY || ETHERSCAN_API_KEY.trim() === '') {
      console.warn('⚠️ Etherscan API key not configured. Ethereum transaction history unavailable.')
      console.warn('To enable Ethereum transaction history, set PLASMO_PUBLIC_ETHERSCAN_API_KEY in your environment variables.')
      console.warn('Get a free API key from: https://etherscan.io/apis')
      return []
    }

    const url = `${apiUrl}&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc`
    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`Etherscan API error: ${response.status} ${response.statusText}`)
    const data = await response.json()
    if (data.status !== '1') throw new Error(`Etherscan API error: ${data.message}`)
    const list: any[] = Array.isArray(data.result) ? data.result : []

    return list.map((tx) => {
      const isSent = String(tx.from).toLowerCase() === String(address).toLowerCase()
      const amount = Number(tx.value) / 1e18
      return {
        hash: tx.hash,
        chain: 'Ethereum',
        title: isSent ? `Transfer to ${String(tx.to).slice(0, 6)}...${String(tx.to).slice(-4)}` : `Received from ${String(tx.from).slice(0, 6)}...${String(tx.from).slice(-4)}`,
        amount: isSent ? -amount : amount,
        status: tx.isError === '0' ? 'Completed' : 'Failed',
        timestamp: Number.parseInt(tx.timeStamp, 10) * 1000,
        from: tx.from,
        to: tx.to,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        blockNumber: tx.blockNumber,
        confirmations: tx.confirmations
      } as UnifiedTx
    })
  } catch (e) {
    console.error('Error fetching ETH transaction history:', e)
    return []
  }
}

// -----------------------------
// Solana via RPC
// -----------------------------
export async function getSolanaTransactionHistory(address: string, network: 'devnet' | 'mainnet' = 'devnet', limit = 20): Promise<UnifiedTx[]> {
  try {
    const rpcUrl = (API_URLS as any).solana?.[network]
    if (!rpcUrl) throw new Error(`Unsupported Solana network: ${network}`)

    // 1) Fetch signatures
    const sigRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [address, { limit, commitment: 'confirmed' }] })
    })
    if (!sigRes.ok) throw new Error(`Solana RPC error: ${sigRes.status} ${sigRes.statusText}`)
    const sigJson = await sigRes.json()
    if (sigJson.error) throw new Error(`Solana RPC error: ${sigJson.error?.message}`)
    const signatures: any[] = Array.isArray(sigJson.result) ? sigJson.result : []

    // 2) Fetch tx details
    const details = await Promise.all(
      signatures.map(async (sig: any) => {
        try {
          const txRes = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'getTransaction', params: [sig.signature, { encoding: 'json', commitment: 'confirmed', maxSupportedTransactionVersion: 0 }] })
          })
          if (!txRes.ok) return null
          const txJson = await txRes.json()
          if (txJson.error || !txJson.result) return null
          return { signature: sig.signature, slot: sig.slot, blockTime: sig.blockTime, confirmationStatus: sig.confirmationStatus, err: sig.err, transaction: txJson.result }
        } catch (_) {
          return null
        }
      })
    )

    const valid = details.filter(Boolean) as any[]
    return valid.map((tx) => {
      const rawKeys = tx.transaction.transaction.message.accountKeys || []
      const keys: string[] = rawKeys.map((k: any) => typeof k === 'string' ? k : (k?.pubkey || ''))
      const myIndex = keys.findIndex((k: string) => k === address)
      const isSent = myIndex === 0 // first key is usually signer; if our address is signer, we treat as sent
      const preBalances: number[] = tx.transaction.meta?.preBalances || []
      const postBalances: number[] = tx.transaction.meta?.postBalances || []
      const pre = myIndex >= 0 ? (preBalances[myIndex] || 0) : 0
      const post = myIndex >= 0 ? (postBalances[myIndex] || 0) : 0
      const amountLamports = Math.abs(post - pre)
      const amount = amountLamports / 1e9
      const otherParty = keys.find((k: string) => k && k !== address) || 'Unknown'
      const status = tx.err ? 'Failed' : tx.confirmationStatus === 'finalized' ? 'Completed' : 'Pending'
      return {
        hash: tx.signature,
        chain: 'Solana',
        title: isSent ? `Transfer to ${otherParty.slice(0, 6)}...${otherParty.slice(-4)}` : `Received from ${otherParty.slice(0, 6)}...${otherParty.slice(-4)}`,
        amount: isSent ? -amount : amount,
        status,
        timestamp: tx.blockTime ? Number(tx.blockTime) * 1000 : Date.now(),
        from: isSent ? address : otherParty,
        to: isSent ? otherParty : address,
        slot: tx.slot,
        fee: tx.transaction.meta?.fee ? tx.transaction.meta.fee / 1e9 : 0
      } as UnifiedTx
    })
  } catch (e) {
    console.error('Error fetching Solana transaction history:', e)
    return []
  }
}

// -----------------------------
// Bitcoin via BlockCypher
// -----------------------------
export async function getBitcoinTransactionHistory(address: string, network: 'testnet' | 'mainnet' = 'testnet', limit = 20): Promise<UnifiedTx[]> {
  try {
    const api = (API_URLS as any).bitcoin?.[network]
    if (!api) throw new Error(`Unsupported Bitcoin network: ${network}`)

    const res = await fetch(`${api}/addrs/${address}?limit=${limit}`)
    if (!res.ok) throw new Error(`BlockCypher API error: ${res.status} ${res.statusText}`)
    const data = await res.json()
    const txs: any[] = Array.isArray(data.txs) ? data.txs : []

    return txs.map((tx: any) => {
      const isSent = tx.inputs?.some((i: any) => (i.addresses || []).includes(address))
      const isReceived = tx.outputs?.some((o: any) => (o.addresses || []).includes(address))
      let amountSat = 0
      if (isSent && isReceived) {
        const totalIn = tx.inputs.filter((i: any) => (i.addresses || []).includes(address)).reduce((s: number, i: any) => s + (i.output_value || 0), 0)
        const totalOut = tx.outputs.filter((o: any) => (o.addresses || []).includes(address)).reduce((s: number, o: any) => s + (o.value || 0), 0)
        amountSat = totalOut - totalIn
      } else if (isReceived) {
        amountSat = tx.outputs.filter((o: any) => (o.addresses || []).includes(address)).reduce((s: number, o: any) => s + (o.value || 0), 0)
      } else if (isSent) {
        const totalIn = tx.inputs.filter((i: any) => (i.addresses || []).includes(address)).reduce((s: number, i: any) => s + (i.output_value || 0), 0)
        const totalOut = tx.outputs.filter((o: any) => !(o.addresses || []).includes(address)).reduce((s: number, o: any) => s + (o.value || 0), 0)
        amountSat = -(totalIn - totalOut - (tx.fees || 0))
      }
      const amount = amountSat / 1e8
      let otherParty = 'Unknown'
      if (isSent) {
        const out = tx.outputs.find((o: any) => !(o.addresses || []).includes(address))
        if (out?.addresses?.length) otherParty = out.addresses[0]
      } else if (isReceived) {
        const input = tx.inputs.find((i: any) => !(i.addresses || []).includes(address))
        if (input?.addresses?.length) otherParty = input.addresses[0]
      }
      let status: UnifiedTx['status'] = 'Completed'
      if ((tx.confirmations || 0) === 0) status = 'Pending'
      else if ((tx.confirmations || 0) < 6) status = 'Confirming'
      return {
        hash: tx.hash,
        chain: 'Bitcoin',
        title: isSent ? `Transfer to ${otherParty.slice(0, 6)}...${otherParty.slice(-4)}` : `Received from ${otherParty.slice(0, 6)}...${otherParty.slice(-4)}`,
        amount,
        status,
        timestamp: new Date(tx.received).getTime(),
        from: isSent ? address : otherParty,
        to: isSent ? otherParty : address,
        confirmations: tx.confirmations || 0,
        fee: tx.fees ? tx.fees / 1e8 : 0,
        blockHeight: tx.block_height,
        size: tx.size,
        weight: tx.weight
      } as UnifiedTx
    })
  } catch (e) {
    console.error('Error fetching Bitcoin transaction history:', e)
    return []
  }
}

// -----------------------------
// ICRC (ICP / Fradium) via index canisters
// -----------------------------
export async function getICRCTransactionHistory(tokenType: 'icp' | 'fradium', principalText: string, icpAccount?: string | null, limit = 20): Promise<UnifiedTx[]> {
  try {
    if (!principalText) throw new Error('Principal is required')
    let principalObj: Principal
    try {
      principalObj = Principal.fromText(principalText)
    } catch (e: any) {
      throw new Error(`Invalid principal format: ${e?.message || e}`)
    }
    if ((principalObj as any).isAnonymous?.()) throw new Error('Anonymous principal cannot fetch transaction history')

    let transactions: UnifiedTx[] = []
    if (tokenType === 'icp') {
      const agent = createAgentForCanister(EFFECTIVE_ICP_INDEX_CANISTER_ID as any, undefined)
      const indexActor = createIcpIndexActor(EFFECTIVE_ICP_INDEX_CANISTER_ID as any, { agent: agent as any }) as any
      const result = await indexActor.get_account_transactions({ account: { owner: principalObj as any, subaccount: [] }, start: [], max_results: BigInt(limit) })
      if (result && (result as any).Ok && (result as any).Ok.transactions) {
        const txs = (result as any).Ok.transactions
        transactions = txs
          .map((tx: any) => {
            const transfer = tx.transaction?.operation?.Transfer
            if (!transfer) return null
            const fromPrincipal = transfer.from
            const toPrincipal = transfer.to
            const fromId = String(fromPrincipal || '').toLowerCase()
            const myId = String(icpAccount || '').toLowerCase()
            const isSent = myId ? (fromId === myId) : false
            const otherParty = isSent ? toPrincipal : fromPrincipal
            const otherPartyStr = String(otherParty)
            return {
              hash: String(tx.id),
              chain: 'Internet Computer',
              title: isSent ? `Transfer to ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}` : `Received from ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}`,
              amount: (Number(transfer.amount?.e8s || 0) / 1e8) * (isSent ? -1 : 1),
              status: 'Completed',
              timestamp: Number(tx.transaction.timestamp?.[0]?.timestamp_nanos || 0) / 1_000_000,
              from: String(fromPrincipal || 'Unknown'),
              to: String(toPrincipal || 'Unknown'),
              fee: transfer.fee?.e8s ? Number(transfer.fee.e8s) / 1e8 : 0,
              tokenType: 'icp'
            } as UnifiedTx
          })
          .filter(Boolean) as UnifiedTx[]
      }
    } else if (tokenType === 'fradium') {
      const agent = createAgentForCanister(EFFECTIVE_FRADIUM_INDEX_CANISTER_ID as any, undefined)
      const indexActor = createFradiumIndexActor(EFFECTIVE_FRADIUM_INDEX_CANISTER_ID as any, { agent: agent as any }) as any
      const result = await indexActor.get_account_transactions({ account: { owner: principalObj as any, subaccount: [] }, start: [], max_results: BigInt(limit) })
      if (result && (result as any).Ok && (result as any).Ok.transactions) {
        const txs = (result as any).Ok.transactions
        transactions = txs
          .map((tx: any) => {
            const transfer = tx.transaction?.transfer?.[0]
            if (!transfer) return null
            const fromPrincipal = transfer.from?.owner?.__principal__ || transfer.from?.owner
            const toPrincipal = transfer.to?.owner?.__principal__ || transfer.to?.owner
            const isSent = String(fromPrincipal) === principalObj.toString()
            const otherPartyStr = String(isSent ? toPrincipal : fromPrincipal)
            return {
              hash: String(tx.id),
              chain: 'Internet Computer',
              title: isSent ? `Transfer to ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}` : `Received from ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}`,
              amount: (Number(transfer.amount || 0) / 1e8) * (isSent ? -1 : 1),
              status: 'Completed',
              timestamp: Number(tx.transaction.timestamp || 0) / 1_000_000,
              from: String(fromPrincipal || 'Unknown'),
              to: String(toPrincipal || 'Unknown'),
              fee: transfer.fee?.[0] ? Number(transfer.fee[0]) / 1e8 : 0,
              tokenType: 'fradium'
            } as UnifiedTx
          })
          .filter(Boolean) as UnifiedTx[]
      }
    } else {
      throw new Error(`Unsupported ICRC token type: ${tokenType}`)
    }

    transactions.sort((a, b) => b.timestamp - a.timestamp)
    return transactions
  } catch (e: any) {
    console.error(`Error fetching ${tokenType} transaction history:`, e)
    // authentication-related errors shouldn't throw in UI flows
    if (typeof e?.message === 'string' && (e.message.includes('Invalid certificate') || e.message.includes('Signature verification failed') || e.message.includes('AgentQueryError'))) {
      return []
    }
    if (typeof e?.message === 'string' && e.message.includes('Anonymous principal')) {
      return []
    }
    return []
  }
}

// ---------------------------------
// ICP pageable history via icp_index (supports 'start' cursor)
// ---------------------------------
export async function getICPTransactionHistoryPage(
  principalText: string,
  icpAccount: string | null,
  limit = 20,
  start?: string | bigint
): Promise<IcrcPage> {
  try {
    if (!principalText) throw new Error('Principal is required')
    const principalObj = Principal.fromText(principalText)
    const agent = createAgentForCanister(EFFECTIVE_ICP_INDEX_CANISTER_ID as any, undefined)
    const indexActor = createIcpIndexActor(EFFECTIVE_ICP_INDEX_CANISTER_ID as any, { agent: agent as any }) as any
    const result = await indexActor.get_account_transactions({
      account: { owner: principalObj as any, subaccount: [] },
      start: typeof start !== 'undefined' ? [BigInt(start as any)] : [],
      max_results: BigInt(limit)
    })

    let items: UnifiedTx[] = []
    let nextStart: string | undefined
    if (result && (result as any).Ok && (result as any).Ok.transactions) {
      const txs = (result as any).Ok.transactions as any[]
      items = txs
        .map((tx: any) => {
          const transfer = tx.transaction?.operation?.Transfer
          if (!transfer) return null
          const fromId = String(transfer.from || '').toLowerCase()
          const myId = String(icpAccount || '').toLowerCase()
          const isSent = myId ? (fromId === myId) : false
          const otherPartyStr = String(isSent ? transfer.to : transfer.from)
          return {
            hash: String(tx.id),
            chain: 'Internet Computer',
            title: isSent ? `Transfer to ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}` : `Received from ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}`,
            amount: (Number(transfer.amount?.e8s || 0) / 1e8) * (isSent ? -1 : 1),
            status: 'Completed',
            timestamp: Number(tx.transaction.timestamp?.[0]?.timestamp_nanos || 0) / 1_000_000,
            from: String(transfer.from || 'Unknown'),
            to: String(transfer.to || 'Unknown'),
            fee: transfer.fee?.e8s ? Number(transfer.fee.e8s) / 1e8 : 0,
            tokenType: 'icp'
          } as UnifiedTx
        })
        .filter(Boolean) as UnifiedTx[]

      // Compute nextStart using the last tx id in this page
      if (txs.length > 0) {
        const last = txs[txs.length - 1]
        nextStart = String(last?.id)
      }
    }

    items.sort((a, b) => b.timestamp - a.timestamp)
    return { items, nextStart }
  } catch (e: any) {
    console.error('Error fetching pageable ICP transaction history:', e)
    return { items: [], nextStart: undefined }
  }
}

// -----------------------------
// ckBTC via ckbtc_index (ICRC)
// -----------------------------
export async function getCkBtcTransactionHistory(principalText: string, limit = 20): Promise<UnifiedTx[]> {
  try {
    if (!principalText) throw new Error('Principal is required')
    const principalObj = Principal.fromText(principalText)
    const agent = createAgentForCanister(EFFECTIVE_CKBTC_INDEX_CANISTER_ID as any, undefined)
    const indexActor = createCkbtcIndexActor(EFFECTIVE_CKBTC_INDEX_CANISTER_ID as any, { agent: agent as any }) as any
    const result = await indexActor.get_account_transactions({ account: { owner: principalObj as any, subaccount: [] }, start: [], max_results: BigInt(limit) })
    if (result && (result as any).Ok && (result as any).Ok.transactions) {
      const txs = (result as any).Ok.transactions
      const transactions = txs
        .map((tx: any) => {
          const transfer = tx.transaction?.transfer?.[0]
          if (!transfer) return null
          const fromPrincipal = transfer.from?.owner?.__principal__ || transfer.from?.owner
          const toPrincipal = transfer.to?.owner?.__principal__ || transfer.to?.owner
          const isSent = String(fromPrincipal) === principalObj.toString()
          const otherPartyStr = String(isSent ? toPrincipal : fromPrincipal)
          return {
            hash: String(tx.id),
            chain: 'Internet Computer',
            title: isSent ? `Transfer to ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}` : `Received from ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}`,
            amount: (Number(transfer.amount || 0) / 1e8) * (isSent ? -1 : 1),
            status: 'Completed',
            timestamp: Number(tx.transaction.timestamp || 0) / 1_000_000,
            from: String(fromPrincipal || 'Unknown'),
            to: String(toPrincipal || 'Unknown'),
            fee: transfer.fee?.[0] ? Number(transfer.fee[0]) / 1e8 : 0,
            tokenType: 'ckbtc'
          } as UnifiedTx
        })
        .filter(Boolean) as UnifiedTx[]
      transactions.sort((a, b) => b.timestamp - a.timestamp)
      return transactions
    }
    return []
  } catch (e: any) {
    console.error('Error fetching ckBTC transaction history:', e)
    return []
  }
}

// -----------------------------
// ckETH via cketh_index (ICRC)
// -----------------------------
export async function getCkEthTransactionHistory(principalText: string, limit = 20): Promise<UnifiedTx[]> {
  try {
    if (!principalText) throw new Error('Principal is required')
    const principalObj = Principal.fromText(principalText)
    const agent = createAgentForCanister(EFFECTIVE_CKETH_INDEX_CANISTER_ID as any, undefined)
    const indexActor = createCkethIndexActor(EFFECTIVE_CKETH_INDEX_CANISTER_ID as any, { agent: agent as any }) as any
    const result = await indexActor.get_account_transactions({ account: { owner: principalObj as any, subaccount: [] }, start: [], max_results: BigInt(limit) })
    if (result && (result as any).Ok && (result as any).Ok.transactions) {
      const txs = (result as any).Ok.transactions
      const transactions = txs
        .map((tx: any) => {
          const transfer = tx.transaction?.transfer?.[0]
          if (!transfer) return null
          const fromPrincipal = transfer.from?.owner?.__principal__ || transfer.from?.owner
          const toPrincipal = transfer.to?.owner?.__principal__ || transfer.to?.owner
          const isSent = String(fromPrincipal) === principalObj.toString()
          const otherPartyStr = String(isSent ? toPrincipal : fromPrincipal)
          return {
            hash: String(tx.id),
            chain: 'Internet Computer',
            title: isSent ? `Transfer to ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}` : `Received from ${otherPartyStr.slice(0, 6)}...${otherPartyStr.slice(-4)}`,
            amount: (Number(transfer.amount || 0) / 1e18) * (isSent ? -1 : 1), // ckETH uses 18 decimals
            status: 'Completed',
            timestamp: Number(tx.transaction.timestamp || 0) / 1_000_000,
            from: String(fromPrincipal || 'Unknown'),
            to: String(toPrincipal || 'Unknown'),
            fee: transfer.fee?.[0] ? Number(transfer.fee[0]) / 1e18 : 0, // ckETH uses 18 decimals
            tokenType: 'cketh'
          } as UnifiedTx
        })
        .filter(Boolean) as UnifiedTx[]
      transactions.sort((a, b) => b.timestamp - a.timestamp)
      return transactions
    }
    return []
  } catch (e: any) {
    console.error('Error fetching ckETH transaction history:', e)
    return []
  }
}

// -----------------------------
// Aggregator
// -----------------------------
export async function getTransactionHistory(
  addressOrPrincipal: string,
  network: NetworkKey,
  limit = 20,
  options?: { icpAccount?: string | null }
): Promise<UnifiedTx[]> {
  try {
    let items: UnifiedTx[] = []
    switch (network.toLowerCase()) {
      case 'ethereum':
      case 'sepolia':
        items = await getETHTransactionHistory(addressOrPrincipal, 'sepolia', limit)
        break
      case 'bitcoin':
      case 'testnet':
        items = await getBitcoinTransactionHistory(addressOrPrincipal, 'testnet', limit)
        break
      case 'solana':
      case 'devnet':
        items = await getSolanaTransactionHistory(addressOrPrincipal, 'devnet', limit)
        break
      case 'internet_computer':
      case 'icp':
        items = await getICRCTransactionHistory('icp', addressOrPrincipal, options?.icpAccount ?? null, limit)
        break
      case 'fradium':
        items = await getICRCTransactionHistory('fradium', addressOrPrincipal, null, limit)
        break
      case 'ckbtc':
        items = await getCkBtcTransactionHistory(addressOrPrincipal, limit)
        break
      case 'cketh':
        items = await getCkEthTransactionHistory(addressOrPrincipal, limit)
        break
      default:
        throw new Error(`Unsupported network: ${network}`)
    }

    // Persist snapshot best-effort
    const key = buildHistoryStorageKey(addressOrPrincipal, network, options?.icpAccount || null)
    saveTransactionsSnapshot(key, items).catch(() => {})
    return items
  } catch (e) {
    console.error(`Error fetching transaction history for ${network}:`, e)
    return []
  }
}

export default {
  getETHTransactionHistory,
  getSolanaTransactionHistory,
  getBitcoinTransactionHistory,
  getICRCTransactionHistory,
  getICPTransactionHistoryPage,
  getCkBtcTransactionHistory,
  getCkEthTransactionHistory,
  getTransactionHistory
}


