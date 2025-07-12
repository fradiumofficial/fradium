import ProfileHeader from "@/components/ui/header";
import HistoryCard from "@/components/ui/history-card";
import Bitcoin from "../../../assets/bitcoin.svg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

function History() {
  const [date] = useState(new Date());
  const navigate = useNavigate();
  return (
      
    <div className="w-[400px] h-auto bg-[#25262B] text-white">
      <ProfileHeader
        mainAvatarSrc='https://github.com/shadcn.png'
        mainAvatarFallback='N'
        address='0x1A2b3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9g0H'
      />

      <div className="m-4">
        <h1 className="font-semibold text-[20px] text-white mb-4">Scan History</h1>
        {Array.from({ length: 10 }).map((_, index) => (
          <HistoryCard
            onClick={() => navigate(ROUTES.DETAIL_HISTORY.replace(':id', index.toString()))}
            key={index}
            icon={Bitcoin}
            address={`13AM4VW2dhxYgXeQepoHkHSQuy6NgaEb94`}
            category="Ransomeware - AI"
            date={`${date.toLocaleDateString()}`}
          />
        ))}
      </div>
    </div>
  );
}

export default History;