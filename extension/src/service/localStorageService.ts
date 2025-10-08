export interface LocalAnalysisHistory {
  id: string
  address: string
  tokenType: "Bitcoin" | "Ethereum" | "Solana" | "Fradium" | "Unknown"
  isSafe: boolean
  source: "ai" | "community" | "ai_and_community"
  date: string
  status: "completed" | "in_progress" | "failed"
  analysisResult?: {
    confidence?: number
    riskLevel?: string
    description?: string
    source?: string
    aiData?: any
    communityData?: any
  }
}

class LocalStorageService {
  private static readonly STORAGE_KEY = "fradium_analysis_history"
  private static readonly MAX_HISTORY_ITEMS = 100

  // Wallet addresses cache (per principal)
  private static readonly WALLET_ADDR_PREFIX = "fradium:wallet_addresses:"
  private static readonly DEFAULT_ADDR_TTL_MS = 1000 * 60 * 60 // 1 hour

  // Shape of addresses we store
  static readonly emptyWalletAddresses = {
    bitcoin: undefined as string | undefined,
    ethereum: undefined as string | undefined,
    solana: undefined as string | undefined,
    icp_principal: undefined as string | undefined,
    icp_account: undefined as string | undefined
  }

  private static walletKey(principal: string) {
    return `${this.WALLET_ADDR_PREFIX}${principal}`
  }

  static saveWalletAddresses(
    principal: string,
    addresses: Partial<typeof LocalStorageService.emptyWalletAddresses>,
    ttlMs: number = LocalStorageService.DEFAULT_ADDR_TTL_MS
  ): boolean {
    try {
      if (!principal || !addresses) return false
      const hasAny = Object.values(addresses).some(Boolean)
      if (!hasAny) return false
      const payload = {
        data: addresses,
        ts: Date.now(),
        ttlMs
      }
      localStorage.setItem(this.walletKey(principal), JSON.stringify(payload))
      return true
    } catch (error) {
      console.error("Failed to save wallet addresses to local storage:", error)
      return false
    }
  }

  static getWalletAddresses(
    principal: string
  ): Partial<typeof LocalStorageService.emptyWalletAddresses> | null {
    try {
      if (!principal) return null
      const raw = localStorage.getItem(this.walletKey(principal))
      if (!raw) return null
      const payload = JSON.parse(raw) as {
        data: Partial<typeof LocalStorageService.emptyWalletAddresses>
        ts: number
        ttlMs?: number
      }
      if (!payload || !payload.data || !payload.ts) return null
      const ttl = payload.ttlMs ?? LocalStorageService.DEFAULT_ADDR_TTL_MS
      const isExpired = Date.now() - payload.ts > ttl
      if (isExpired) return null
      return payload.data
    } catch (error) {
      console.error(
        "Failed to read wallet addresses from local storage:",
        error
      )
      return null
    }
  }

  static clearWalletAddresses(principal: string): boolean {
    try {
      if (!principal) return false
      localStorage.removeItem(this.walletKey(principal))
      return true
    } catch (error) {
      console.error(
        "Failed to clear wallet addresses from local storage:",
        error
      )
      return false
    }
  }

  // Save analysis to local storage
  static saveAnalysis(analysis: Omit<LocalAnalysisHistory, "id">): string {
    try {
      const history = this.getHistory()
      const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newAnalysis: LocalAnalysisHistory = {
        ...analysis,
        id,
        date: analysis.date || new Date().toISOString()
      }

      // Add to beginning of array (most recent first)
      history.unshift(newAnalysis)

      // Keep only the most recent items
      if (history.length > this.MAX_HISTORY_ITEMS) {
        history.splice(this.MAX_HISTORY_ITEMS)
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history))
      return id
    } catch (error) {
      console.error("Failed to save analysis to local storage:", error)
      return ""
    }
  }

  // Update existing analysis with results
  static updateAnalysis(
    id: string,
    updates: Partial<LocalAnalysisHistory>
  ): boolean {
    try {
      const history = this.getHistory()
      const index = history.findIndex((item) => item.id === id)

      if (index !== -1) {
        history[index] = { ...history[index], ...updates }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history))
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to update analysis in local storage:", error)
      return false
    }
  }

  // Get all analysis history
  static getHistory(): LocalAnalysisHistory[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Failed to get analysis history from local storage:", error)
      return []
    }
  }

  // Get analysis by ID
  static getAnalysisById(id: string): LocalAnalysisHistory | null {
    try {
      const history = this.getHistory()
      return history.find((item) => item.id === id) || null
    } catch (error) {
      console.error("Failed to get analysis by ID:", error)
      return null
    }
  }

  // Delete analysis by ID
  static deleteAnalysis(id: string): boolean {
    try {
      const history = this.getHistory()
      const filteredHistory = history.filter((item) => item.id !== id)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory))
      return true
    } catch (error) {
      console.error("Failed to delete analysis from local storage:", error)
      return false
    }
  }

  // Clear all history
  static clearHistory(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      return true
    } catch (error) {
      console.error("Failed to clear analysis history:", error)
      return false
    }
  }

  // Search history by address or token type
  static searchHistory(searchTerm: string): LocalAnalysisHistory[] {
    try {
      const history = this.getHistory()
      const term = searchTerm.toLowerCase()

      return history.filter(
        (item) =>
          item.address.toLowerCase().includes(term) ||
          item.tokenType.toLowerCase().includes(term)
      )
    } catch (error) {
      console.error("Failed to search analysis history:", error)
      return []
    }
  }

  // Get statistics
  static getStats() {
    try {
      const history = this.getHistory()

      return {
        total: history.length,
        safe: history.filter((item) => item.isSafe).length,
        unsafe: history.filter((item) => !item.isSafe).length,
        ai: history.filter((item) => item.source === "ai").length,
        community: history.filter((item) => item.source === "community").length,
        aiAndCommunity: history.filter(
          (item) => item.source === "ai_and_community"
        ).length,
        completed: history.filter((item) => item.status === "completed").length,
        inProgress: history.filter((item) => item.status === "in_progress")
          .length,
        failed: history.filter((item) => item.status === "failed").length
      }
    } catch (error) {
      console.error("Failed to get analysis statistics:", error)
      return {
        total: 0,
        safe: 0,
        unsafe: 0,
        ai: 0,
        community: 0,
        aiAndCommunity: 0,
        completed: 0,
        inProgress: 0,
        failed: 0
      }
    }
  }

  // Detect token type from address
  static detectTokenType(
    address: string
  ): "Bitcoin" | "Ethereum" | "Solana" | "Fradium" | "Unknown" {
    if (
      address.startsWith("1") ||
      address.startsWith("3") ||
      address.startsWith("bc1")
    ) {
      return "Bitcoin"
    } else if (address.startsWith("0x") && address.length === 42) {
      return "Ethereum"
    } else if (
      address.length >= 32 &&
      address.length <= 44 &&
      /^[A-HJ-NP-Z0-9]+$/i.test(address)
    ) {
      return "Solana"
    } else if (address.startsWith("fra") || address.startsWith("FRADIUM")) {
      return "Fradium"
    } else {
      return "Unknown"
    }
  }
}

export default LocalStorageService
