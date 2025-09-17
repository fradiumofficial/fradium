// Chain explorer configuration
export const CHAIN_EXPLORERS = {
  // Ethereum and EVM chains
  ethereum: {
    name: "Etherscan",
    baseUrl: "https://etherscan.io/address/",
    icon: "🔷",
  },
  polygon: {
    name: "PolygonScan",
    baseUrl: "https://polygonscan.com/address/",
    icon: "🟣",
  },
  bsc: {
    name: "BscScan",
    baseUrl: "https://bscscan.com/address/",
    icon: "🟡",
  },
  arbitrum: {
    name: "Arbiscan",
    baseUrl: "https://arbiscan.io/address/",
    icon: "🔵",
  },
  optimism: {
    name: "Optimistic Etherscan",
    baseUrl: "https://optimistic.etherscan.io/address/",
    icon: "🔴",
  },
  avalanche: {
    name: "Snowtrace",
    baseUrl: "https://snowtrace.io/address/",
    icon: "❄️",
  },
  fantom: {
    name: "FtmScan",
    baseUrl: "https://ftmscan.com/address/",
    icon: "💜",
  },
  cronos: {
    name: "CronosScan",
    baseUrl: "https://cronoscan.com/address/",
    icon: "🟢",
  },
  celo: {
    name: "CeloScan",
    baseUrl: "https://celoscan.io/address/",
    icon: "🟡",
  },
  gnosis: {
    name: "GnosisScan",
    baseUrl: "https://gnosisscan.io/address/",
    icon: "🟢",
  },
  base: {
    name: "BaseScan",
    baseUrl: "https://basescan.org/address/",
    icon: "🔵",
  },
  linea: {
    name: "LineaScan",
    baseUrl: "https://lineascan.build/address/",
    icon: "🔵",
  },
  scroll: {
    name: "ScrollScan",
    baseUrl: "https://scrollscan.com/address/",
    icon: "🟢",
  },
  zksync: {
    name: "zkScan",
    baseUrl: "https://explorer.zksync.io/address/",
    icon: "🔵",
  },
  mantle: {
    name: "MantleScan",
    baseUrl: "https://explorer.mantle.xyz/address/",
    icon: "🟢",
  },
  opbnb: {
    name: "opBNBScan",
    baseUrl: "https://opbnbscan.com/address/",
    icon: "🟡",
  },
  manta: {
    name: "MantaScan",
    baseUrl: "https://pacific-explorer.manta.network/address/",
    icon: "🔵",
  },
  blast: {
    name: "BlastScan",
    baseUrl: "https://blastscan.io/address/",
    icon: "🟡",
  },

  // Bitcoin and UTXO chains
  bitcoin: {
    name: "Blockstream",
    baseUrl: "https://blockstream.info/address/",
    icon: "🟠",
  },
  bitcoin_cash: {
    name: "Blockchair",
    baseUrl: "https://blockchair.com/bitcoin-cash/address/",
    icon: "🟢",
  },
  litecoin: {
    name: "Blockchair",
    baseUrl: "https://blockchair.com/litecoin/address/",
    icon: "🔵",
  },
  dogecoin: {
    name: "Blockchair",
    baseUrl: "https://blockchair.com/dogecoin/address/",
    icon: "🟡",
  },

  // Solana ecosystem
  solana: {
    name: "Solscan",
    baseUrl: "https://solscan.io/account/",
    icon: "🟣",
  },
  solana_alt: {
    name: "Solana Explorer",
    baseUrl: "https://explorer.solana.com/address/",
    icon: "🟣",
  },

  // Cosmos ecosystem
  cosmos: {
    name: "Mintscan",
    baseUrl: "https://www.mintscan.io/cosmos/account/",
    icon: "🔵",
  },
  osmosis: {
    name: "Mintscan",
    baseUrl: "https://www.mintscan.io/osmosis/account/",
    icon: "🟣",
  },
  juno: {
    name: "Mintscan",
    baseUrl: "https://www.mintscan.io/juno/account/",
    icon: "🟠",
  },
  atom: {
    name: "Mintscan",
    baseUrl: "https://www.mintscan.io/cosmos/account/",
    icon: "🔵",
  },

  // Polkadot ecosystem
  polkadot: {
    name: "Subscan",
    baseUrl: "https://polkadot.subscan.io/account/",
    icon: "🟣",
  },
  kusama: {
    name: "Subscan",
    baseUrl: "https://kusama.subscan.io/account/",
    icon: "🟠",
  },

  // Cardano
  cardano: {
    name: "Cardanoscan",
    baseUrl: "https://cardanoscan.io/address/",
    icon: "🔵",
  },

  // Algorand
  algorand: {
    name: "AlgoExplorer",
    baseUrl: "https://algoexplorer.io/address/",
    icon: "🟢",
  },

  // Tezos
  tezos: {
    name: "TzKT",
    baseUrl: "https://tzkt.io/",
    icon: "🟢",
  },

  // NEAR
  near: {
    name: "NEAR Explorer",
    baseUrl: "https://explorer.near.org/accounts/",
    icon: "🟢",
  },

  // Internet Computer
  icp: {
    name: "IC Dashboard",
    baseUrl: "https://dashboard.internetcomputer.org/account/",
    icon: "🟠",
  },
  internet_computer: {
    name: "IC Dashboard",
    baseUrl: "https://dashboard.internetcomputer.org/account/",
    icon: "🟠",
  },
  fradium: {
    name: "IC Dashboard",
    baseUrl: "https://dashboard.internetcomputer.org/account/",
    icon: "🟠",
  },
  fadm: {
    name: "IC Dashboard",
    baseUrl: "https://dashboard.internetcomputer.org/account/",
    icon: "🟠",
  },
  ckbtc: {
    name: "IC Dashboard",
    baseUrl: "https://dashboard.internetcomputer.org/account/",
    icon: "🟠",
  },

  // Aptos
  aptos: {
    name: "Aptos Explorer",
    baseUrl: "https://explorer.aptoslabs.com/account/",
    icon: "🔵",
  },

  // Sui
  sui: {
    name: "Sui Explorer",
    baseUrl: "https://suiexplorer.com/address/",
    icon: "🔵",
  },

  // Tron
  tron: {
    name: "Tronscan",
    baseUrl: "https://tronscan.org/#/address/",
    icon: "🔴",
  },

  // XRP
  xrp: {
    name: "XRPScan",
    baseUrl: "https://xrpscan.com/account/",
    icon: "🟢",
  },

  // Stellar
  stellar: {
    name: "Stellar Expert",
    baseUrl: "https://stellar.expert/explorer/public/account/",
    icon: "🟣",
  },

  // Monero
  monero: {
    name: "Monero Explorer",
    baseUrl: "https://xmrchain.net/search?value=",
    icon: "🟠",
  },

  // Zcash
  zcash: {
    name: "Zcash Explorer",
    baseUrl: "https://explorer.zcha.in/accounts/",
    icon: "🟡",
  },

  // Filecoin
  filecoin: {
    name: "Filfox",
    baseUrl: "https://filfox.info/en/address/",
    icon: "🔵",
  },

  // Chainlink
  chainlink: {
    name: "Chainlink Explorer",
    baseUrl: "https://chainlink.eth.link/",
    icon: "🔵",
  },

  // Uniswap
  uniswap: {
    name: "Uniswap Info",
    baseUrl: "https://info.uniswap.org/#/pools/",
    icon: "🟣",
  },

  // Aave
  aave: {
    name: "Aave Analytics",
    baseUrl: "https://aave.com/",
    icon: "🔵",
  },

  // Compound
  compound: {
    name: "Compound Analytics",
    baseUrl: "https://compound.finance/",
    icon: "🟢",
  },

  // Yearn Finance
  yearn: {
    name: "Yearn Finance",
    baseUrl: "https://yearn.finance/",
    icon: "🟡",
  },

  // Curve
  curve: {
    name: "Curve Finance",
    baseUrl: "https://curve.fi/",
    icon: "🔵",
  },

  // SushiSwap
  sushiswap: {
    name: "SushiSwap",
    baseUrl: "https://sushi.com/",
    icon: "🍣",
  },

  // PancakeSwap
  pancakeswap: {
    name: "PancakeSwap",
    baseUrl: "https://pancakeswap.finance/",
    icon: "🥞",
  },

  // 1inch
  oneinch: {
    name: "1inch",
    baseUrl: "https://1inch.io/",
    icon: "🔵",
  },

  // Balancer
  balancer: {
    name: "Balancer",
    baseUrl: "https://balancer.fi/",
    icon: "🔵",
  },

  // Synthetix
  synthetix: {
    name: "Synthetix",
    baseUrl: "https://synthetix.io/",
    icon: "🟣",
  },

  // MakerDAO
  makerdao: {
    name: "MakerDAO",
    baseUrl: "https://makerdao.com/",
    icon: "🟠",
  },

  // RenVM
  renvm: {
    name: "RenVM",
    baseUrl: "https://renproject.io/",
    icon: "🔵",
  },

  // Thorchain
  thorchain: {
    name: "Thorchain",
    baseUrl: "https://thorchain.org/",
    icon: "⚡",
  },

  // Terra
  terra: {
    name: "Terra Finder",
    baseUrl: "https://finder.terra.money/",
    icon: "🟢",
  },

  // Binance Chain
  binance: {
    name: "Binance Explorer",
    baseUrl: "https://explorer.binance.org/address/",
    icon: "🟡",
  },

  // Huobi ECO Chain
  heco: {
    name: "HecoScan",
    baseUrl: "https://hecoinfo.com/address/",
    icon: "🟢",
  },

  // OKEx Chain
  okex: {
    name: "OKLink",
    baseUrl: "https://www.oklink.com/okexchain/address/",
    icon: "🔵",
  },

  // KuCoin Chain
  kucoin: {
    name: "KuCoin Explorer",
    baseUrl: "https://explorer.kcc.io/address/",
    icon: "🟢",
  },

  // GateChain
  gatechain: {
    name: "GateScan",
    baseUrl: "https://gatescan.org/address/",
    icon: "🟡",
  },

  // IoTeX
  iotex: {
    name: "IoTeXScan",
    baseUrl: "https://iotexscan.io/address/",
    icon: "🟢",
  },

  // Harmony
  harmony: {
    name: "Harmony Explorer",
    baseUrl: "https://explorer.harmony.one/address/",
    icon: "🟢",
  },

  // Elrond
  elrond: {
    name: "Elrond Explorer",
    baseUrl: "https://explorer.elrond.com/accounts/",
    icon: "🟣",
  },

  // Zilliqa
  zilliqa: {
    name: "Zilliqa Explorer",
    baseUrl: "https://explorer.zilliqa.com/address/",
    icon: "🟢",
  },

  // VeChain
  vechain: {
    name: "VeChain Explorer",
    baseUrl: "https://explore.vechain.org/accounts/",
    icon: "🟢",
  },

  // NEO
  neo: {
    name: "NEO Tracker",
    baseUrl: "https://neotracker.io/address/",
    icon: "🟢",
  },

  // Ontology
  ontology: {
    name: "Ontology Explorer",
    baseUrl: "https://explorer.ont.io/address/",
    icon: "🟢",
  },

  // Icon
  icon: {
    name: "ICON Tracker",
    baseUrl: "https://tracker.icon.foundation/address/",
    icon: "🟢",
  },

  // Waves
  waves: {
    name: "Waves Explorer",
    baseUrl: "https://wavesexplorer.com/addresses/",
    icon: "🔵",
  },

  // NEM
  nem: {
    name: "NEM Explorer",
    baseUrl: "https://explorer.nemtool.com/#/s_account?account=",
    icon: "🟢",
  },

  // IOTA
  iota: {
    name: "IOTA Explorer",
    baseUrl: "https://explorer.iota.org/mainnet/",
    icon: "🟢",
  },

  // Nano
  nano: {
    name: "Nano Crawler",
    baseUrl: "https://nanocrawler.cc/explorer/account/",
    icon: "🟢",
  },

  // Banano
  banano: {
    name: "Banano Crawler",
    baseUrl: "https://creeper.banano.cc/explorer/account/",
    icon: "🟡",
  },

  // Hedera
  hedera: {
    name: "Hedera Explorer",
    baseUrl: "https://hash-hash.info/account/",
    icon: "🟢",
  },

  // Hashgraph
  hashgraph: {
    name: "Hashgraph Explorer",
    baseUrl: "https://hash-hash.info/",
    icon: "🟢",
  },

  // Fantom
  fantom: {
    name: "Fantom Explorer",
    baseUrl: "https://ftmscan.com/address/",
    icon: "💜",
  },

  // Avalanche
  avalanche: {
    name: "Avalanche Explorer",
    baseUrl: "https://snowtrace.io/address/",
    icon: "❄️",
  },

  // Celo
  celo: {
    name: "Celo Explorer",
    baseUrl: "https://explorer.celo.org/address/",
    icon: "🟡",
  },

  // Klaytn
  klaytn: {
    name: "KlaytnScope",
    baseUrl: "https://scope.klaytn.com/address/",
    icon: "🟢",
  },

  // Ronin
  ronin: {
    name: "Ronin Explorer",
    baseUrl: "https://explorer.roninchain.com/address/",
    icon: "🔵",
  },

  // Axie Infinity
  axie: {
    name: "Axie Infinity",
    baseUrl: "https://marketplace.axieinfinity.com/",
    icon: "🟢",
  },

  // The Sandbox
  sandbox: {
    name: "The Sandbox",
    baseUrl: "https://www.sandbox.game/",
    icon: "🟡",
  },

  // Decentraland
  decentraland: {
    name: "Decentraland",
    baseUrl: "https://decentraland.org/",
    icon: "🟢",
  },

  // CryptoKitties
  cryptokitties: {
    name: "CryptoKitties",
    baseUrl: "https://www.cryptokitties.co/",
    icon: "🐱",
  },

  // NBA Top Shot
  nbatopshot: {
    name: "NBA Top Shot",
    baseUrl: "https://nbatopshot.com/",
    icon: "🏀",
  },

  // Sorare
  sorare: {
    name: "Sorare",
    baseUrl: "https://sorare.com/",
    icon: "⚽",
  },

  // Gods Unchained
  godsunchained: {
    name: "Gods Unchained",
    baseUrl: "https://godsunchained.com/",
    icon: "⚔️",
  },

  // Axie Infinity
  axieinfinity: {
    name: "Axie Infinity",
    baseUrl: "https://axieinfinity.com/",
    icon: "🟢",
  },

  // The Sandbox
  sandboxgame: {
    name: "The Sandbox",
    baseUrl: "https://www.sandbox.game/",
    icon: "🟡",
  },

  // Decentraland
  decentralandgame: {
    name: "Decentraland",
    baseUrl: "https://decentraland.org/",
    icon: "🟢",
  },

  // CryptoKitties
  cryptokittiesgame: {
    name: "CryptoKitties",
    baseUrl: "https://www.cryptokitties.co/",
    icon: "🐱",
  },

  // NBA Top Shot
  nbatopshotgame: {
    name: "NBA Top Shot",
    baseUrl: "https://nbatopshot.com/",
    icon: "🏀",
  },

  // Sorare
  soraregame: {
    name: "Sorare",
    baseUrl: "https://sorare.com/",
    icon: "⚽",
  },

  // Gods Unchained
  godsunchainedgame: {
    name: "Gods Unchained",
    baseUrl: "https://godsunchained.com/",
    icon: "⚔️",
  },
};

