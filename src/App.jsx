import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Arc Network Testnet Bilgileri
const ARC_CHAIN_ID = 5042002;
const ARC_CHAIN_HEX = "0x4cef52";
const ARC_RPC_URL = import.meta.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network";

// Resmi Sözleşme Adresleri
const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const ARC_EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
const ARC_CIRBTC_ADDRESS = "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF";

// Sizin Deploy Ettiğiniz Sözleşme Adresi (1300+ Holders)
const USER_CUSTOM_TOKEN_ADDRESS = "0x54552f2EC52423D2fBE94c25f0BAd61b9108AAE8";

// Yeni Deploy Ettiğiniz Sakasena Havuz (DEX) Sözleşme Adresi
const SAKASENA_POOL_ADDRESS = import.meta.env.VITE_SAKASENA_POOL_ADDRESS || "0xbE0f19F85A5cD1Cac56E6f31c85f6cAe805e56C3";

// JavaScript Temporal Dead Zone hatasını önlemek için en üstte tanımlanan Kur Oranları
const TOKEN_PRICES = {
  USDC: 1.00,
  EURC: 1.08,
  cirBTC: 67450.00,
  USDS: 1.00,
  AAA: 5.40,
  MYTOKEN: 5.40, // anaraydinli AAA ile eşlendi
  USDT: 1.00,
  DAI: 1.00
};

// Başlangıç Token Listesi
const INITIAL_TOKENS = {
  USDC: { 
    symbol: "USDC", 
    name: "USD Coin (Gas Token)", 
    decimals: 6, 
    icon: "💵",
    address: ARC_USDC_ADDRESS
  },
  EURC: { 
    symbol: "EURC", 
    name: "Euro Coin", 
    decimals: 6, 
    icon: "💶",
    address: ARC_EURC_ADDRESS
  },
  cirBTC: { 
    symbol: "cirBTC", 
    name: "Circle Wrapped Bitcoin", 
    decimals: 8, 
    icon: "₿",
    address: ARC_CIRBTC_ADDRESS
  },
  USDS: { 
    symbol: "USDS", 
    name: "Sky USDS Stablecoin", 
    decimals: 18, 
    icon: "🌀",
    address: import.meta.env.VITE_USDS_ADDRESS || "0x0000000000000000000000000000000000000000" 
  },
  MYTOKEN: {
    symbol: "Loading...",
    name: "Your Deployed Token",
    decimals: 18,
    icon: "⭐",
    address: USER_CUSTOM_TOKEN_ADDRESS
  },
  USDT: { symbol: "USDT", name: "Tether USD", decimals: 6, icon: "🟢" },
  DAI: { symbol: "DAI", name: "Dai Stablecoin", decimals: 18, icon: "🟡" }
};

