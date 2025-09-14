import { CheckCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "~lib/constant/routes"

function SendSuccess() {
  const navigate = useNavigate()

  return (
    <div className="w-[375px] space-y-4 text-white shadow-md overflow-y-auto">
      <div className="flex flex-col px-[24px] items-center text-center">
        <CheckCircle className="w-16 h-16 text-[#9BE4A0] mt-8" />
        <h1 className="text-[22px] font-semibold mt-4">Transfer Successful</h1>

        <button
          type="button"
          onClick={() => navigate(ROUTES.HISTORY)}
          className="w-full h-[40px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] bg-gradient-to-br from-[#99E39E] to-[#4BB255] shadow-[0px_5px_8px_-4px_rgba(153,227,158,0.7),0px_0px_0px_1px_#C0DDB5] rounded-[99px] mt-8"
        >
          <span className="font-sans font-medium text-[14px] bg-gradient-to-b from-[#004104] to-[#004104_60%] bg-clip-text text-transparent">
            View History
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.HOME)}
          className="w-full h-[40px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] border border-white/15 rounded-[99px] mt-3"
        >
          <span className="font-sans font-medium text-[14px]">Back to Home</span>
        </button>
      </div>
    </div>
  )
}

export default SendSuccess


