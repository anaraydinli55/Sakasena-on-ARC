// ============================================
// FAUCET SEKMESI COMPONENT
// ============================================
import { ARC_ADDRESSES } from '../constants';

export const FaucetTab = ({ handleFaucet, txLoading }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Token Faucet</h2>

      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Circle Official Faucet</h3>
        <p className="text-xs text-gray-400 mb-4">
          Get testnet USDC, EURC and cirBTC from Circle's official faucet.
        </p>

        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => handleFaucet("USDC")}
            className="bg-[#211e47] hover:bg-violet-900 text-white p-4 rounded-xl border border-gray-700 transition"
          >
            <span className="text-2xl block mb-2">💵</span>
            <span className="text-sm font-semibold">Get USDC</span>
          </button>
          <button 
            onClick={() => handleFaucet("EURC")}
            className="bg-[#211e47] hover:bg-violet-900 text-white p-4 rounded-xl border border-gray-700 transition"
          >
            <span className="text-2xl block mb-2">💶</span>
            <span className="text-sm font-semibold">Get EURC</span>
          </button>
          <button 
            onClick={() => handleFaucet("cirBTC")}
            className="bg-[#211e47] hover:bg-violet-900 text-white p-4 rounded-xl border border-gray-700 transition"
          >
            <span className="text-2xl block mb-2">₿</span>
            <span className="text-sm font-semibold">Get cirBTC</span>
          </button>
        </div>
      </div>

      <div className="bg-[#1c183a] p-4 rounded-2xl mb-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Custom Token Faucet</h3>
        <p className="text-xs text-gray-400 mb-4">
          Get AAA tokens (requires owner permissions).
        </p>

        <button 
          onClick={() => handleFaucet("AAA")}
          disabled={txLoading}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl shadow-lg transition disabled:opacity-50"
        >
          {txLoading ? "Islem Yukleniyor..." : "Get 10 AAA Tokens"}
        </button>
      </div>

      <div className="bg-[#100e21] p-4 rounded-xl border border-gray-900">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Faucet Info</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Circle Faucet: https://faucet.circle.com/</li>
          <li>• Arc Testnet Chain ID: 5042002</li>
          <li>• AAA Token: {ARC_ADDRESSES.AAA}</li>
        </ul>
      </div>
    </div>
  );
};