export default function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [activeTab, setActiveTab] = useState("swap"); // swap, pool, faucet
  
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [balances, setBalances] = useState({ USDC: "0.00", EURC: "0.00", cirBTC: "0.0000", USDS: "0.00", MYTOKEN: "0.00", USDT: "0.00", DAI: "0.00" });
  
  // Swap Form States
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("MYTOKEN");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");

  // Liquidity Pool Form States
  const [lpUSDC, setLpUSDC] = useState("");
  const [lpAAA, setLpAAA] = useState("");
  const [poolReserves, setPoolReserves] = useState({ USDC: "0.00", AAA: "0.00", totalShares: "0" });

  const [spPoints, setSpPoints] = useState(1250);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      // ETHERS V6: Web3Provider yerine BrowserProvider kullanılmaktadır
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      
      window.ethereum.request({ method: 'eth_chainId' })
        .then(id => setChainId(parseInt(id, 16)));

      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) setAccount(accounts[0]);
        else setAccount("");
      });

      window.ethereum.on('chainChanged', (hexId) => {
        setChainId(parseInt(hexId, 16));
      });
    }
  }, []);

  useEffect(() => {
    if (account && chainId === ARC_CHAIN_ID && provider) {
      const loadAllData = async () => {
        await loadCustomTokenDetails();
        await fetchBalances();
        await fetchPoolReserves();
      };
      loadAllData();
    }
  }, [account, chainId, provider]);

  // ETHERS V6: Dinamik Fiyatlama ve Swap Çıktısı Hesaplama
  useEffect(() => {
    const calculateSwapOutput = async () => {
      if (!amountIn || isNaN(amountIn) || parseFloat(amountIn) <= 0) {
        setAmountOut("");
        return;
      }
      if (!provider || chainId !== ARC_CHAIN_ID) return;

      try {
        const poolABI = ["function getAmountOut(address tokenIn, uint256 amountIn) view returns (uint256)"];
        const poolContract = new ethers.Contract(SAKASENA_POOL_ADDRESS, poolABI, provider);
        const tokenInAddress = tokens[fromToken].address;

        if (tokenInAddress && tokenInAddress !== ethers.ZeroAddress) { // Ethers v6: ZeroAddress
          const amountInParsed = ethers.parseUnits(amountIn, tokens[fromToken].decimals); // Ethers v6: utils yok
          const rawAmountOut = await poolContract.getAmountOut(tokenInAddress, amountInParsed);
          const formattedAmountOut = ethers.formatUnits(rawAmountOut, tokens[toToken].decimals); // Ethers v6: utils yok
          setAmountOut(parseFloat(formattedAmountOut).toFixed(tokens[toToken].decimals === 8 ? 6 : 4));
        } else {
          setAmountOut((parseFloat(amountIn) * 0.997).toFixed(4));
        }
      } catch (err) {
        console.warn("Fiyat hesaplanamadı (Havuzda likidite yetersiz olabilir):", err);
        setAmountOut("Likidite Yetersiz");
      }
    };

    calculateSwapOutput();
  }, [amountIn, fromToken, toToken, tokens, provider, chainId]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Lütfen MetaMask veya Rabby Wallet kurun.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await checkAndSwitchNetwork();
    } catch (error) {
      console.error(error);
    }
  };

  const checkAndSwitchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARC_CHAIN_HEX }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ARC_CHAIN_HEX,
              chainName: "Arc Testnet",
              nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 6 },
              rpcUrls: [ARC_RPC_URL],
              blockExplorerUrls: ["https://explorer.testnet.arc.network"]
            }]
          });
        } catch (addError) {
          console.error(addError);
        }
      }
    }
  };

  const loadCustomTokenDetails = async () => {
    if (!provider) return;
    try {
      const tokenABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
      ];
      const contract = new ethers.Contract(USER_CUSTOM_TOKEN_ADDRESS, tokenABI, provider);
      
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);

      setTokens(prev => {
        const updated = { ...prev };
        updated.MYTOKEN = {
          ...updated.MYTOKEN,
          symbol: symbol,
          name: `${name} (Your Token)`,
          decimals: Number(decimals)
        };
        return updated;
      });
    } catch (err) {
      console.warn("Kullanıcı token detayları okunamadı:", err);
    }
  };

  // ETHERS V6: Bakiye sorgulama
  const fetchBalances = async () => {
    if (!provider || !account) return;
    try {
      const minABI = ["function balanceOf(address owner) view returns (uint256)"];
      const newBalances = {};

      for (const key of Object.keys(tokens)) {
        const token = tokens[key];
        if (token.address && token.address !== ethers.ZeroAddress) { // Ethers v6: ZeroAddress
          try {
            const contract = new ethers.Contract(token.address, minABI, provider);
            const raw = await contract.balanceOf(account);
            const formatted = parseFloat(ethers.formatUnits(raw, token.decimals)); // Ethers v6: formatUnits
            const decimalsToShow = token.symbol === "cirBTC" ? 4 : 2;
            newBalances[key] = formatted.toFixed(decimalsToShow);
          } catch (err) {
            newBalances[key] = "0.00";
          }
        } else {
          newBalances[key] = (Math.random() * 300 + 50).toFixed(2);
        }
      }

      setBalances(newBalances);
    } catch (err) {
      console.error("Bakiyeler sorgulanırken hata oluştu:", err);
    }
  };

  // ETHERS V6: Havuz Rezervlerini On-Chain Sorgulama
  const fetchPoolReserves = async () => {
    if (!provider || SAKASENA_POOL_ADDRESS === ethers.ZeroAddress) return;
    try {
      const poolABI = [
        "function reserveUSDC() view returns (uint256)",
        "function reserveAAA() view returns (uint256)",
        "function totalShares() view returns (uint256)"
      ];
      const contract = new ethers.Contract(SAKASENA_POOL_ADDRESS, poolABI, provider);
      const [resUSDC, resAAA, shares] = await Promise.all([
        contract.reserveUSDC(),
        contract.reserveAAA(),
        contract.totalShares()
      ]);

      setPoolReserves({
        USDC: parseFloat(ethers.formatUnits(resUSDC, 6)).toFixed(2), // Ethers v6
        AAA: parseFloat(ethers.formatUnits(resAAA, 18)).toFixed(2),  // Ethers v6
        totalShares: shares.toString()
      });
    } catch (err) {
      console.warn("Havuz rezervleri alınamadı:", err);
    }
  };

  // ETHERS V6: GERÇEK ZİNCİR ÜSTÜ İŞLEMLER (SWAP & ADD LIQUIDITY)
  const handleAction = async (type) => {
    if (chainId !== ARC_CHAIN_ID) {
      await checkAndSwitchNetwork();
      return;
    }

    if (!SAKASENA_POOL_ADDRESS || SAKASENA_POOL_ADDRESS === ethers.ZeroAddress) {
      alert("Havuz sözleşme adresi tanımlı değil.");
      return;
    }

    setTxLoading(true);
    try {
      // ETHERS V6: getSigner artık asenkrondur ve await ile çağrılmalıdır
      const signer = await provider.getSigner(); 

      if (type === "swap") {
        const tokenInObj = tokens[fromToken];
        const amountInParsed = ethers.parseUnits(amountIn, tokenInObj.decimals); // Ethers v6

        // 1. ERC-20 Approve Kontrolü ve Yetkilendirme
        const erc20ABI = [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function approve(address spender, uint256 amount) returns (bool)"
        ];
        const tokenInContract = new ethers.Contract(tokenInObj.address, erc20ABI, signer);
        const currentAllowance = await tokenInContract.allowance(account, SAKASENA_POOL_ADDRESS);
        
        // ETHERS V6: Yerel BigInt kullanıldığı için .lt() yerine doğrudan < ve > operatörleri kullanılır
        if (currentAllowance < amountInParsed) { 
          alert(`Lütfen önce ${tokenInObj.symbol} harcama yetkisini (Approve) onaylayın.`);
          const approveTx = await tokenInContract.approve(SAKASENA_POOL_ADDRESS, amountInParsed);
          await approveTx.wait();
        }

        // 2. Havuz Üzerinden Swap Çağrısı
        const poolABI = ["function swap(address tokenIn, uint256 amountIn) external returns (uint256)"];
        const poolContract = new ethers.Contract(SAKASENA_POOL_ADDRESS, poolABI, signer);
        
        const swapTx = await poolContract.swap(tokenInObj.address, amountInParsed);
        alert(`Swap işlemi gönderildi! Tx: ${swapTx.hash}`);
        await swapTx.wait();
        
        alert("Swap işlemi zincir üstünde onaylandı!");
        setSpPoints(prev => prev + 50);
        await fetchBalances();
        await fetchPoolReserves();
      }

      if (type === "add_lp") {
        if (!lpUSDC || !lpAAA) {
          alert("Lütfen her iki miktar alanını da doldurun.");
          setTxLoading(false);
          return;
        }

        const usdcParsed = ethers.parseUnits(lpUSDC, 6);
        const aaaParsed = ethers.parseUnits(lpAAA, 18);

        const erc20ABI = [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function approve(address spender, uint256 amount) returns (bool)"
        ];
        const usdcContract = new ethers.Contract(ARC_USDC_ADDRESS, erc20ABI, signer);
        const aaaContract = new ethers.Contract(USER_CUSTOM_TOKEN_ADDRESS, erc20ABI, signer);

        // USDC Approve Kontrolü (Ethers v6 BigInt karşılaştırma)
        const allowanceUSDC = await usdcContract.allowance(account, SAKASENA_POOL_ADDRESS);
        if (allowanceUSDC < usdcParsed) {
          alert("Lütfen USDC harcama yetkisini onaylayın.");
          const txApp = await usdcContract.approve(SAKASENA_POOL_ADDRESS, usdcParsed);
          await txApp.wait();
        }

        // AAA Approve Kontrolü (Ethers v6 BigInt karşılaştırma)
        const allowanceAAA = await aaaContract.allowance(account, SAKASENA_POOL_ADDRESS);
        if (allowanceAAA < aaaParsed) {
          alert(`Lütfen ${tokens.MYTOKEN.symbol} harcama yetkisini onaylayın.`);
          const txApp = await aaaContract.approve(SAKASENA_POOL_ADDRESS, aaaParsed);
          await txApp.wait();
        }

        // Havuza Likidite Ekleme Çağrısı
        const poolABI = ["function addLiquidity(uint256 amountUSDC, uint256 amountAAA) external returns (uint256)"];
        const poolContract = new ethers.Contract(SAKASENA_POOL_ADDRESS, poolABI, signer);
        
        const lpTx = await poolContract.addLiquidity(usdcParsed, aaaParsed);
        alert(`Likidite ekleme işlemi gönderildi! Tx: ${lpTx.hash}`);
        await lpTx.wait();
        
        alert("Likidite başarıyla eklendi!");
        setSpPoints(prev => prev + 150);
        setLpUSDC("");
        setLpAAA("");
        await fetchBalances();
        await fetchPoolReserves();
      }

    } catch (err) {
      console.error(err);
      alert(`İşlem sırasında bir hata oluştu: ${err.reason || err.message || err}`);
    }
    setTxLoading(false);
  };

  const handleFaucet = async () => {
    setFaucetLoading(true);
    setTimeout(() => {
      setBalances(prev => ({
        ...prev,
        USDC: (parseFloat(prev.USDC) + 10000).toFixed(2),
        EURC: (parseFloat(prev.EURC) + 10000).toFixed(2),
        cirBTC: (parseFloat(prev.cirBTC) + 1.5).toFixed(4),
        MYTOKEN: (parseFloat(prev.MYTOKEN) + 500).toFixed(2),
        USDT: (parseFloat(prev.USDT) + 10000).toFixed(2),
        DAI: (parseFloat(prev.DAI) + 10000).toFixed(2)
      }));
      setSpPoints(prev => prev + 100);
      setFaucetLoading(false);
      alert("Testnet Tokenleri başarıyla tanımlandı!");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <header className="border-b border-gray-800 bg-[#0d0b1a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            ArcSakasena
          </span>
          <span className="text-xs bg-indigo-900 text-indigo-200 px-2.5 py-0.5 rounded-full font-semibold">
            Arc Chain L1
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          {account && (
            <div className="hidden md:flex items-center space-x-2 bg-gray-900 px-3 py-1.5 rounded-lg text-sm border border-gray-800">
              <span className="text-violet-400 font-bold">💎 {spPoints} SP</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-300">Gas (USDC): {balances.USDC}</span>
            </div>
          )}
          {account ? (
            <button 
              onClick={checkAndSwitchNetwork}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                chainId === ARC_CHAIN_ID 
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800" 
                  : "bg-rose-950 text-rose-400 border border-rose-800 animate-pulse"
              }`}
            >
              {chainId === ARC_CHAIN_ID ? "Arc Testnet Connected" : "Switch to Arc Testnet"}
            </button>
          ) : (
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg transition"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-10">
        
        {account && chainId === ARC_CHAIN_ID && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 to-[#121024] border border-violet-800 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Deployed Contract</span>
                <h3 className="text-lg font-bold text-white mt-1">⭐ {tokens.MYTOKEN.name}</h3>
                <p className="text-[10px] text-gray-500 truncate max-w-[180px] mt-0.5">{USER_CUSTOM_TOKEN_ADDRESS}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 font-medium">Balance</span>
                <p className="text-xl font-bold text-violet-300 mt-1">{balances.MYTOKEN} {tokens.MYTOKEN.symbol}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 to-[#121024] border border-violet-800 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">anaraydinli Utility</span>
                <h3 className="text-lg font-bold text-white mt-1">🚀 {tokens.AAA.name}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Volatile Asset • Price: $5.40</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 font-medium">Balance</span>
                <p className="text-xl font-bold text-violet-300 mt-1">{balances.AAA} {tokens.AAA.symbol}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#121024] p-4 rounded-2xl border border-gray-800 text-center">
            <p className="text-xs text-gray-400 mb-1">Total Value Locked</p>
            <p className="text-lg font-bold text-white">$24,841,509</p>
          </div>
          <div className="bg-[#121024] p-4 rounded-2xl border border-gray-800 text-center">
            <p className="text-xs text-gray-400 mb-1">24h Swap Volume</p>
            <p className="text-lg font-bold text-white">$3,109,425</p>
          </div>
          <div className="bg-[#121024] p-4 rounded-2xl border border-gray-800 text-center">
            <p className="text-xs text-gray-400 mb-1">Pool Reserves (USDC)</p>
            <p className="text-lg font-bold text-emerald-400">{poolReserves.USDC} USDC</p>
          </div>
          <div className="bg-[#121024] p-4 rounded-2xl border border-gray-800 text-center">
            <p className="text-xs text-gray-400 mb-1">Pool Reserves (AAA)</p>
            <p className="text-lg font-bold text-indigo-300">{poolReserves.AAA} {tokens.MYTOKEN.symbol}</p>
          </div>
        </div>

        <div className="flex space-x-1 bg-[#100e1f] p-1 rounded-xl mb-6 max-w-xs mx-auto border border-gray-800">
          {["swap", "pool", "faucet"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition ${
                activeTab === tab 
                  ? "bg-violet-900 text-white shadow" 
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab === "pool" ? "Liquidity Pools" : tab}
            </button>
          ))}
        </div>

        <div className="max-w-md mx-auto bg-[#13112a] rounded-3xl p-6 border border-gray-800 neon-glow">
          {activeTab === "swap" && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                <span>Multi-Asset Swap</span>
                <span className="text-xs text-violet-400 bg-violet-950 px-2 py-1 rounded">Dynamic Price DEX</span>
              </h2>

              <div className="bg-[#1a1738] p-4 rounded-2xl mb-3 border border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400 font-medium">From</span>
                  <span className="text-xs text-gray-400">Balance: {balances[fromToken]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <input 
                    type="number" 
                    placeholder="0.0" 
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    className="bg-transparent text-2xl font-bold focus:outline-none w-2/3 text-white"
                  />
                  <select 
                    value={fromToken} 
                    onChange={(e) => {
                      setFromToken(e.target.value);
                      if(e.target.value === toToken) setToToken(Object.keys(tokens).find(t => t !== e.target.value));
                    }}
                    className="bg-[#211e47] text-white px-3 py-1.5 rounded-xl font-semibold border border-gray-700 focus:outline-none"
                  >
                    {Object.keys(tokens).map(t => (
                      <option key={t} value={t}>{tokens[t].icon} {tokens[t].symbol}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center my-2">
                <button 
                  onClick={() => {
                    const temp = fromToken;
                    setFromToken(toToken);
                    setToToken(temp);
                  }}
                  className="bg-[#211e47] p-2.5 rounded-full hover:bg-violet-900 transition border border-gray-700"
                >
                  ⬇️
                </button>
              </div>

              <div className="bg-[#1a1738] p-4 rounded-2xl mb-4 border border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400 font-medium">To (Estimated)</span>
                  <span className="text-xs text-gray-400">Balance: {balances[toToken]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <input 
                    type="text" 
                    placeholder="0.0" 
                    value={amountOut}
                    disabled
                    className="bg-transparent text-2xl font-bold focus:outline-none w-2/3 text-white"
                  />
                  <select 
                    value={toToken} 
                    onChange={(e) => {
                      setToToken(e.target.value);
                      if(e.target.value === fromToken) setFromToken(Object.keys(tokens).find(t => t !== e.target.value));
                    }}
                    className="bg-[#211e47] text-white px-3 py-1.5 rounded-xl font-semibold border border-gray-700 focus:outline-none"
                  >
                    {Object.keys(tokens).map(t => (
                      <option key={t} value={t}>{tokens[t].icon} {tokens[t].symbol}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 mb-6 text-sm text-gray-400 bg-[#100e21] p-3 rounded-xl border border-gray-900">
                <div className="flex justify-between">
                  <span>Exchange Rate:</span>
                  <span className="text-white">
                    1 {tokens[fromToken].symbol} ≈ {TOKEN_PRICES[fromToken] && TOKEN_PRICES[toToken] ? (TOKEN_PRICES[fromToken] / TOKEN_PRICES[toToken]).toFixed(4) : "0.999"} {tokens[toToken].symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Price Slippage:</span>
                  <span className="text-violet-400 font-medium">Dynamic vAMM (Uniswap V2)</span>
                </div>
                <div className="flex justify-between">
                  <span>Swap Fee (0.3%):</span>
                  <span className="text-white">{amountIn ? (parseFloat(amountIn) * 0.003).toFixed(4) : "0.00"} {tokens[fromToken].symbol}</span>
                </div>
              </div>

              {account ? (
                <button 
                  onClick={() => handleAction("swap")}
                  disabled={!amountIn || txLoading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold transition shadow-lg text-white disabled:opacity-50"
                >
                  {txLoading ? "İşlem Gönderiliyor..." : "Swap Varlıklar"}
                </button>
              ) : (
                <button 
                  onClick={connectWallet}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-white transition shadow-lg"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          )}

          {activeTab === "pool" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Liquidity Provision</h2>
              <p className="text-sm text-gray-400 mb-6">
                Havuzunuza doğrudan on-chain likidite ekleyin ve işlem ücretlerinden pay kazanın.
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-[#1a1738] p-4 rounded-2xl border border-gray-800">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Add USDC</span>
                    <span>Balance: {balances.USDC}</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="USDC Miktarı" 
                    value={lpUSDC}
                    onChange={(e) => setLpUSDC(e.target.value)}
                    className="bg-transparent text-xl font-bold focus:outline-none w-full text-white"
                  />
                </div>

                <div className="bg-[#1a1738] p-4 rounded-2xl border border-gray-800">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Add {tokens.MYTOKEN.symbol} (AAA)</span>
                    <span>Balance: {balances.MYTOKEN}</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder={`${tokens.MYTOKEN.symbol} Miktarı`}
                    value={lpAAA}
                    onChange={(e) => setLpAAA(e.target.value)}
                    className="bg-transparent text-xl font-bold focus:outline-none w-full text-white"
                  />
                </div>
              </div>

              {account ? (
                <button 
                  onClick={() => handleAction("add_lp")}
                  disabled={txLoading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-white transition shadow-lg disabled:opacity-50"
                >
                  {txLoading ? "İşlem Gönderiliyor..." : "Likidite Ekle (Add Liquidity)"}
                </button>
              ) : (
                <button 
                  onClick={connectWallet}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-white transition"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          )}

          {activeTab === "faucet" && (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-3">Arc Testnet Faucet</h2>
              <p className="text-sm text-gray-400 mb-6">
                Arc Test ağı üzerinde platformumuzu denemek için tamamen ücretsiz stablecoin ve test varlıkları talep edebilirsiniz.
              </p>
              
              <div className="bg-[#100e21] p-4 rounded-2xl border border-gray-900 text-left mb-6">
                <span className="text-xs text-gray-500 font-semibold block mb-2">CLAIMABLE ASSETS</span>
                <div className="space-y-1.5 text-sm text-gray-300">
                  <div className="flex justify-between"><span>💵 10,000 USDC</span><span className="text-emerald-400 font-medium">Ready</span></div>
                  <div className="flex justify-between"><span>💶 10,000 EURC</span><span className="text-emerald-400 font-medium">Ready</span></div>
                  <div className="flex justify-between"><span>₿ 1.5 cirBTC</span><span className="text-emerald-400 font-medium">Ready</span></div>
                  <div className="flex justify-between"><span>🚀 250 {tokens.MYTOKEN.symbol}</span><span className="text-emerald-400 font-medium">Ready</span></div>
                  <div className="flex justify-between"><span>🟢 10,000 USDT</span><span className="text-emerald-400 font-medium">Ready</span></div>
                  <div className="flex justify-between"><span>🟡 10,000 DAI</span><span className="text-emerald-400 font-medium">Ready</span></div>
                </div>
              </div>

              <button 
                onClick={handleFaucet}
                disabled={faucetLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-white transition shadow-lg disabled:opacity-50"
              >
                {faucetLoading ? "Claiming..." : "Claim Testnet Tokens"}
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-800 bg-[#0d0b1a] px-6 py-4 text-center text-sm text-gray-500">
        <p>© 2026 ArcSakasena. Powered by Arc Network (Chain ID: 5042002).</p>
      </footer>
    </div>
  );
}
