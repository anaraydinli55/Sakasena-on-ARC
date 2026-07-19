// ============================================
// AAA TOKEN BANNER COMPONENT
// ============================================
import { ARC_ADDRESSES } from './constants';

export const AAABanner = ({ account, chainId, balances, tokens }) => {
  if (!account || chainId !== 5042002) return null;

  return (
    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-indigo-950 to-[#121024] border border-violet-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
      <div className="w-full md:w-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 font-medium">
          Your Deployed Custom Token
        </span>
        <h3 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
          🪙 {tokens.AAA?.name} ({tokens.AAA?.symbol})
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Volatile Asset • Price: $5.40 • 
          <span className="text-emerald-400 font-semibold">1,300+ Active Holders on Arcscan</span>
        </p>

        <div className="relative mt-3 flex items-center bg-[#1b173c]/50 p-2.5 pr-12 rounded-xl border border-gray-800 w-full max-w-full overflow-hidden group">
          <span className="text-xs text-gray-300 font-mono break-all select-all flex-grow">
            {ARC_ADDRESSES.AAA}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(ARC_ADDRESSES.AAA);
              alert("AAA Kontrat Adresi basariyla kopyalandi!");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-400 transition-colors p-2 z-10"
            title="Kontrat Adresini Kopyala"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </div>
      <div className="text-left md:text-right shrink-0">
        <span className="text-xs text-gray-400 font-medium block">Your Balance</span>
        <p className="text-2xl font-bold text-violet-300 mt-1">{balances.AAA} {tokens.AAA?.symbol}</p>
      </div>
    </div>
  );
};
