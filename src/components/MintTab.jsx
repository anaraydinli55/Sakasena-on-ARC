// ============================================
// MINT/REDEEM SEKMESI COMPONENT
// ============================================
export const MintTab = ({
  tokens, balances,
  mintCollateral, setMintCollateral,
  mintAmount, setMintAmount,
  redeemAmount, setRedeemAmount,
  handleAction, txLoading,
  handleNumberInput, handleFocus, handleBlur
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Mint & Redeem SakUSD</h2>

      {/* Mint Section */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Mint SakUSD</h3>

        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Collateral Token</label>
          <select 
            value={mintCollateral} 
            onChange={(e) => setMintCollateral(e.target.value)}
            className="bg-[#211e47] text-white px-3 py-2 rounded-xl font-semibold border border-gray-700 focus:outline-none w-full"
          >
            <option value="USDC">USDC</option>
            <option value="EURC">EURC</option>
            <option value="cirBTC">cirBTC</option>
          </select>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Collateral Amount</label>
            <span className="text-xs text-gray-400">Balance: {balances[mintCollateral]}</span>
          </div>
          <input 
            type="number" 
            value={mintAmount}
            onFocus={handleFocus(mintAmount, setMintAmount)}
            onBlur={handleBlur(mintAmount, setMintAmount)}
            onChange={handleNumberInput(setMintAmount)}
            className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700"
            placeholder="0"
          />
        </div>

        <div className="mb-4 p-3 bg-[#100e21] rounded-xl border border-gray-900">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">You will receive:</span>
            <span className="text-white font-bold">{mintAmount || "0"} sakUSD</span>
          </div>
        </div>

        <button 
          onClick={() => handleAction("mint_sakusd")}
          disabled={txLoading || !mintAmount || parseFloat(mintAmount) <= 0}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl shadow-lg transition disabled:opacity-50"
        >
          {txLoading ? "Islem Yukleniyor..." : "Mint SakUSD"}
        </button>
      </div>

      {/* Redeem Section */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Redeem Collateral</h3>

        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Collateral to Receive</label>
          <select 
            value={mintCollateral} 
            onChange={(e) => setMintCollateral(e.target.value)}
            className="bg-[#211e47] text-white px-3 py-2 rounded-xl font-semibold border border-gray-700 focus:outline-none w-full"
          >
            <option value="USDC">USDC</option>
            <option value="EURC">EURC</option>
            <option value="cirBTC">cirBTC</option>
          </select>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">SakUSD to Burn</label>
            <span className="text-xs text-gray-400">Balance: {balances.sakUSD}</span>
          </div>
          <input 
            type="number" 
            value={redeemAmount}
            onFocus={handleFocus(redeemAmount, setRedeemAmount)}
            onBlur={handleBlur(redeemAmount, setRedeemAmount)}
            onChange={handleNumberInput(setRedeemAmount)}
            className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700"
            placeholder="0"
          />
        </div>

        <button 
          onClick={() => handleAction("redeem_sakusd")}
          disabled={txLoading || !redeemAmount || parseFloat(redeemAmount) <= 0}
          className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold py-3 rounded-2xl shadow-lg transition disabled:opacity-50"
        >
          {txLoading ? "Islem Yukleniyor..." : "Redeem Collateral"}
        </button>
      </div>
    </div>
  );
};
