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

// Vercel / .env üzerinden çekilecek Sakasena Havuz (DEX) Sözleşme Adresi
const SAKASENA_POOL_ADDRESS = import.meta.env.VITE_SAKASENA_POOL_ADDRESS || "0x0000000000000000000000000000000000000000";

// Simüle Edilmiş Piyasa Fiyatları (Volatil ve Stabil hesaplamalar için)
const TOKEN_PRICES = {
  USDC: 1.00,
  EURC: 1.08,
  cirBTC: 67450.00,  // Bitcoin fiyatı
  USDS: 1.00,
  AAA: 5.40,         // anaraydinli AAA volatil token fiyatı ($5.40)
  MYTOKEN: 0.15,     // Sizin diğer tokeninizin fiyatı
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
  // anaraydinli AAA Token (Volatil / Stabil Olmayan)
  AAA: {
    symbol: "AAA",
    name: "anaraydinli AAA Token",
    decimals: 18,
    icon: "🚀",
    address: import.meta.env.VITE_AAA_ADDRESS || "0x0000000000000000000000000000000000000000"
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
  const [activeTab, setActiveTab] = useState("swap");
  
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [balances, setBalances] = useState({ USDC: "0.00", EURC: "0.00", cirBTC: "0.0000", USDS: "0.00", AAA: "0.00", MYTOKEN: "0.00", USDT: "0.00", DAI: "0.00" });
  
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("AAA");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [spPoints, setSpPoints] = useState(1250);
  const [faucetLoading, setFaucetLoading] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
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
      };
      loadAllData();
    }
  }, [account, chainId, provider]);

  // Dinamik Fiyatlama ve Swap Çıktısı Hesaplama Modülü
  useEffect(() => {
    if (!amountIn || isNaN(amountIn)) {
      setAmountOut("");
      return;
    }
    
    // Seçilen tokenlerin USD karşılıklarını alıyoruz
    const priceIn = TOKEN_PRICES[fromToken] || 1.00;
    const priceOut = TOKEN_PRICES[toToken] || 1.00;

    // Fiyat oranına göre çıktı miktarını hesapla
    const rawAmountOut = (parseFloat(amountIn) * priceIn) / priceOut;
    const fee = rawAmountOut * 0.001; // %0.1 Swap ücreti
    
    // cirBTC gibi yüksek değerli/düşük ondalıklı varlıklar için daha detaylı gösterim yap
    const decimalsToShow = tokens[toToken].decimals === 8 ? 6 : 4;
    setAmountOut((rawAmountOut - fee).toFixed(decimalsToShow));
  }, [amountIn, fromToken, toToken, tokens]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Lütfen MetaMask kurun.");
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
          decimals: decimals
        };
        return updated;
      });
    } catch (err) {
      console.warn("Kullanıcı token detayları okunamadı, varsayılanlar kullanılacak:", err);
    }
  };

  const fetchBalances = async () => {
    if (!provider || !account) return;
    try {
      const minABI = ["function balanceOf(address owner) view returns (uint256)"];
      const newBalances = {};

      for (const key of Object.keys(tokens)) {
        const token = tokens[key];
        if (token.address && token.address !== ethers.constants.AddressZero) {
          try {
            const contract = new ethers.Contract(token.address, minABI, provider);
            const raw = await contract.balanceOf(account);
            const formatted = parseFloat(ethers.utils.formatUnits(raw, token.decimals));
            const decimalsToShow = token.symbol === "cirBTC" ? 4 : 2;
            newBalances[key] = formatted.toFixed(decimalsToShow);
          } catch (err) {
            console.warn(`${key} bakiye okuma hatası:`, err);
            newBalances[key] = "0.00";
          }
        } else {
          newBalances[key] = (Math.random() * 300 + 50).toFixed(2);
        }
      }

      setBalances(newBalances);
    } catch (err) {
      console.error("Bakiyeler yüklenirken genel hata oluştu:", err);
    }
  };

  const handleAction = async (type) => {
    if (chainId !== ARC_CHAIN_ID) {
      await checkAndSwitchNetwork();
      return;
    }

    if (!SAKASENA_POOL_ADDRESS || SAKASENA_POOL_ADDRESS === "0x0000000000000000000000000000000000000000") {
      alert("Lütfen projenize VITE_SAKASENA_POOL_ADDRESS (Sakasena Havuz/Swap Sözleşme Adresi) tanımlayın. Havuz adresi olmadan gerçek zincir üstü işlem gönderilemez.");
      return;
    }

    try {
      const signer = provider.getSigner();

      if (type === "swap") {
        const tokenInObj = tokens[fromToken];
        const tokenOutObj = tokens[toToken];

        if (!tokenInObj.address || tokenInObj.address === ethers.constants.AddressZero) {
          alert("Lütfen on-chain adresi tanımlı, gerçek bir token seçin.");
          return;
        }

        const amountInParsed = ethers.utils.parseUnits(amountIn, tokenInObj.decimals);

        // 1. ADIM: ERC-20 Harcama Onayı (Approve) Kontrolü
        const erc20ABI = [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function approve(address spender, uint256 amount) returns (bool)"
        ];
        const tokenInContract = new ethers.Contract(tokenInObj.address, erc20ABI, signer);

        const currentAllowance = await tokenInContract.allowance(account, SAKASENA_POOL_ADDRESS);
        
        if (currentAllowance.lt(amountInParsed)) {
          alert(`Lütfen önce ${tokenInObj.symbol} harcama yetkisini (Approve) onaylayın.`);
          const approveTx = await tokenInContract.approve(SAKASENA_POOL_ADDRESS, amountInParsed);
          await approveTx.wait();
          alert("Harcama yetkisi onaylandı. Şimdi Swap işlemi gönderiliyor.");
        }

        // 2. ADIM: Sakasena Havuz Sözleşmesindeki swap fonksiyonunu çağırıyoruz
        const poolABI = [
          "function swap(address tokenIn, uint256 amountIn) external"
        ];
        const poolContract = new ethers.Contract(SAKASENA_POOL_ADDRESS, poolABI, signer);
        
        const swapTx = await poolContract.swap(tokenInObj.address, amountInParsed);
        alert(`Swap işlemi Arc Network'e gönderildi! Tx: ${swapTx.hash}`);
        await swapTx.wait();
        
        alert("Swap işlemi zincir üstünde başarıyla onaylandı!");
        setSpPoints(prev => prev + 50);
        fetchBalances();
      }

      if (type === "mint") {
        const usdcObj = tokens.USDC;
        const amountInParsed = ethers.utils.parseUnits(amountIn, usdcObj.decimals);

        const erc20ABI = [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function approve(address spender, uint256 amount) returns (bool)"
        ];
        const usdcContract = new ethers.Contract(usdcObj.address, erc20ABI, signer);

        const currentAllowance = await usdcContract.allowance(account, SAKASENA_POOL_ADDRESS);
        if (currentAllowance.lt(amountInParsed)) {
          alert("Lütfen USDC harcama yetkisini onaylayın.");
          const approveTx = await usdcContract.approve(SAKASENA_POOL_ADDRESS, amountInParsed);
          await approveTx.wait();
        }

        const poolABI = [
          "function mintUSDS(uint256 usdcAmount) external"
        ];
        const poolContract = new ethers.Contract(SAKASENA_POOL_ADDRESS, poolABI, signer);
        
        const mintTx = await poolContract.mintUSDS(amountInParsed);
        alert(`Mint işlemi gönderildi! Tx: ${mintTx.hash}`);
        await mintTx.wait();
        
        alert("Mint başarıyla gerçekleşti!");
        setSpPoints(prev => prev + 100);
        fetchBalances();
      }

      if (type === "redeem") {
        const usdsObj = tokens.USDS;
        const amountInParsed = ethers.utils.parseUnits(amountIn, usdsObj.decimals);

        const poolABI = [
          "function redeemUSDZ(uint256 usdzAmount) external"
        ];
        const poolContract = new ethers.Contract(SAKASENA_POOL_ADDRESS, poolABI, signer);
        
        const redeemTx = await poolContract.redeemUSDZ(amountInParsed);
        alert(`Redeem işlemi gönderildi! Tx: ${redeemTx.hash}`);
        await redeemTx.wait();
        
        alert("Redeem başarıyla gerçekleşti!");
        setSpPoints(prev => prev + 100);
        fetchBalances();
      }

    } catch (err) {
      console.error(err);
      alert(`İşlem sırasında bir hata oluştu: ${err.reason || err.message || err}`);
    }
  };

  const handleFaucet = async () => {
    setFaucetLoading(true);
    setTimeout(() => {
      setBalances(prev => ({
        ...prev,
        USDC: (parseFloat(prev.USDC) + 10000).toFixed(2),
        EURC: (parseFloat(prev.EURC) + 10000).toFixed(2),
        cirBTC: (parseFloat(prev.cirBTC) + 1.5).toFixed(4),
        AAA: (parseFloat(prev.AAA) + 250).toFixed(2),  // Faucet'tan 250 AAA tanımlama simülasyonu
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
            {/* Sizin Token Kartı 1 */}
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

            {/* Sizin Token Kartı 2 (anaraydinli AAA) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 to-[#121024] border border-violet-800 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">anaraydinli Utility</span>
                <h3 className="text-lg font-bold text-white mt-1">🚀 {tokens.AAA.name}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Volatile Asset • Price: ${TOKEN_PRICES.AAA.toFixed(2)}</p>
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
            <p className="text-xs text-gray-400 mb-1">USDS/USDC Pool APR</p>
            <p className="text-lg font-bold text-emerald-400">8.40%</p>
          </div>
          <div className="bg-[#121024] p-4 rounded-2xl border border-gray-800 text-center">
            <p className="text-xs text-gray-400 mb-1">Network Native Gas</p>
            <p className="text-lg font-bold text-indigo-300">USDC (6 Decimals)</p>
          </div>
        </div>

        <div className="flex space-x-1 bg-[#100e1f] p-1 rounded-xl mb-6 max-w-md mx-auto border border-gray-800">
          {["swap", "mint", "pool", "faucet"].map((tab) => (
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
                    1 {tokens[fromToken].symbol} ≈ {((TOKEN_PRICES[fromToken] || 1.0) / (TOKEN_PRICES[toToken] || 1.0)).toFixed(4)} {tokens[toToken].symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Price Slippage:</span>
                  <span className={TOKEN_PRICES[fromToken] === 1 && TOKEN_PRICES[toToken] === 1 ? "text-emerald-400 font-medium" : "text-violet-400 font-medium"}>
                    {TOKEN_PRICES[fromToken] === 1 && TOKEN_PRICES[toToken] === 1 ? "0.00% (Locked Peg)" : "Dynamic vAMM"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Swap Fee (0.1%):</span>
                  <span className="text-white">{amountIn ? (parseFloat(amountIn) * 0.001).toFixed(4) : "0.00"} {tokens[fromToken].symbol}</span>
                </div>
              </div>

              {account ? (
                <button 
                  onClick={() => handleAction("swap")}
                  disabled={!amountIn}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold transition shadow-lg text-white disabled:opacity-50"
                >
                  Swap Varlıklar
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

          {activeTab === "mint" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Mint & Redeem USDS</h2>
              <p className="text-sm text-gray-400 mb-6">
                Mevcut stablecoinlerinizi (USDC, USDT, DAI) kilitleyerek 1:1 oranında ekosistemin ana stabil kripto parası <strong>USDS</strong> basabilir veya geri dönüştürebilirsiniz.
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-[#1a1738] p-4 rounded-2xl border border-gray-800">
                  <label className="block text-xs text-gray-400 mb-2">Mint USDS (Lock USDC)</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      placeholder="USDC Amount" 
                      className="bg-transparent text-xl font-bold focus:outline-none w-full text-white"
                    />
                    <button 
                      onClick={() => handleAction("mint")}
                      className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl text-sm font-semibold transition text-white"
                    >
                      Mint
                    </button>
                  </div>
                </div>

                <div className="bg-[#1a1738] p-4 rounded-2xl border border-gray-800">
                  <label className="block text-xs text-gray-400 mb-2">Redeem USDS (Claim USDC)</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      placeholder="USDS Amount" 
                      className="bg-transparent text-xl font-bold focus:outline-none w-full text-white"
                    />
                    <button 
                      onClick={() => handleAction("redeem")}
                      className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-semibold transition text-white"
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pool" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Liquidity Pools</h2>
              <p className="text-sm text-gray-400 mb-6">
                Bölümlere likidite sağlayarak işlem ücretlerinden sürdürülebilir bir gelir elde edin.
              </p>

              <div className="space-y-4">
                <div className="bg-[#1a1738] p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">💵 🌀</span>
                      <span className="font-bold">USDC / USDS</span>
                    </div>
                    <span className="text-xs text-gray-400">TVL: $12.3M | APR: 8.4%</span>
                  </div>
                  <button 
                    onClick={() => handleAction("add_lp")}
                    className="bg-violet-900 hover:bg-violet-800 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition text-white"
                  >
                    Add Liquidity
                  </button>
                </div>

                <div className="bg-[#1a1738] p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🟢 🌀</span>
                      <span className="font-bold">USDT / USDS</span>
                    </div>
                    <span className="text-xs text-gray-400">TVL: $9.5M | APR: 9.1%</span>
                  </div>
                  <button 
                    onClick={() => handleAction("add_lp")}
                    className="bg-violet-900 hover:bg-violet-800 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition text-white"
                  >
                    Add Liquidity
                  </button>
                </div>
              </div>
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
                  <div className="flex justify-between"><span>🚀 250 {tokens.AAA.symbol}</span><span className="text-emerald-400 font-medium">Ready</span></div>
                  <div className="flex justify-between"><span>⭐ 500 {tokens.MYTOKEN.symbol}</span><span className="text-emerald-400 font-medium">Ready</span></div>
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
