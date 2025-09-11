import { Search, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CDN } from "~lib/constant/cdn";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";

type TransactionHistoryItem = {
  id: string;
  tokenType: string;
  direction: "Receive" | "Send";
  amount: number;
  status: "Completed" | "Pending" | "Failed";
  toAddress?: string;
  fromAddress?: string;
  timestamp: number;
};

function History() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);

  useEffect(() => {
    // Dummy data fallback
    const dummy: TransactionHistoryItem[] = [
      {
        id: "tx_1",
        tokenType: "Bitcoin",
        direction: "Receive",
        amount: 0.0123,
        status: "Completed",
        toAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        fromAddress: "bc1qexamplefrom0000000000000000000000000",
        timestamp: Date.now() - 1000 * 60 * 60,
      },
      {
        id: "tx_2",
        tokenType: "Solana",
        direction: "Send",
        amount: 2.5,
        status: "Pending",
        toAddress: "3h2qExampleSolanaTo1111111111111111111111",
        fromAddress: "9k3wExampleSolanaFrom2222222222222222222",
        timestamp: Date.now() - 1000 * 60 * 30,
      },
      {
        id: "tx_3",
        tokenType: "Fradium",
        direction: "Receive",
        amount: 1500,
        status: "Completed",
        toAddress: "fdm1exampleto33333333333333333",
        fromAddress: "fdm1examplefrom444444444444444",
        timestamp: Date.now() - 1000 * 60 * 5,
      },
    ];
    const sorted = [...dummy].sort((a, b) => b.timestamp - a.timestamp);
    setTransactions(sorted);
  }, []);

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
        return CDN.tokens.bitcoin;
      case 'Solana':
        return CDN.tokens.solana;
      case 'Fradium':
        return CDN.tokens.fum;
      default:
        return CDN.tokens.unknown;
    }
  };

  const formatAmount = (tx: TransactionHistoryItem): { text: string; color: 'green' | 'red' } => {
    const sign = tx.direction === 'Receive' ? '+' : '-';
    const color = tx.direction === 'Receive' ? 'green' : 'red';
    return { text: `${sign} ${tx.amount} ${tx.tokenType === 'Bitcoin' ? 'BTC' : tx.tokenType === 'Solana' ? 'SOL' : tx.tokenType}`, color };
  };

  const SHOW_EMPTY = filtered.length === 0;

  return (
    <div className="w-[375px] text-white flex flex-col">
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
                  <img src={CDN.icons.empty} alt="empty" className="w-16 h-16 mb-6 mx-auto" />
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