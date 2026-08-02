// ============================================
// BALANS VE HAVUZ VERILERI HOOK'U (v2 - Çakışma Önleyici & Standart Ayrıştırıcı)
// ============================================
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { formatUnits, ZERO_ADDRESS } from '../constants';
import { getActiveNetworkConfig, getPoolAddress } from '../networks';

export const useBalances = (provider, account, chainId) => {
  const [balances, setBalances] = useState({ 
    USDC: "0.00", aUSDC: "0.00", EURC: "0.00", cirBTC: "0.0000", // 💎 aUSDC eklendi
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
      setBalances({ USDC: "0.00", aUSDC: "0.00", EURC: "0.00", cirBTC: "0.0000", sakUSD: "0.00", WUSDC: "0.00", AAA: "0.00", USDT: "0.00", DAI: "0.00" });
      return;
    }

    const freshProvider = getFreshProvider();
    if (!freshProvider) return;

    const currentChainId = await getCurrentChainId();
    if (!currentChainId) return;

    const config = getActiveNetworkConfig(currentChainId);

    // 💎 Hem standart hem de Aave token'larını çakışma olmadan okumak için birleştiriyoruz:
    const allNetworkTokens = {
      ...config.tokens,
      ...(config.aaveTokens || {})
    };

    try {
      const minABI = ["function balanceOf(address owner) view returns (uint256)"];
      const newBalances = {};

      for (const key of Object.keys(allNetworkTokens)) {
        const token = allNetworkTokens[key];
        if (token.address && token.address !== ZERO_ADDRESS) { 
          try {
            const contract = new ethers.Contract(token.address, minABI, freshProvider);
            const raw = await contract.balanceOf(account);
            const formatted = parseFloat(formatUnits(raw, token.decimals)); 
            newBalances[key] = formatted.toFixed(key === "cirBTC" ? 4 : 2);
          } catch (err) {
            try {
              await new Promise(r => setTimeout(r, 300));
              const contract = new ethers.Contract(token.address, minABI, freshProvider);
              const raw = await contract.balanceOf(account);
              const formatted = parseFloat(formatUnits(raw, token.decimals));
              newBalances[key] = formatted.toFixed(key === "cirBTC" ? 4 : 2);
            } catch (retryErr) {
              console.warn(`${key} balansi okunurken hata (retry sonrasi):`, retryErr.message);
            }
          }
        } else {
          newBalances[key] = "0.00";
        }
      }

      // 💎 Sabit whitelist yerine, o an aktif agda gercekten var olan
      // TUM token key'lerini (Aave dahil) dinamik olarak birlestiriyoruz.
      // Onceki sabit liste WBTC ve LINK'i icermedigi icin bu iki token'in
      // bakiyesi zincirden dogru cekilse bile ekrana hic yansimiyordu.
      const knownTokenKeys = new Set([
        ...Object.keys(config.tokens || {}),
        ...Object.keys(config.aaveTokens || {}),
        "aUSDC", "WUSDC", "DAI" // legacy/gorunum icin geriye donuk uyumluluk
      ]);
      setBalances(prev => {
        const merged = { ...prev };
        for (const t of knownTokenKeys) {
          if (newBalances[t] !== undefined) {
            merged[t] = newBalances[t];
          } else if (merged[t] === undefined) {
            merged[t] = "0.00";
          }
        }
        console.log('Balanslar guncellendi:', currentChainId, merged);
        return merged;
      });
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

    let activePool = activeTab === "pool"
      ? getPoolAddress(activePoolType, "AAA") 
      : getPoolAddress(fromToken, toToken);

    // İstatistik kartlarının her zaman güncel kalabilmesi için varsayılan koruma:
    if (!activePool || activePool === ZERO_ADDRESS) {
      activePool = getPoolAddress("USDC", "AAA");
    }

    if (activePool === ZERO_ADDRESS) return;

    const fetchOnce = async () => {
      // 1. Yol: lpShares ve totalShares içeren özel ABI
      const customABI = [
        "function tokenA() view returns (address)",
        "function tokenB() view returns (address)",
        "function reserveA() view returns (uint256)",
        "function reserveB() view returns (uint256)",
        "function totalShares() view returns (uint256)",
        "function lpShares(address) view returns (uint256)" 
      ];
      
      // 2. Yol: Standart ERC20 (balanceOf ve totalSupply) içeren ABI
      const standardABI = [
        "function tokenA() view returns (address)",
        "function tokenB() view returns (address)",
        "function reserveA() view returns (uint256)",
        "function reserveB() view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)" 
      ];

      try {
        const contract = new ethers.Contract(activePool, customABI, freshProvider);
        const [tA, tB, resA, resB, shares, userShares] = await Promise.all([
          contract.tokenA(), contract.tokenB(),
          contract.reserveA(), contract.reserveB(),
          contract.totalShares(), contract.lpShares(account)
        ]);
        return [tA, tB, resA, resB, shares, userShares];
      } catch (customErr) {
        console.warn("Özel havuz ABI sorgusu başarısız, standart ERC20 (balanceOf/totalSupply) deneniyor...");
        const contract = new ethers.Contract(activePool, standardABI, freshProvider);
        const [tA, tB, resA, resB, shares, userShares] = await Promise.all([
          contract.tokenA(), contract.tokenB(),
          contract.reserveA(), contract.reserveB(),
          contract.totalSupply(), contract.balanceOf(account)
        ]);
        return [tA, tB, resA, resB, shares, userShares];
      }
    };

    try {
      let tA, tB, resA, resB, shares, userShares;
      try {
        [tA, tB, resA, resB, shares, userShares] = await fetchOnce();
      } catch (firstErr) {
        await new Promise(r => setTimeout(r, 400));
        [tA, tB, resA, resB, shares, userShares] = await fetchOnce();
      }

      const config = getActiveNetworkConfig(currentChainId);
      
      // 💎 toLowerCase() undefined çökmesini engelleyen emniyetli fonksiyon:
      // Hem standart hem de Aave token listelerindeki ondalık haneleri başarıyla tarar:
      const getDecimals = (addr) => {
        if (!addr) return 18; 
        const allTokens = {
          ...config.tokens,
          ...(config.aaveTokens || {})
        };
        for (const key of Object.keys(allTokens)) {
          const tokenAddr = allTokens[key].address;
          if (tokenAddr && tokenAddr.toLowerCase() === addr.toLowerCase()) 
            return allTokens[key].decimals;
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
      await new Promise(r => setTimeout(r, 1000));
      await fetchBalances();
      await fetchPoolReserves(); 
    };

    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [fetchBalances, fetchPoolReserves]);

  // ============================================
  // ILK YUKLEME VE PERIYODIK YENILEME
  // ============================================
  useEffect(() => {
    if (!account) return;

    const refreshAllData = () => {
      fetchBalances();
      fetchPoolReserves(); 
    };

    refreshAllData();

    const interval = setInterval(refreshAllData, 5000);
    return () => clearInterval(interval);
  }, [account, fetchBalances, fetchPoolReserves]);

  return { balances, poolReserves, userPoolBalances, fetchBalances, fetchPoolReserves };
};
