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
  // Sizin Tokeniniz (Bilgiler on-chain yüklendikçe güncellenecektir)
  MYTOKEN: {
    symbol: "Loading...",
    name: "Your Deployed Token",
    decimals: 18, // Geçici varsayılan, on-chain güncellenir
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
  
  // Token listesini ve bakiyeleri state'e alıyoruz
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [balances, setBalances] = useState({ USDC: "0.00", EURC: "0.00", cirBTC: "0.0000", USDS: "0.00", MYTOKEN: "0.00", USDT: "0.00", DAI: "0.00" });
  
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("MYTOKEN");
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

  // Cüzdan bağlandığında verileri sırasıyla yükle
  useEffect(() => {
    if (account && chainId === ARC_CHAIN_ID && provider) {
      const loadAllData = async () => {
        await loadCustomTokenDetails();
        await fetchBalances();
      };
      loadAllData();
    }
  }, [account, chainId, provider]);

  useEffect(() => {
    if (!amountIn || isNaN(amountIn)) {
      setAmountOut("");
      return;
    }
    const fee = parseFloat(amountIn) * 0.001;
    setAmountOut((parseFloat(amountIn) - fee).toFixed(4));
  }, [amountIn, fromToken, toToken]);

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

  // Sizin tokeninizin on-chain bilgilerini dinamik olarak çeken fonksiyon
  const loadCustomTokenDetails = async () => {
    if (!provider) return;
    try {
      const tokenABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
      ];
      const contract = new ethers.Contract(USER_CUSTOM_TOKEN_ADDRESS, tokenABI, provider);
      
      // Paralel olarak isim, sembol ve ondalık değerlerini çekiyoruz
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

  // Bakiyeleri güncelleyen fonksiyon
  const fetchBalances = async () => {
    if (!provider || !account) return;
    try {
      const minABI = ["function balanceOf(address owner) view returns (uint256)"];
      const newBalances = {};

      for (const key of Object.keys(tokens)) {
        const token = tokens[key];
        if (token.address) {
          try {
            const contract = new ethers.Contract(token.address, minABI, provider);
            const raw = await contract.balanceOf(account);
            const formatted = parseFloat(ethers.utils.formatUnits(raw, token.decimals));
            // cirBTC için 4 hane, diğerleri için 2 hane göster
            const decimalsToShow = token.symbol === "cirBTC" ? 4 : 2;
            newBalances[key] = formatted.toFixed(decimalsToShow);
          } catch (err) {
            console.warn(`${key} bakiye okuma hatası:`, err);
            newBalances[key] = "0.00";
          }
        } else {
          // USDT ve DAI simüle kalmaya devam eder
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
    try {
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.utils.parseUnits("0", 6)
      });
      alert(`İşlem Gönderildi: ${tx.hash}`);
      await tx.wait();
      alert("İşlem Onaylandı!");
      setSpPoints(prev => prev + 50);
      fetchBalances();
    } catch (err) {
      console.error(err);
      alert("İşlem başarısız oldu veya reddedildi.");
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
        MYTOKEN: (parseFloat(prev.MYTOKEN) + 500).toFixed(2), // Faucet'tan sizin tokeninizden de 500 adet ekleme simülasyonu
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
        
        {/* Sizin Token Bilgilendirme Kartı */}
        {account && chainId === ARC_CHAIN_ID && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-950 to-[#121024] border border-violet-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Connected Contract Details</span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
                ⭐ {tokens.MYTOKEN.name} ({tokens.MYTOKEN.symbol})
              </h3>
              <p className="text-xs text-gray-400 mt-1 break-all">Address: {USER_CUSTOM_TOKEN_ADDRESS}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400">Your Token Balance</span>
              <p className="text-xl font-bold text-violet-300 mt-1">{balances.MYTOKEN} {tokens.MYTOKEN.symbol}</p>
              <span className="text-[10px] bg-violet-900/40 text-violet-300 px-2 py-0.5 rounded-full mt-1 inline-block border border-violet-800">
                1300+ Holders on Arcscan
              </span>
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
                <span>Zero-Slippage Swap</span>
                <span className="text-xs text-emerald-400 bg-emerald-950 px-2 py-1 rounded">Constant-Sum AMM</span>
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
                  <span>Rate:</span>
                  <span className="text-white">1 {tokens[fromToken].symbol} ≈ 0.999 {tokens[toToken].symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price Impact / Slippage:</span>
                  <span className="text-emerald-400 font-medium">0.00% (Locked Peg)</span>
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
                  Swap Tokens
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
