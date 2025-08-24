import ProfileHeader from "@/components/ui/header";
import { Search, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import solanaIcon from "../../../../public/assets/tokens/solana.svg";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { getTransactionHistory, type TransactionHistoryItem } from "@/lib/localStorage";
import { useAuth } from "@/lib/contexts/authContext";

function History() {
  const navigate = useNavigate();
  const { principal } = useAuth();
  const [query, setQuery] = useState("");
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);

  useEffect(() => {
    const { items } = getTransactionHistory(principal ?? undefined);
    const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);
    setTransactions(sorted);
  }, [principal]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((tx) =>
      tx.tokenType.toLowerCase().includes(q) ||
      tx.direction.toLowerCase().includes(q) ||
      (tx.toAddress?.toLowerCase().includes(q) ?? false) ||
      (tx.fromAddress?.toLowerCase().includes(q) ?? false)
    );
  }, [query, transactions]);

  const getIcon = (tokenType: string): string => {
    switch (tokenType) {
      case 'Bitcoin':
        return '/assets/images/bitcoin.png';
      case 'Solana':
        return solanaIcon;
      case 'Fradium':
        return '/assets/icon128.png';
      default:
        return '/assets/icon128.png';
    }
  };

  const formatAmount = (tx: TransactionHistoryItem): { text: string; color: 'green' | 'red' } => {
    const sign = tx.direction === 'Receive' ? '+' : '-';
    const color = tx.direction === 'Receive' ? 'green' : 'red';
    return { text: `${sign} ${tx.amount} ${tx.tokenType === 'Bitcoin' ? 'BTC' : tx.tokenType === 'Solana' ? 'SOL' : tx.tokenType}`, color };
  };

  const SHOW_EMPTY = filtered.length === 0;

  return (
    <div className="w-[375px] h-[600px] bg-[#25262B] text-white pb-20 flex flex-col">
      <ProfileHeader />

      <div className={`relative flex-1 ${SHOW_EMPTY ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <div className="px-4 pb-4 h-full flex flex-col">
          <div className="flex flex-row justify-between pt-3 select-none">
            <div className="flex-1 text-center text-white text-[14px] font-semibold">Transaction</div>
            <button
              type="button"
              className="flex-1 text-center text-white/60 text-[14px] font-semibold"
              onClick={() => navigate(ROUTES.SCAN_HISTORY)}
            >
              Scan History
            </button>
          </div>
          <div className="relative mt-2 h-[2px] w-full bg-white/10">
            <div className="absolute left-0 w-[170px] h-[2px] bg-white" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-12 border border-white/10 rounded-md flex items-center px-3 text-white/70">
              <Search className="w-5 h-5 mr-2 text-white/60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search by token or address"
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

          <div className="relative flex-1 mt-6">
            {SHOW_EMPTY ? (
              <div className="relative z-10 w-full h-full flex items-center justify-center text-center">
                <div>
                  <img src="/assets/empty.png" alt="empty" className="w-16 h-16 mb-6 mx-auto" />
                  <div className="text-[18px] font-medium mb-3">No transaction here...</div>
                  <div className="text-white/60 text-[14px] font-normal leading-relaxed max-w-[320px] mx-auto">
                    Use your fradium wallet to send, receive tokens - and your activity will appear here
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-1 space-y-3">
                {filtered.map((tx) => {
                  const { text, color } = formatAmount(tx);
                  return (
                    <button key={tx.id} className="w-full text-left" onClick={() => navigate(ROUTES.TX_DETAIL.replace(':id', tx.id))}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <img src={getIcon(tx.tokenType)} alt={tx.tokenType} className="w-10 h-10 rounded-full" />
                          <div className="ml-3">
                            <div className="text-[14px] font-normal leading-6">
                              {tx.direction === 'Receive' ? 'Received' : 'Sent'} {tx.amount} {tx.tokenType}
                            </div>
                            <div className="text-white/60 mt-1 truncate max-w-[180px]">
                              {tx.direction === 'Receive' ? (tx.toAddress || '') : (tx.toAddress || '')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={color === 'green' ? "text-[#9BE4A0] text-[16px] font-medium" : "text-[#E69494] text-[16px] font-medium"}>
                            {text}
                          </div>
                          <div className={tx.status === "Completed" ? "mt-2 inline-block rounded-full bg-[#2F3A33] text-[#9BE4A0] px-3 py-1 text-xs" : "mt-2 inline-block rounded-full bg-[#3A3B41] text-white/80 px-3 py-1 text-xs"}>
                            {tx.status}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 h-px w-full bg-white/10" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;