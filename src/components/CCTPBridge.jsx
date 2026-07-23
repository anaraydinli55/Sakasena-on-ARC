import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';

// ============================================
// CCTP v2 KONTRAT ADRESLERI (USDC & EURC DESTEKLI)
// ============================================

const CCTP_CONTRACTS = {
  // Ethereum Sepolia (Chain ID: 11155111)
  11155111: {
    domain: 0,
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    eurc: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    nativeCurrency: "ETH",
    gasToken: "ETH",
  },
  // Avalanche Fuji (Chain ID: 43113)
  43113: {
    domain: 1,
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
    eurc: "0x5E44db7996c682E92a960b65AC713a54AD815c6B",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    nativeCurrency: "AVAX",
    gasToken: "AVAX",
  },
  // Optimism Sepolia (Chain ID: 11155420)
  11155420: {
    domain: 2,
    usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    eurc: "0x0000000000000000000000000000000000000000",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    nativeCurrency: "ETH",
    gasToken: "ETH",
  },
  // Arbitrum Sepolia (Chain ID: 421614)
  421614: {
    domain: 3,
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    eurc: "0x3271ff68408398a123F67CE4a42f50005C12423d",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    nativeCurrency: "ETH",
    gasToken: "ETH",
  },
  // Base Sepolia (Chain ID: 84532)
  84532: {
    domain: 6,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    eurc: "0x808456652fdb597867f38412077A9182bf77359F",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    nativeCurrency: "ETH",
    gasToken: "ETH",
  },
  // World Chain Sepolia (Chain ID: 4801)
  4801: {
    domain: 14,
    usdc: "0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88",
    eurc: "0xe479EcA5740Ac65d6E1823bea2f1C08Bc14e954F",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    nativeCurrency: "ETH",
    gasToken: "ETH",
  },
  // Arc Testnet (Chain ID: 5042002)
  5042002: {
    domain: 26,
    usdc: "0x3600000000000000000000000000000000000000",
    eurc: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    nativeCurrency: "USDC",
    gasToken: "USDC",
  },
};

const TOKEN_MESSENGER_ABI = [
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) external",
  "event DepositForBurn(address indexed burnToken, uint256 amount, address indexed depositor, bytes32 mintRecipient, uint32 destinationDomain, bytes32 destinationTokenMessenger, bytes32 destinationCaller, uint256 maxFee, uint32 indexed minFinalityThreshold, bytes hookData)",
  "event MessageSent(bytes message)",
];

const MESSAGE_TRANSMITTER_ABI = [
  "function receiveMessage(bytes calldata message, bytes calldata attestation) external returns (bool success)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
];

// ============================================
// CCTP v2 BRIDGE HOOK
// ============================================

