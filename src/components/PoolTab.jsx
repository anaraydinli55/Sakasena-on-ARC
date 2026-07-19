// ============================================
// POOL/LIQUIDITY SEKMESI COMPONENT
// ============================================
export const PoolTab = ({
  tokens, balances, poolReserves, userPoolBalances,
  activePoolType, setActivePoolType,
  lpUSDC, setLpUSDC, lpAAA, setLpAAA,
  handleAction, txLoading,
  handleNumberInput, handleFocus, handleBlur
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Liquidity Pool</h2>

      {/* Pool Stats */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Pool Reserves</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-400">{poolReserves.stableSymbol}</span>
            <p className="text-lg font-bold text-white">{poolReserves.stableAmount}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">AAA</span>
            <p className="text-lg font-bold text-white">{poolReserves.aaaAmount}</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700">
          <span className="text-xs text-gray-400">Total Shares: {poolReserves.totalShares}</span>
        </div>
      </div>

      {/* User Pool Balance */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Your Position</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-400">{userPoolBalances.stableSymbol}</span>
            <p className="text-lg font-bold text-emerald-400">{userPoolBalances.stableAmount}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">AAA</span>
            <p className="text-lg font-bold text-indigo-400">{userPoolBalances.aaaAmount}</p>
          </div>
        </div>
      </div>

      {/* Add Liquidity Form */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Add Liquidity</h3>

        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Pool Type</label>
          <select 
            value={activePoolType} 
            onChange={(e) => setActivePoolType(e.target.value)}
            className="bg-[#211e47] text-white px-3 py-2 rounded-xl font-semibold border border-gray-700 focus:outline-none w-full"
          >
            <option value="USDC">USDC/AAA</option>
            <option value="EURC">EURC/AAA</option>
            <option value="cirBTC">cirBTC/AAA</option>
          </select>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">{activePoolType} Amount</label>
            <span className="text-xs text-gray-400">Balance: {balances[activePoolType]}</span>
          </div>
          <input 
            type="number" 
            value={lpUSDC}
            onFocus={handleFocus(lpUSDC, setLpUSDC)}
            onBlur={handleBlur(lpUSDC, setLpUSDC)}
            onChange={handleNumberInput(setLpUSDC)}
            className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700"
            placeholder="0"
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">AAA Amount</label>
            <span className="text-xs text-gray-400">Balance: {balances.AAA}</span>
          </div>
          <input 
            type="number" 
            value={lpAAA}
            onFocus={handleFocus(lpAAA, setLpAAA)}
            onBlur={handleBlur(lpAAA, setLpAAA)}
            onChange={handleNumberInput(setLpAAA)}
            className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700"
            placeholder="0"
          />
        </div>

        <button 
          onClick={() => handleAction("add_lp")}
          disabled={txLoading || !lpUSDC || !lpAAA || parseFloat(lpUSDC) <= 0 || parseFloat(lpAAA) <= 0}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl shadow-lg transition disabled:opacity-50"
        >
          {txLoading ? "Islem Yukleniyor..." : "Add Liquidity"}
        </button>
      </div>
    </div>
  );
};
