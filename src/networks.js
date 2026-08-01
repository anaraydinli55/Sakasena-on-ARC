// ============================================
// COKLU-ZINCIR SEBEKE KONFIGURASYONLARI (v2 - DUZELTILMIS)
// ============================================
import { ARC_ADDRESSES } from './constants';

// ZERO_ADDRESS artik constants.js'dev geliyor
export { ZERO_ADDRESS } from './constants';

// HER SEBEKE ICIN AYRI TOKEN ADRESLERI
export const NETWORKS = {
  5042002: {
    name: "Arc Testnet",
    hexId: "0x4cef52",
    rpcUrl: "https://rpc.testnet.arc.network",
    explorer: "https://testnet.arcscan.app",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    // 💎 NATIVE TOKENS: Swap, Pool, Mint, Bridge için
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: ARC_ADDRESSES.USDC, decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: ARC_ADDRESSES.EURC, decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: ARC_ADDRESSES.cirBTC, decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: ARC_ADDRESSES.sakUSD, decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: ARC_ADDRESSES.AAA, decimals: 18, icon: "🪙" }
    },
    // Arc Testnet'te Aave desteklenmediği için boş bırakıyoruz
    aaveTokens: {}, 
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
    // 💎 NATIVE TOKENS: Swap, Pool, Mint, Bridge için (Standart Sepolia USDC & EURC)
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x1c7d4b196cb0c7b01d74fbc6116a902379c7238", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x1a05282496e69dbded31b846f25870a19b91234", decimals: 6, icon: "💶" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    // 💎 AAVE-SPECIFIC TOKENS: Sadece Borrow, Repay ve Supply için resmî Aave Sepolia adresleri
    aaveTokens: {
      aUSDC: { symbol: "aUSDC", name: "USD Coin (Aave)", address: "0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8", decimals: 6, icon: "💵" },
      USDT: { symbol: "USDT", name: "Tether (Aave)", address: "0x7169d386502ed0613f392c1ac7a6e11155111155", decimals: 6, icon: "💵" },
      WBTC: { symbol: "WBTC", name: "Wrapped BTC (Aave)", address: "0x29f2d40b09200424566f313936082f11393608d7", decimals: 8, icon: "₿" },
      LINK: { symbol: "LINK", name: "ChainLink (Aave)", address: "0xf8db5f31398fef16e87f8f90382025d2d5d788fe", decimals: 18, icon: "🪙" }
    },
    minterAddress: "0x0000000000000000000000000000000000000000",
    aavePoolAddress: "0x6ae43d3271ff6888e7fc43fd7321a503ff738951",
    isAaveSupported: true
  },
  84532: {
    name: "Base Sepolia",
    hexId: "0x14a34",
    rpcUrl: "https://base-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    // 💎 NATIVE TOKENS: Swap, Pool, Mint, Bridge için
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x036cbd53842c5426634e7929541ec2318f3dcf7e", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x808456652fdb597867f38412077a9182bf77359f", decimals: 6, icon: "💶" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x7c45c5ce07e0cf673f48f7aef4837c59c0d3281", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    // 💎 AAVE-SPECIFIC TOKENS: Faucet'tan aldığınız tüm yeni coinlerin resmî Base Sepolia Aave adresleri
    aaveTokens: {
      aUSDC: { symbol: "aUSDC", name: "USD Coin (Aave)", address: "0x036cbd53842c5426634e7929541ec2318f3dcf7e", decimals: 6, icon: "💵" },
      USDT: { symbol: "USDT", name: "Tether (Aave)", address: "0x3b07cbd53842c5426634e7929541ec2318f3dcf7e", decimals: 6, icon: "💵" },
      WBTC: { symbol: "WBTC", name: "Wrapped BTC (Aave)", address: "0xfb825da0298aed601595a70ab815c96711a31bc6", decimals: 8, icon: "₿" },
      LINK: { symbol: "LINK", name: "ChainLink (Aave)", address: "0xe52c03842c5426634e7929541ec2318f3dcf7e2f", decimals: 18, icon: "🪙" }
    },
    minterAddress: "0x20b45703967b5ed4d36c9d8bea38d4d44e64fd67",
    aavePoolAddress: "0x8bab6d1b75f19e9ed9fce8b9bd338844ff79ae27",
    isAaveSupported: true
  },
  421614: {
    name: "Arbitrum Sepolia",
    hexId: "0x66eee",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorer: "https://sepolia.arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x3271ff68408398a123f67ce4a42f50005c12423d", decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: "0x0000000000000000000000000000000000000000", decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    // Arbitrum Sepolia Aave Faucet Tokenleri (İhtiyaca göre doldurabilirsiniz)
    aaveTokens: {
      USDC: { symbol: "USDC", name: "USD Coin (Aave)", address: "0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d", decimals: 6, icon: "💵" }
    },
    minterAddress: "0x0000000000000000000000000000000000000000",
    aavePoolAddress: "0x76ad72ba9760775ffbc87eeaf493ad5b4c965c40",
    isAaveSupported: true
  },
  11155420: {
    name: "Optimism Sepolia",
    hexId: "0xaa37dc",
    rpcUrl: "https://sepolia.optimism.io",
    explorer: "https://sepolia-optimism.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x5fd84259d66cd46123540766be93dfe6d43130d7", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x0000000000000000000000000000000000000000", decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: "0x0000000000000000000000000000000000000000", decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    aaveTokens: {
      USDC: { symbol: "USDC", name: "USD Coin (Aave)", address: "0x5fd84259d66cd46123540766be93dfe6d43130d7", decimals: 6, icon: "💵" }
    },
    minterAddress: "0x0000000000000000000000000000000000000000",
    aavePoolAddress: "0x1204a117c54535ca5122e478ee1dfb4914dfee123",
    isAaveSupported: true
  },
  4801: {
    name: "World Chain Sepolia",
    hexId: "0x12c1",
    rpcUrl: "https://worldchain-sepolia.g.alchemy.com/public",
    explorer: "https://worldchain-sepolia.explorer.alchemy.com",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x66145f38cbac35ca6f1dfb4914df98f1614aea88", decimals: 6, icon: "💵" },
      ETH: { symbol: "ETH", name: "Ether", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x0000000000000000000000000000000000000000", decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: "0x0000000000000000000000000000000000000000", decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    aaveTokens: {},
    minterAddress: "0x0000000000000000000000000000000000000000",
    aavePoolAddress: "0x0000000000000000000000000000000000000000",
    isAaveSupported: false
  },
  43113: {
    name: "Avalanche Fuji",
    hexId: "0xa869",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    explorer: "https://testnet.snowtrace.io",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
    tokens: {
      USDC: { symbol: "USDC", name: "USD Coin", address: "0x5425890298aed601595a70ab815c96711a31bc65", decimals: 6, icon: "💵" },
      EURC: { symbol: "EURC", name: "Euro Coin", address: "0x0000000000000000000000000000000000000000", decimals: 6, icon: "💶" },
      cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: "0x0000000000000000000000000000000000000000", decimals: 8, icon: "₿" },
      sakUSD: { symbol: "sakUSD", name: "Sakasena USD", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "💴" },
      AAA: { symbol: "AAA", name: "anaraydinli AAA Token", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🪙" }
    },
    aaveTokens: {},
    minterAddress: "0x0000000000000000000000000000000000000000",
    aavePoolAddress: "0x0000000000000000000000000000000000000000",
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
