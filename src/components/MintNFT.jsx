import { useState } from 'react';
import { ethers } from 'ethers';

// Sizin deploy ettiğiniz NFT sözleşme bilgileri
const NFT_CONTRACT_ADDRESS = "0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B"; 
const NFT_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "to", "type": "address" }],
    "name": "safeMint", // Kontratınızdaki fonksiyon ismini kontrol edin (mint veya safeMint)
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const ARC_TESTNET_CHAIN_ID = "0x4cef52"; // 5042002 on decimal

export default function MintNFT() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");

  const mintNFT = async () => {
    if (!window.ethereum) {
      setStatus("Lütfen MetaMask veya uyumlu bir Web3 cüzdanı kurun.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Cüzdana bağlanılıyor...");

      // 1. Cüzdan bağlantısını iste
      const provider = new ethers.BrowserProvider(window.ethereum); // ethers v6 için
      // Not: ethers v5 kullanıyorsanız: new ethers.providers.Web3Provider(window.ethereum)
      
      const accounts = await provider.send("eth_requestAccounts", []);
      const userAddress = accounts[0];

      // 2. Doğru ağda (Arc Testnet) olup olmadığını kontrol et
      const { chainId } = await provider.getNetwork();
      if (chainId !== 5042002n && chainId !== 5042002) {
        setStatus("Lütfen cüzdanınızdan Arc Testnet ağına geçiş yapın.");
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ARC_TESTNET_CHAIN_ID }],
          });
        } catch (switchError) {
          setStatus("Ağ değiştirme başarısız oldu. Lütfen manuel olarak Arc Testnet'e geçin.");
          setLoading(false);
          return;
        }
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);

      setStatus("İşlem cüzdandan onaylanıyor...");
      
      // safeMint fonksiyonunu çağır ve kullanıcının kendi adresine mint et
      const tx = await contract.safeMint(userAddress);
      
      setStatus("İşlem ağa gönderildi, onay bekleniyor...");
      setTxHash(tx.hash);

      await tx.wait(); // Blok onayını bekle

      setStatus("Başarılı! NFT başarıyla mint edildi.");
    } catch (error) {
      console.error(error);
      setStatus("İşlem sırasında bir hata oluştu: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto', textAlign: 'center' }}>
      <h2>Arc Testnet NFT Mint</h2>
      <p style={{ color: '#666' }}>
        Sözleşme Adresi: <span style={{ fontSize: '12px' }}>{NFT_CONTRACT_ADDRESS}</span>
      </p>
      
      <button 
        onClick={mintNFT} 
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '20px'
        }}
      >
        {loading ? "Mint Ediliyor..." : "NFT Mint Et"}
      </button>

      {status && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{status}</p>}
      
      {txHash && (
        <p style={{ marginTop: '10px' }}>
          <a 
            href={`https://testnet.arcscan.app/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#2196F3', textDecoration: 'underline' }}
          >
            İşlemi ArcScan üzerinde görüntüle
          </a>
        </p>
      )}
    </div>
  );
}
