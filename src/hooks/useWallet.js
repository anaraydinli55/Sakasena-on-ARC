// ============================================
// CUZDAN VE SEBEKE HOOK'U (DUZELTILMIS)
// ============================================
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getProviderInstance, getSignerInstance } from '../constants';
import { NETWORKS } from '../networks';

export const useWallet = () => {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = getProviderInstance();
      setProvider(web3Provider);

      window.ethereum.request({ method: 'eth_chainId' })
        .then(id => setChainId(parseInt(id, 16)))
        .catch(err => console.warn(err));

      const handleAccounts = (accounts) => {
        if (accounts.length > 0) setAccount(accounts[0]);
        else setAccount("");
      };

      const handleChain = (hexId) => {
        setChainId(parseInt(hexId, 16));
      };

      window.ethereum.on('accountsChanged', handleAccounts);
      window.ethereum.on('chainChanged', handleChain);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccounts);
          window.ethereum.removeListener('chainChanged', handleChain);
        }
      };
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("Lutfen MetaMask veya Rabby Wallet kurun.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await switchNetwork(5042002);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const switchNetwork = useCallback(async (targetChainId) => {
    const config = NETWORKS[targetChainId];
    if (!config) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: config.hexId }],
      });
    } catch (switchError) {
      console.warn("Sebekeye gecis yapilamadi...", switchError);
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: config.hexId,
            chainName: config.name,
            nativeCurrency: config.nativeCurrency,
            rpcUrls: [config.rpcUrl],
            blockExplorerUrls: [config.explorer]
          }]
        });
      } catch (addError) {
        console.error("Sebeke cuzdana eklenemedi:", addError);
        alert(`Lutfen cuzdaninizdan manuel olarak ${config.name} agina gecin.`);
      }
    }
  }, []);

  const getSigner = useCallback(async () => {
    // Her zaman taze provider olustur - ag degisimi sonrasi gerekli
    if (!window.ethereum) return null;
    const freshProvider = new ethers.BrowserProvider(window.ethereum);
    return await freshProvider.getSigner();
  }, []);

  return {
    provider,
    account,
    chainId,
    connectWallet,
    switchNetwork,
    getSigner
  };
};