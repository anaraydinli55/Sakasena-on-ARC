// ============================================
// SWAP SEKMESI COMPONENT
// ============================================
import { useEffect } from 'react';
import { ethers } from 'ethers';
import { TOKEN_PRICES, formatUnits, parseUnits, ZERO_ADDRESS } from './constants';
import { getPoolAddress } from './networks';

export const SwapTab = ({ 
  tokens, balances, provider, chainId,
  fromToken, setFromToken, toToken, setToToken,
  amountIn, setAmountIn, amountOut, setAmountOut,
  handleAction, txLoading,
  handlePercentClick, handleNumberInput, handleFocus, handleBlur
}) => {

  useEffect(() => {
    const calculateSwapOutput = async () => {
      if (!amountIn || isNaN(amountIn) || parseFloat(amountIn) <= 0) {
        setAmountOut(""); return;
      }

      const isUsdcEurc = (fromToken === "USDC" && toToken === "EURC");
      const isEurcUsdc = (fromToken === "EURC" && toToken === "USDC");

      if (isUsdcEurc) { setAmountOut((parseFloat(amountIn) * 0.8).toFixed(4)); return; }
      if (isEurcUsdc) { setAmountOut((parseFloat(amountIn) * 1.25).toFixed(4)); return; }

      if (!provider || chainId !== 5042002) return;

      const activePool = getPoolAddress(fromToken, toToken);
      if (activePool === ZERO_ADDRESS) { setAmountOut("Havuz Bulunamadi"); return; }

      try {
        const poolABI = ["function getAmountOut(address tokenIn, uint256 amountIn) view returns (uint256)"];
        const poolContract = new ethers.Contract(activePool, poolABI, provider);
        const tokenInAddress = tokens[fromToken]?.address;

        if (tokenInAddress && tokenInAddress !== ZERO_ADDRESS) { 
          const amountInParsed = parseUnits(amountIn, tokens[fromToken].decimals); 
          const rawAmountOut = await poolContract.getAmountOut(tokenInAddress, amountInParsed);
          const formattedAmountOut = formatUnits(rawAmountOut, tokens[toToken].decimals); 
          setAmountOut(parseFloat(formattedAmountOut).toFixed(tokens[toToken].decimals === 8 ? 6 : 4));
        } else {
          setAmountOut((parseFloat(amountIn) * 0.997).toFixed(4));
        }
      } catch (err) {
        console.warn("Fiyat hesaplanamadi:", err);
        setAmountOut("Likidite Yetersiz");
      }
    };
    calculateSwapOutput();
  }, [amountIn, fromToken, toToken, tokens, provider, chainId]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
        <span>Multi-Asset Swap</span>
        <span className="text-xs text-violet-400 bg-violet-950 px-2 py-1 rounded">Dynamic Price DEX</span>
      </h2>

      {/* From */}
      <div className="bg-[#1c183a] p-4 rounded-2xl mb-3 border border-gray-800 focus-within:border-violet-600 transition">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400 font-medium">From</span>
          <span className="text-xs text-gray-400">Balance: {balances[fromToken]}</span>
        </div>
        <div className="flex items-center justify-between">
          <input type="number" placeholder="0" value={amountIn}
            onFocus={handleFocus(amountIn, setAmountIn)} 
            onBlur={handleBlur(amountIn, setAmountIn)}
            onChange={handleNumberInput(setAmountIn)}
            className="bg-transparent text-2xl font-bold focus:outline-none w-2/3 text-white" />
          <select value={fromToken} 
            onChange={(e) => { 
              setFromToken(e.target.value); 
              if(e.target.value === toToken) setToToken(Object.keys(tokens).find(t => t !== e.target.value)); 
            }}
            className="bg-[#211e47] text-white px-3 py-1.5 rounded-xl font-semibold border border-gray-700 focus:outline-none">
            {Object.keys(tokens).map(t => (
              <option key={t} value={t}>{tokens[t].icon} {tokens[t].symbol}</option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2 mt-3 pt-2 border-t border-[#2a2456]/40">
          {[25, 50, 75, 100].map(p => (
            <button key={p} 
              onClick={() => handlePercentClick(p, balances[fromToken], tokens[fromToken]?.decimals, setAmountIn)}
              className="bg-[#211e47] hover:bg-violet-900 hover:text-white text-[10px] text-gray-400 font-bold px-3 py-1 rounded-lg transition">
              {p === 100 ? "MAX" : `${p}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Swap Arrow */}
      <div className="flex justify-center my-2">
        <button onClick={handleSwapTokens}
          className="bg-[#211e47] p-2.5 rounded-full hover:bg-violet-900 transition border border-gray-700">⬇️</button>
      </div>

      {/* To */}
      <div className="bg-[#1a1738] p-4 rounded-2xl mb-4 border border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400 font-medium">To (Estimated)</span>
          <span className="text-xs text-gray-400">Balance: {balances[toToken]}</span>
        </div>
        <div className="flex items-center justify-between">
          <input type="text" placeholder="0" value={amountOut} disabled
            className="bg-transparent text-2xl font-bold focus:outline-none w-2/3 text-white" />
          <select value={toToken} 
            onChange={(e) => { 
              setToToken(e.target.value); 
              if(e.target.value === fromToken) setFromToken(Object.keys(tokens).find(t => t !== e.target.value)); 
            }}
            className="bg-[#211e47] text-white px-3 py-1.5 rounded-xl font-semibold border border-gray-700 focus:outline-none">
            {Object.keys(tokens).map(t => (
              <option key={t} value={t}>{tokens[t].icon} {tokens[t].symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-6 text-sm text-gray-400 bg-[#100e21] p-3 rounded-xl border border-gray-900">
        <div className="flex justify-between">
          <span>Exchange Rate:</span>
          <span className="text-white">
            1 {tokens[fromToken]?.symbol} ≈ {TOKEN_PRICES[fromToken] && TOKEN_PRICES[toToken] 
              ? (TOKEN_PRICES[fromToken] / TOKEN_PRICES[toToken]).toFixed(4) 
              : "0.999"} {tokens[toToken]?.symbol}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Slippage Tolerance:</span>
          <span className="text-white">0.3%</span>
        </div>
        <div className="flex justify-between">
          <span>Network Fee:</span>
          <span className="text-white">~0.001 USDC</span>
        </div>
      </div>

      {/* Swap Button */}
      <button 
        onClick={() => handleAction("swap")}
        disabled={txLoading || !amountIn || parseFloat(amountIn) <= 0}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {txLoading ? "Islem Yukleniyor..." : "Swap Tokens"}
      </button>
    </div>
  );
};
