import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Arc Network Testnet Bilgileri (Düzəldilmiş Rəsmi Chain ID)
const ARC_CHAIN_ID = 5042002; 
const ARC_CHAIN_HEX = "0x4cef52"; 
const ARC_RPC_URL = import.meta.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network";

// Resmi Sözleşme Adresleri
const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000".toLowerCase();
const ARC_EURC_ADDRESS = "0x89b50855aa3be2f677cd6303cec089b5f319d72a".toLowerCase();
const ARC_CIRBTC_ADDRESS = "0xf0c4a4ce82a5746abaad9425360ab04fbba432bf".toLowerCase();
const ARC_USDT_ADDRESS = "0x175cdb1d338945f0d851a741ccf787d343e57952".toLowerCase(); 

// Sizin Deploy Ettiğiniz Sözleşme Adresi
const USER_CUSTOM_TOKEN_ADDRESS = "0x54552f2ec52423d2fbe94c25f0bad61b9108aae8".toLowerCase();

// Havuz Sözleşme Adresleri (USDC, EURC ve BTC Havuzlarınız)
const SAKASENA_USDC_POOL_ADDRESS = (import.meta.env.VITE_SAKASENA_USDC_POOL_ADDRESS || "0xbe0f19f85a5cd1cac56e6f31c85f6cae805e56c3").toLowerCase();
const SAKASENA_EURC_POOL_ADDRESS = (import.meta.env.VITE_SAKASENA_EURC_POOL_ADDRESS || "0xbbc6cd33291edfe9e4e927129901db0e58ba705b").toLowerCase();
const SAKASENA_BTC_POOL_ADDRESS = (import.meta.env.VITE_SAKASENA_BTC_POOL_ADDRESS || "0x1815df186c43506e7d9113e6c1d19326610aa448").toLowerCase();

// Sizin Deploy Ettiğiniz sakUSD Sözleşme Adresleri (Minter ve Token)
const SAKUSD_MINTER_ADDRESS = (import.meta.env.VITE_SAKUSD_MINTER_ADDRESS || "0x1e27b23bc7662db4accf371b96b14ea5d81e0f83").toLowerCase();
const SAKUSD_TOKEN_ADDRESS = (import.meta.env.VITE_SAKUSD_TOKEN_ADDRESS || "0x085bc2b26d637685d2d3b742f10d14d8d77557b1").toLowerCase();

// Kur Oranları
const TOKEN_PRICES = {
  USDC: 1.00,
  EURC: 1.08,
  cirBTC: 67450.00,
  WUSDC: 1.00, 
  sakUSD: 1.00, 
  AAA: 5.40,
  USDT: 1.00,
  DAI: 1.00
};

// ETHERS V5 VE V6 ÇİFT SÜRÜM UYUMLULUK KATMANI
const isV6 = typeof ethers.BrowserProvider !== 'undefined';

const getProviderInstance = () => {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  return isV6 
    ? new ethers.BrowserProvider(window.ethereum) 
    : new ethers.providers.Web3Provider(window.ethereum);
};

const ZERO_ADDRESS = isV6 
  ? ethers.ZeroAddress 
  : (ethers.constants ? ethers.constants.AddressZero : "0x0000000000000000000000000000000000000000");

const formatUnits = (value, decimals) => {
  return isV6 
    ? ethers.formatUnits(value, decimals) 
    : ethers.utils.formatUnits(value, decimals);
};

const parseUnits = (value, decimals) => {
  return isV6 
    ? ethers.parseUnits(value, decimals) 
    : ethers.utils.parseUnits(value, decimals);
};

const getSignerInstance = async (providerInstance) => {
  return isV6 
    ? await providerInstance.getSigner() 
    : providerInstance.getSigner();
};

const isLessThan = (a, b) => {
  return BigInt(a.toString()) < BigInt(b.toString());
};

const getDecimalsByAddress = (addr) => {
  const a = addr.toLowerCase();
  if (a === ARC_USDC_ADDRESS.toLowerCase() || a === ARC_EURC_ADDRESS.toLowerCase() || a === ARC_USDT_ADDRESS.toLowerCase()) return 6;
  if (a === ARC_CIRBTC_ADDRESS.toLowerCase()) return 8; 
  return 18; 
};

// DÜZƏLDİLMİŞ dinamik havuz yönləndirici router funksiyası (Swap xətası burada düzəldilib)
const getPoolAddress = (token1, token2) => {
  const t1 = token1.toLowerCase();
  const t2 = token2.toLowerCase();
  
  // Havuzlar yalnız [Stable/BTC] / AAA şəklində mövcuddur. 
  // Buna görə də tərəflərdən biri mütləq AAA (USER_CUSTOM_TOKEN_ADDRESS) olmalıdır.
  const hasAAA = t1 === "aaa" || t2 === "aaa";
  if (!hasAAA) {
    return ZERO_ADDRESS; 
  }

  const otherToken = t1 === "aaa" ? t2 : t1;

  if (otherToken === "usdc") return SAKASENA_USDC_POOL_ADDRESS;
  if (otherToken === "eurc") return SAKASENA_EURC_POOL_ADDRESS;
  if (otherToken === "cirbtc") return SAKASENA_BTC_POOL_ADDRESS;
  
  return ZERO_ADDRESS;
};

