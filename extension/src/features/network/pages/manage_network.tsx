import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CDN } from "~lib/constant/cdn";
import { useWallet } from "~lib/context/walletContext";

export default function ManageNetwork() {
  const navigate = useNavigate();
  const { networkFilters, updateNetworkFilters } = useWallet() as any;

  // Local state for UI updates (will sync with networkFilters on save)
  const [btc, setBtc] = useState(networkFilters?.Bitcoin ?? true);
  const [eth, setEth] = useState(networkFilters?.Ethereum ?? true);
  const [sol, setSol] = useState(networkFilters?.Solana ?? true);
  const [fra, setFra] = useState(networkFilters?.Fradium ?? true);
  const [icp, setIcp] = useState(networkFilters?.ICP ?? true);
  const [ckbtc, setCkbTc] = useState(networkFilters?.ckBTC ?? true);

  // Sync local state with networkFilters when they change
  useEffect(() => {
    if (networkFilters) {
      setBtc(networkFilters.Bitcoin ?? true);
      setEth(networkFilters.Ethereum ?? true);
      setSol(networkFilters.Solana ?? true);
      setFra(networkFilters.Fradium ?? true);
      setIcp(networkFilters.ICP ?? true);
      setCkbTc(networkFilters.ckBTC ?? true);
    }
  }, [networkFilters]);

  // Save function to persist changes
  const handleSave = () => {
    const updatedFilters = {
      Bitcoin: btc,
      Ethereum: eth,
      Solana: sol,
      Fradium: fra,
      ICP: icp,
      ckBTC: ckbtc,
    };
    updateNetworkFilters(updatedFilters);
    // Navigate back after saving
    navigate(-1);
  };

  return (
    <div className="w-[375px]">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 rounded hover:bg-white/5 active:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-white text-[20px] font-semibold">Manage Network</h2>
        </div>
        <p className="text-white/60 text-[14px] font-normal mt-2">
          All network you are using here
        </p>
      </div>

      <div className="px-6 mt-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-[10px] p-4">
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

          {/* ICP */}
          <div className="py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={CDN.tokens.icp}
                  className="w-6 h-6"
                  alt="icp"
                />
                <span className="text-white text-[14px] font-normal">
                  Internet Computer
                </span>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={icp}
                  onChange={(e) => setIcp(e.target.checked)}
                />
                <span
                  className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors ${
                    icp ? "bg-[#37C058]" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      icp ? "translate-x-7" : ""
                    }`}
                  ></span>
                </span>
              </label>
            </div>
            <div className="mt-2 h-px w-full bg-white/10" />
          </div>

          {/* ckBTC */}
          <div className="py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={CDN.tokens.bitcoinDark}
                  className="w-6 h-6"
                  alt="ckbtc"
                />
                <span className="text-white text-[14px] font-normal">
                  ckBTC
                </span>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={ckbtc}
                  onChange={(e) => setCkbTc(e.target.checked)}
                />
                <span
                  className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors ${
                    ckbtc ? "bg-[#37C058]" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      ckbtc ? "translate-x-7" : ""
                    }`}
                  ></span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-10 mb-6">
          <button
            type="button"
            onClick={handleSave}
            className="w-full h-[40px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] bg-gradient-to-br from-[#99E39E] to-[#4BB255] shadow-[0px_5px_8px_-4px_rgba(153,227,158,0.7),0px_0px_0px_1px_#C0DDB5] rounded-[99px] mt-2 self-stretch flex-grow-0 hover:opacity-90 transition-opacity"
          >
            <span className="w-auto h-[17px] font-sans font-medium text-[14px] leading-[120%] tracking-[-0.0125em] bg-gradient-to-b from-[#004104] to-[#004104_60%] bg-clip-text text-transparent">
              Save
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
