import ProfileHeader from "@/components/ui/header";
import { Search, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

type Tx = {
  id: string;
  icon: string;
  title: string;
  chain: string;
  amount: string;
  amountColor: "green" | "red";
  status: "Completed" | "Pending";
};

const transactions: Tx[] = [
  {
    id: "1",
    icon: "/assets/images/bitcoin.png",
    title: "Transfer to 1Egfhhasdx...",
    chain: "Bitcoin",
    amount: "-$892.48",
    amountColor: "red",
    status: "Completed",
  },
  {
    id: "2",
    icon: "/assets/images/ethereum.png",
    title: "Received from 1Egfhhas...",
    chain: "Ethereum",
    amount: "+ $892.48",
    amountColor: "green",
    status: "Completed",
  },
  {
    id: "3",
    icon: "/assets/icon128.png",
    title: "Received from 1Egfhhas...",
    chain: "Fradium",
    amount: "+ $892.48",
    amountColor: "green",
    status: "Pending",
  },
];

function History() {
  const navigate = useNavigate();
  const SHOW_EMPTY = false;

  return (
    <div className="w-[375px] h-[600px] bg-[#25262B] text-white">
      <ProfileHeader />

      <div className="px-4 pb-4">
        {/* Tabs */}
        <div className="flex items-center justify-between pt-3 select-none">
          <div className="text-white text-[14px] font-semibold">Transaction</div>
          <button
            type="button"
            className="text-white/60 text-[14px] font-semibold"
            onClick={() => navigate(ROUTES.SCAN_HISTORY)}
          >
            Scan history
          </button>
        </div>
        {/* underline line with active segment */}
        <div className="relative mt-2 h-[2px] w-full bg-white/10">
          <div className="absolute left-0 w-[170px] h-[2px] bg-white" />
        </div>

        {/* Search row */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-12 border border-white/10 rounded-md flex items-center px-3 text-white/70">
            <Search className="w-5 h-5 mr-2 text-white/60" />
            <input
              type="text"
              placeholder="Search by token"
              className="bg-transparent outline-none font-normal placeholder:text-white/60 w-full text-sm"
            />
          </div>
          <button
            type="button"
            className="h-12 w-12 rounded-md bg-[#3A3B41] border border-white/10 flex items-center justify-center"
          >
            <Settings2 className="text-white/80" />
          </button>
        </div>

        {/* List or Empty State */}
        {SHOW_EMPTY ? (
          <div className="h-[430px] flex flex-col items-center justify-center text-center">
            <img src="/assets/empty.png" alt="empty" className="w-16 h-16 mb-6" />
            <div className="text-[18px] font-medium mb-3">No transaction here...</div>
            <div className="text-white/60 text-[14px] font-normal leading-relaxed max-w-[320px]">
              Use your fradium wallet to send, receive tokens - and your activity will appear here
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <img src={tx.icon} alt={tx.chain} className="w-10 h-10 rounded-full" />
                    <div className="ml-3">
                      <div className="text-[14px] font-normal leading-6">
                        {tx.title}
                      </div>
                      <div className="text-white/60 mt-1">{tx.chain}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={
                        tx.amountColor === "green"
                          ? "text-[#9BE4A0] text-[16px] font-medium"
                          : "text-[#E69494] text-[16px] font-medium"
                      }
                    >
                      {tx.amount}
                    </div>
                    <div
                      className={
                        tx.status === "Completed"
                          ? "mt-2 inline-block rounded-full bg-[#2F3A33] text-[#9BE4A0] px-3 py-1 text-xs"
                          : "mt-2 inline-block rounded-full bg-[#3A3B41] text-white/80 px-3 py-1 text-xs"
                      }
                    >
                      {tx.status}
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-px w-full bg-white/10" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;