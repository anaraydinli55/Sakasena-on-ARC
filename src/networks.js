// ============================================
// COKLU-ZINCIR SEBEKE KONFIGURASYONLARI (v2)
// ============================================
import { ARC_ADDRESSES } from './constants';

// ZERO_ADDRESS artik constants.js'den geliyor
export { ZERO_ADDRESS } from './constants';

// HER SEBEKE ICIN AYRI TOKEN ADRESLERI
export const NETWORKS = {
  5042002: {
    name: "Arc Testnet",
    hexId: "0x4cef52",
    rpcUrl: "https://rpc.testnet.arc.network",
    explorer: "https://testnet.arcscan.app",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: ARC_ADDRESSES.USDC, decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: ARC_ADDRESSES.EURC, decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: ARC_ADDRESSES.cirBTC, decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: ARC_ADDRESSES.sakUSD, decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: ARC_ADDRESSES.AAA, decimals: 18, icon: "🪙" }
    },
    minterAddress: ARC_ADDRESSES.MINTER,
    aavePoolAddress: "0x0000000000000000000000000000000000000000",
    isAaveSupported: false
  },
  11155111: {
    name: "Ethereum Sepolia",
    hexId: "0xaa36a7",
    rpcUrl: "https://rpc.sepolia.org",
    explorer: "https://sepolia.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x1a05282496E69D8BDeD31b846F25870A19B91234", decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: "0x0000000000000000000000000000000000000000", decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    minterAddress: "0x0000000000000000000000000000000000000000",
    aavePoolAddress: "0x6Ae43d3271ff68408398a123F67CE4a42f50005C",
    isAaveSupported: true
  },
  421614: {
    name: "Arbitrum Sepolia",
    hexId: "0x66eee",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorer: "https://sepolia.arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x3271ff68408398a123F67CE4a42f50005C12423d", decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: "0x0000000000000000000000000000000000000000", decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    minterAddress: "0x0000000000000000000000000000000000000000",
    aavePoolAddress: "0x3271ff68408398a123F67CE4a42f50005C12423d",
    isAaveSupported: true
  },
  84532: {
    name: "Base Sepolia",
    hexId: "0x14a34",
    rpcUrl: "https://base-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x808456652fdb597867f38412077A9182bf77359F", decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: "0x0000000000000000000000000000000000000000", decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x7C45c5Ce07E0cf673F48F7A4eF4837c59C0D3281", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    minterAddress: "0x20b45703967B5eD4D36C9d8Bea38d4d44E64fd67",
    aavePoolAddress: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
    isAaveSupported: true
  },
  11155420: {
    name: "Optimism Sepolia",
    hexId: "0xaa3748",
    rpcUrl: "https://sepolia.optimism.io",
    explorer: "https://sepolia-optimism.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x5fd84259d66Cd46123540766Ad943c0D274250D7", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x0000000000000000000000000000000000000000", decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: "0x0000000000000000000000000000000000000000", decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    minterAddress: "0x0000000000000000000000000000000000000000",
    aavePoolAddress: "0x6Ae43d3271ff68408398a123F67CE4a42f50005C",
    isAaveSupported: true
  },
  300: {
    name: "zkSync Sepolia",
    hexId: "0x12c",
    rpcUrl: "https://sepolia.era.zksync.dev",
    explorer: "https://sepolia.explorer.zksync.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0xAe045DE5638162fa134807Cb558E15A3F5A7F853", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x0000000000000000000000000000000000000000", decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: "0x0000000000000000000000000000000000000000", decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    minterAddress: "0x0000000000000000000000000000000000000000",
    aavePoolAddress: "0x6Ae43d3271ff68408398a123F67CE4a42f50005C",
    isAaveSupported: false
  },
  480: {
    name: "World Chain Sepolia",
    hexId: "0x1e0",
    rpcUrl: "https://sepolia.worldchain.dev",
    explorer: "https://sepolia.worldscan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x79A02482A880bCe3F13E09da970dC34dB4cD24D1", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x0000000000000000000000000000000000000000", decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: "0x0000000000000000000000000000000000000000", decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    minterAddress: "0x0000000000000000000000000000000000000000",
    aavePoolAddress: "0x6Ae43d3271ff68408398a123F67CE4a42f50005C",
    isAaveSupported: false
  },
  43113: {
    name: "Avalanche Fuji",
    hexId: "0xa869",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    explorer: "https://testnet.snowtrace.io",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x5425890298aed601595a70AB815c96711a31Bc65", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x0000000000000000000000000000000000000000", decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: "0x0000000000000000000000000000000000000000", decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    minterAddress: "0x0000000000000000000000000000000000000000",
    aavePoolAddress: "0x6Ae43d3271ff68408398a123F67CE4a42f50005C",
    isAaveSupported: false
  }
};

export const getActiveNetworkConfig = (activeChainId) => {
  return NETWORKS[activeChainId] || NETWORKS[5042002];
};

export const getPoolAddress = (token1, token2) => {
  const t1 = token1.toLowerCase();
  const t2 = token2.toLowerCase();

  const isUsdcEurc = (t1 === "usdc" && t2 === "eurc") || (t1 === "eurc" && t2 === "usdc");
  if (isUsdcEurc) return ARC_ADDRESSES.POOLS.USDC_EURC;

  const hasAAA = t1 === "aaa" || t2 === "aaa";
  if (!hasAAA) return "0x0000000000000000000000000000000000000000";

  const otherToken = t1 === "aaa" ? t2 : t1;
  if (otherToken === "usdc") return ARC_ADDRESSES.POOLS.USDC;
  if (otherToken === "eurc") return ARC_ADDRESSES.POOLS.EURC;
  if (otherToken === "cirbtc") return ARC_ADDRESSES.POOLS.BTC;

  return "0x0000000000000000000000000000000000000000";
};