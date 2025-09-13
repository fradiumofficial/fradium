import { LogOut } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "~lib/constant/routes"
import { useAuth } from "~lib/context/authContext"

type LogoutButtonProps = {
  onClick?: () => void
  className?: string
}

function LogoutButton({ onClick, className = "" }: LogoutButtonProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const { signOut } = useAuth()

  const handleLogout = async () => {
    if (onClick) {
      onClick()
      return
    }
    if (isLoading) return
    setIsLoading(true)
    try {
      // Clear local auth state and navigate
      await signOut()
      navigate(ROUTES.WELCOME, { replace: true })
    } catch (_e) {
      // ignore and continue
      navigate(ROUTES.WELCOME, { replace: true })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex flex-row items-center gap-2 ${className}`}>
      <LogOut className="w-5 h-5 text-[#99E39E]" />
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`text-[#99E39E] ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}>
        <span>{isLoading ? "Logging out..." : "Logout"}</span>
      </button>
    </div>
  )
}

export default LogoutButton