// Function to get explorer info for a chain
export function getChainExplorer(chainName) {
  // Handle null, undefined, or empty chain names
  if (!chainName || chainName.trim() === "") {
    return {
      name: "Explorer",
      baseUrl: "https://explorer.example.com/address/",
      icon: "🔗",
    };
  }

  const normalizedChain = chainName.toLowerCase().replace(/\s+/g, "_");

  // Direct match
  if (CHAIN_EXPLORERS[normalizedChain]) {
    return CHAIN_EXPLORERS[normalizedChain];
  }

  // Partial matches for common variations
  const chainVariations = {
    eth: "ethereum",
    btc: "bitcoin",
    sol: "solana",
    ada: "cardano",
    dot: "polkadot",
    ksm: "kusama",
    algo: "algorand",
    xtz: "tezos",
    near: "near",
    icp: "icp",
    internet_computer: "internet_computer",
    fradium: "fradium",
    fadm: "fadm",
    ckbtc: "ckbtc",
    apt: "aptos",
    sui: "sui",
    trx: "tron",
    xrp: "xrp",
    xlm: "stellar",
    xmr: "monero",
    zec: "zcash",
    fil: "filecoin",
    link: "chainlink",
    uni: "uniswap",
    aave: "aave",
    comp: "compound",
    yfi: "yearn",
    crv: "curve",
    sushi: "sushiswap",
    cake: "pancakeswap",
    "1inch": "oneinch",
    bal: "balancer",
    snx: "synthetix",
    mkr: "makerdao",
    ren: "renvm",
    rune: "thorchain",
    luna: "terra",
    bnb: "bsc",
    matic: "polygon",
    arb: "arbitrum",
    op: "optimism",
    avax: "avalanche",
    ftm: "fantom",
    cro: "cronos",
    celo: "celo",
    xdai: "gnosis",
    linea: "linea",
    scroll: "scroll",
    zksync: "zksync",
    mantle: "mantle",
    opbnb: "opbnb",
    manta: "manta",
    blast: "blast",
  };

  if (chainVariations[normalizedChain]) {
    return CHAIN_EXPLORERS[chainVariations[normalizedChain]];
  }

  // Default fallback for unknown chains
  return {
    name: "Explorer",
    baseUrl: "https://explorer.example.com/address/",
    icon: "🔗",
  };
}

// Function to generate explorer URL
export function getExplorerUrl(chainName, address) {
  const explorer = getChainExplorer(chainName);
  return `${explorer.baseUrl}${address}`;
}

// Function to get explorer name
export function getExplorerName(chainName) {
  const explorer = getChainExplorer(chainName);
  return explorer.name;
}

// Function to get explorer icon
export function getExplorerIcon(chainName) {
  const explorer = getChainExplorer(chainName);
  return explorer.icon;
}
