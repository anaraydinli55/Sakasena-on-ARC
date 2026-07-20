// ============================================
// ANA APP COMPONENT
// Bütün parçaları birleştirir
// ============================================
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Sabitler ve konfigürasyon
import { 
  ARC_CHAIN_ID, ARC_ADDRESSES, TOKEN_PRICES,
  MAX_UINT256, formatUnits, parseUnits, isLessThan,
  isAaveSupported, AAVE_SUPPORTED_TOKENS 
} from './constants';

import { NETWORKS, getActiveNetworkConfig, getPoolAddress } from './networks';

// Hook'lar
import { useWallet } from './hooks/useWallet';
import { useBalances } from './hooks/useBalances';
import { useSavings } from './hooks/useSavings';

// Component'ler
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { AAABanner } from './components/AAABanner';
import { SwapTab } from './components/SwapTab';
import { PoolTab } from './components/PoolTab';
import { MintTab } from './components/MintTab';
import { SavingsTab } from './components/SavingsTab';
import { SendTab } from './components/SendTab';
import { LendingTab } from './components/LendingTab';
import { FaucetTab } from './components/FaucetTab';
import CCTPBridgeTab from './components/CCTPBridge';

export default function App() {
  // Wallet hook
  const { provider, account, chainId, connectWallet, switchNetwork, getSigner } = useWallet();

  // Balans hook
  const { balances, poolReserves, userPoolBalances, fetchBalances, fetchPoolReserves } = useBalances(provider, account, chainId);

  // Savings hook
  const { savingsData, fetchSavingsData } = useSavings(provider, account, chainId);

  // State'ler
  const [activeTab, setActiveTab] = useState("swap"); 
  const [activePoolType, setActivePoolType] = useState("USDC"); 
  const [tokens, setTokens] = useState(NETWORKS[5042002].tokens);
  const [spPoints, setSpPoints] = useState(1250);
  const [txLoading, setTxLoading] = useState(false);

  // Swap state'leri
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("AAA"); 
  const [amountIn, setAmountIn] = useState("0");
  const [amountOut, setAmountOut] = useState("");

  // Pool state'leri
  const [lpUSDC, setLpUSDC] = useState("0");
  const [lpAAA, setLpAAA] = useState("0");

  // Mint state'leri
  const [mintCollateral, setMintCollateral] = useState("USDC");
  const [mintAmount, setMintAmount] = useState("0");
  const [redeemAmount, setRedeemAmount] = useState("0");

  // Savings state'leri
  const [stakeAmountInput, setStakeAmountInput] = useState("0");
  const [unstakeAmountInput, setUnstakeAmountInput] = useState("0");

  // Send state'leri
  const [sendToken, setSendToken] = useState("AAA"); 
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("0");

  // Lending state'leri
  const [lendingToken, setLendingToken] = useState("USDC");
  const [collateralToken, setCollateralToken] = useState("USDC");
  const [supplyAmount, setSupplyAmount] = useState("0");
  const [borrowAmount, setBorrowAmount] = useState("0");
  const [repayAmount, setRepayAmount] = useState("0");

  // Token listesini güncelle
  useEffect(() => {
    const config = getActiveNetworkConfig(chainId);
    setTokens(config.tokens);
  }, [chainId]);

  // Verileri yükle
  useEffect(() => {
    if (account && provider) {
      const loadAllData = async () => {
        await fetchBalances();
        await fetchPoolReserves(activePoolType, fromToken, toToken, activeTab);
        await fetchSavingsData();
      };
      loadAllData();
    }
  }, [account, chainId, provider, activeTab, activePoolType, fromToken, toToken]);

  // YENI (Sadece ilk yukleme icin):
useEffect(() => {
  if (account) {
    fetchBalances();
  }
}, [account]);

  // Yardımcı fonksiyonlar
  const handlePercentClick = (percent, balance, decimals, setter) => {
    if (!balance || isNaN(balance)) return;
    const bal = parseFloat(balance);
    if (bal <= 0) return;
    setter((bal * percent / 100).toFixed(decimals === 8 ? 6 : 4));
  };

  const handleNumberInput = (setter) => (e) => {
    let val = e.target.value;
    if (val.startsWith("0") && val.length > 1 && val[1] !== ".") val = val.slice(1);
    setter(val);
  };

  const handleFocus = (val, setter) => () => {
    if (val === "0" || val === "0.0" || val === "0.00") setter("");
  };

  const handleBlur = (val, setter) => () => {
    if (val === "" || isNaN(val)) setter("0");
  };

  // Ana işlem fonksiyonu
  const handleAction = async (type, payload = null) => {
    const config = getActiveNetworkConfig(chainId);
    setTxLoading(true);

    if (!NETWORKS[chainId]) {
      await switchNetwork(5042002);
      setTxLoading(false);
      return;
    }

    try {
      const signer = await getSigner();

      // SWAP
      if (type === "swap") {
        if (chainId !== 5042002) {
          alert("Swap yalniz Arc Testnet'de aktiftir.");
          await switchNetwork(5042002); setTxLoading(false); return;
        }
        const activePool = getPoolAddress(fromToken, toToken);
        const tokenInObj = config.tokens[fromToken];
        const amountInParsed = parseUnits(amountIn, tokenInObj.decimals); 
        const amountInWithBuffer = (BigInt(amountInParsed.toString()) * 105n) / 100n;

        const erc20ABI = ["function allowance(address owner, address spender) view returns (uint256)", "function approve(address spender, uint256 amount) returns (bool)"];
        const tokenInContract = new ethers.Contract(tokenInObj.address, erc20ABI, signer);
        const currentAllowance = await tokenInContract.allowance(account, activePool);

        if (isLessThan(currentAllowance, amountInParsed)) { 
          const approveTx = await tokenInContract.approve(activePool, amountInWithBuffer, { gasLimit: 800000 });
          await approveTx.wait();
        }

        const poolABI = ["function swap(address tokenIn, uint256 amountIn) external returns (uint256)"];
        const poolContract = new ethers.Contract(activePool, poolABI, signer);
        const swapTx = await poolContract.swap(tokenInObj.address, amountInParsed, { gasLimit: 1000000 });
        await swapTx.wait();

        alert("Swap basariyla tamamlandi!");
        setSpPoints(prev => prev + 50);
        await fetchBalances(); await fetchPoolReserves(activePoolType, fromToken, toToken, activeTab);
      }

      // ADD LIQUIDITY
      if (type === "add_lp") {
        const activePool = getPoolAddress(activePoolType, "AAA");
        if (!lpUSDC || !lpAAA || parseFloat(lpUSDC) <= 0 || parseFloat(lpAAA) <= 0) {
          alert("Lutfen her iki miktar alanini da doldurun."); setTxLoading(false); return;
        }
        const stableTokenObj = config.tokens[activePoolType];
        const stableParsed = parseUnits(lpUSDC, stableTokenObj.decimals);
        const aaaParsed = parseUnits(lpAAA, 18);

        const erc20ABI = ["function allowance(address owner, address spender) view returns (uint256)", "function approve(address spender, uint256 amount) returns (bool)"];
        const stableContract = new ethers.Contract(stableTokenObj.address, erc20ABI, signer);
        const aaaContract = new ethers.Contract(config.tokens.AAA.address, erc20ABI, signer);

        const stableBuffer = (BigInt(stableParsed.toString()) * 105n) / 100n;
        const aaaBuffer = (BigInt(aaaParsed.toString()) * 105n) / 100n;

        const allowanceStable = await stableContract.allowance(account, activePool);
        if (isLessThan(allowanceStable, stableParsed)) {
          const txApp = await stableContract.approve(activePool, stableBuffer, { gasLimit: 800000 });
          await txApp.wait();
        }
        const allowanceAAA = await aaaContract.allowance(account, activePool);
        if (isLessThan(allowanceAAA, aaaParsed)) {
          const txApp = await aaaContract.approve(activePool, aaaBuffer, { gasLimit: 800000 });
          await txApp.wait();
        }

        const poolContract = new ethers.Contract(activePool, [
          "function tokenA() view returns (address)",
          "function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256)"
        ], signer);
        let lpTx = await poolContract.addLiquidity(stableParsed, aaaParsed, { gasLimit: 1000000 });
        await lpTx.wait();

        alert("Likidite eklendi!");
        setSpPoints(prev => prev + 150);
        await fetchBalances(); await fetchPoolReserves(activePoolType, fromToken, toToken, activeTab);
      }

      // MINT SAKUSD
      if (type === "mint_sakusd") {
        if (!mintAmount || isNaN(mintAmount) || parseFloat(mintAmount) <= 0) {
          alert("Gecersiz miktar."); setTxLoading(false); return;
        }
        const collateralObj = config.tokens[mintCollateral];
        const amountInParsed = parseUnits(mintAmount, collateralObj.decimals);
        const erc20ABI = ["function allowance(address owner, address spender) view returns (uint256)", "function approve(address spender, uint256 amount) returns (bool)"];
        const collateralContract = new ethers.Contract(collateralObj.address, erc20ABI, signer);
        const amountWithBuffer = (BigInt(amountInParsed.toString()) * 101n) / 100n;
        const currentAllowance = await collateralContract.allowance(account, config.minterAddress);
        if (isLessThan(currentAllowance, amountInParsed)) {
          const appTx = await collateralContract.approve(config.minterAddress, amountWithBuffer, { gasLimit: 800000 });
          await appTx.wait();
        }
        const minterContract = new ethers.Contract(config.minterAddress, ["function mint(address collateralToken, uint256 amountIn) external"], signer);
        const mintTx = await minterContract.mint(collateralObj.address, amountInParsed, { gasLimit: 1000000 });
        await mintTx.wait();
        alert("sakUSD basildi!");
        setSpPoints(prev => prev + 100);
        await fetchBalances();
      }

      // REDEEM SAKUSD
      if (type === "redeem_sakusd") {
        if (!redeemAmount || isNaN(redeemAmount) || parseFloat(redeemAmount) <= 0) {
          alert("Gecersiz miktar."); setTxLoading(false); return;
        }
        const collateralObj = config.tokens[mintCollateral];
        const amountToBurnParsed = parseUnits(redeemAmount, 18); 
        const erc20ABI = ["function allowance(address owner, address spender) view returns (uint256)", "function approve(address spender, uint256 amount) returns (bool)"];
        const sakusdContract = new ethers.Contract(config.tokens.sakUSD.address, erc20ABI, signer);
        const currentAllowance = await sakusdContract.allowance(account, config.minterAddress);
        const burnWithBuffer = (BigInt(amountToBurnParsed.toString()) * 101n) / 100n;
        if (isLessThan(currentAllowance, amountToBurnParsed)) {
          const appTx = await sakusdContract.approve(config.minterAddress, burnWithBuffer, { gasLimit: 800000 });
          await appTx.wait();
        }
        const minterContract = new ethers.Contract(config.minterAddress, ["function redeem(address collateralToken, uint256 sakUSDAmount) external"], signer);
        const redeemTx = await minterContract.redeem(collateralObj.address, amountToBurnParsed, { gasLimit: 1000000 });
        await redeemTx.wait();
        alert("Teminat geri alindi!");
        await fetchBalances();
      }

      // SEND TOKEN
      if (type === "send_token") {
        if (!sendRecipient || !sendAmount || parseFloat(sendAmount) <= 0) {
          alert("Lutfen alici adresi ve miktar girin."); setTxLoading(false); return;
        }
        const tokenObj = config.tokens[sendToken];
        const amountParsed = parseUnits(sendAmount, tokenObj.decimals);
        const erc20ABI = ["function transfer(address to, uint256 amount) returns (bool)"];
        const tokenContract = new ethers.Contract(tokenObj.address, erc20ABI, signer);
        const tx = await tokenContract.transfer(sendRecipient, amountParsed, { gasLimit: 100000 });
        await tx.wait();
        alert(`${sendAmount} ${sendToken} gonderildi!`);
        setSendAmount("0"); setSendRecipient("");
        await fetchBalances();
      }

      // STAKE
      if (type === "stake_sakusd") {
        if (!stakeAmountInput || isNaN(stakeAmountInput) || parseFloat(stakeAmountInput) <= 0) {
          alert("Gecersiz miktar."); setTxLoading(false); return;
        }
        const amountParsed = parseUnits(stakeAmountInput, 18);
        const erc20ABI = ["function allowance(address owner, address spender) view returns (uint256)", "function approve(address spender, uint256 amount) returns (bool)"];
        const sakusdContract = new ethers.Contract(config.tokens.sakUSD.address, erc20ABI, signer);
        const currentAllowance = await sakusdContract.allowance(account, config.minterAddress);
        const stakeWithBuffer = (BigInt(amountParsed.toString()) * 101n) / 100n;
        if (isLessThan(currentAllowance, amountParsed)) {
          const appTx = await sakusdContract.approve(config.minterAddress, stakeWithBuffer, { gasLimit: 800000 });
          await appTx.wait();
        }
        const minterContract = new ethers.Contract(config.minterAddress, ["function stake(uint256 amount) external"], signer);
        const stakeTx = await minterContract.stake(amountParsed, { gasLimit: 1000000 });
        await stakeTx.wait();
        alert("sakUSD stake edildi!");
        setStakeAmountInput("0");
        await fetchBalances(); await fetchSavingsData();
      }

      // REQUEST UNSTAKE
      if (type === "request_unstake") {
        if (!unstakeAmountInput || isNaN(unstakeAmountInput) || parseFloat(unstakeAmountInput) <= 0) {
          alert("Gecersiz miktar."); setTxLoading(false); return;
        }
        const amountParsed = parseUnits(unstakeAmountInput, 18);
        const minterContract = new ethers.Contract(config.minterAddress, ["function requestUnstake(uint256 amount) external"], signer);
        const unstakeTx = await minterContract.requestUnstake(amountParsed, { gasLimit: 1000000 });
        await unstakeTx.wait();
        alert("Geri cekim talebi olusturuldu! 14 gun sonra cekebilirsiniz.");
        setUnstakeAmountInput("0");
        await fetchSavingsData();
      }

      // CLAIM REWARDS
      if (type === "claim_rewards") {
        const minterContract = new ethers.Contract(config.minterAddress, ["function claimRewards() external"], signer);
        const claimTx = await minterContract.claimRewards({ gasLimit: 1000000 });
        await claimTx.wait();
        alert("Oduller talep edildi!");
        await fetchBalances(); await fetchSavingsData();
      }

      // CLAIM UNSTAKED
      if (type === "claim_unstaked_req") {
        const requestIndex = payload;
        const minterContract = new ethers.Contract(config.minterAddress, ["function claimUnstaked(uint256 requestIndex) external"], signer);
        const claimTx = await minterContract.claimUnstaked(requestIndex, { gasLimit: 1000000 });
        await claimTx.wait();
        alert("Geri cekim tamamlandi!");
        await fetchSavingsData();
      }

      // AAVE SUPPLY
      if (type === "aave_supply") {
        if (!config.isAaveSupported) {
          alert("Bu sebekede Aave V3 desteklenmiyor."); setTxLoading(false); return;
        }
        if (!AAVE_SUPPORTED_TOKENS.includes(collateralToken)) {
          alert(`Aave V3 sadece su token'lari destekler: ${AAVE_SUPPORTED_TOKENS.join(", ")}`);
          setTxLoading(false); return;
        }
        const collatObj = config.tokens[collateralToken];
        const amountParsed = parseUnits(supplyAmount, collatObj.decimals);
        const erc20ABI = ["function allowance(address owner, address spender) view returns (uint256)", "function approve(address spender, uint256 amount) returns (bool)"];
        const tokenContract = new ethers.Contract(collatObj.address, erc20ABI, signer);
        const currentAllowance = await tokenContract.allowance(account, config.aavePoolAddress);
        if (isLessThan(currentAllowance, amountParsed)) {
          const appTx = await tokenContract.approve(config.aavePoolAddress, MAX_UINT256, { gasLimit: 800000 });
          await appTx.wait();
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        const aavePoolABI = ["function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external"];
        const poolContract = new ethers.Contract(config.aavePoolAddress, aavePoolABI, signer);
        const tx = await poolContract.supply(collatObj.address, amountParsed, account, 0, { gasLimit: 1000000 });
        await tx.wait();
        alert("Girov Aave'ye yerlestirildi!");
        setSupplyAmount("0");
        await fetchBalances();
      }

      // AAVE BORROW
      if (type === "aave_borrow") {
        if (!config.isAaveSupported) {
          alert("Bu sebekede Aave V3 desteklenmiyor."); setTxLoading(false); return;
        }
        if (!AAVE_SUPPORTED_TOKENS.includes(lendingToken)) {
          alert(`Aave V3 sadece su token'lari destekler: ${AAVE_SUPPORTED_TOKENS.join(", ")}`);
          setTxLoading(false); return;
        }
        const loanObj = config.tokens[lendingToken];
        const amountParsed = parseUnits(borrowAmount, loanObj.decimals);
        const aavePoolABI = ["function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external"];
        const poolContract = new ethers.Contract(config.aavePoolAddress, aavePoolABI, signer);
        const tx = await poolContract.borrow(loanObj.address, amountParsed, 2, 0, account, { gasLimit: 1200000 });
        await tx.wait();
        alert("Borc alma tamamlandi!");
        setBorrowAmount("0");
        await fetchBalances();
      }

      // AAVE REPAY
      if (type === "aave_repay") {
        if (!config.isAaveSupported) {
          alert("Bu sebekede Aave V3 desteklenmiyor."); setTxLoading(false); return;
        }
        if (!AAVE_SUPPORTED_TOKENS.includes(lendingToken)) {
          alert(`Aave V3 sadece su token'lari destekler: ${AAVE_SUPPORTED_TOKENS.join(", ")}`);
          setTxLoading(false); return;
        }
        const loanObj = config.tokens[lendingToken];
        const amountParsed = parseUnits(repayAmount, loanObj.decimals);
        const erc20ABI = ["function allowance(address owner, address spender) view returns (uint256)", "function approve(address spender, uint256 amount) returns (bool)"];
        const tokenContract = new ethers.Contract(loanObj.address, erc20ABI, signer);
        const currentAllowance = await tokenContract.allowance(account, config.aavePoolAddress);
        if (isLessThan(currentAllowance, amountParsed)) {
          const appTx = await tokenContract.approve(config.aavePoolAddress, MAX_UINT256, { gasLimit: 800000 });
          await appTx.wait();
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        const aavePoolABI = ["function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256)"];
        const poolContract = new ethers.Contract(config.aavePoolAddress, aavePoolABI, signer);
        const tx = await poolContract.repay(loanObj.address, amountParsed, 2, account, { gasLimit: 1000000 });
        await tx.wait();
        alert("Borc odendi!");
        setRepayAmount("0");
        await fetchBalances();
      }

    } catch (err) {
      console.error(err);
      alert(`Islem sirasinda hata: ${err.reason || err.message || err}`);
    }
    setTxLoading(false);
  };

  // Faucet fonksiyonu
  const handleFaucet = async (tokenSymbol) => {
    if (tokenSymbol === "USDC" || tokenSymbol === "EURC" || tokenSymbol === "cirBTC") {
      window.open("https://faucet.circle.com/", "_blank"); return;
    }
    if (chainId !== ARC_CHAIN_ID || !provider || !account) {
      alert("Lutfen cuzdaninizi baglayin ve Arc Testnet'e gecin."); return;
    }
    setTxLoading(true);
    try {
      const signer = await getSigner();
      if (tokenSymbol === "AAA") {
        const aaaABI = ["function mint(address to, uint256 amount) external"];
        const aaaContract = new ethers.Contract(ARC_ADDRESSES.AAA, aaaABI, signer);
        const tx = await aaaContract.mint(account, parseUnits("10", 18), { gasLimit: 1000000 });
        await tx.wait();
        alert("10 AAA token aktarildi!");
        await fetchBalances();
      }
    } catch (err) {
      console.error("Faucet hatasi:", err);
      alert("Faucet basarisiz. Owner yetkisini kontrol edin.");
    }
    setTxLoading(false);
  };

  // Aktif sekmeyi render et
  const renderTab = () => {
    const commonProps = {
      tokens, balances, handleAction, txLoading,
      handleNumberInput, handleFocus, handleBlur
    };

    switch (activeTab) {
      case "swap":
        return (
          <SwapTab {...commonProps} provider={provider} chainId={chainId}
            fromToken={fromToken} setFromToken={setFromToken}
            toToken={toToken} setToToken={setToToken}
            amountIn={amountIn} setAmountIn={setAmountIn}
            amountOut={amountOut} setAmountOut={setAmountOut}
            handlePercentClick={handlePercentClick}
          />
        );
      case "pool":
        return (
          <PoolTab {...commonProps}
            poolReserves={poolReserves} userPoolBalances={userPoolBalances}
            activePoolType={activePoolType} setActivePoolType={setActivePoolType}
            lpUSDC={lpUSDC} setLpUSDC={setLpUSDC}
            lpAAA={lpAAA} setLpAAA={setLpAAA}
          />
        );
      case "bridge":
        return (
          <CCTPBridgeTab 
            provider={provider} 
            account={account} 
            chainId={chainId}
            balances={balances}
            switchNetwork={switchNetwork}
          />
        );
      case "mint":
        return (
          <MintTab {...commonProps}
            mintCollateral={mintCollateral} setMintCollateral={setMintCollateral}
            mintAmount={mintAmount} setMintAmount={setMintAmount}
            redeemAmount={redeemAmount} setRedeemAmount={setRedeemAmount}
          />
        );
      case "savings":
        return (
          <SavingsTab {...commonProps}
            savingsData={savingsData}
            stakeAmountInput={stakeAmountInput} setStakeAmountInput={setStakeAmountInput}
            unstakeAmountInput={unstakeAmountInput} setUnstakeAmountInput={setUnstakeAmountInput}
          />
        );
      case "send":
        return (
          <SendTab {...commonProps}
            sendToken={sendToken} setSendToken={setSendToken}
            sendRecipient={sendRecipient} setSendRecipient={setSendRecipient}
            sendAmount={sendAmount} setSendAmount={setSendAmount}
          />
        );
      case "lending":
        return (
          <LendingTab {...commonProps}
            lendingToken={lendingToken} setLendingToken={setLendingToken}
            collateralToken={collateralToken} setCollateralToken={setCollateralToken}
            supplyAmount={supplyAmount} setSupplyAmount={setSupplyAmount}
            borrowAmount={borrowAmount} setBorrowAmount={setBorrowAmount}
            repayAmount={repayAmount} setRepayAmount={setRepayAmount}
          />
        );
      case "faucet":
        return <FaucetTab handleFaucet={handleFaucet} txLoading={txLoading} />;
      default:
        return <SwapTab {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0b0914] text-[#f3f4f6]">
      <Header 
        account={account} chainId={chainId} spPoints={spPoints} balances={balances}
        connectWallet={connectWallet} switchNetwork={switchNetwork}
        activeTab={activeTab} setActiveTab={setActiveTab}
      />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-10">
        <AAABanner account={account} chainId={chainId} balances={balances} tokens={tokens} />
        <StatsCards userPoolBalances={userPoolBalances} tokens={tokens} />

        <div className="max-w-md mx-auto bg-[#13112a] rounded-3xl p-6 border border-gray-800 neon-glow shadow-2xl">
          {renderTab()}
        </div>
      </main>

      <footer className="bg-[#0d0b1a] border-t border-gray-800 py-6 text-center">
        <p className="text-xs text-gray-500">
          ArcSakasena DeFi Protocol • Built on Arc Blockchain L1 • 
          <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline ml-1">Arcscan Explorer</a>
        </p>
      </footer>
    </div>
  );
}

