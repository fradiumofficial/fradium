import { Search, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CDN } from "~lib/constant/cdn";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import { useWallet } from "~lib/context/walletContext";
import {
  getBitcoinTransactionHistory,
  getETHTransactionHistory,
  getSolanaTransactionHistory,
  getICRCTransactionHistory,
  getCkBtcTransactionHistory,
  getCkEthTransactionHistory,
  type UnifiedTx,
} from "~service/transactionHistoryService";

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
  const { addresses, principalText } = useWallet() as any;
  const [query, setQuery] = useState("");
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const btcAddr = addresses?.bitcoin;
        const ethAddr = addresses?.ethereum;
        const solAddr = addresses?.solana;
        const icpPrincipal = principalText || addresses?.icp_principal;
        const icpAccount = addresses?.icp_account || null;

        const tasks: Array<Promise<UnifiedTx[]>> = [];
        if (btcAddr) tasks.push(getBitcoinTransactionHistory(btcAddr, 'testnet', 30));
        if (ethAddr) tasks.push(getETHTransactionHistory(ethAddr, 'sepolia', 30));
        if (solAddr) tasks.push(getSolanaTransactionHistory(solAddr, 'devnet', 30));
        if (icpPrincipal) tasks.push(getICRCTransactionHistory('icp', icpPrincipal, icpAccount, 30));
        if (icpPrincipal) tasks.push(getICRCTransactionHistory('fradium', icpPrincipal, null, 30));
        if (icpPrincipal) tasks.push(getCkBtcTransactionHistory(icpPrincipal, 30));
        if (icpPrincipal) tasks.push(getCkEthTransactionHistory(icpPrincipal, 30));

        const results = await Promise.allSettled(tasks);
        const onchain = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

        const mapped: TransactionHistoryItem[] = onchain.map((t) => ({
          id: t.hash,
          tokenType: t.tokenType
            ? (t.tokenType === 'icp' ? 'ICP' : t.tokenType === 'fradium' ? 'Fradium' : t.tokenType === 'ckbtc' ? 'ckBTC' : t.tokenType === 'cketh' ? 'ckETH' : (t.chain === 'Bitcoin' ? 'Bitcoin' : t.chain === 'Ethereum' ? 'Ethereum' : t.chain === 'Solana' ? 'Solana' : 'ICP'))
            : (t.chain === 'Bitcoin' ? 'Bitcoin' : t.chain === 'Ethereum' ? 'Ethereum' : t.chain === 'Solana' ? 'Solana' : 'ICP'),
          direction: t.amount >= 0 ? 'Receive' as const : 'Send' as const,
          amount: Math.abs(t.amount),
          status: t.status as any,
          toAddress: t.to,
          fromAddress: t.from,
          timestamp: t.timestamp,
        }));

        const sorted = mapped.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(sorted);
      } catch (e: any) {
        setError(e?.message || 'Failed to load transactions');
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [addresses, principalText])

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
      case 'Ethereum':
        return CDN.tokens.eth;
      case 'Solana':
        return CDN.tokens.solana;
      case 'ICP':
        return CDN.tokens.icp;
      case 'Fradium':
        return CDN.tokens.fum;
      case 'ckBTC':
        return CDN.tokens.bitcoin;
      case 'ckETH':
        return CDN.tokens.eth;
      default:
        return CDN.tokens.unknown;
    }
  };

  const formatAmount = (tx: TransactionHistoryItem): { text: string; color: 'green' | 'red' } => {
    const sign = tx.direction === 'Receive' ? '+' : '-';
    const color = tx.direction === 'Receive' ? 'green' : 'red';
    return { text: `${sign} ${tx.amount} ${tx.tokenType === 'Bitcoin' ? 'BTC' : tx.tokenType === 'Solana' ? 'SOL' : tx.tokenType}`, color };
  };

  const SHOW_EMPTY = !isLoading && filtered.length === 0 && !error;

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
            {isLoading ? (
              <div className="mt-1 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-full">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                        <div className="ml-3 w-[200px]">
                          <div className="h-4 bg-white/10 rounded animate-pulse" />
                          <div className="h-3 bg-white/5 rounded mt-2 w-3/4 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-right w-[100px]">
                        <div className="h-4 bg-white/10 rounded animate-pulse" />
                        <div className="h-5 bg-white/5 rounded mt-2 animate-pulse" />
                      </div>
                    </div>
                    <div className="mt-4 h-px w-full bg-white/10" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="relative z-10 w-full h-full flex items-center justify-center text-center">
                <div>
                  <img src={CDN.icons.empty} alt="error" className="w-16 h-16 mb-6 mx-auto" />
                  <div className="text-[18px] font-medium mb-2">Error loading history</div>
                  <div className="text-red-400 text-[14px] max-w-[320px] mx-auto mb-3">{error}</div>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="bg-[#3A3B41] text-white px-4 py-2 rounded-md text-sm hover:bg-[#4A4B51] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : SHOW_EMPTY ? (
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