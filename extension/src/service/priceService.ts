// Lightweight USD price service with simple caching
// Uses CoinGecko simple price API

type SupportedId = 'bitcoin' | 'ethereum' | 'solana' | 'icp' | 'fradium'

const COINGECKO_IDS: Record<SupportedId, string | null> = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  solana: 'solana',
  icp: 'internet-computer',
  fradium: null // Not listed on CG; keep null so value returns 0
}

const CACHE_TTL_MS = 60_000 // 1 minute

const cache: {
  ts: number
  data: Record<string, number>
} = { ts: 0, data: {} }

export async function fetchUsdPrices(tokenIds: string[]): Promise<Record<string, number>> {
  try {
    const now = Date.now()
    // Serve from cache if still valid and covers requested tokens
    const needs = tokenIds.filter((id) => cache.data[id] === undefined)
    if (now - cache.ts < CACHE_TTL_MS && needs.length === 0) {
      return pick(cache.data, tokenIds)
    }

    const ids = uniq(
      tokenIds
        .map((id) => (COINGECKO_IDS[id as SupportedId] || null))
        .filter(Boolean) as string[]
    )

    let fetched: Record<string, number> = {}
    if (ids.length > 0) {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
        ids.join(',')
      )}&vs_currencies=usd`
      const resp = await fetch(url)
      if (resp.ok) {
        const json = await resp.json()
        // Map back to our token ids
        for (const [tokenId, cgId] of Object.entries(COINGECKO_IDS)) {
          if (!cgId) continue
          const price = json?.[cgId]?.usd
          if (typeof price === 'number') {
            fetched[tokenId] = price
          }
        }
      }
    }

    // Tokens not present get 0
    const result: Record<string, number> = {}
    tokenIds.forEach((id) => {
      result[id] = fetched[id] ?? 0
    })

    // Update cache
    cache.ts = now
    cache.data = { ...cache.data, ...result }
    return result
  } catch {
    // On error, return zeros for requested tokens
    const fallback: Record<string, number> = {}
    tokenIds.forEach((id) => (fallback[id] = 0))
    return fallback
  }
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

function pick<T extends object>(obj: Record<string, any>, keys: string[]): Record<string, any> {
  const out: Record<string, any> = {}
  keys.forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k]
  })
  return out
}


