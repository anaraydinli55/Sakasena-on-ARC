// ============================================
// SAVINGS/STAKE VERILERI HOOK'U
// ============================================
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { formatUnits } from './constants';
import { getActiveNetworkConfig, ZERO_ADDRESS } from './networks';

export const useSavings = (provider, account, chainId) => {
  const [savingsData, setSavingsData] = useState({ 
    staked: "0.00", pendingRewards: "0.00", requests: [] 
  });

  const fetchSavingsData = useCallback(async () => {
    if (!provider || !account) return;
    const config = getActiveNetworkConfig(chainId);
    if (!config.minterAddress || config.minterAddress === ZERO_ADDRESS) return;

    try {
      const minterABI = [
        {
          "inputs": [{"name": "", "type": "address"}],
          "name": "stakedBalance",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{"name": "user", "type": "address"}],
          "name": "calculatePendingRewards",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{"name": "user", "type": "address"}],
          "name": "getUnstakeRequests",
          "outputs": [
            {
              "components": [
                {"name": "amount", "type": "uint256"},
                {"name": "releaseTime", "type": "uint256"}
              ],
              "name": "",
              "type": "tuple[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ];

      const contract = new ethers.Contract(config.minterAddress, minterABI, provider);

      const [staked, pending, reqs] = await Promise.all([
        contract.stakedBalance(account),
        contract.calculatePendingRewards(account),
        contract.getUnstakeRequests(account)
      ]);

      const requestsMapped = Array.from(reqs).map((r, i) => {
        const amountVal = r.amount !== undefined ? r.amount : r[0];
        const releaseVal = r.releaseTime !== undefined ? r.releaseTime : r[1];
        return {
          index: i,
          amount: parseFloat(formatUnits(amountVal, 18)).toFixed(2),
          releaseTime: Number(releaseVal)
        };
      });

      setSavingsData({
        staked: parseFloat(formatUnits(staked, 18)).toFixed(2),
        pendingRewards: parseFloat(formatUnits(pending, 18)).toFixed(4),
        requests: requestsMapped
      });
    } catch (err) {
      console.warn("Tasarruf bilgileri alinamadi:", err);
    }
  }, [provider, account, chainId]);

  return { savingsData, fetchSavingsData };
};
