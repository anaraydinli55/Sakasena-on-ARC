// ============================================
// BALANS VE HAVUZ VERILERI HOOK'U (v2 - Ag degisimi takibi)
// ============================================
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { formatUnits, ZERO_ADDRESS } from '../constants';
import { getActiveNetworkConfig, getPoolAddress } from '../networks';

export const useBalances = (provider, account, chainId) => {
  const [balances, setBalances] = useState({ 
    USDC: "0.00", EURC: "0.00", cirBTC: "0.0000", 
    sakUSD: "0.00", WUSDC: "0.00", AAA: "0.00", USDT: "0.00", DAI: "0.00" 
  });

  const [poolReserves, setPoolReserves] = useState({ 
    stableAmount: "0.00", aaaAmount: "0.00", stableSymbol: "USDC", totalShares: "0" 
  });

  const [userPoolBalances, setUserPoolBalances] = useState({ 
    stableAmount: "0.00", aaaAmount: "0.00", stableSymbol: "USDC" 
  });

  // ============================================
  // TAZE PROVIDER AL - her zaman guncel ag
  // ============================================
  const getFreshProvider = useCallback(() => {
    if (!window.ethereum) return null;
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  // ============================================
  // MEVCUT AGI AL - MetaMask'ten dogrudan
  // ============================================
  const getCurrentChainId = useCallback(async () => {
    if (!window.ethereum) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    return Number(network.chainId);
  }, []);

  // ============================================
  // BALANSLARI CEK
  // ============================================
  const fetchBalances = useCallback(async () => {
    if (!account) {
      setBalances({ USDC: "0.00", EURC: "0.00", cirBTC: "0.0000", sakUSD: "0.00", WUSDC: "0.00", AAA: "0.00", USDT: "0.00", DAI: "0.00" });
      return;
    }

    const freshProvider = getFreshProvider();
    if (!freshProvider) return;

    // Mevcut agi al - prop yerine
    const currentChainId = await getCurrentChainId();
    if (!currentChainId) return;

    const config = getActiveNetworkConfig(currentChainId);

    try {
      const minABI = ["function balanceOf(address owner) view returns (uint256)"];
      const newBalances = {};

      for (const key of Object.keys(config.tokens)) {
        const token = config.tokens[key];
        if (token.address && token.address !== ZERO_ADDRESS) { 
          try {
            const contract = new ethers.Contract(token.address, minABI, freshProvider);
            const raw = await contract.balanceOf(account);
            const formatted = parseFloat(formatUnits(raw, token.decimals)); 
            newBalances[key] = formatted.toFixed(key === "cirBTC" ? 4 : 2);
          } catch (err) {
            console.warn(`${key} balansi okunurken hata:`, err.message);
            newBalances[key] = "0.00";
          }
        } else {
          newBalances[key] = "0.00";
        }
      }

      // Eksik token'lar icin 0 ata
      const allTokens = ["USDC", "EURC", "cirBTC", "sakUSD", "WUSDC", "AAA", "USDT", "DAI"];
      for (const t of allTokens) {
        if (newBalances[t] === undefined) newBalances[t] = "0.00";
      }

      setBalances(newBalances);
      console.log('Balanslar guncellendi:', currentChainId, newBalances);
    } catch (err) {
      console.error("Bakiyeler sorgulanirken hata:", err);
    }
  }, [account, getFreshProvider, getCurrentChainId]);

  // ============================================
  // HAVUZ REZERVLERINI CEK
  // ============================================
  const fetchPoolReserves = useCallback(async (activePoolType, fromToken, toToken, activeTab) => {
    if (!account) return;

    const freshProvider = getFreshProvider();
    if (!freshProvider) return;

    const currentChainId = await getCurrentChainId();
    if (!currentChainId) return;

    const activePool = activeTab === "pool"
      ? getPoolAddress(activePoolType, "AAA") 
      : getPoolAddress(fromToken, toToken);

    if (activePool === ZERO_ADDRESS) return;

    try {
      const genericABI = [
        "function tokenA() view returns (address)",
        "function tokenB() view returns (address)",
        "function reserveA() view returns (uint256)",
        "function reserveB() view returns (uint256)",
        "function totalShares() view returns (uint256)",
        "function lpShares(address) view returns (uint256)" 
      ];
      const contract = new ethers.Contract(activePool, genericABI, freshProvider);

      const [tA, tB, resA, resB, shares, userShares] = await Promise.all([
        contract.tokenA(), contract.tokenB(),
        contract.reserveA(), contract.reserveB(),
        contract.totalShares(), contract.lpShares(account)
      ]);

      const config = getActiveNetworkConfig(currentChainId);
      const getDecimals = (addr) => {
        for (const key of Object.keys(config.tokens)) {
          if (config.tokens[key].address.toLowerCase() === addr.toLowerCase()) 
            return config.tokens[key].decimals;
        }
        return 18;
      };

      const decimalsA = getDecimals(tA), decimalsB = getDecimals(tB);
      const formattedResA = parseFloat(formatUnits(resA, decimalsA)).toFixed(decimalsA === 8 ? 4 : 2);
      const formattedResB = parseFloat(formatUnits(resB, decimalsB)).toFixed(decimalsB === 8 ? 4 : 2);

      const isAStableOrBTC = decimalsA === 6 || decimalsA === 8;
      const stableSymbol = isAStableOrBTC 
        ? config.tokens[Object.keys(config.tokens).find(k => config.tokens[k].address.toLowerCase() === tA.toLowerCase())]?.symbol || "Stable" 
        : config.tokens[Object.keys(config.tokens).find(k => config.tokens[k].address.toLowerCase() === tB.toLowerCase())]?.symbol || "Stable";

      const uShares = BigInt(userShares.toString()), tShares = BigInt(shares.toString());
      const rA = BigInt(resA.toString()), rB = BigInt(resB.toString());

      let userStableAmount = "0.00", userAaaAmount = "0.00";

      if (tShares > 0n && uShares > 0n) {
        const userShareA = (uShares * rA) / tShares, userShareB = (uShares * rB) / tShares;
        userStableAmount = parseFloat(formatUnits(userShareA, decimalsA)).toFixed(decimalsA === 8 ? 4 : 2);
        userAaaAmount = parseFloat(formatUnits(userShareB, decimalsB)).toFixed(decimalsB === 8 ? 4 : 2);
      }

      setPoolReserves({
        stableAmount: isAStableOrBTC ? formattedResA : formattedResB,
        aaaAmount: isAStableOrBTC ? formattedResB : formattedResA,
        stableSymbol, totalShares: shares.toString()
      });

      setUserPoolBalances({
        stableAmount: isAStableOrBTC ? userStableAmount : userAaaAmount,
        aaaAmount: isAStableOrBTC ? userAaaAmount : userStableAmount,
        stableSymbol
      });
    } catch (err) {
      console.warn("Havuz rezervleri alinamadi:", err.message);
    }
  }, [account, getFreshProvider, getCurrentChainId]);

  // ============================================
  // AG DEGISIMINI IZLE - MetaMask events
  // ============================================
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = async () => {
      console.log('Ag degisimi algilandi, balanslar yenileniyor...');
      // Kisa bekleme sonra yenile
      await new Promise(r => setTimeout(r, 1000));
      await fetchBalances();
    };

    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [fetchBalances]);

  // ============================================
  // ILK YUKLEME VE PERIYODIK YENILEME
  // ============================================
  useEffect(() => {
    if (!account) return;

    fetchBalances();

    // Her 5 saniyede bir yenile (ag degisimi icin)
    const interval = setInterval(fetchBalances, 5000);
    return () => clearInterval(interval);
  }, [account, fetchBalances]);

  return { balances, poolReserves, userPoolBalances, fetchBalances, fetchPoolReserves };
};
