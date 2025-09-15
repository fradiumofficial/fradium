import NeoButton from "~components/custom-button";
import { ROUTES } from "~lib/constant/routes";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "~lib/context/walletContext";
import {
  getBitcoinTransactionHistory,
  getETHTransactionHistory,
  getSolanaTransactionHistory,
  getICRCTransactionHistory,
  type UnifiedTx,
} from "~service/transactionHistoryService";

type DetailedTx = UnifiedTx & { tokenLabel: string };

function TransactionDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addresses, principalText } = useWallet() as any;
  const [tx, setTx] = useState<DetailedTx | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const btcAddr = addresses?.bitcoin;
        const ethAddr = addresses?.ethereum;
        const solAddr = addresses?.solana;
        const icpPrincipal = principalText || addresses?.icp_principal;
        const icpAccount = addresses?.icp_account || null;

        const tasks: Array<Promise<DetailedTx[]>> = [];
        if (btcAddr) tasks.push(getBitcoinTransactionHistory(btcAddr, 'testnet', 20).then(arr => arr.map(t => ({ ...t, tokenLabel: 'BTC' }))));
        if (ethAddr) tasks.push(getETHTransactionHistory(ethAddr, 'sepolia', 20).then(arr => arr.map(t => ({ ...t, tokenLabel: 'ETH' }))));
        if (solAddr) tasks.push(getSolanaTransactionHistory(solAddr, 'devnet', 20).then(arr => arr.map(t => ({ ...t, tokenLabel: 'SOL' }))));
        if (icpPrincipal) tasks.push(getICRCTransactionHistory('icp', icpPrincipal, icpAccount, 20).then(arr => arr.map(t => ({ ...t, tokenLabel: 'ICP' }))));
        if (icpPrincipal) tasks.push(getICRCTransactionHistory('fradium', icpPrincipal, null, 20).then(arr => arr.map(t => ({ ...t, tokenLabel: 'FUM' }))));

        const results = await Promise.allSettled(tasks);
        const all: DetailedTx[] = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
        const sorted = all.sort((a, b) => b.timestamp - a.timestamp);

        // Find by hash (route id treated as tx hash); fallback to latest
        const selected = id ? sorted.find((t) => t.hash === id) || null : (sorted[0] || null);
        setTx(selected);
      } catch (e: any) {
        setError(e?.message || 'Failed to load transaction');
        setTx(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, addresses, principalText]);

  const tokenAndDirection = useMemo(() => {
    if (!tx) return { token: '-', direction: '-', amountAbs: 0 };
    const token = tx.tokenLabel || (tx.chain === 'Bitcoin' ? 'BTC' : tx.chain === 'Ethereum' ? 'ETH' : tx.chain === 'Solana' ? 'SOL' : 'ICP');
    const direction = tx.amount >= 0 ? 'Receive' : 'Send';
    const amountAbs = Math.abs(tx.amount);
    return { token, direction, amountAbs };
  }, [tx]);

  if (loading) {
    return (
      <div className="w-[375px] h-[600px] text-white shadow-md flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[375px] text-white shadow-md overflow-y-auto">
        <div className="m-4 text-center">
          <h1 className="font-semibold text-[20px] text-white mb-4">Failed to load transaction</h1>
          <p className="text-white/60 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="w-[375px] text-white shadow-md overflow-y-auto">
        <div className="m-4 text-center">
          <h1 className="font-semibold text-[20px] text-white mb-4">Transaction Not Found</h1>
          <p className="text-white/50 mb-4">The requested transaction could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[375px] space-y-4 text-white shadow-md overflow-y-auto relative">
      <div className="m-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.HISTORY)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-[20px] font-semibold">Transaction Detail</h1>
        </div>

        {/* Primary info cards */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="flex flex-col justify-center items-start p-[12px_16px] gap-[6px] bg-white/5 rounded-[12px]">
            <div className="text-white/60 text-xs">Amount</div>
            <div className="text-white text-base mt-1">{tokenAndDirection.amountAbs} {tokenAndDirection.token}</div>
          </div>
          <div className="flex flex-col justify-center items-start p-[12px_16px] gap-[6px] bg-white/5 rounded-[12px]">
            <div className="text-white/60 text-xs">Status</div>
            <div className="text-white text-base mt-1">{tx.status}</div>
          </div>
          <div className="flex flex-col justify-center items-start p-[12px_16px] gap-[6px] bg-white/5 rounded-[12px]">
            <div className="text-white/60 text-xs">Token</div>
            <div className="text-white text-base mt-1">{tokenAndDirection.token}</div>
          </div>
          <div className="flex flex-col justify-center items-start p-[12px_16px] gap-[6px] bg-white/5 rounded-[12px]">
            <div className="text-white/60 text-xs">Direction</div>
            <div className="text-white text-base mt-1">{tokenAndDirection.direction}</div>
          </div>
        </div>

        {/* Destination & metadata */}
        <div className="mt-4 space-y-3">
          <div className="bg-white/5 p-4 rounded">
            <div className="text-white/60 text-xs">Destination Address</div>
            <div className="text-white text-sm mt-1 break-all">{tx.to}</div>
          </div>
          <div className="bg-white/5 p-4 rounded">
            <div className="text-white/60 text-xs">Transaction ID</div>
            <div className="text-white text-sm mt-1 break-all">{tx.hash}</div>
          </div>
          <div className="bg-white/5 p-4 rounded">
            <div className="text-white/60 text-xs">Timestamp</div>
            <div className="text-white text-sm mt-1">{new Date(tx.timestamp).toLocaleString()}</div>
          </div>
          <div className="bg-white/5 p-4 rounded">
            <div className="text-white/60 text-xs">From</div>
            <div className="text-white text-sm mt-1 break-all">{tx.from}</div>
          </div>
          <div className="bg-white/5 p-4 rounded">
            <div className="text-white/60 text-xs">Network</div>
            <div className="text-white text-sm mt-1">{tx.chain}</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <button
          type="button"
          onClick={() => navigate(ROUTES.HISTORY)}
          className="w-full h-[40px] box-border flex flex-row justify-center items-center p-[10px_20px] gap-[6px] bg-gradient-to-br from-[#99E39E] to-[#4BB255] shadow-[0px_5px_8px_-4px_rgba(153,227,158,0.7),0px_0px_0px_1px_#C0DDB5] rounded-[99px] mt-2"
        >
          <span className="w-auto h-[17px] font-sans font-medium text-[14px] leading-[120%] tracking-[-0.0125em] bg-gradient-to-b from-[#004104] to-[#004104_60%] bg-clip-text text-transparent">
            Back
          </span>
        </button>
      </div>
    </div>
  );
}

export default TransactionDetail;


