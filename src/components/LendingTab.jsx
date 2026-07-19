// ============================================
// LENDING/AAVE SEKMESI COMPONENT
// ============================================
import { AAVE_SUPPORTED_TOKENS } from './constants';

export const LendingTab = ({
  tokens, balances,
  lendingToken, setLendingToken,
  collateralToken, setCollateralToken,
  supplyAmount, setSupplyAmount,
  borrowAmount, setBorrowAmount,
  repayAmount, setRepayAmount,
  handleAction, txLoading,
  handleNumberInput, handleFocus, handleBlur
}) => {
  // Sadece Aave desteklenen token'lari goster
  const availableTokens = Object.keys(tokens).filter(t => AAVE_SUPPORTED_TOKENS.includes(t));

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Aave V3 Lending</h2>

      {/* Supply */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Supply Collateral</h3>

        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Collateral Token</label>
          <select 
            value={collateralToken} 
            onChange={(e) => setCollateralToken(e.target.value)}
            className="bg-[#211e47] text-white px-3 py-2 rounded-xl font-semibold border border-gray-700 focus:outline-none w-full"
          >
            {availableTokens.map(t => (
              <option key={t} value={t}>{tokens[t].icon} {tokens[t].symbol}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Amount</label>
            <span className="text-xs text-gray-400">Balance: {balances[collateralToken]}</span>
          </div>
          <input 
            type="number" 
            value={supplyAmount}
            onFocus={handleFocus(supplyAmount, setSupplyAmount)}
            onBlur={handleBlur(supplyAmount, setSupplyAmount)}
            onChange={handleNumberInput(setSupplyAmount)}
            className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700"
            placeholder="0"
          />
        </div>

        <button 
          onClick={() => handleAction("aave_supply")}
          disabled={txLoading || !supplyAmount || parseFloat(supplyAmount) <= 0}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl shadow-lg transition disabled:opacity-50"
        >
          {txLoading ? "Islem Yukleniyor..." : "Supply to Aave"}
        </button>
      </div>

      {/* Borrow */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Borrow</h3>

        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Token to Borrow</label>
          <select 
            value={lendingToken} 
            onChange={(e) => setLendingToken(e.target.value)}
            className="bg-[#211e47] text-white px-3 py-2 rounded-xl font-semibold border border-gray-700 focus:outline-none w-full"
          >
            {availableTokens.map(t => (
              <option key={t} value={t}>{tokens[t].icon} {tokens[t].symbol}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Amount</label>
            <span className="text-xs text-gray-400">Available: {balances[lendingToken]}</span>
          </div>
          <input 
            type="number" 
            value={borrowAmount}
            onFocus={handleFocus(borrowAmount, setBorrowAmount)}
            onBlur={handleBlur(borrowAmount, setBorrowAmount)}
            onChange={handleNumberInput(setBorrowAmount)}
            className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700"
            placeholder="0"
          />
        </div>

        <button 
          onClick={() => handleAction("aave_borrow")}
          disabled={txLoading || !borrowAmount || parseFloat(borrowAmount) <= 0}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 rounded-2xl shadow-lg transition disabled:opacity-50"
        >
          {txLoading ? "Islem Yukleniyor..." : "Borrow"}
        </button>
      </div>

      {/* Repay */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Repay Loan</h3>

        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Token to Repay</label>
          <select 
            value={lendingToken} 
            onChange={(e) => setLendingToken(e.target.value)}
            className="bg-[#211e47] text-white px-3 py-2 rounded-xl font-semibold border border-gray-700 focus:outline-none w-full"
          >
            {availableTokens.map(t => (
              <option key={t} value={t}>{tokens[t].icon} {tokens[t].symbol}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Amount</label>
            <span className="text-xs text-gray-400">Balance: {balances[lendingToken]}</span>
          </div>
          <input 
            type="number" 
            value={repayAmount}
            onFocus={handleFocus(repayAmount, setRepayAmount)}
            onBlur={handleBlur(repayAmount, setRepayAmount)}
            onChange={handleNumberInput(setRepayAmount)}
            className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700"
            placeholder="0"
          />
        </div>

        <button 
          onClick={() => handleAction("aave_repay")}
          disabled={txLoading || !repayAmount || parseFloat(repayAmount) <= 0}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-2xl shadow-lg transition disabled:opacity-50"
        >
          {txLoading ? "Islem Yukleniyor..." : "Repay"}
        </button>
      </div>
    </div>
  );
};
