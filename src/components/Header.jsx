// ============================================
// HEADER COMPONENT (GUNCELLENMIS - Bridge Sekmesi Eklendi)
// ============================================
import { isAaveSupported } from './constants';
import { NETWORKS } from './networks';

export const Header = ({ 
  account, chainId, spPoints, balances, 
  connectWallet, switchNetwork, activeTab, setActiveTab
}) => {

  const getAvailableTabs = () => {
    const baseTabs = ["swap", "pool", "bridge", "mint", "savings", "send", "faucet"];
    if (isAaveSupported(chainId)) return [...baseTabs, "lending"];
    return baseTabs;
  };

  const getTabLabel = (tab) => {
    const labels = {
      swap: "Swap", 
      pool: "Liquidity", 
      bridge: "Bridge",
      mint: "Mint SakUSD",
      savings: "Savings", 
      send: "Send", 
      faucet: "Faucet",
      lending: "Borrow & Repay"
    };
    return labels[tab] || tab;
  };

  return (
    <header className="border-b border-gray-800 bg-[#0d0b1a] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Logo */}
      <div className="flex items-center space-x-3 shrink-0">
        <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          ArcSakasena
        </span>
        <span className="text-xs bg-indigo-900 text-indigo-200 px-2.5 py-0.5 rounded-full font-semibold">
          Arc Chain L1
        </span>
      </div>

      {/* Nav Tabs */}
      <div className="grid grid-cols-4 md:flex bg-[#100e1f] p-1 rounded-xl border border-gray-800 shrink-0 w-full md:w-auto max-w-sm md:max-w-none">
        {getAvailableTabs().map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold capitalize transition ${
              activeTab === tab 
                ? "bg-violet-900 text-white shadow-md shadow-violet-900/30" 
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-3 shrink-0">
        {account && (
          <div className="hidden md:flex items-center space-x-2 bg-gray-900 px-3 py-1.5 rounded-lg text-sm border border-gray-800">
            <span className="text-violet-400 font-bold">💎 {spPoints} SP</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-300">Gas (USDC): {balances.USDC || "0.00"}</span>
          </div>
        )}

        {account && (
          <select
            value={chainId || 5042002}
            onChange={(e) => switchNetwork(Number(e.target.value))}
            className="bg-[#100e1f] text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-800 focus:outline-none focus:border-violet-600 transition"
          >
            {Object.keys(NETWORKS).map((id) => (
              <option key={id} value={id}>🌐 {NETWORKS[id].name}</option>
            ))}
          </select>
        )}

        {account ? (
          <button 
            onClick={() => switchNetwork(chainId)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              NETWORKS[chainId] 
                ? "bg-emerald-950 text-emerald-400 border border-emerald-800" 
                : "bg-rose-950 text-rose-400 border border-rose-800 animate-pulse"
            }`}
          >
            {NETWORKS[chainId] ? "Connected" : "Wrong Network"}
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
  );
};
