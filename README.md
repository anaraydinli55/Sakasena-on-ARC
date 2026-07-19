
============================================
SAKASENA ON ARC - DUZELTILMIS PROJE
============================================

DOSYA YAPISI
============================================

src/
├── constants.js          # Sabitler, adresler, yardimci fonksiyonlar
├── networks.js           # Coklu zincir konfigurasyonu
├── App.jsx               # Ana App component
├── hooks/
│   ├── useWallet.js      # Cuzdan baglantisi
│   ├── useBalances.js    # Balans ve havuz verileri
│   └── useSavings.js     # Stake/odul verileri
└── components/
    ├── Header.jsx        # Header + nav tabs
    ├── StatsCards.jsx    # Istatistik kartlari
    ├── AAABanner.jsx     # AAA token banner
    ├── SwapTab.jsx       # Swap sekmesi
    ├── PoolTab.jsx       # Likidite sekmesi
    ├── MintTab.jsx       # Mint/Redeem sekmesi
    ├── SavingsTab.jsx    # Stake/Unstake sekmesi
    ├── SendTab.jsx       # Token gonderme sekmesi
    ├── LendingTab.jsx    # Aave lending sekmesi
    └── FaucetTab.jsx     # Faucet sekmesi


KRITIK DUZELTMELER (Onceki Koddan)
============================================

1. MAX_UINT256 TANIMI
   - Onceki kodda tanimlanmamisti, simdi constants.js'de tanimli

2. AAVE DESTEK KONTROLU
   - Arc Testnet'te Aave YOK (5042002)
   - Sadece Base Sepolia, Ethereum Sepolia, Arbitrum Sepolia, Optimism Sepolia'da var
   - Lending sekmesi sadece desteklenen sebekelerde gorunur

3. TOKEN ADRESLERI
   - Her sebeke icin AYRI adresler
   - Arc disindaki sebekelerde ZERO_ADDRESS (deploy edip degistirin)

4. ARC GAS TOKEN
   - Arc'ta gas USDC ile odenir (ETH degil)
   - switchNetwork fonksiyonu her sebeke icin dogru nativeCurrency kullanir

5. EKSIK FONKSIYONLAR EKLENDI
   - send_token: ERC20 transfer
   - stake_sakusd: Stake
   - request_unstake: Unstake talebi
   - claim_rewards: Odul claim
   - claim_unstaked_req: Unstake claim

6. AAVE TOKEN KONTROLU
   - Sadece resmi Aave V3 token'lari: USDC, USDT, DAI, WETH
   - sakUSD ve AAA Aave'de YOKTUR


DEPLOY ETMENIZ GEREKEN KONTRAKTLAR
============================================

ARC TESTNET (5042002) - ZATEN DEPLOY EDILDI:
  ✅ AAA Token: 0x54552f2ec52423d2fbe94c25f0bad61b9108aae8
  ✅ sakUSD Token: 0x085bc2b26d637685d2d3b742f10d14d8d77557b1
  ✅ Minter: 0x1e27b23bc7662db4accf371b96b14ea5d81e0f83
  ✅ USDC Pool: 0xbe0f19f85a5cd1cac56e6f31c85f6cae805e56c3
  ✅ EURC Pool: 0xbbc6cd33291edfe9e4e927129901db0e58ba705b
  ✅ BTC Pool: 0x1815df186c43506e7d9113e6c1d19326610aa448
  ✅ USDC/EURC Pool: 0xE50eeb474BB6D7Afc148da3023836B2Afa358D3c

BASE SEPOLIA (84532) - DEPLOY EDILMELI:
  ⚠️ sakUSD: 0x7C45c5Ce07E0cf673F48F7A4eF4837c59C0D3281 (var)
  ❌ AAA Token: Deploy edip networks.js'de degistirin
  ❌ Minter: Deploy edip networks.js'de degistirin
  ❌ Pools: Deploy edip networks.js'de degistirin

DIGER SEBEKELER:
  ❌ Tum custom token'lar: ZERO_ADDRESS
  ❌ Minter: ZERO_ADDRESS
  ❌ Pools: ZERO_ADDRESS


KURULUM
============================================

1. Dosyalari indirin ve src/ klasorune yerlestirin
2. Terminalde: npm install
3. Terminalde: npm run dev
4. Tarayicida: http://localhost:5173


GITHUB'A YUKLEME
============================================

1. Her .txt dosyasinin icerigini kopyalayin
2. GitHub'da yeni dosya olusturun (ornegin: src/constants.js)
3. Icerigi yapistirin ve kaydedin
4. Tum dosyalar icin tekrarlayin


ONEMLI NOTLAR
============================================

- Aave V3 sadece resmi token'lari destekler (USDC, USDT, DAI, WETH)
- sakUSD ve AAA'yi Aave'e supply edemezsiniz
- Arc Testnet'te Aave YOKTUR
- Base Sepolia'da Aave V3 var ama sadece resmi token'larla calisir
- Her sebeke icin ayri kontrat deploy etmeniz gerekir