// ERC20 Minimal ABI
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// Başlangıç Token Listesi
const INITIAL_TOKENS = {
  USDC: { symbol: "USDC", name: "USD Coin (Gas Token)", decimals: 6, icon: "💵", address: ARC_USDC_ADDRESS },
  EURC: { symbol: "EURC", name: "Euro Coin", decimals: 6, icon: "💶", address: ARC_EURC_ADDRESS },
  cirBTC: { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", decimals: 8, icon: "₿", address: ARC_CIRBTC_ADDRESS },
  sakUSD: { symbol: "sakUSD", name: "Sakasena USD", decimals: 18, icon: "💴", address: SAKUSD_TOKEN_ADDRESS },
  WUSDC: { symbol: "WUSDC", name: "Wrapped USDC", decimals: 18, icon: "💸", address: "0x911b4000d3422f482f4062a913885f7b035382df" },
  AAA: { symbol: "AAA", name: "anaraydinli AAA Token", decimals: 18, icon: "🪙", address: USER_CUSTOM_TOKEN_ADDRESS },
  USDT: { symbol: "USDT", name: "Tether USD", decimals: 6, icon: "💲", address: ARC_USDT_ADDRESS }, 
  DAI: { symbol: "DAI", name: "Dai Stablecoin", decimals: 18, icon: "💷", address: "0x40e899d2acd26c5fbee2e1bda4523e7ded617589" }
};

export default function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [activeTab, setActiveTab] = useState("swap"); 
  const [activePoolType, setActivePoolType] = useState("USDC"); 
  
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [balances, setBalances] = useState({ USDC: "0.00", EURC: "0.00", cirBTC: "0.0000", sakUSD: "0.00", WUSDC: "0.00", AAA: "0.00", USDT: "0.00", DAI: "0.00" }); 
  
  // Allowance (Təvəkkül Limitləri) State-ləri
  const [swapAllowance, setSwapAllowance] = useState(0n);
  const [mintAllowance, setMintAllowance] = useState(0n);
  const [stakeAllowance, setStakeAllowance] = useState(0n);
  const [lpStableAllowance, setLpStableAllowance] = useState(0n);
  const [lpAaaAllowance, setLpAaaAllowance] = useState(0n);

  // Swap Form States
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("AAA"); 
  const [amountIn, setAmountIn] = useState("0");
  const [amountOut, setAmountOut] = useState("");

  // Liquidity Pool Form States
  const [lpUSDC, setLpUSDC] = useState("0");
  const [lpAAA, setLpAAA] = useState("0");
  const [poolReserves, setPoolReserves] = useState({ stableAmount: "0.00", aaaAmount: "0.00", stableSymbol: "USDC", totalShares: "0" });

  // Kullanıcının Havuzdaki Kişisel Rezerv Payları
  const [userPoolBalances, setUserPoolBalances] = useState({ stableAmount: "0.00", aaaAmount: "0.00", stableSymbol: "USDC" });

  // Mint / Redeem Form States
  const [mintCollateral, setMintCollateral] = useState("USDC");
  const [mintAmount, setMintAmount] = useState("0");
  const [redeemAmount, setRedeemAmount] = useState("0");

  // Savings (Staking) Form States
  const [stakeAmountInput, setStakeAmountInput] = useState("0");
  const [unstakeAmountInput, setUnstakeAmountInput] = useState("0");
  const [savingsData, setSavingsData] = useState({ staked: "0.00", pendingRewards: "0.00", requests: [] });

  // Send Token Form States
  const [sendToken, setSendToken] = useState("AAA"); 
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("0");

  const [spPoints, setSpPoints] = useState(1250);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = getProviderInstance();
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

  // Balansların və digər dataların sinxron şəkildə çəkilməsi
  useEffect(() => {
    if (account && chainId === ARC_CHAIN_ID && provider) {
      const loadAllData = async () => {
        await fetchBalances();
        await fetchPoolReserves();
        await fetchSavingsData();
        await fetchAllowances(); // Limitləri çəkirik
      };
      loadAllData();
    }
  }, [account, chainId, provider, fromToken, toToken, activePoolType, activeTab]); 

  // Dinamik Fiyatlama Hesaplama
  useEffect(() => {
    const calculateSwapOutput = async () => {
      if (!amountIn || isNaN(amountIn) || parseFloat(amountIn) <= 0) {
        setAmountOut("");
        return;
      }
      if (!provider || chainId !== ARC_CHAIN_ID) return;

      const activePool = getPoolAddress(fromToken, toToken);
      if (activePool === ZERO_ADDRESS) {
        setAmountOut("Havuz Bulunamadı");
        return;
      }

      try {
        const poolABI = ["function getAmountOut(address tokenIn, uint256 amountIn) view returns (uint256)"];
        const poolContract = new ethers.Contract(activePool, poolABI, provider);
        const tokenInAddress = tokens[fromToken].address;

        if (tokenInAddress && tokenInAddress !== ZERO_ADDRESS) { 
          const amountInParsed = parseUnits(amountIn, tokens[fromToken].decimals); 
          const rawAmountOut = await poolContract.getAmountOut(tokenInAddress, amountInParsed);
          const formattedAmountOut = formatUnits(rawAmountOut, tokens[toToken].decimals); 
          setAmountOut(parseFloat(formattedAmountOut).toFixed(tokens[toToken].decimals === 8 ? 6 : 4));
        } else {
          setAmountOut((parseFloat(amountIn) * 0.997).toFixed(4));
        }
      } catch (err) {
        console.warn("Fiyat hesaplanamadı:", err);
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

  // On-chain təsdiq limitlərini (allowance) çəkən funksiya
  const fetchAllowances = async () => {
    if (!provider || !account || chainId !== ARC_CHAIN_ID) return;
    try {
      // 1. Swap Limit
      const activeSwapPool = getPoolAddress(fromToken, toToken);
      if (activeSwapPool !== ZERO_ADDRESS && tokens[fromToken]?.address) {
        const contract = new ethers.Contract(tokens[fromToken].address, ERC20_ABI, provider);
        const allow = await contract.allowance(account, activeSwapPool);
        setSwapAllowance(BigInt(allow.toString()));
      }

      // 2. Mint Limit
      if (tokens[mintCollateral]?.address) {
        const contract = new ethers.Contract(tokens[mintCollateral].address, ERC20_ABI, provider);
        const allow = await contract.allowance(account, SAKUSD_MINTER_ADDRESS);
        setMintAllowance(BigInt(allow.toString()));
      }

      // 3. Stake Limit
      if (SAKUSD_TOKEN_ADDRESS !== ZERO_ADDRESS) {
        const contract = new ethers.Contract(SAKUSD_TOKEN_ADDRESS, ERC20_ABI, provider);
        const allow = await contract.allowance(account, SAKUSD_MINTER_ADDRESS);
        setStakeAllowance(BigInt(allow.toString()));
      }

      // 4. LP (Stable & AAA) Limitləri
      const activeLpPool = getPoolAddress(activePoolType, "AAA");
      if (activeLpPool !== ZERO_ADDRESS) {
        const stableSymbol = activePoolType; 
        const stableTokenAddress = stableSymbol === "USDC" 
          ? ARC_USDC_ADDRESS 
          : (stableSymbol === "EURC" ? ARC_EURC_ADDRESS : ARC_CIRBTC_ADDRESS);
        
        const stableContract = new ethers.Contract(stableTokenAddress, ERC20_ABI, provider);
        const aaaContract = new ethers.Contract(USER_CUSTOM_TOKEN_ADDRESS, ERC20_ABI, provider);

        const [allowStable, allowAaa] = await Promise.all([
          stableContract.allowance(account, activeLpPool),
          aaaContract.allowance(account, activeLpPool)
        ]);

        setLpStableAllowance(BigInt(allowStable.toString()));
        setLpAaaAllowance(BigInt(allowAaa.toString()));
      }
    } catch (err) {
      console.warn("Allowance limitleri sorgulanamadı:", err);
    }
  };

  const fetchBalances = async () => {
    if (!provider || !account) return;
    try {
      const minABI = ["function balanceOf(address owner) view returns (uint256)"];
      const newBalances = {};

      for (const key of Object.keys(tokens)) {
        const token = tokens[key];
        if (token.address && token.address !== ZERO_ADDRESS) { 
          try {
            const contract = new ethers.Contract(token.address, minABI, provider);
            const raw = await contract.balanceOf(account);
            const formatted = parseFloat(formatUnits(raw, token.decimals)); 
            const decimalsToShow = token.symbol === "cirBTC" ? 4 : 2;
            newBalances[key] = formatted.toFixed(decimalsToShow);
          } catch (err) {
            newBalances[key] = "0.00";
          }
        } else {
          newBalances[key] = "0.00";
        }
      }

      setBalances(newBalances);
    } catch (err) {
      console.error("Bakiyeler sorgulanırken hata oluştu:", err);
    }
  };

  const fetchPoolReserves = async () => {
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
        contract.tokenA(),
        contract.tokenB(),
        contract.reserveA(),
        contract.reserveB(),
        contract.totalShares(),
        contract.lpShares(account)
      ]);

      const decimalsA = getDecimalsByAddress(tA);
      const decimalsB = getDecimalsByAddress(tB);

      const formattedResA = parseFloat(formatUnits(resA, decimalsA)).toFixed(decimalsA === 8 ? 4 : 2);
      const formattedResB = parseFloat(formatUnits(resB, decimalsB)).toFixed(decimalsB === 8 ? 4 : 2);

      const isAStableOrBTC = decimalsA === 6 || decimalsA === 8;
      const stableSymbol = isAStableOrBTC ? tokens[Object.keys(tokens).find(k => tokens[k].address.toLowerCase() === tA.toLowerCase())]?.symbol || "Stable" : tokens[Object.keys(tokens).find(k => tokens[k].address.toLowerCase() === tB.toLowerCase())]?.symbol || "Stable";

      const uShares = BigInt(userShares.toString());
      const tShares = BigInt(shares.toString());
      const rA = BigInt(resA.toString());
      const rB = BigInt(resB.toString());

      let userStableAmount = "0.00";
      let userAaaAmount = "0.00";

      if (tShares > 0n && uShares > 0n) {
        const userShareA = (uShares * rA) / tShares;
        const userShareB = (uShares * rB) / tShares;
        
        userStableAmount = parseFloat(formatUnits(userShareA, decimalsA)).toFixed(decimalsA === 8 ? 4 : 2);
        userAaaAmount = parseFloat(formatUnits(userShareB, decimalsB)).toFixed(decimalsB === 8 ? 4 : 2);
      }

      setPoolReserves({
        stableAmount: isAStableOrBTC ? formattedResA : formattedResB,
        aaaAmount: isAStableOrBTC ? formattedResB : formattedResA,
        stableSymbol: stableSymbol,
        totalShares: shares.toString()
      });

      setUserPoolBalances({
        stableAmount: isAStableOrBTC ? userStableAmount : userAaaAmount,
        aaaAmount: isAStableOrBTC ? userAaaAmount : userStableAmount,
        stableSymbol: stableSymbol
      });

    } catch (err) {
      try {
        const oldABI = [
          "function reserveUSDC() view returns (uint256)",
          "function reserveAAA() view returns (uint256)",
          "function totalShares() view returns (uint256)",
          "function lpShares(address) view returns (uint256)"
        ];
        const oldContract = new ethers.Contract(activePool, oldABI, provider);
        const [resUSDC, resAAA, shares, userShares] = await Promise.all([
          oldContract.reserveUSDC(),
          oldContract.reserveAAA(),
          oldContract.totalShares(),
          oldContract.lpShares(account)
        ]);

        const uShares = BigInt(userShares.toString());
        const tShares = BigInt(shares.toString());
        const rUSDC = BigInt(resUSDC.toString());
        const rAAA = BigInt(resAAA.toString());

        let userStableAmount = "0.00";
        let userAaaAmount = "0.00";

        if (tShares > 0n && uShares > 0n) {
          const userShareUSDC = (uShares * rUSDC) / tShares;
          const userShareAAA = (uShares * rAAA) / tShares;
          
          userStableAmount = parseFloat(formatUnits(userShareUSDC, 6)).toFixed(2);
          userAaaAmount = parseFloat(formatUnits(userShareAAA, 18)).toFixed(2);
        }

        setPoolReserves({
          stableAmount: parseFloat(formatUnits(resUSDC, 6)).toFixed(2),
          aaaAmount: parseFloat(formatUnits(resAAA, 18)).toFixed(2),
          stableSymbol: "USDC",
          totalShares: shares.toString()
        });

        setUserPoolBalances({
          stableAmount: userStableAmount,
          aaaAmount: userAaaAmount,
          stableSymbol: "USDC"
        });
      } catch (oldErr) {
        console.warn("Havuz rezervleri alınamadı:", oldErr);
      }
    }
  };

  const fetchSavingsData = async () => {
    if (!provider || !account || SAKUSD_MINTER_ADDRESS === ZERO_ADDRESS) return;
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
      
      const contract = new ethers.Contract(SAKUSD_MINTER_ADDRESS, minterABI, provider);
      
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
      console.warn("Tasarruf bilgileri alınamadı:", err);
    }
  };

// Müstəqil Təsdiq (Approve) İşləyicisi (Şəbəkə xətası üçün gasLimit əlavə edildi)
  const handleApprove = async (type) => {
    if (chainId !== ARC_CHAIN_ID) {
      await checkAndSwitchNetwork();
      return;
    }
    setTxLoading(true);
    try {
      const signer = await getSignerInstance(provider);

      if (type === "swap") {
        const activePool = getPoolAddress(fromToken, toToken);
        const tokenInObj = tokens[fromToken];
        const amountInParsed = parseUnits(amountIn || "0", tokenInObj.decimals);
        const tokenInContract = new ethers.Contract(tokenInObj.address, ERC20_ABI, signer);

        alert(`${tokenInObj.symbol} üçün təsdiq (Approve) sorğusu göndərilir...`);
        const tx = await tokenInContract.approve(activePool, amountInParsed, {
          gasLimit: 800000 // Sabit qaz limiti
        });
        await tx.wait();
        alert("Təsdiq uğurla tamamlandı!");
      }

      if (type === "mint") {
        const collateralObj = tokens[mintCollateral];
        const amountInParsed = parseUnits(mintAmount || "0", collateralObj.decimals);
        const collateralContract = new ethers.Contract(collateralObj.address, ERC20_ABI, signer);

        alert(`${collateralObj.symbol} üçün təsdiq (Approve) sorğusu göndərilir...`);
        const tx = await collateralContract.approve(SAKUSD_MINTER_ADDRESS, amountInParsed, {
          gasLimit: 800000
        });
        await tx.wait();
        alert("Təsdiq uğurla tamamlandı!");
      }

      if (type === "stake") {
        const amountParsed = parseUnits(stakeAmountInput || "0", 18);
        const tokenContract = new ethers.Contract(SAKUSD_TOKEN_ADDRESS, ERC20_ABI, signer);

        alert("sakUSD üçün təsdiq (Approve) sorğusu göndərilir...");
        const tx = await tokenContract.approve(SAKUSD_MINTER_ADDRESS, amountParsed, {
          gasLimit: 800000
        });
        await tx.wait();
        alert("Təsdiq uğurla tamamlandı!");
      }

      if (type === "approve_lp_stable") {
        const activePool = getPoolAddress(activePoolType, "AAA");
        const stableSymbol = activePoolType; 
        const stableTokenAddress = stableSymbol === "USDC" 
          ? ARC_USDC_ADDRESS 
          : (stableSymbol === "EURC" ? ARC_EURC_ADDRESS : ARC_CIRBTC_ADDRESS);
        const stableDecimals = stableSymbol === "cirBTC" ? 8 : 6;
        const stableParsed = parseUnits(lpUSDC || "0", stableDecimals);

        const stableContract = new ethers.Contract(stableTokenAddress, ERC20_ABI, signer);
        alert(`${stableSymbol} üçün təsdiq (Approve) sorğusu göndərilir...`);
        const tx = await stableContract.approve(activePool, stableParsed, {
          gasLimit: 800000
        });
        await tx.wait();
        alert("Təsdiq uğurla tamamlandı!");
      }

      if (type === "approve_lp_aaa") {
        const activePool = getPoolAddress(activePoolType, "AAA");
        const aaaParsed = parseUnits(lpAAA || "0", 18);

        const aaaContract = new ethers.Contract(USER_CUSTOM_TOKEN_ADDRESS, ERC20_ABI, signer);
        alert("AAA üçün təsdiq (Approve) sorğusu göndərilir...");
        const tx = await aaaContract.approve(activePool, aaaParsed, {
          gasLimit: 800000
        });
        await tx.wait();
        alert("Təsdiq uğurla tamamlandı!");
      }

      // Limitləri və balansları yenidən çəkirik
      await fetchAllowances();
      await fetchBalances();
    } catch (err) {
      console.error(err);
      alert(`Təsdiq zamanı xəta baş verdi: ${err.reason || err.message || err}`);
    }
    setTxLoading(false);
  };

  // On-Chain Əməliyyat İcraçısı (Şəbəkə xətası üçün gasLimit əlavə edildi)
  const handleAction = async (type, payload = null) => {
    if (chainId !== ARC_CHAIN_ID) {
      await checkAndSwitchNetwork();
      return;
    }

    setTxLoading(true);
    try {
      const signer = await getSignerInstance(provider);

      if (type === "swap") {
        const activePool = getPoolAddress(fromToken, toToken);
        const tokenInObj = tokens[fromToken];
        const amountInParsed = parseUnits(amountIn, tokenInObj.decimals); 

        const poolABI = ["function swap(address tokenIn, uint256 amountIn) external returns (uint256)"];
        const poolContract = new ethers.Contract(activePool, poolABI, signer);
        
        // RPC-dəki eth_estimateGas xətasını keçmək üçün əl ilə gasLimit təyin edirik
        const swapTx = await poolContract.swap(tokenInObj.address, amountInParsed, {
          gasLimit: 1000000 // Geniş və sabit gasLimit
        });
        alert(`Swap işlemi gönderildi! Tx: ${swapTx.hash}`);
        await swapTx.wait();
        
        alert("Swap işlemi zincir üstünde onaylandı!");
        setSpPoints(prev => prev + 50);
        await fetchBalances();
        await fetchPoolReserves();
        await fetchAllowances();
      }

      if (type === "add_lp") {
        const activePool = getPoolAddress(activePoolType, "AAA");
        const stableSymbol = activePoolType; 
        const stableTokenAddress = stableSymbol === "USDC" 
          ? ARC_USDC_ADDRESS 
          : (stableSymbol === "EURC" ? ARC_EURC_ADDRESS : ARC_CIRBTC_ADDRESS);

        const stableDecimals = stableSymbol === "cirBTC" ? 8 : 6;

        const stableParsed = parseUnits(lpUSDC, stableDecimals);
        const aaaParsed = parseUnits(lpAAA, 18);

        const poolContract = new ethers.Contract(activePool, [
          "function tokenA() view returns (address)",
          "function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256)"
        ], signer);

        let lpTx;
        try {
          const tA = await poolContract.tokenA();
          const isTAStable = tA.toLowerCase() === ARC_EURC_ADDRESS.toLowerCase() || 
                             tA.toLowerCase() === ARC_USDC_ADDRESS.toLowerCase() || 
                             tA.toLowerCase() === ARC_CIRBTC_ADDRESS.toLowerCase();
          
          if (isTAStable) {
            lpTx = await poolContract.addLiquidity(stableParsed, aaaParsed, {
              gasLimit: 1000000
            });
          } else {
            lpTx = await poolContract.addLiquidity(aaaParsed, stableParsed, {
              gasLimit: 1000000
            });
          }
        } catch (err) {
          console.log("Eski havuz yapısı algılandı, varsayılan sıralama ile işlem gönderiliyor...");
          const oldPoolContract = new ethers.Contract(activePool, [
            "function addLiquidity(uint256 amountUSDC, uint256 amountAAA) external returns (uint256)"
          ], signer);
          lpTx = await oldPoolContract.addLiquidity(stableParsed, aaaParsed, {
            gasLimit: 1000000
          });
        }
        
        alert(`Likidite ekleme işlemi gönderildi! Tx: ${lpTx.hash}`);
        await lpTx.wait();
        
        alert("Likidite başarıyla eklendi!");
        setSpPoints(prev => prev + 150);
        setLpUSDC("0");
        setLpAAA("0");
        await fetchBalances();
        await fetchPoolReserves();
        await fetchAllowances();
      }

      if (type === "mint_sakusd") {
        const collateralObj = tokens[mintCollateral];
        const amountInParsed = parseUnits(mintAmount, collateralObj.decimals);

        const minterABI = ["function mint(address collateralToken, uint256 amountIn) external"];
        const minterContract = new ethers.Contract(SAKUSD_MINTER_ADDRESS, minterABI, signer);

        const mintTx = await minterContract.mint(collateralObj.address, amountInParsed, {
          gasLimit: 1000000
        });
        alert(`Basım işlemi gönderildi! Tx: ${mintTx.hash}`);
        await mintTx.wait();

        alert("sakUSD başarıyla basıldı!");
        setSpPoints(prev => prev + 100);
        setMintAmount("0");
        await fetchBalances();
        await fetchAllowances();
      }

      if (type === "redeem_sakusd") {
        const collateralObj = tokens[mintCollateral];
        const amountToBurnParsed = parseUnits(redeemAmount, 18); 

        const minterABI = ["function redeem(address collateralToken, uint256 sakUSDAmount) external"];
        const minterContract = new ethers.Contract(SAKUSD_MINTER_ADDRESS, minterABI, signer);

        const redeemTx = await minterContract.redeem(collateralObj.address, amountToBurnParsed, {
          gasLimit: 1000000
        });
        alert(`Geri alma işlemi gönderildi! Tx: ${redeemTx.hash}`);
        await redeemTx.wait();

        alert("Teminat başarıyla geri alındı!");
        setSpPoints(prev => prev + 100);
        setRedeemAmount("0");
        await fetchBalances();
        await fetchAllowances();
      }

      if (type === "stake_sakusd") {
        const amountParsed = parseUnits(stakeAmountInput, 18);

        const minterABI = ["function stake(uint256 amount) external"];
        const minterContract = new ethers.Contract(SAKUSD_MINTER_ADDRESS, minterABI, signer);

        const stakeTx = await minterContract.stake(amountParsed, {
          gasLimit: 1000000
        });
        alert(`Stake işlemi gönderildi! Tx: ${stakeTx.hash}`);
        await stakeTx.wait();

        alert("Tasarrufa başarıyla sakUSD eklendi!");
        setStakeAmountInput("0");
        setSpPoints(prev => prev + 100);
        await fetchBalances();
        await fetchSavingsData();
        await fetchAllowances();
      }

      if (type === "request_unstake") {
        if (!unstakeAmountInput || isNaN(unstakeAmountInput) || parseFloat(unstakeAmountInput) <= 0) {
          alert("Gecerli bir miktar girin.");
          setTxLoading(false);
          return;
        }

        const amountParsed = parseUnits(unstakeAmountInput, 18);

        const minterABI = ["function requestUnstake(uint256 amount) external"];
        const minterContract = new ethers.Contract(SAKUSD_MINTER_ADDRESS, minterABI, signer);

        const unstakeTx = await minterContract.requestUnstake(amountParsed, {
          gasLimit: 1000000
        });
        alert(`Geri çekme talebi gönderildi! Tx: ${unstakeTx.hash}`);
        await unstakeTx.wait();

        alert("14 Günlük geri çekim talebi başarıyla başlatıldı!");
        setUnstakeAmountInput("0");
        await fetchBalances();
        await fetchSavingsData();
      }

      if (type === "claim_unstaked_req") {
        const index = payload;
        const minterABI = ["function claimUnstaked(uint256 index) external"];
        const minterContract = new ethers.Contract(SAKUSD_MINTER_ADDRESS, minterABI, signer);

        const claimTx = await minterContract.claimUnstaked(index, {
          gasLimit: 1000000
        });
        alert(`Kilit açma işlemi gönderildi! Tx: ${claimTx.hash}`);
        await claimTx.wait();

        alert("Kilitli sakUSD bakiyeniz başarıyla cüzdanınıza aktarıldı!");
        await fetchBalances();
        await fetchSavingsData();
      }

      if (type === "claim_rewards") {
        const minterABI = ["function claimRewards() external"];
        const minterContract = new ethers.Contract(SAKUSD_MINTER_ADDRESS, minterABI, signer);

        const claimTx = await minterContract.claimRewards({
          gasLimit: 1000000
        });
        alert(`Faiz ödülleri talep edildi! Tx: ${claimTx.hash}`);
        await claimTx.wait();

        alert("Birikmiş sakUSD faiz ödülleriniz başarıyla basıldı ve cüzdanınıza aktarıldı!");
        setSpPoints(prev => prev + 150);
        await fetchBalances();
        await fetchSavingsData();
      }

      if (type === "send_token") {
        if (!sendRecipient || !sendAmount || isNaN(sendAmount) || parseFloat(sendAmount) <= 0) {
          alert("Lütfen geçerli bir alıcı adresi ve miktar girin.");
          setTxLoading(false);
          return;
        }

        const isAddressValid = isV6 ? ethers.isAddress(sendRecipient) : ethers.utils.isAddress(sendRecipient);
        if (!isAddressValid) {
          alert("Hata: Geçersiz alıcı adresi. Lütfen adresi kontrol edin.");
          setTxLoading(false);
          return;
        }

        const tokenToTransfer = sendToken === "AAA" ? USER_CUSTOM_TOKEN_ADDRESS : SAKUSD_TOKEN_ADDRESS;
        const symbolToTransfer = sendToken === "AAA" ? "AAA" : "sakUSD";
        const amountParsed = parseUnits(sendAmount, 18); 

        const erc20Contract = new ethers.Contract(tokenToTransfer, ERC20_ABI, signer);

        const transferTx = await erc20Contract.transfer(sendRecipient, amountParsed, {
          gasLimit: 1000000
        });
        alert(`Transfer işlemi gönderildi! Tx: ${transferTx.hash}`);
        await transferTx.wait();

        alert(`${sendAmount} ${symbolToTransfer} token, başarıyla ${sendRecipient} adresine gönderildi!`);
        setSendAmount("0");
        setSendRecipient("");
        setSpPoints(prev => prev + 50);
        await fetchBalances();
      }

    } catch (err) {
      console.error(err);
      alert(`İşlem sırasında bir hata oluştu: ${err.reason || err.message || err}`);
    }
    setTxLoading(false);
  };

  const handleFaucet = async (tokenSymbol) => {
    if (tokenSymbol === "USDC" || tokenSymbol === "EURC" || tokenSymbol === "cirBTC" || tokenSymbol === "USDT") {
      window.open("https://faucet.circle.com/", "_blank");
      return;
    }

    if (chainId !== ARC_CHAIN_ID || !provider || !account) {
      alert("Lütfen cüzdanınızı bağlayın ve Arc Testnet ağına geçin.");
      return;
    }

    setTxLoading(true);
    try {
      const signer = await getSignerInstance(provider);
      
      if (tokenSymbol === "AAA") {
        const aaaABI = ["function mint(address to, uint256 amount) external"];
        const aaaContract = new ethers.Contract(USER_CUSTOM_TOKEN_ADDRESS, aaaABI, signer);
        
        const tx = await aaaContract.mint(account, parseUnits("10", 18), {
          gasLimit: 1000000
        });
        alert(`10 AAA basım işlemi gönderildi! Tx: ${tx.hash}`);
        await tx.wait();
        alert("10 AAA token cüzdanınıza başarıyla aktarıldı!");
        await fetchBalances();
      }
    } catch (err) {
      console.error("Faucet hatası:", err);
      alert("Faucet işlemi başarısız oldu. AAA token kontratının yetkili cüzdanında (owner) olduğunuzdan emin olun.");
    }
    setTxLoading(false);
  };

  const handlePercentClick = (percent, balance, decimals, setter) => {
    if (!balance || isNaN(balance)) return;
    const bal = parseFloat(balance);
    if (bal <= 0) return;
    const calculatedAmount = (bal * percent) / 100;
    setter(calculatedAmount.toFixed(decimals === 8 ? 6 : 4));
  };

  const handleNumberInput = (setter) => (e) => {
    let val = e.target.value;
    if (val.startsWith("0") && val.length > 1 && val[1] !== ".") {
      val = val.slice(1);
    }
    setter(val);
  };

  const handleFocus = (val, setter) => () => {
    if (val === "0" || val === "0.0" || val === "0.00") {
      setter("");
    }
  };

  const handleBlur = (val, setter) => () => {
    if (val === "" || isNaN(val)) {
      setter("0");
    }
  };

  const activeStableSymbol = activePoolType;

  // Limit Müqayisə Dəyişənləri (JSX hissəsində düymələri idarə etmək üçün)
  const isSwapApproved = swapAllowance >= parseUnits(amountIn || "0", tokens[fromToken]?.decimals || 18);
  const isMintApproved = mintAllowance >= parseUnits(mintAmount || "0", tokens[mintCollateral]?.decimals || 18);
  const isStakeApproved = stakeAllowance >= parseUnits(stakeAmountInput || "0", 18);
  const isLpStableApproved = lpStableAllowance >= parseUnits(lpUSDC || "0", activePoolType === "cirBTC" ? 8 : 6);
  const isLpAaaApproved = lpAaaAllowance >= parseUnits(lpAAA || "0", 18);

  const activeStableSymbol = activePoolType;

  // Limit Müqayisə Dəyişənləri (JSX hissəsində düymələri idarə etmək üçün)
  const isSwapApproved = swapAllowance >= parseUnits(amountIn || "0", tokens[fromToken]?.decimals || 18);
  const isMintApproved = mintAllowance >= parseUnits(mintAmount || "0", tokens[mintCollateral]?.decimals || 18);
  const isStakeApproved = stakeAllowance >= parseUnits(stakeAmountInput || "0", 18);
  const isLpStableApproved = lpStableAllowance >= parseUnits(lpUSDC || "0", activePoolType === "cirBTC" ? 8 : 6);
  const isLpAaaApproved = lpAaaAllowance >= parseUnits(lpAAA || "0", 18);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0b0914] text-[#f3f4f6]">
      <header className="border-b border-gray-800 bg-[#0d0b1a] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Sol: Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            ArcSakasena
          </span>
          <span className="text-xs bg-indigo-900 text-indigo-200 px-2.5 py-0.5 rounded-full font-semibold">
            Arc Chain L1
          </span>
        </div>
        
        {/* Orta: Navbar Navigasyon Tabları (Dinamik Grid / Flex) */}
        <div className="grid grid-cols-3 md:flex bg-[#100e1f] p-1 rounded-xl border border-gray-800 shrink-0 w-full md:w-auto max-w-sm md:max-w-none">
          {["swap", "pool", "mint", "savings", "send", "faucet"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold capitalize transition ${
                activeTab === tab 
                  ? "bg-violet-900 text-white shadow-md shadow-violet-900/30" 
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab === "pool" ? "Liquidity" : (tab === "mint" ? "Mint SakUSD" : (tab === "savings" ? "Savings" : (tab === "send" ? "Send" : tab)))}
            </button>
          ))}
        </div>
        
        {/* Sağ: Cüzdan Göstergeleri ve Bağlantı */}
        <div className="flex items-center space-x-4 shrink-0">
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
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-indigo-950 to-[#121024] border border-violet-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
            <div className="w-full md:w-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 font-medium">Your Deployed Custom Token</span>
              <h3 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                🪙 {tokens.AAA.name} ({tokens.AAA.symbol})
              </h3>
              <p className="text-xs text-gray-400 mt-1">Volatile Asset • Price: $5.40 • <span className="text-emerald-400 font-semibold">1,300+ Active Holders on Arcscan</span></p>
              
              {/* Adres Kopyalama Alanı */}
              <div className="relative mt-3 flex items-center bg-[#1b173c]/50 p-2.5 pr-12 rounded-xl border border-gray-800 w-full max-w-full overflow-hidden group">
                <span className="text-xs text-gray-300 font-mono break-all select-all flex-grow">
                  {USER_CUSTOM_TOKEN_ADDRESS}
                </span>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(USER_CUSTOM_TOKEN_ADDRESS);
                    alert("AAA Kontrat Adresi başarıyla kopyalandı!");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-400 transition-colors p-2 z-10"
                  title="Kontrat Adresini Kopyala"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="text-left md:text-right shrink-0">
              <span className="text-xs text-gray-400 font-medium block">Your Balance</span>
              <p className="text-2xl font-bold text-violet-300 mt-1">{balances.AAA} {tokens.AAA.symbol}</p>
            </div>
          </div>
        )}

        {/* İstatistik Kartları Grid */}
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
            <p className="text-xs text-gray-400 mb-1">My {userPoolBalances.stableSymbol || "Stable"} in Pool</p>
            <p className="text-lg font-bold text-emerald-400">{userPoolBalances.stableAmount} {userPoolBalances.stableSymbol}</p>
          </div>
          <div className="bg-[#121024] p-4 rounded-2xl border border-gray-800 text-center">
            <p className="text-xs text-gray-400 mb-1">My AAA in Pool</p>
            <p className="text-lg font-bold text-indigo-300">{userPoolBalances.aaaAmount} {tokens.AAA.symbol}</p>
          </div>
        </div>

        <div className="max-w-md mx-auto bg-[#13112a] rounded-3xl p-6 border border-gray-800 neon-glow shadow-2xl">
          {activeTab === "swap" && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                <span>Multi-Asset Swap</span>
                <span className="text-xs text-violet-400 bg-violet-950 px-2 py-1 rounded">Dynamic Price DEX</span>
              </h2>

              <div className="bg-[#1c183a] p-4 rounded-2xl mb-3 border border-gray-800 focus-within:border-violet-600 transition">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400 font-medium">From</span>
                  <span className="text-xs text-gray-400">Balance: {balances[fromToken]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={amountIn}
                    onFocus={handleFocus(amountIn, setAmountIn)}
                    onBlur={handleBlur(amountIn, setAmountIn)}
                    onChange={handleNumberInput(setAmountIn)}
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
                
                {/* Swap Yüzde Butonları */}
                <div className="flex space-x-2 mt-3 pt-2 border-t border-[#2a2456]/40">
                  {[25, 50, 75, 100].map(p => (
                    <button
                      key={p}
                      onClick={() => handlePercentClick(p, balances[fromToken], tokens[fromToken].decimals, setAmountIn)}
                      className="bg-[#211e47] hover:bg-violet-900 hover:text-white text-[10px] text-gray-400 font-bold px-3 py-1 rounded-lg transition"
                    >
                      {p === 100 ? "MAX" : `${p}%`}
                    </button>
                  ))}
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
                    placeholder="0" 
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
                  <span>Price Impact / Slippage:</span>
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
                  disabled={!amountIn || txLoading || amountOut === "Likidite Yetersiz" || amountOut === "Havuz Bulunamadı"}
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
              <h2 className="text-xl font-bold mb-2">Liquidity Provision</h2>
              
              {/* Havuz Seçici Toggle Butonları */}
              <div className="flex space-x-2 bg-[#100e1f] p-1 rounded-xl mb-6 max-w-sm mx-auto border border-gray-800">
                <button
                  onClick={() => setActivePoolType("USDC")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activePoolType === "USDC" ? "bg-violet-900 text-white" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  💵 USDC / AAA
                </button>
                <button
                  onClick={() => setActivePoolType("EURC")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activePoolType === "EURC" ? "bg-violet-900 text-white" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  💶 EURC / AAA
                </button>
                <button
                  onClick={() => setActivePoolType("cirBTC")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activePoolType === "cirBTC" ? "bg-violet-900 text-white" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  ₿ cirBTC / AAA
                </button>
              </div>

              <p className="text-sm text-gray-400 mb-6 text-center">
                Seçtiğiniz havuza doğrudan on-chain likidite ekleyin ve işlem ücretlerinden pay kazanın.
              </p>

              <div className="space-y-4 mb-6">
                {/* LP STABLE GİRİŞ ALANI */}
                <div className="bg-[#1c183a] p-4 rounded-2xl border border-gray-800 focus-within:border-violet-600 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.25)] transition">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Add {activeStableSymbol}</span>
                    <span>Balance: {balances[activeStableSymbol]}</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={lpUSDC}
                    onFocus={handleFocus(lpUSDC, setLpUSDC)}
                    onBlur={handleBlur(lpUSDC, setLpUSDC)}
                    onChange={handleNumberInput(setLpUSDC)}
                    className="bg-transparent text-xl font-bold focus:outline-none w-full text-white"
                  />
                  {/* Stable LP Yüzde Butonları */}
                  <div className="flex space-x-2 mt-3 pt-2 border-t border-[#2a2456]/40">
                    {[25, 50, 75, 100].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePercentClick(p, balances[activeStableSymbol], activeStableSymbol === "cirBTC" ? 8 : 6, setLpUSDC)}
                        className="bg-[#211e47] hover:bg-violet-900 hover:text-white text-[10px] text-gray-400 font-bold px-3 py-1 rounded-lg transition"
                      >
                        {p === 100 ? "MAX" : `${p}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LP AAA GİRİŞ ALANI */}
                <div className="bg-[#1c183a] p-4 rounded-2xl border border-gray-800 focus-within:border-violet-600 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.25)] transition">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Add AAA Token</span>
                    <span>Balance: {balances.AAA}</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={lpAAA}
                    onFocus={handleFocus(lpAAA, setLpAAA)}
                    onBlur={handleBlur(lpAAA, setLpAAA)}
                    onChange={handleNumberInput(setLpAAA)}
                    className="bg-transparent text-xl font-bold focus:outline-none w-full text-white"
                  />
                  {/* AAA LP Yüzde Butonları */}
                  <div className="flex space-x-2 mt-3 pt-2 border-t border-[#2a2456]/40">
                    {[25, 50, 75, 100].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePercentClick(p, balances.AAA, 18, setLpAAA)}
                        className="bg-[#211e47] hover:bg-violet-900 hover:text-white text-[10px] text-gray-400 font-bold px-3 py-1 rounded-lg transition"
                      >
                        {p === 100 ? "MAX" : `${p}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {account ? (
                <button 
                  onClick={() => handleAction("add_lp")}
                  disabled={txLoading || parseFloat(lpUSDC) <= 0 || parseFloat(lpAAA) <= 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-white transition shadow-lg disabled:opacity-50"
                >
                  {txLoading ? "İşlem Gönderiliyor..." : "Likidite Ekle (Add Liquidity)"}
                </button>
              ) : (
                <button 
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-white transition"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          )}

          {activeTab === "mint" && (
            <div>
              <h2 className="text-xl font-bold mb-2">Multi-Collateral sakUSD</h2>
              <p className="text-sm text-gray-400 mb-6">
                USDC, EURC, USDT veya cirBTC teminatlarınızı kilitleyerek 1:1 veya BTC fiyat kurları üzerinden merkezsiz <strong>sakUSD</strong> basabilirsiniz.
              </p>

              <div className="bg-[#1a1738] p-4 rounded-2xl mb-4 border border-gray-800">
                <label className="block text-xs text-gray-400 mb-2 font-medium">Teminat Varlığı Seçin (Collateral)</label>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">Seçili Teminat Bakiyesi: {balances[mintCollateral]} {mintCollateral}</span>
                  <select 
                    value={mintCollateral} 
                    onChange={(e) => setMintCollateral(e.target.value)}
                    className="bg-[#211e47] text-white px-3 py-1.5 rounded-xl font-semibold border border-gray-700 focus:outline-none"
                  >
                    {["USDC", "EURC", "USDT", "cirBTC"].map(c => (
                      <option key={c} value={c}>{tokens[c]?.icon} {c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {/* sakUSD MINT ETME GİRİŞ ALANI */}
                <div className="bg-[#1c183a] p-4 rounded-2xl border border-gray-800 focus-within:border-violet-600 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.25)] transition">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Mint sakUSD</span>
                    <span>sakUSD Balance: {balances.sakUSD}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={mintAmount}
                      onFocus={handleFocus(mintAmount, setMintAmount)}
                      onBlur={handleBlur(mintAmount, setMintAmount)}
                      onChange={handleNumberInput(setMintAmount)}
                      className="bg-transparent text-xl font-bold focus:outline-none w-full text-white"
                    />
                    <button 
                      onClick={() => handleAction("mint_sakusd")}
                      disabled={txLoading || parseFloat(mintAmount) <= 0}
                      className="bg-violet-600 hover:bg-violet-500 px-5 py-2.5 rounded-xl text-sm font-bold transition text-white disabled:opacity-50 shrink-0"
                    >
                      Mint
                    </button>
                  </div>
                  {/* Mint Yüzde Butonları */}
                  <div className="flex space-x-2 mt-3 pt-2 border-t border-[#2a2456]/40">
                    {[25, 50, 75, 100].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePercentClick(p, balances[mintCollateral], tokens[mintCollateral].decimals, setMintAmount)}
                        className="bg-[#211e47] hover:bg-violet-900 hover:text-white text-[10px] text-gray-400 font-bold px-3 py-1 rounded-lg transition"
                      >
                        {p === 100 ? "MAX" : `${p}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* sakUSD YAKMA (REDEEM) GİRİŞ ALANI */}
                <div className="bg-[#1c183a] p-4 rounded-2xl border border-gray-800 focus-within:border-violet-600 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.25)] transition">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Redeem sakUSD (Teminatı Geri Al)</span>
                    <span>Collateral: {mintCollateral}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={redeemAmount}
                      onFocus={handleFocus(redeemAmount, setRedeemAmount)}
                      onBlur={handleBlur(redeemAmount, setRedeemAmount)}
                      onChange={handleNumberInput(setRedeemAmount)}
                      className="bg-transparent text-xl font-bold focus:outline-none w-full text-white"
                    />
                    <button 
                      onClick={() => handleAction("redeem_sakusd")}
                      disabled={txLoading || parseFloat(redeemAmount) <= 0}
                      className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl text-sm font-bold transition text-white disabled:opacity-50 shrink-0"
                    >
                      Redeem
                    </button>
                  </div>
                  {/* Redeem Yüzde Butonları */}
                  <div className="flex space-x-2 mt-3 pt-2 border-t border-[#2a2456]/40">
                    {[25, 50, 75, 100].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePercentClick(p, balances.sakUSD, 18, setRedeemAmount)}
                        className="bg-[#211e47] hover:bg-violet-900 hover:text-white text-[10px] text-gray-400 font-bold px-3 py-1 rounded-lg transition"
                      >
                        {p === 100 ? "MAX" : `${p}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "savings" && (
            <div>
              <h2 className="text-xl font-bold mb-2">Sakasena Savings (%8 APY)</h2>
              <p className="text-sm text-gray-400 mb-6">
                sakUSD bakiyenizi tasarruf havuzuna yatırarak yıllık sabit <strong>%8 faiz getirisi</strong> kazanmaya başlayın.
              </p>

              {/* Bakiye Bilgilendirme Kartları */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#1a1738] p-4 rounded-2xl border border-gray-800 text-center">
                  <span className="text-xs text-gray-400 block mb-1">Your Staked Balance</span>
                  <span className="text-lg font-bold text-violet-300">{savingsData.staked} sakUSD</span>
                </div>
                <div className="bg-[#1a1738] p-4 rounded-2xl border border-gray-800 text-center flex flex-col justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Pending Rewards</span>
                    <span className="text-lg font-bold text-emerald-400">{savingsData.pendingRewards} sakUSD</span>
                  </div>
                  <button 
                    onClick={() => handleAction("claim_rewards")}
                    disabled={txLoading || parseFloat(savingsData.pendingRewards) <= 0}
                    className="mt-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-1 px-3 rounded-lg text-xs transition disabled:opacity-50"
                  >
                    Claim Rewards
                  </button>
                </div>
              </div>

              {/* Stake / Unstake Formları */}
              <div className="space-y-4 mb-6">
                {/* STAKE (KİLİTLEME) ALANI */}
                <div className="bg-[#1c183a] p-4 rounded-2xl border border-gray-800 focus-within:border-violet-600 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.25)] transition">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Stake sakUSD</span>
                    <span>Wallet Balance: {balances.sakUSD}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={stakeAmountInput}
                      onFocus={handleFocus(stakeAmountInput, setStakeAmountInput)}
                      onBlur={handleBlur(stakeAmountInput, setStakeAmountInput)}
                      onChange={handleNumberInput(setStakeAmountInput)}
                      className="bg-transparent text-xl font-bold focus:outline-none w-full text-white"
                    />
                    <button 
                      onClick={() => handleAction("stake_sakusd")}
                      disabled={txLoading || parseFloat(stakeAmountInput) <= 0}
                      className="bg-violet-600 hover:bg-violet-500 px-5 py-2.5 rounded-xl text-sm font-bold transition text-white disabled:opacity-50 shrink-0"
                    >
                      Stake
                    </button>
                  </div>
                  {/* Stake Yüzde Butonları */}
                  <div className="flex space-x-2 mt-3 pt-2 border-t border-[#2a2456]/40">
                    {[25, 50, 75, 100].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePercentClick(p, balances.sakUSD, 18, setStakeAmountInput)}
                        className="bg-[#211e47] hover:bg-violet-900 hover:text-white text-[10px] text-gray-400 font-bold px-3 py-1 rounded-lg transition"
                      >
                        {p === 100 ? "MAX" : `${p}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* UNSTAKE (GERİ ÇEKİM TALEBİ) ALANI */}
                <div className="bg-[#1c183a] p-4 rounded-2xl border border-gray-800 focus-within:border-violet-600 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.25)] transition">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Request Unstake (Geri Çekim Talebi)</span>
                    <span>14 Günlük Kilit Süresi</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={unstakeAmountInput}
                      onFocus={handleFocus(unstakeAmountInput, setUnstakeAmountInput)}
                      onBlur={handleBlur(unstakeAmountInput, setUnstakeAmountInput)}
                      onChange={handleNumberInput(setUnstakeAmountInput)}
                      className="bg-transparent text-xl font-bold focus:outline-none w-full text-white"
                    />
                    <button 
                      onClick={() => handleAction("request_unstake")}
                      disabled={txLoading || parseFloat(unstakeAmountInput) <= 0}
                      className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl text-sm font-bold transition text-white disabled:opacity-50 shrink-0"
                    >
                      Request Unstake
                    </button>
                  </div>
                  {/* Unstake Yüzde Butonları */}
                  <div className="flex space-x-2 mt-3 pt-2 border-t border-[#2a2456]/40">
                    {[25, 50, 75, 100].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePercentClick(p, savingsData.staked, 18, setUnstakeAmountInput)}
                        className="bg-[#211e47] hover:bg-violet-900 hover:text-white text-[10px] text-gray-400 font-bold px-3 py-1 rounded-lg transition"
                      >
                        {p === 100 ? "MAX" : `${p}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Aktif Unstake Talepleri (14 günlük sayaçlar) */}
              {savingsData.requests.length > 0 && (
                <div className="bg-[#100e21] p-4 rounded-2xl border border-gray-900">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-3">Aktif Geri Çekim Talepleriniz</h3>
                  <div className="space-y-2">
                    {savingsData.requests.map((r) => {
                      const now = Math.floor(Date.now() / 1000);
                      const isUnlocked = now >= r.releaseTime;
                      const timeLeft = r.releaseTime - now;

                      let statusText = "";
                      if (isUnlocked) {
                        statusText = "Kilit Açıldı! Çekilebilir.";
                      } else {
                        const days = Math.floor(timeLeft / 86400);
                        const hours = Math.floor((timeLeft % 86400) / 3600);
                        statusText = `Kalan Süre: ${days}g ${hours}s`;
                      }

                      return (
                        <div key={r.index} className="flex justify-between items-center text-sm bg-[#16142d] p-3 rounded-xl border border-gray-800">
                          <div>
                            <p className="font-bold text-white">{r.amount} sakUSD</p>
                            <p className="text-xs text-gray-400 mt-0.5">{statusText}</p>
                          </div>
                          <button 
                            onClick={() => handleAction("claim_unstaked_req", r.index)}
                            disabled={txLoading || !isUnlocked}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              isUnlocked 
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                                : "bg-gray-800 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            Cüzdana Çek
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SAKASENA SEND (CÜZDAN TRANSFER) TAB ALANI */}
          {activeTab === "send" && (
            <div>
              <h2 className="text-xl font-bold mb-2">Send Token</h2>
              <p className="text-sm text-gray-400 mb-6">
                AAA veya sakUSD tokenlerinizi doğrudan başka bir cüzdan adresine hızlıca transfer edin.
              </p>

              {/* Gönderilecek Token Seçimi */}
              <div className="bg-[#1a1738] p-4 rounded-2xl mb-4 border border-gray-800">
                <label className="block text-xs text-gray-400 mb-2 font-medium">Gönderilecek Tokeni Seçin (Asset)</label>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">Seçili Token Bakiyesi: {balances[sendToken]} {sendToken}</span>
                  <select 
                    value={sendToken} 
                    onChange={(e) => setSendToken(e.target.value)}
                    className="bg-[#211e47] text-white px-3 py-1.5 rounded-xl font-semibold border border-gray-700 focus:outline-none"
                  >
                    <option value="AAA">🪙 AAA</option>
                    <option value="sakUSD">💴 sakUSD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {/* Alıcı Adresi Girişi */}
                <div className="bg-[#1a1738] p-4 rounded-2xl border border-gray-800">
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Alıcı Cüzdan Adresi (Recipient Address)</label>
                  <input 
                    type="text" 
                    placeholder="0x..." 
                    value={sendRecipient}
                    onChange={(e) => setSendRecipient(e.target.value.toLowerCase())} // bad checksum engelleme
                    className="bg-transparent text-sm font-mono focus:outline-none w-full text-white"
                  />
                </div>

                {/* Miktar Girişi */}
                <div className="bg-[#1c183a] p-4 rounded-2xl border border-gray-800 focus-within:border-violet-600 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.25)] transition">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Gönderilecek {sendToken} Miktarı</span>
                    <span>Mevcut Bakiye: {balances[sendToken]} {sendToken}</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={sendAmount}
                    onFocus={handleFocus(sendAmount, setSendAmount)}
                    onBlur={handleBlur(sendAmount, setSendAmount)}
                    onChange={handleNumberInput(setSendAmount)}
                    className="bg-transparent text-xl font-bold focus:outline-none w-full text-white"
                  />
                  {/* Send Yüzde Butonları */}
                  <div className="flex space-x-2 mt-3 pt-2 border-t border-[#2a2456]/40">
                    {[25, 50, 75, 100].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePercentClick(p, balances[sendToken], 18, setSendAmount)}
                        className="bg-[#211e47] hover:bg-violet-900 hover:text-white text-[10px] text-gray-400 font-bold px-3 py-1 rounded-lg transition"
                      >
                        {p === 100 ? "MAX" : `${p}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {account ? (
                <button 
                  onClick={() => handleAction("send_token")}
                  disabled={txLoading || !sendRecipient || !sendAmount || parseFloat(sendAmount) <= 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-white transition shadow-lg disabled:opacity-50"
                >
                  {txLoading ? "Gönderiliyor..." : `${sendToken} Gönder (Send)`}
                </button>
              ) : (
                <button 
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-white transition shadow-lg"
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
              
              <div className="bg-[#100e21] p-4 rounded-2xl border border-gray-900 text-left mb-6 space-y-4">
                <span className="text-xs text-gray-500 font-semibold block mb-1">Circle Resmi Musluğu (External)</span>
                
                <div className="flex justify-between items-center text-sm bg-[#16142d] p-3 rounded-xl border border-gray-800">
                  <div>
                    <p className="font-bold text-white">💵 USDC / 💶 EURC / 💲 USDT / ₿ cirBTC</p>
                    <p className="text-xs text-gray-400 mt-0.5">Circle Resmi Testnet Musluk Sayfası</p>
                  </div>
                  <button 
                    onClick={() => handleFaucet("USDC")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs transition"
                  >
                     Circle Faucet'a Git 🌐
                  </button>
                </div>

                <span className="text-xs text-gray-500 font-semibold block mb-1">On-Chain Sakasena Musluğu (Local)</span>

                {/* Gerçek On-Chain AAA Mint Butonu */}
                <div className="flex justify-between items-center text-sm bg-[#16142d] p-3 rounded-xl border border-gray-800">
                  <div>
                    <p className="font-bold text-white">🪙 10 AAA Token</p>
                    <p className="text-xs text-gray-400 mt-0.5">Gerçek Zincir Üstü (On-Chain) Basım</p>
                  </div>
                  <button 
                    onClick={() => handleFaucet("AAA")}
                    disabled={txLoading}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition disabled:opacity-50"
                  >
                    {txLoading ? "Basılıyor..." : "10 AAA Al ⭐"}
                  </button>
                </div>

                {/* Bilgilendirici sakUSD Kartı */}
                <div className="p-3.5 bg-[#111026] rounded-xl border border-violet-900 text-xs text-violet-300 leading-relaxed">
                  💴 <strong>sakUSD Nasıl Alınır?</strong> sakUSD basımı (mint) teminata dayalı olduğu için; üstteki butondan Circle Faucet'a giderek ücretsiz test USDC alabilir, ardından sitemizdeki <strong>Mint sakUSD</strong> sekmesinden 1:1 oranında ücretsiz sakUSD basabilirsiniz!
                </div>
              </div>
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
