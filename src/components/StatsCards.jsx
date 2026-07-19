// ============================================
// ISTATISTIK KARTLARI COMPONENT
// ============================================
export const StatsCards = ({ userPoolBalances, tokens }) => {
  return (
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
        <p className="text-lg font-bold text-indigo-300">{userPoolBalances.aaaAmount} {tokens.AAA?.symbol}</p>
      </div>
    </div>
  );
};
