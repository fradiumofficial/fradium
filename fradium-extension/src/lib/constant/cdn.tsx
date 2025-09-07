const CDN_BASE = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/extensions"

export const CDN = {
  images: {
    topRight: `${CDN_BASE}/images/top_right.svg`,
    topLeft: `${CDN_BASE}/images/top_left.svg`,
    welcomeCard: `${CDN_BASE}/images/welcome_card.svg`,
  },
  tokens: {
    bitcoin: `${CDN_BASE}/tokens/bitcoin.svg`,
    solana: `${CDN_BASE}/tokens/solana.svg`,
    eth: `${CDN_BASE}/tokens/eth.svg`,
    fum: `${CDN_BASE}/tokens/fum.svg`,
    unknown: `${CDN_BASE}/tokens/unknown.svg`,
  },
  icons: {
    analyzeAddress: `${CDN_BASE}/icons/analyze-address.svg`,
    empty: `${CDN_BASE}/icons/empty.png`,
  }
}
