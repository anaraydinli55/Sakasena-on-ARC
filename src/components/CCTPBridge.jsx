import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// ============================================
// CCTP v2 KONTRAT ADRESLERİ
// ============================================

const CCTP_CONTRACTS = {
  // Arc Testnet (Domain: 26)
  5042002: {
    domain: 26,
    usdc: "0x3600000000000000000000000000000000000000",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
  },
  // Base Sepolia (Domain: 6)
  84532: {
    domain: 6,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessenger: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
    messageTransmitter: "0xe7b84D8846c96Bb83155Da5537625c75e42d6E42",
  },
};

// ============================================
// CCTP v2 ABI'LER
// ============================================

const TOKEN_MESSENGER_ABI = [
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) external returns (uint64 nonce)",
  "function depositForBurnWithCaller(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller) external returns (uint64 nonce)",
  "function replaceDepositForBurn(bytes32 originalMessage, bytes calldata originalAttestation, bytes32 newDestinationCaller, bytes32 newMintRecipient) external",
];

const MESSAGE_TRANSMITTER_ABI = [
  "function receiveMessage(bytes calldata message, bytes calldata attestation) external returns (bool success)",
  "function usedNonces(bytes32) view returns (uint256)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// ============================================
// CCTP v2 BRIDGE HOOK
// ============================================

export function useCCTPBridge(provider, account, chainId, switchNetwork) {
  const [bridgeState, setBridgeState] = useState({
    status: 'idle', // idle | approving | burning | polling | switching | minting | completed | error
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

  // Bridge geçmişini kaydet
  useEffect(() => {
    localStorage.setItem('cctp_bridge_history', JSON.stringify(bridgeHistory));
  }, [bridgeHistory]);

  // ============================================
  // ADIM 1: USDC APPROVE (TokenMessenger'a)
  // ============================================
  const approveUSDC = async (amount, sourceChainId) => {
    const config = CCTP_CONTRACTS[sourceChainId];
    if (!config) throw new Error('Desteklenmeyen kaynak ağı');

    const signer = provider.getSigner ? await provider.getSigner() : provider.getSigner();
    const usdcContract = new ethers.Contract(config.usdc, ERC20_ABI, signer);

    const decimals = 6; // USDC decimals
    const amountParsed = ethers.parseUnits ? ethers.parseUnits(amount, decimals) : ethers.utils.parseUnits(amount, decimals);

    setBridgeState(s => ({ ...s, status: 'approving' }));

    const tx = await usdcContract.approve(config.tokenMessenger, amountParsed, {
      gasLimit: 200000,
    });

    await tx.wait();
    return amountParsed;
  };

  // ============================================
  // ADIM 2: BURN (depositForBurn)
  // ============================================
  const burnUSDC = async (amountParsed, sourceChainId, destChainId, recipient) => {
    const sourceConfig = CCTP_CONTRACTS[sourceChainId];
    const destConfig = CCTP_CONTRACTS[destChainId];

    if (!sourceConfig || !destConfig) throw new Error('Desteklenmeyen ağ');

    const signer = provider.getSigner ? await provider.getSigner() : provider.getSigner();
    const messenger = new ethers.Contract(sourceConfig.tokenMessenger, TOKEN_MESSENGER_ABI, signer);

    // Recipient adresini bytes32'e çevir
    const mintRecipient = ethers.zeroPadValue 
      ? ethers.zeroPadValue(recipient, 32)
      : ethers.utils.hexZeroPad(recipient, 32);

    setBridgeState(s => ({ ...s, status: 'burning' }));

const tx = await messenger.depositForBurn(
  amountParsed,
  destConfig.domain,
  mintRecipient,
  sourceConfig.usdc,
  { gasLimit: 500000 }
);

    const receipt = await tx.wait();

    // Nonce'yi event'ten çıkar
    const event = receipt.logs.find(log => {
      try {
        const parsed = messenger.interface.parseLog(log);
        return parsed && parsed.name === 'DepositForBurn';
      } catch { return false; }
    });

    const nonce = event ? event.args.nonce.toString() : null;

    // Message hash'i hesapla
    const messageHash = ethers.keccak256 
      ? ethers.keccak256(event?.data || '0x')
      : ethers.utils.keccak256(event?.data || '0x');

    setBridgeState(s => ({
      ...s,
      status: 'polling',
      txHash: tx.hash,
      nonce,
      messageHash,
    }));

    return { txHash: tx.hash, nonce, messageHash };
  };

  // ============================================
  // ADIM 3: ATTESTATION POLLING (Circle IRIS API)
  // ============================================
  const pollAttestation = async (messageHash, maxAttempts = 60) => {
    const IRIS_API = 'https://iris-api-sandbox.circle.com';

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${IRIS_API}/attestations/${messageHash}`);
        const data = await response.json();

        if (data.attestation && data.attestation !== '0x') {
          setBridgeState(s => ({ ...s, attestation: data.attestation }));
          return data.attestation;
        }

        // Her 5 saniyede bir dene (toplam 5 dakika)
        await new Promise(r => setTimeout(r, 5000));

      } catch (err) {
        console.warn(`Attestation polling attempt ${i + 1} failed:`, err);
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    throw new Error('Attestation 5 dakika içinde alınamadı');
  };

  // ============================================
  // ADIM 4: MINT (receiveMessage)
  // ============================================
  const mintUSDC = async (message, attestation, destChainId) => {
    const destConfig = CCTP_CONTRACTS[destChainId];
    if (!destConfig) throw new Error('Desteklenmeyen hedef ağı');

    const signer = provider.getSigner ? await provider.getSigner() : provider.getSigner();
    const transmitter = new ethers.Contract(destConfig.messageTransmitter, MESSAGE_TRANSMITTER_ABI, signer);

    setBridgeState(s => ({ ...s, status: 'minting' }));

    const tx = await transmitter.receiveMessage(message, attestation, {
      gasLimit: 500000,
    });

    await tx.wait();

    setBridgeState(s => ({ ...s, status: 'completed' }));

    return tx.hash;
  };

  // ============================================
  // TAM BRIDGE AKIŞI (Tek Fonksiyon)
  // ============================================
  const executeBridge = async (amount, sourceChainId, destChainId) => {
    if (!account) throw new Error('Cüzdan bağlı değil');
    if (!CCTP_CONTRACTS[sourceChainId] || !CCTP_CONTRACTS[destChainId]) {
      throw new Error('Desteklenmeyen ağ çifti');
    }
    if (sourceChainId === destChainId) {
      throw new Error('Kaynak ve hedef aynı olamaz');
    }

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
      const amountParsed = await approveUSDC(amount, sourceChainId);

      // 2. Burn
      const { txHash, nonce, messageHash } = await burnUSDC(
        amountParsed,
        sourceChainId,
        destChainId,
        account
      );

      // 3. Poll Attestation
      const attestation = await pollAttestation(messageHash);

      // 4. Ağ değiştir
      setBridgeState(s => ({ ...s, status: 'switching' }));
      await switchNetwork(destChainId);

      // Ağ değişikliğinin tamamlanması için bekle
      await new Promise(r => setTimeout(r, 3000));

      // 5. Mint
      // Message'ı IRIS API'den al
      const IRIS_API = 'https://iris-api-sandbox.circle.com';
      const msgResponse = await fetch(`${IRIS_API}/messages/${messageHash}`);
      const msgData = await msgResponse.json();

      const mintTxHash = await mintUSDC(msgData.message, attestation, destChainId);

      // Geçmişe kaydet
      const record = {
        id: Date.now(),
        amount,
        sourceChain: sourceChainId,
        destChain: destChainId,
        sourceTxHash: txHash,
        destTxHash: mintTxHash,
        timestamp: Date.now(),
        status: 'completed',
      };

      setBridgeHistory(prev => [record, ...prev]);

      return record;

    } catch (err) {
      setBridgeState(s => ({ ...s, status: 'error', error: err.message }));
      throw err;
    }
  };

  // Bridge durumunu sıfırla
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
    CCTP_CONTRACTS,
  };
}

// ============================================
// CCTP BRIDGE UI BİLEŞENİ
// ============================================

export default function CCTPBridgeTab({ provider, account, chainId, balances, switchNetwork }) {
  const { bridgeState, bridgeHistory, executeBridge, resetBridge, CCTP_CONTRACTS } = 
    useCCTPBridge(provider, account, chainId, switchNetwork);

  const [amount, setAmount] = useState('');
  const [sourceChain, setSourceChain] = useState(5042002); // Arc
  const [destChain, setDestChain] = useState(84532); // Base Sepolia

  // Zincir çiftini değiştir
  const swapChains = () => {
    setSourceChain(destChain);
    setSourceChain(sourceChain);
    // Doğru swap
    const temp = sourceChain;
    setSourceChain(destChain);
    setDestChain(temp);
  };

  const handleBridge = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    // Kaynak ağda mı kontrol et
    if (chainId !== sourceChain) {
      await switchNetwork(sourceChain);
      await new Promise(r => setTimeout(r, 2000));
    }

    await executeBridge(amount, sourceChain, destChain);
  };

  const getStatusText = () => {
    switch (bridgeState.status) {
      case 'idle': return 'Hazır';
      case 'approving': return 'USDC onaylanıyor...';
      case 'burning': return 'USDC yakılıyor (burn)...';
      case 'polling': return `Attestation bekleniyor... (Nonce: ${bridgeState.nonce || '...'})`;
      case 'switching': return 'Ağ değiştiriliyor...';
      case 'minting': return 'USDC basılıyor (mint)...';
      case 'completed': return '✅ Transfer tamamlandı!';
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
    5042002: 'Arc Testnet',
    84532: 'Base Sepolia',
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
        <span>Circle CCTP v2 Bridge</span>
        <span className="text-xs text-emerald-400 bg-emerald-950 px-2 py-1 rounded-lg">USDC Only</span>
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Arc Testnet ↔ Base Sepolia arasında <strong>USDC</strong> transferi yapın. 
        Circle CCTP v2 ile güvenli ve hızlı cross-chain transfer.
      </p>

      {/* Zincir Seçici */}
      <div className="bg-[#1a1738] p-4 rounded-2xl mb-4 border border-gray-800">
        {/* Kaynak */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-400">From (Kaynak)</span>
          <select
            value={sourceChain}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSourceChain(val);
              if (destChain === val) setDestChain(val === 5042002 ? 84532 : 5042002);
            }}
            className="bg-[#211e47] text-white px-3 py-1.5 rounded-xl font-semibold border border-gray-700"
          >
            <option value={5042002}>🌐 Arc Testnet</option>
            <option value={84532}>🌐 Base Sepolia</option>
          </select>
        </div>

        {/* Swap Butonu */}
        <div className="flex justify-center my-2">
          <button
            onClick={swapChains}
            className="bg-[#211e47] p-2 rounded-full hover:bg-violet-900 transition border border-gray-700"
          >
            ⬇️
          </button>
        </div>

        {/* Hedef */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">To (Hedef)</span>
          <select
            value={destChain}
            onChange={(e) => {
              const val = Number(e.target.value);
              setDestChain(val);
              if (sourceChain === val) setSourceChain(val === 5042002 ? 84532 : 5042002);
            }}
            className="bg-[#211e47] text-white px-3 py-1.5 rounded-xl font-semibold border border-gray-700"
          >
            <option value={84532}>🌐 Base Sepolia</option>
            <option value={5042002}>🌐 Arc Testnet</option>
          </select>
        </div>
      </div>

      {/* Miktar Girişi */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Bridge Amount</span>
          <span>Balance: {balances.USDC || '0.00'} USDC</span>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-transparent text-2xl font-bold focus:outline-none w-full text-white"
          />
          <span className="text-sm font-semibold text-gray-400">💵 USDC</span>
        </div>
        <div className="flex space-x-2 mt-3 pt-2 border-t border-[#2a2456]/40">
          {[25, 50, 75, 100].map(p => (
            <button
              key={p}
              onClick={() => setAmount((parseFloat(balances.USDC || 0) * p / 100).toFixed(2))}
              className="bg-[#211e47] hover:bg-violet-900 hover:text-white text-[10px] text-gray-400 font-bold px-3 py-1 rounded-lg transition"
            >
              {p === 100 ? 'MAX' : `${p}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Durum Gösterimi */}
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
            <button
              onClick={resetBridge}
              className="mt-2 text-xs text-violet-400 hover:text-violet-300 underline"
            >
              Tekrar Dene
            </button>
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
            ? `Bridge USDC → ${CHAIN_NAMES[destChain]}`
            : 'İşlem Devam Ediyor...'}
        </button>
      ) : (
        <button className="w-full py-4 rounded-2xl bg-gray-700 text-gray-400 font-bold disabled:opacity-50">
          Cüzdan Bağlayın
        </button>
      )}

      {/* Bridge Geçmişi */}
      {bridgeHistory.length > 0 && (
        <div className="mt-6 bg-[#100e21] p-4 rounded-2xl border border-gray-900">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-3">
            Bridge Geçmişi
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {bridgeHistory.map((record) => (
              <div key={record.id} className="text-xs bg-[#16142d] p-3 rounded-xl border border-gray-800">
                <div className="flex justify-between">
                  <span className="text-white font-bold">{record.amount} USDC</span>
                  <span className="text-emerald-400">{record.status}</span>
                </div>
                <div className="text-gray-500 mt-1">
                  {CHAIN_NAMES[record.sourceChain]} → {CHAIN_NAMES[record.destChain]}
                </div>
                <div className="text-gray-600 mt-0.5">
                  {new Date(record.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
