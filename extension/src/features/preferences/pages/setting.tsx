import { ArrowLeft, Copy, ArrowRight } from "lucide-react"

import { CDN } from "~lib/constant/cdn"
import { useAuth } from "~lib/context/authContext"

function Setting() {
  const { identity } = useAuth()
  const principalText = identity?.getPrincipal?.().toText?.() ?? ""
  const shortPrincipal = principalText
    ? `${principalText.slice(0, 4)}...${principalText.slice(-3)}`
    : "—"
  const copyPrincipal = async () => {
    if (!principalText) return
    try {
      await navigator.clipboard.writeText(principalText)
    } catch (_) {
      // ignore
    }
  }

  return (
    <div className="w-[375px] max-w-full text-white overflow-y-auto m-4">
      <div className="flex flex-row pt-4 items-center gap-2">
        <ArrowLeft className="w-5 h-5" />
        <h1 className="text-white text-[20px] font-semibold">Setting</h1>
      </div>

      <p className="text-white/70 text-[14px] font-normal pt-4">
        Adjust wallet, security, and extension preferences
      </p>

      <div className="w-[335px] max-w-full text-gray-200 rounded-2xl p-5 shadow-lg mt-4 border border-white/10">
        {/* General Section */}
        <div className="w-full">
          <h2 className="text-base font-semibold mb-2">General</h2>
          <div className="grid grid-cols-[1fr,auto] gap-x-4 gap-y-2 items-center mb-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-white text-[12px] font-extralight">Your Principal</span>
              <img src={CDN.icons.help} className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white text-[12px] font-extralight truncate max-w-[120px]">
                {shortPrincipal}
              </span>
              <button
                type="button"
                onClick={copyPrincipal}
                className="p-0.5 rounded hover:bg-white/5 active:bg-white/10"
                aria-label="Copy principal"
                title="Copy"
              >
                <Copy className="w-4 h-4 text-[#99E39E]" />
              </button>
            </div>

            <span className="text-white text-[12px] font-extralight">Session Duration</span>
            <span className="text-white text-[12px] font-extralight"> </span>

            <span className="text-white/50 text-[12px] font-extralight">Expires in - minutes</span>
            <span className="text-white text-[12px] font-extralight"> </span>
          </div>

          <div className="w-full bg-[rgba(255,255,255,0.03)] backdrop-blur-[14px] rounded-2xl border border-white/10">
            <div className="px-3 py-3">
              <h3 className="text-[14px] font-semibold text-white mb-2">
                List of scan activity
              </h3>

              <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-white text-[12px] font-extralight">Active Networks</span>
                  <img src={CDN.icons.help} className="w-4 h-4 text-green-400" />
                  <div className="ml-2 flex items-center gap-2">
                    <img src={CDN.tokens.bitcoinDark} className="w-5 h-5" />
                    <img src={CDN.tokens.ethereumDark} className="w-5 h-5" />
                    <img src={CDN.tokens.fradiumDark} className="w-5 h-5" />
                  </div>
                </div>

                <button
                  type="button"
                  className="justify-self-end inline-flex items-center gap-1 text-[12px] text-[#99E39E] hover:text-[#7DD488]"
                >
                  Manage
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Setting
