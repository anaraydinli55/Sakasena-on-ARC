// ============================================
// SAVINGS/STAKE SEKMESI COMPONENT
// ============================================
export const SavingsTab = ({
  balances, savingsData,
  stakeAmountInput, setStakeAmountInput,
  unstakeAmountInput, setUnstakeAmountInput,
  handleAction, txLoading,
  handleNumberInput, handleFocus, handleBlur
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Savings & Staking</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#1c183a] p-4 rounded-2xl border border-gray-800 text-center">
          <span className="text-xs text-gray-400 block">Staked Amount</span>
          <p className="text-xl font-bold text-violet-300">{savingsData.staked} sakUSD</p>
        </div>
        <div className="bg-[#1c183a] p-4 rounded-2xl border border-gray-800 text-center">
          <span className="text-xs text-gray-400 block">Pending Rewards</span>
          <p className="text-xl font-bold text-emerald-400">{savingsData.pendingRewards} sakUSD</p>
        </div>
      </div>

      {/* Stake */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Stake SakUSD</h3>
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Amount</label>
            <span className="text-xs text-gray-400">Balance: {balances.sakUSD}</span>
          </div>
          <input 
            type="number" 
            value={stakeAmountInput}
            onFocus={handleFocus(stakeAmountInput, setStakeAmountInput)}
            onBlur={handleBlur(stakeAmountInput, setStakeAmountInput)}
            onChange={handleNumberInput(setStakeAmountInput)}
            className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700"
            placeholder="0"
          />
        </div>
        <button 
          onClick={() => handleAction("stake_sakusd")}
          disabled={txLoading || !stakeAmountInput || parseFloat(stakeAmountInput) <= 0}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl shadow-lg transition disabled:opacity-50"
        >
          {txLoading ? "Islem Yukleniyor..." : "Stake"}
        </button>
      </div>

      {/* Request Unstake */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Request Unstake</h3>
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Amount</label>
            <span className="text-xs text-gray-400">Staked: {savingsData.staked}</span>
          </div>
          <input 
            type="number" 
            value={unstakeAmountInput}
            onFocus={handleFocus(unstakeAmountInput, setUnstakeAmountInput)}
            onBlur={handleBlur(unstakeAmountInput, setUnstakeAmountInput)}
            onChange={handleNumberInput(setUnstakeAmountInput)}
            className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700"
            placeholder="0"
          />
        </div>
        <button 
          onClick={() => handleAction("request_unstake")}
          disabled={txLoading || !unstakeAmountInput || parseFloat(unstakeAmountInput) <= 0}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 rounded-2xl shadow-lg transition disabled:opacity-50"
        >
          {txLoading ? "Islem Yukleniyor..." : "Request Unstake (14 days)"}
        </button>
      </div>

      {/* Claim Rewards */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Claim Rewards</h3>
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-400">Available:</span>
          <span className="text-emerald-400 font-bold">{savingsData.pendingRewards} sakUSD</span>
        </div>
        <button 
          onClick={() => handleAction("claim_rewards")}
          disabled={txLoading || parseFloat(savingsData.pendingRewards) <= 0}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-2xl shadow-lg transition disabled:opacity-50"
        >
          {txLoading ? "Islem Yukleniyor..." : "Claim Rewards"}
        </button>
      </div>

      {/* Unstake Requests */}
      {savingsData.requests.length > 0 && (
        <div className="bg-[#1c183a] p-4 rounded-2xl border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Pending Unstake Requests</h3>
          {savingsData.requests.map((req) => (
            <div key={req.index} className="flex justify-between items-center p-3 bg-[#100e21] rounded-xl mb-2 border border-gray-900">
              <div>
                <span className="text-white font-bold">{req.amount} sakUSD</span>
                <span className="text-xs text-gray-400 block">
                  Release: {new Date(req.releaseTime * 1000).toLocaleDateString()}
                </span>
              </div>
              <button 
                onClick={() => handleAction("claim_unstaked_req", req.index)}
                disabled={txLoading || Date.now() / 1000 < req.releaseTime}
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                Claim
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
