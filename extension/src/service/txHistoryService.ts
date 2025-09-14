export type Direction = "Receive" | "Send"

export type TxHistoryItem = {
  id: string
  tokenType: "Bitcoin" | "Ethereum" | "Solana" | "Fradium" | "ICP" | "Unknown"
  direction: Direction
  amount: number
  status: "Completed" | "Pending" | "Failed"
  toAddress?: string
  fromAddress?: string
  timestamp: number
  txId?: string
}

const STORAGE_KEY = "fradium_tx_history"
const MAX_ITEMS = 200

export const TxHistoryService = {
  add(tx: Omit<TxHistoryItem, "id" | "status" | "timestamp"> & { status?: TxHistoryItem["status"], timestamp?: number }): string {
    const history = this.getAll()
    const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const item: TxHistoryItem = {
      id,
      tokenType: tx.tokenType,
      direction: tx.direction,
      amount: tx.amount,
      status: tx.status ?? "Completed",
      toAddress: tx.toAddress,
      fromAddress: tx.fromAddress,
      timestamp: tx.timestamp ?? Date.now(),
      txId: tx.txId
    }
    history.unshift(item)
    if (history.length > MAX_ITEMS) history.splice(MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    return id
  },

  getAll(): TxHistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr
      return []
    } catch {
      return []
    }
  }
}


