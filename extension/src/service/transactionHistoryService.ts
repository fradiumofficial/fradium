// Transaction History Service for the browser extension
// Adapted from src/frontend/src/core/services/historyTransactionService.js

import { Principal } from '@dfinity/principal'
import { icp_index } from '../declarations/icp_index'
import { fradium_index } from '../declarations/fradium_index'

export type NetworkKey = 'ethereum' | 'bitcoin' | 'solana' | 'icp' | 'fradium' | 'internet_computer'

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
}

// Environment configuration (use same keys as other extension services)
const ETHERSCAN_API_KEY = (typeof process !== 'undefined' && (process as any)?.env?.PLASMO_PUBLIC_ETHERSCAN_API_KEY) || ''

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

// -----------------------------
// Ethereum via Etherscan
// -----------------------------
export async function getETHTransactionHistory(address: string, network: 'sepolia' | 'mainnet' = 'sepolia', limit = 20): Promise<UnifiedTx[]> {
  try {
    const apiUrl = (API_URLS as any).ethereum?.[network]
    if (!apiUrl) throw new Error(`Unsupported Ethereum network: ${network}`)
    if (!ETHERSCAN_API_KEY) throw new Error('PLASMO_PUBLIC_ETHERSCAN_API_KEY is not configured')

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
      const result = await (icp_index as any).get_account_transactions({ account: { owner: principalObj as any, subaccount: [] }, start: [], max_results: BigInt(limit) })
      if (result && (result as any).Ok && (result as any).Ok.transactions) {
        const txs = (result as any).Ok.transactions
        transactions = txs
          .map((tx: any) => {
            const transfer = tx.transaction?.operation?.Transfer
            if (!transfer) return null
            if (!icpAccount) throw new Error('ICP account identifier is required for ICP transaction comparison')
            const fromPrincipal = transfer.from
            const toPrincipal = transfer.to
            const isSent = fromPrincipal === String(icpAccount).toLowerCase()
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
              fee: transfer.fee?.e8s ? Number(transfer.fee.e8s) / 1e8 : 0
            } as UnifiedTx
          })
          .filter(Boolean) as UnifiedTx[]
      }
    } else if (tokenType === 'fradium') {
      const result = await (fradium_index as any).get_account_transactions({ account: { owner: principalObj as any, subaccount: [] }, start: [], max_results: BigInt(limit) })
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
              fee: transfer.fee?.[0] ? Number(transfer.fee[0]) / 1e8 : 0
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
    switch (network.toLowerCase()) {
      case 'ethereum':
      case 'sepolia':
        return await getETHTransactionHistory(addressOrPrincipal, 'sepolia', limit)
      case 'bitcoin':
      case 'testnet':
        return await getBitcoinTransactionHistory(addressOrPrincipal, 'testnet', limit)
      case 'solana':
      case 'devnet':
        return await getSolanaTransactionHistory(addressOrPrincipal, 'devnet', limit)
      case 'internet_computer':
      case 'icp':
        return await getICRCTransactionHistory('icp', addressOrPrincipal, options?.icpAccount ?? null, limit)
      case 'fradium':
        return await getICRCTransactionHistory('fradium', addressOrPrincipal, null, limit)
      default:
        throw new Error(`Unsupported network: ${network}`)
    }
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
  getTransactionHistory
}


