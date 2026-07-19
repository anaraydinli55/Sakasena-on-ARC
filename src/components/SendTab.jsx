// ============================================
// SEND TOKEN SEKMESI COMPONENT
// ============================================
export const SendTab = ({
  tokens, balances,
  sendToken, setSendToken,
  sendRecipient, setSendRecipient,
  sendAmount, setSendAmount,
  handleAction, txLoading,
  handleNumberInput, handleFocus, handleBlur
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Send Tokens</h2>

      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Transfer Details</h3>

        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Token</label>
          <select 
            value={sendToken} 
            onChange={(e) => setSendToken(e.target.value)}
            className="bg-[#211e47] text-white px-3 py-2 rounded-xl font-semibold border border-gray-700 focus:outline-none w-full"
          >
            {Object.keys(tokens).map(t => (
              <option key={t} value={t}>{tokens[t].icon} {tokens[t].symbol}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Recipient Address</label>
          <input 
            type="text" 
            value={sendRecipient}
            onChange={(e) => setSendRecipient(e.target.value)}
            className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700"
            placeholder="0x..."
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Amount</label>
            <span className="text-xs text-gray-400">Balance: {balances[sendToken]}</span>
          </div>
          <input 
            type="number" 
            value={sendAmount}
            onFocus={handleFocus(sendAmount, setSendAmount)}
            onBlur={handleBlur(sendAmount, setSendAmount)}
            onChange={handleNumberInput(setSendAmount)}
            className="bg-[#211e47] text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:border-violet-600 border border-gray-700"
            placeholder="0"
          />
        </div>

        <button 
          onClick={() => handleAction("send_token")}
          disabled={txLoading || !sendRecipient || !sendAmount || parseFloat(sendAmount) <= 0}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl shadow-lg transition disabled:opacity-50"
        >
          {txLoading ? "Islem Yukleniyor..." : "Send Tokens"}
        </button>
      </div>
    </div>
  );
};
