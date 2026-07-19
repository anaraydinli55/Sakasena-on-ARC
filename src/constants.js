// ============================================
// SAKASENA ON ARC - SABITLER VE KONFIGURASYON
// ============================================
import { ethers } from 'ethers';

// ARC TESTNET SABITLERI
export const ARC_CHAIN_ID = 5042002;
export const ARC_CHAIN_HEX = "0x4cef52";
export const ARC_RPC_URL = import.meta.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network";

// ARC TESTNET KONTRAKT ADRESLERI
export const ARC_ADDRESSES = {
  USDC: "0x3600000000000000000000000000000000000000",
  EURC: "0x89b50855aa3be2f677cd6303cec089b5f319d72a",
  cirBTC: "0xf0c4a4ce82a5746abaad9425360ab04fbba432bf",
  AAA: "0x54552f2ec52423d2fbe94c25f0bad61b9108aae8",
  sakUSD: "0x085bc2b26d637685d2d3b742f10d14d8d77557b1",
  MINTER: "0x1e27b23bc7662db4accf371b96b14ea5d81e0f83",
  POOLS: {
    USDC: "0xbe0f19f85a5cd1cac56e6f31c85f6cae805e56c3",
    EURC: "0xbbc6cd33291edfe9e4e927129901db0e58ba705b",
    BTC: "0x1815df186c43506e7d9113e6c1d19326610aa448",
    USDC_EURC: "0xE50eeb474BB6D7Afc148da3023836B2Afa358D3c"
  }
};

// TOKEN MEZENNELERI
export const TOKEN_PRICES = {
  USDC: 1.00, EURC: 1.25, cirBTC: 67450.00,
  WUSDC: 1.00, sakUSD: 1.00, AAA: 5.40, USDT: 1.00, DAI: 1.00
};

// ETHERS V5/V6 UYUMLULUK
export const isV6 = typeof ethers.BrowserProvider !== 'undefined';

export const getProviderInstance = () => {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  return isV6 
    ? new ethers.BrowserProvider(window.ethereum) 
    : new ethers.providers.Web3Provider(window.ethereum);
};

export const ZERO_ADDRESS = isV6 
  ? ethers.ZeroAddress 
  : (ethers.constants ? ethers.constants.AddressZero : "0x0000000000000000000000000000000000000000");

// MAX_UINT256 TANIMI (ONCEKI KODDA YOKTU)
export const MAX_UINT256 = isV6 
  ? ethers.MaxUint256 
  : (ethers.constants ? ethers.constants.MaxUint256 : "115792089237316195423570985008687907853269984665640564039457584007913129639935");

export const formatUnits = (value, decimals) => {
  return isV6 ? ethers.formatUnits(value, decimals) : ethers.utils.formatUnits(value, decimals);
};

export const parseUnits = (value, decimals) => {
  return isV6 ? ethers.parseUnits(value, decimals) : ethers.utils.parseUnits(value, decimals);
};

export const getSignerInstance = async (providerInstance) => {
  return isV6 ? await providerInstance.getSigner() : providerInstance.getSigner();
};

export const isLessThan = (a, b) => BigInt(a.toString()) < BigInt(b.toString());

// AAVE DESTEK
export const AAVE_SUPPORTED_CHAIN_IDS = [84532, 11155111, 421614, 11155420];
export const isAaveSupported = (chainId) => AAVE_SUPPORTED_CHAIN_IDS.includes(Number(chainId));
export const AAVE_SUPPORTED_TOKENS = ["USDC", "USDT", "DAI", "WETH"];
