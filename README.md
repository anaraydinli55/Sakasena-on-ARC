ArcSakasena (Sakasena on Arc L1)
ArcSakasena is a decentralized, multi-asset Automated Market Maker (AMM) and Swap protocol designed and optimized specifically for the EVM-compatible Arc L1 Network [1.2.6].
By leveraging Arc's unique architecture—where gas fees are natively paid in USDC (6 decimals)—ArcSakasena provides a frictionless, fast, and capital-efficient trading interface for both stable and volatile digital assets [1.2.6].
Key Features
Hybrid AMM Engine: Implements a constant-sum model for fiat-backed stablecoins (USDC, EURC, USDS) to guarantee near-zero slippage swaps, alongside a dynamic pricing vAMM module for volatile assets like Circle Wrapped Bitcoin (cirBTC) and utility tokens [2.1.2].
Integrated Native USDC Gas: Custom-tailored to align with the Arc Network's transaction fee model, allowing users to execute trades and approvals without holding secondary gas tokens [1.2.6].
Dynamic On-Chain Token Discovery: Features an auto-discovery module that interacts with arbitrary ERC-20 contracts (such as our community utility token anaraydinli AAA and other custom-deployed tokens with over 1,300+ holders) to fetch metadata (name, symbol, decimals) and balances directly from the blockchain [1.1.2, 1.2.2].
Interactive Faucet System: Enables developer-friendly test environments by allowing users to request mock testnet stablecoins and test assets with a single click.
Tech Stack
Frontend: React, Vite, Tailwind CSS (for modern UI/UX and responsive layouts)
Web3 Integration: Ethers.js (v5)
Smart Contracts: Solidity (EVM compatible, compiled under OpenZeppelin standards)
🇹🇷 Türkçe Proje Açıklaması (Yerel Dokümantasyon için)
ArcSakasena (Arc Network Üzerinde Sakasena)
ArcSakasena, EVM uyumlu Arc Network L1 zinciri için özel olarak tasarlanmış ve optimize edilmiş çok varlıklı, merkeziyetsiz bir Otomatik Piyasa Yapıcı (AMM) ve takas (swap) protokolüdür [1.2.6].
İşlem ücretlerinin (gas) doğrudan yerel USDC (6 ondalık basamaklı) ile ödendiği Arc L1 ağının yenilikçi mimarisinden yararlanan ArcSakasena, kullanıcılara hem sabit coinler hem de volatil dijital varlıklar için hızlı, ucuz ve verimli bir ticaret arayüzü sunar [1.2.6].
Öne Çıkan Özellikler
Hibrid AMM Motoru: USDC, EURC ve USDS gibi sabit değerli fiat-pegged varlıklar arasında sıfıra yakın fiyat kayması (slippage) sağlayan sabit-toplam (constant-sum) mekanizmasını; Circle Wrapped Bitcoin (cirBTC) ve anaraydinli AAA gibi volatil varlıklar için ise dinamik fiyatlandırma hesaplamalarını bir arada sunar [2.1.2].
Yerel USDC Gaz Optimizasyonu: Kullanıcıların işlem yapmak için cüzdanlarında başka bir yerel ağ varlığı (ETH vb.) tutma zorunluluğunu ortadan kaldırarak doğrudan USDC ile akıllı sözleşme onaylarını (Approve) ve transferlerini yürütmesini sağlar [1.2.6].
Zincir Üstü Dinamik Token Keşfi: Özel olarak geliştirilmiş on-chain keşif modülü sayesinde, 1.300'den fazla holdera sahip topluluk tokenimiz de dahil olmak üzere deploy edilen tüm ERC-20 sözleşmeleriyle doğrudan konuşarak isim (name), sembol (symbol) ve ondalık basamak (decimals) verilerini dinamik olarak arayüze yükler [1.1.2, 1.2.2].
Testnet Faucet Entegrasyonu: Geliştiriciler ve test kullanıcıları için tasarlanmış tek tıkla çalışan Faucet sistemi, test ağında ihtiyaç duyulan tüm stablecoin ve test varlıklarının saniyeler içinde cüzdanlara tanımlanmasına imkan tanır.
Teknolojik Altyapı
Ön Yüz (Frontend): React, Vite, Tailwind CSS (Hızlı yüklenen, modern ve mobil uyumlu DeFi UI)
Web3 Entegrasyonu: Ethers.js (v5)
Akıllı Sözleşmeler: Solidity (OpenZeppelin standartlarında geliştirilmiş akıllı sözleşme yapısı)



# Sakasena-on-ARC
Swap, Mint , Stake, Pools on ARC Testnet
