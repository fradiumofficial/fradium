import ProfileHeader from "@/components/ui/header";
import NeoButton from "@/components/ui/custom-button";
import { ROUTES } from "@/constants/routes";
import { useNavigate, useParams } from "react-router-dom";
import { getTransactionById, type TransactionHistoryItem } from "@/lib/localStorage";
import { useEffect, useState } from "react";

function TransactionDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [tx, setTx] = useState<TransactionHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const item = getTransactionById(id);
    setTx(item || null);
    setLoading(false);
  }, [id]);

  const labelForToken = (t: string) => (t === 'Bitcoin' ? 'BTC' : t === 'Solana' ? 'SOL' : t);

  if (loading) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white shadow-md flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
        <ProfileHeader />
        <div className="m-4 text-center">
          <h1 className="font-semibold text-[20px] text-white mb-4">Transaction Not Found</h1>
          <p className="text-white/50 mb-4">The requested transaction could not be found.</p>
          <NeoButton onClick={() => navigate(ROUTES.HISTORY)}>
            Back to History
          </NeoButton>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
      <ProfileHeader />
      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Transaction Detail</h1>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded">
            <div className="text-white/60 text-xs">Direction</div>
            <div className="text-white text-base mt-1">{tx.direction}</div>
          </div>
          <div className="bg-white/5 p-4 rounded">
            <div className="text-white/60 text-xs">Status</div>
            <div className="text-white text-base mt-1">{tx.status}</div>
          </div>
          <div className="bg-white/5 p-4 rounded">
            <div className="text-white/60 text-xs">Amount</div>
            <div className="text-white text-base mt-1">{tx.amount} {labelForToken(tx.tokenType)}</div>
          </div>
          <div className="bg-white/5 p-4 rounded">
            <div className="text-white/60 text-xs">Token</div>
            <div className="text-white text-base mt-1">{tx.tokenType}</div>
          </div>
          <div className="bg-white/5 p-4 rounded col-span-2">
            <div className="text-white/60 text-xs">From</div>
            <div className="text-white text-sm mt-1 break-all">{tx.fromAddress || '-'}</div>
          </div>
          <div className="bg-white/5 p-4 rounded col-span-2">
            <div className="text-white/60 text-xs">To</div>
            <div className="text-white text-sm mt-1 break-all">{tx.toAddress}</div>
          </div>
          <div className="bg-white/5 p-4 rounded col-span-2">
            <div className="text-white/60 text-xs">Transaction ID</div>
            <div className="text-white text-sm mt-1 break-all">{tx.transactionId || '-'}</div>
          </div>
          <div className="bg-white/5 p-4 rounded col-span-2">
            <div className="text-white/60 text-xs">Timestamp</div>
            <div className="text-white text-sm mt-1">{new Date(tx.timestamp).toLocaleString()}</div>
          </div>
          {tx.note ? (
            <div className="bg-white/5 p-4 rounded col-span-2">
              <div className="text-white/60 text-xs">Note</div>
              <div className="text-white text-sm mt-1">{tx.note}</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <NeoButton onClick={() => navigate(ROUTES.HISTORY)}>
          Back
        </NeoButton>
      </div>
    </div>
  );
}

export default TransactionDetail;