export function useCCTPBridge(account, switchNetwork, onBridgeSuccess) {
  const [bridgeState, setBridgeState] = useState({
    status: 'idle',
    messageHash: null,
    attestation: null,
    nonce: null,
    error: null,
    txHash: null,
  });

  const [bridgeHistory, setBridgeHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cctp_bridge_history') || '[]');
    } catch { return []; }
  });

  const currentChainIdRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('cctp_bridge_history', JSON.stringify(bridgeHistory));
  }, [bridgeHistory]);

  const getCurrentChainId = async () => {
    if (!window.ethereum) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    return Number(network.chainId);
  };

  const getFreshSigner = async () => {
    if (!window.ethereum) throw new Error('MetaMask bulunamadi');
    const freshProvider = new ethers.BrowserProvider(window.ethereum);
    return await freshProvider.getSigner();
  };

  // ============================================
  // ADIM 1: TOKEN APPROVE
  // ============================================
  const approveToken = async (amount, sourceChainId, tokenSymbol) => {
    const config = CCTP_CONTRACTS[sourceChainId];
    if (!config) throw new Error('Desteklenmeyen kaynak agi');

    const tokenAddress = tokenSymbol === "EURC" ? config.eurc : config.usdc;
    if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error(`${tokenSymbol} bu sebekede desteklenmiyor.`);
    }

    const signer = await getFreshSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

    const amountParsed = ethers.parseUnits(amount, 6);
    setBridgeState(s => ({ ...s, status: 'approving' }));

    const tx = await tokenContract.approve(config.tokenMessenger, amountParsed, {
      gasLimit: sourceChainId === 5042002 ? 300000 : 200000
    });
    await tx.wait();
    return { amountParsed, tokenAddress };
  };

  // ============================================
  // ADIM 2: BURN
  // ============================================
  const burnToken = async (amountParsed, tokenAddress, sourceChainId, destChainId, recipient) => {
    const sourceConfig = CCTP_CONTRACTS[sourceChainId];
    const destConfig = CCTP_CONTRACTS[destChainId];
    if (!sourceConfig || !destConfig) throw new Error('Desteklenmeyen ag');

    const signer = await getFreshSigner();
    const messenger = new ethers.Contract(sourceConfig.tokenMessenger, TOKEN_MESSENGER_ABI, signer);

    const mintRecipient = ethers.zeroPadValue(recipient, 32);
    setBridgeState(s => ({ ...s, status: 'burning' }));

    const tx = await messenger.depositForBurn(
      amountParsed,
      destConfig.domain,
      mintRecipient,
      tokenAddress,
      ethers.ZeroHash,
      0,
      2000,
      { gasLimit: sourceChainId === 5042002 ? 800000 : 500000 }
    );

    const receipt = await tx.wait();

    // MessageSent event'ini parse et
    const messageSentEvent = receipt.logs
      .map(log => {
        try {
          return messenger.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(event => event && event.name === 'MessageSent')[0];

    if (!messageSentEvent) {
      throw new Error('MessageSent event bulunamadi. Lutfen CCTP v2 kontrat adreslerini kontrol edin.');
    }

    const messageBytes = messageSentEvent.args.message;
    const messageHash = ethers.keccak256(messageBytes);
    const nonce = messageSentEvent.args.nonce?.toString() || null;

    console.log('Message Hash:', messageHash);
    console.log('Message Bytes:', messageBytes);

    setBridgeState(s => ({
      ...s,
      status: 'polling',
      txHash: tx.hash,
      nonce,
      messageHash,
    }));

    return { txHash: tx.hash, nonce, messageHash, messageBytes };
  };

  // ============================================
  // ADIM 3: ATTESTATION POLLING (CCTP v2)
  // ============================================
  const pollAttestation = async (sourceDomain, txHash, maxAttempts = 360) => {
    const IRIS_API = 'https://iris-api-sandbox.circle.com';

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const url = `${IRIS_API}/v2/messages/${sourceDomain}?transactionHash=${txHash}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            console.log(`Deneme ${i + 1}: Attestation henuz hazir degil...`);
            await new Promise(r => setTimeout(r, 5000));
            continue;
          }
          throw new Error(`API Hatasi: ${response.status}`);
        }

        const data = await response.json();

        if (!data.messages || data.messages.length === 0) {
          console.log(`Deneme ${i + 1}: Mesaj bulunamadi...`);
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }

        const message = data.messages[0];

        if (message.status === 'complete') {
          console.log('Attestation alindi!');
          setBridgeState(s => ({ ...s, attestation: message.attestation }));
          return {
            attestation: message.attestation,
            message: message.message,
          };
        }

        console.log(`Deneme ${i + 1}: Status = ${message.status}`);
        await new Promise(r => setTimeout(r, 5000));

      } catch (err) {
        console.warn(`Polling ${i + 1} failed:`, err.message);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    throw new Error('Attestation zaman asimina ugradi');
  };

  // ============================================
  // ADIM 4: MINT
  // ============================================
  const mintToken = async (message, attestation, destChainId) => {
    const destConfig = CCTP_CONTRACTS[destChainId];
    if (!destConfig) throw new Error('Desteklenmeyen hedef agi');

    const currentChain = await getCurrentChainId();
    if (currentChain !== destChainId) {
      throw new Error(`Ag degisimi tamamlanmadi. Mevcut: ${currentChain}, Hedef: ${destChainId}`);
    }

    const signer = await getFreshSigner();
    const transmitter = new ethers.Contract(destConfig.messageTransmitter, MESSAGE_TRANSMITTER_ABI, signer);

    setBridgeState(s => ({ ...s, status: 'minting' }));

    const tx = await transmitter.receiveMessage(message, attestation, {
      gasLimit: destChainId === 5042002 ? 800000 : 500000
    });
    await tx.wait();

    setBridgeState(s => ({ ...s, status: 'completed' }));
    return tx.hash;
  };

  // ============================================
  // TAM BRIDGE AKISI
  // ============================================
  const executeBridge = async (amount, sourceChainId, destChainId, tokenSymbol, recipientAddress) => {
    if (!account) throw new Error('Cuzdan bagli degil');
    if (!CCTP_CONTRACTS[sourceChainId] || !CCTP_CONTRACTS[destChainId]) {
      throw new Error('Desteklenmeyen ag cifti');
    }
    if (sourceChainId === destChainId) throw new Error('Kaynak ve hedef ayni olamaz');

    try {
      setBridgeState({
        status: 'approving',
        messageHash: null,
        attestation: null,
        nonce: null,
        error: null,
        txHash: null,
      });

      // 1. Approve
      const { amountParsed, tokenAddress } = await approveToken(amount, sourceChainId, tokenSymbol);

      // 2. Burn
      const { txHash, nonce, messageHash, messageBytes } = await burnToken(
        amountParsed, tokenAddress, sourceChainId, destChainId, recipientAddress
      );

      // 3. Poll Attestation
      const sourceConfig = CCTP_CONTRACTS[sourceChainId];
      const attestationData = await pollAttestation(sourceConfig.domain, txHash, 360);

      // 4. Ag degistir
      setBridgeState(s => ({ ...s, status: 'switching' }));
      await switchNetwork(destChainId);

      const waitTime = sourceChainId === 84532 ? 10000 : 6000;
      await new Promise(r => setTimeout(r, waitTime));

      let retries = 0;
      while (retries < 15) {
        const currentChain = await getCurrentChainId();
        if (currentChain === destChainId) {
          console.log('Hedef aga gecildi:', destChainId);
          break;
        }
        console.log('Ag degisimi bekleniyor...', currentChain);
        await new Promise(r => setTimeout(r, 2000));
        retries++;
      }

      // 5. Mint (Guncel message ve attestation verileri ile)
      const mintTxHash = await mintToken(attestationData.message, attestationData.attestation, destChainId);

      const record = {
        id: Date.now(),
        amount,
        tokenSymbol,
        sourceChain: sourceChainId,
        destChain: destChainId,
        sourceTxHash: txHash,
        destTxHash: mintTxHash,
        timestamp: Date.now(),
        status: 'completed',
      };
      setBridgeHistory(prev => [record, ...prev]);

      if (onBridgeSuccess) {
        onBridgeSuccess();
      }

      return record;

    } catch (err) {
      console.error('Bridge hatasi:', err);
      setBridgeState(s => ({ ...s, status: 'error', error: err.message || 'Bilinmeyen hata' }));
      throw err;
    }
  };

  // 🌟 CLAUDE'UN UYARDIĞI EKSIK RESETBRIDGE FONKSIYONU TEKRAR EKLENDI
  const resetBridge = () => {
    setBridgeState({
      status: 'idle',
      messageHash: null,
      attestation: null,
      nonce: null,
      error: null,
      txHash: null,
    });
  };

  return {
    bridgeState,
    bridgeHistory,
    executeBridge,
    resetBridge,
  };
}

// ============================================
// CCTP BRIDGE UI BILESENI
// ============================================

export default function CCTPBridgeTab({ provider, account, chainId, balances = {}, switchNetwork, onBridgeSuccess }) {
  const { bridgeState, bridgeHistory, executeBridge, resetBridge } = 
    useCCTPBridge(account, switchNetwork, onBridgeSuccess);

  const [amount, setAmount] = useState('');
  const [sourceChain, setSourceChain] = useState(5042002);
  const [destChain, setDestChain] = useState(84532);
  const [tokenSymbol, setTokenSymbol] = useState("USDC");
  const [recipientAddress, setRecipientAddress] = useState("");

  useEffect(() => {
    if (account && !recipientAddress) {
      setRecipientAddress(account);
    }
  }, [account]);

  const swapChains = () => {
    const temp = sourceChain;
    setSourceChain(destChain);
    setDestChain(temp);
  };

  const handleBridge = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const targetAddress = recipientAddress || account;
    if (!ethers.isAddress(targetAddress)) {
      alert("Lutfen gecerli bir alici adresi girin.");
      return;
    }

    try {
      const currentProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await currentProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      console.log('Mevcut ag:', currentChainId, 'Kaynak ag:', sourceChain);

      if (currentChainId !== sourceChain) {
        console.log('Kaynak aga geciliyor...');
        await switchNetwork(sourceChain);
        await new Promise(r => setTimeout(r, 4000));
      }

      await executeBridge(amount, sourceChain, destChain, tokenSymbol, targetAddress);
    } catch (err) {
      console.error('Bridge hatasi:', err);
    }
  };

  const getStatusText = () => {
    switch (bridgeState.status) {
      case 'idle': return 'Hazir';
      case 'approving': return `${tokenSymbol} onaylaniyor...`;
      case 'burning': return `${tokenSymbol} yakiliyor (burn)...`;
      case 'polling': return `Attestation bekleniyor... (Nonce: ${bridgeState.nonce || '...'})`;
      case 'switching': return 'Ag degistiriliyor... Lutfen MetaMask\'te onaylayin';
      case 'minting': return `${tokenSymbol} basilip (mint)...`;
      case 'completed': return '✅ Transfer tamamlandi!';
      case 'error': return `❌ Hata: ${bridgeState.error}`;
      default: return '';
    }
  };

  const getStatusColor = () => {
    switch (bridgeState.status) {
      case 'completed': return 'text-emerald-400';
      case 'error': return 'text-rose-400';
      case 'idle': return 'text-gray-400';
      default: return 'text-violet-400 animate-pulse';
    }
  };

  const CHAIN_NAMES = {
    11155111: 'Ethereum Sepolia',
    43113: 'Avalanche Fuji',
    11155420: 'Optimism Sepolia',
    421614: 'Arbitrum Sepolia',
    84532: 'Base Sepolia',
    4801: 'World Chain Sepolia',
    5042002: 'Arc Testnet',
  };

  const GAS_INFO = {
    11155111: 'Gas: ETH',
    43113: 'Gas: AVAX',
    11155420: 'Gas: ETH',
    421614: 'Gas: ETH',
    84532: 'Gas: ETH',
    4801: 'Gas: ETH',
    5042002: 'Gas: USDC',
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
        <span>Circle CCTP v2 Bridge</span>
        <span className="text-xs text-emerald-400 bg-emerald-950 px-2 py-1 rounded-lg">Multi-Asset</span>
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Arc Testnet ↔ Base Sepolia arasinda <strong>USDC / EURC</strong> transferi yapin.
      </p>

      {/* Varlik Secici (USDC / EURC) */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <span className="text-xs text-gray-400 block mb-2">Select Asset (Varlik Secimi)</span>
        <div className="flex space-x-2">
          {["USDC", "EURC"].map((symbol) => {
            const isSupportedOnSource = CCTP_CONTRACTS[sourceChain]?.[symbol.toLowerCase()];
            const isSupportedOnDest = CCTP_CONTRACTS[destChain]?.[symbol.toLowerCase()];
            
            const isSupported = 
              isSupportedOnSource && 
              isSupportedOnSource !== "0x0000000000000000000000000000000000000000" &&
              isSupportedOnDest && 
              isSupportedOnDest !== "0x0000000000000000000000000000000000000000";

            return (
              <button
                key={symbol}
                disabled={!isSupported}
                onClick={() => setTokenSymbol(symbol)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center space-x-1.5 ${
                  tokenSymbol === symbol
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                    : "bg-[#211e47] text-gray-400 hover:text-white"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <span>{symbol === "USDC" ? "💵" : "💶"}</span>
                <span>{symbol}</span>
                {!isSupported && <span className="text-[9px] font-normal text-rose-400 ml-1">(N/A)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zincir Secici */}
      <div className="bg-[#1a1738] p-4 rounded-2xl mb-4 border border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-xs text-gray-400">From (Kaynak)</span>
            <p className="text-xs text-violet-400">{GAS_INFO[sourceChain]}</p>
          </div>
        <select
            value={sourceChain}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSourceChain(val);
              if (destChain === val) {
                const other = Object.keys(CCTP_CONTRACTS).map(Number).find(id => id !== val);
                setDestChain(other);
              }
            }}
            className="bg-[#211e47] text-white px-3 py-1.5 rounded-xl font-semibold border border-gray-700"
          >
            {Object.keys(CCTP_CONTRACTS).map((id) => (
              <option key={id} value={Number(id)}>
                🌐 {CHAIN_NAMES[id]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center my-2">
          <button onClick={swapChains} className="bg-[#211e47] p-2 rounded-full hover:bg-violet-900 transition border border-gray-700">
            ⬇️
          </button>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs text-gray-400">To (Hedef)</span>
            <p className="text-xs text-violet-400">{GAS_INFO[destChain]}</p>
          </div>
          <select
            value={destChain}
            onChange={(e) => {
              const val = Number(e.target.value);
              setDestChain(val);
              if (sourceChain === val) {
                const other = Object.keys(CCTP_CONTRACTS).map(Number).find(id => id !== val);
                setSourceChain(other);
              }
            }}
            className="bg-[#211e47] text-white px-3 py-1.5 rounded-xl font-semibold border border-gray-700"
          >
            {Object.keys(CCTP_CONTRACTS).map((id) => (
              <option key={id} value={Number(id)}>
                🌐 {CHAIN_NAMES[id]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ALICI ADRESI GIRIS ALANI */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">Recipient Address (Alici Adresi)</span>
          {account && (
            <button 
              onClick={() => setRecipientAddress(account)}
              className="text-xs text-violet-400 hover:text-violet-300 font-bold transition"
            >
              Self (Kendim)
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder="0x..."
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700 text-xs font-mono"
        />
      </div>

      {/* Miktar Girisi */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Bridge Amount</span>
          <span>
            Balance: {tokenSymbol === "EURC" ? (balances?.EURC || '0.00') : (balances?.USDC || '0.00')} {tokenSymbol}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-transparent text-2xl font-bold focus:outline-none w-full text-white"
          />
          <span className="text-sm font-semibold text-gray-400">{tokenSymbol === "USDC" ? "💵 USDC" : "💶 EURC"}</span>
        </div>
        <div className="flex space-x-2 mt-3 pt-2 border-t border-[#2a2456]/40">
          {[25, 50, 75, 100].map(p => (
            <button
              key={p}
              onClick={() => {
                const maxBal = tokenSymbol === "EURC" ? (balances?.EURC || 0) : (balances?.USDC || 0);
                setAmount((parseFloat(maxBal) * p / 100).toFixed(2));
              }}
              className="bg-[#211e47] hover:bg-violet-900 hover:text-white text-[10px] text-gray-400 font-bold px-3 py-1 rounded-lg transition"
            >
              {p === 100 ? 'MAX' : `${p}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Durum Gosterimi */}
      {bridgeState.status !== 'idle' && (
        <div className="bg-[#100e21] p-4 rounded-2xl mb-4 border border-gray-900">
          <div className={`text-sm font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          {bridgeState.txHash && (
            <p className="text-xs text-gray-500 mt-1 font-mono truncate">
              TX: {bridgeState.txHash}
            </p>
          )}
          {bridgeState.messageHash && (
            <p className="text-xs text-gray-500 mt-1 font-mono truncate">
              Msg: {bridgeState.messageHash.slice(0, 20)}...
            </p>
          )}
          {bridgeState.error && (
            <div className="mt-2">
              <p className="text-xs text-rose-400 mb-2">{bridgeState.error}</p>
              <button onClick={resetBridge} className="text-xs text-violet-400 hover:text-violet-300 underline">
                Tekrar Dene
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bridge Butonu */}
      {account ? (
        <button
          onClick={handleBridge}
          disabled={bridgeState.status !== 'idle' && bridgeState.status !== 'error' || !amount || parseFloat(amount) <= 0}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-white transition shadow-lg disabled:opacity-50"
        >
          {bridgeState.status === 'idle' || bridgeState.status === 'error'
            ? `Bridge ${tokenSymbol} → ${CHAIN_NAMES[destChain]}`
            : 'Islem Devam Ediyor...'}
        </button>
      ) : (
        <button className="w-full py-4 rounded-2xl bg-gray-700 text-gray-400 font-bold disabled:opacity-50">
          Cuzdan Baglayin
        </button>
      )}

      {/* Bridge Gecmisi */}
      {bridgeHistory.length > 0 && (
        <div className="mt-6 bg-[#100e21] p-4 rounded-2xl border border-gray-900">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-3">
            Bridge Gecmisi
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {bridgeHistory.map((record) => (
              <div key={record.id} className="text-xs bg-[#16142d] p-3 rounded-xl border border-gray-800">
                <div className="flex justify-between">
                  <span className="text-white font-bold">{record.amount} {record.tokenSymbol || 'USDC'}</span>
                  <span className="text-emerald-400">{record.status}</span>
                </div>
                <div className="text-gray-500 mt-1">
                  {CHAIN_NAMES[record.sourceChain]} → {CHAIN_NAMES[record.destChain]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
