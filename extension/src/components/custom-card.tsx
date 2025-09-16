import { CDN } from "~lib/constant/cdn"

interface SafetyCardProps {
  confidence: number
  title: string
  isSafe: boolean
  description?: string
}

export function SafetyCard({ confidence, title, isSafe, description }: SafetyCardProps) {
  return (
    <div
      className={`rounded-2xl shadow-lg max-w-md bg-gradient-to-tr
      ${isSafe ? "from-[#9BE4A0]/20 to-[#9BE4A0]/10" : "from-[#FFFFFF]/5 to-[#F2AFB199]/10"} p-6 mt-[20px]`}>
      <div className="flex items-center gap-4">
        {/* Icon Section */}
        <div className="flex-shrink-0">
          <div className="relative">
            <img
              src={isSafe ? CDN.icons.safe : CDN.icons.danger}
              alt="Address Safe"
            />
          </div>
        </div>

        {/* Text Section */}
        <div className="flex flex-col w-full">
          <h3 className="text-[14px] font-semibold uppercase tracking-wider">
            {isSafe ? `${title} IS SAFE` : `${title} IS NOT SAFE`}
          </h3>
          <div className="flex flex-row items-center gap-2 mt-1">
            <p className="text-[12px] font-medium text-white">
              Confidence: {confidence}%
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <p className="text-white/70 font-extralight text-[14px]">
          {description || "This address has been analyzed for security risks and potential threats."}
        </p>
      </div>
    </div>
  )
}
