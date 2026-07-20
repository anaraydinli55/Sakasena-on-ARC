// ============================================
// BALANS VE HAVUZ VERILERI HOOK'U
// ============================================
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { formatUnits, ZERO_ADDRESS } from '../constants';
import { getActiveNetworkConfig, getPoolAddress } from './networks';

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

  const fetchBalances = useCallback(async () => {
    if (!provider || !account) return;
    try {
      const minABI = ["function balanceOf(address owner) view returns (uint256)"];
      const newBalances = {};
      const config = getActiveNetworkConfig(chainId);

      for (const key of Object.keys(config.tokens)) {
        const token = config.tokens[key];
        if (token.address && token.address !== ZERO_ADDRESS) { 
          try {
            const contract = new ethers.Contract(token.address, minABI, provider);
            const raw = await contract.balanceOf(account);
            const formatted = parseFloat(formatUnits(raw, token.decimals)); 
            newBalances[key] = formatted.toFixed(key === "cirBTC" ? 4 : 2);
          } catch (err) {
            console.error(`${key} balansi okunurken hata:`, err);
            newBalances[key] = "0.00";
          }
        } else {
          newBalances[key] = "0.00";
        }
      }
      setBalances(newBalances);
    } catch (err) {
      console.error("Bakiyeler sorgulanirken hata:", err);
    }
  }, [provider, account, chainId]);

  const fetchPoolReserves = useCallback(async (activePoolType, fromToken, toToken, activeTab) => {
    if (!provider || !account) return;

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
      const contract = new ethers.Contract(activePool, genericABI, provider);

      const [tA, tB, resA, resB, shares, userShares] = await Promise.all([
        contract.tokenA(), contract.tokenB(),
        contract.reserveA(), contract.reserveB(),
        contract.totalShares(), contract.lpShares(account)
      ]);

      const config = getActiveNetworkConfig(chainId);
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
      console.warn("Havuz rezervleri alinamadi:", err);
    }
  }, [provider, account, chainId]);

  return { balances, poolReserves, userPoolBalances, fetchBalances, fetchPoolReserves };
};
