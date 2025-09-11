import { useState } from "react";
import NeoButton from "~components/custom-button";
import { CDN } from "~lib/constant/cdn";


type ManageNetworkProps = {
  onClose: () => void;
};

export default function ManageNetwork({ onClose }: ManageNetworkProps) {
  // const { networkFilters, updateNetworkFilters } = useWallet();
  
  const [btc, setBtc] = useState(true);
  const [eth, setEth] = useState(true);
  const [sol, setSol] = useState(true);
  const [fra, setFra] = useState(true);

  // Load current network filters when component mounts
  // useEffect(() => {
  //   if (networkFilters) {
  //     setBtc(networkFilters.Bitcoin);
  //     setEth(networkFilters.Ethereum);
  //     setSol(networkFilters.Solana);
  //     setFra(networkFilters.Fradium);
  //   }
  // }, [networkFilters]);

  // const handleSave = () => {
  //   // Update network filters with selected networks
  //   updateNetworkFilters({
  //     Bitcoin: btc,
  //     Ethereum: eth,
  //     Solana: sol,
  //     Fradium: fra,
  //   });
    
  //   console.log('Network filters saved:', { btc, sol, fra });
  //   onClose();
  // };

  return (
    <div className="bg-[#000510] overflow-hidden w-[344px]">
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-white text-[20px] font-semibold">Manage Network</h2>
        <p className="text-white/60 text-[14px] font-normal mt-2">
          All network you are using here
        </p>
      </div>

      <div className="px-6 mt-6">
        {/* BTC */}
        <div className="py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={CDN.tokens.bitcoinDark}
                className="w-6 h-6"
                alt="btc"
              />
              <span className="text-white text-[14px] font-normal">
                Bitcoin
              </span>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={btc}
                onChange={(e) => setBtc(e.target.checked)}
              />
              <span
                className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors ${
                  btc ? "bg-[#37C058]" : "bg-white/20"
                }`}
              >
                <span
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    btc ? "translate-x-7" : ""
                  }`}
                ></span>
              </span>
            </label>
          </div>
          <div className="mt-2 h-px w-full bg-white/10" />
        </div>

        {/* ETH */}
        <div className="py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={CDN.tokens.ethereumDark}
                className="w-6 h-6"
                alt="eth"
              />
              <span className="text-white text-[14px] font-normal">
                Ethereum
              </span>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={eth}
                onChange={(e) => setEth(e.target.checked)}
              />
              <span
                className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors ${
                  eth ? "bg-[#37C058]" : "bg-white/20"
                }`}
              >
                <span
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    eth ? "translate-x-7" : ""
                  }`}
                ></span>
              </span>
            </label>
          </div>
          <div className="mt-2 h-px w-full bg-white/10" />
        </div>

        {/* FRA */}
        <div className="py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={CDN.tokens.fradiumDark}
                className="w-6 h-6"
                alt="fra"
              />
              <span className="text-white text-[14px] font-normal">
                Fradium
              </span>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={fra}
                onChange={(e) => setFra(e.target.checked)}
              />
              <span
                className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors ${
                  fra ? "bg-[#37C058]" : "bg-white/20"
                }`}
              >
                <span
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    fra ? "translate-x-7" : ""
                  }`}
                ></span>
              </span>
            </label>
          </div>
          <div className="mt-2 h-px w-full bg-white/10" />
        </div>

        {/* SOL */}
        <div className="py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={CDN.tokens.solanaDark}
                className="w-6 h-6"
                alt="sol"
              />
              <span className="text-white text-[14px] font-normal">
                Solana
              </span>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={sol}
                onChange={(e) => setSol(e.target.checked)}
              />
              <span
                className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors ${
                  sol ? "bg-[#37C058]" : "bg-white/20"
                }`}
              >
                <span
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    sol ? "translate-x-7" : ""
                  }`}
                ></span>
              </span>
            </label>
          </div>
          <div className="mt-2 h-px w-full bg-white/10" />
        </div>

        {/* Save button */}
        <div className="mt-10 mb-6">
          <NeoButton onClick={() => {}}>Save</NeoButton>
        </div>
      </div>
    </div>
  );
}
