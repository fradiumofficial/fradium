import NeoButton from "~components/custom-button";
import { ROUTES } from "~lib/constant/routes";
import { useNavigate, useParams } from "react-router-dom";
type TransactionHistoryItem = {
  id: string;
  tokenType: string;
  direction: "Receive" | "Send";
  amount: number;
  status: "Completed" | "Pending" | "Failed";
  toAddress?: string;
  fromAddress?: string;
  transactionId?: string;
  timestamp: number;
  note?: string;
};
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
    // Dummy lookup
    const dummy: TransactionHistoryItem[] = [
      {
        id: "tx_1",
        tokenType: "Bitcoin",
        direction: "Receive",
        amount: 0.0123,
        status: "Completed",
        toAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        fromAddress: "bc1qexamplefrom0000000000000000000000000",
        transactionId: "abcd1234",
        timestamp: Date.now() - 1000 * 60 * 60,
        note: "Payment received",
      },
      {
        id: "tx_2",
        tokenType: "Solana",
        direction: "Send",
        amount: 2.5,
        status: "Pending",
        toAddress: "3h2qExampleSolanaTo1111111111111111111111",
        fromAddress: "9k3wExampleSolanaFrom2222222222222222222",
        transactionId: "efgh5678",
        timestamp: Date.now() - 1000 * 60 * 30,
      },
    ];
    const item = dummy.find((d) => d.id === id) || null;
    setTx(item);
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
      <div className="w-[375px] bg-[#25262B] text-white shadow-md overflow-y-auto">
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
    <div className="w-[375px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto">
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


