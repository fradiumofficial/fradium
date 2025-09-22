import { useState, useEffect, useRef } from "react";

import { Link } from "react-router";

import { Search, ArrowUpRight, ArrowDownLeft, Coins, Calendar } from "lucide-react";

import { fradium_ledger as token } from "declarations/fradium_ledger";

import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { useAuth } from "@/core/providers/AuthProvider";
import { convertE8sToToken, formatAddress } from "@/core/lib/canisterUtils";
import { getICRCTransactionHistory } from "@/core/services/historyTransactionService";

import Card from "@/core/components/Card";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import Footer from "../../core/components/Footer.jsx";

export default function BalancePage() {
  const { isAuthenticated: isConnected, identity } = useAuth();

  // User balance state
  const [userBalance, setUserBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Transaction history state
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, receive, sent
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  // Reveal-on-scroll (match ProductsExtensionPage)
  const Reveal = ({ children, delay = 0 }) => {
    const ref = useRef(null);
    const [show, setShow] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShow(true);
            io.disconnect();
          }
        },
        { rootMargin: "-10% 0px" }
      );
      io.observe(el);
      return () => io.disconnect();
    }, []);
    return (
      <div ref={ref} className={`transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"}`} style={{ transitionDelay: `${delay}ms` }}>
        {children}
      </div>
    );
  };

  // Skeleton for a transaction row
  const SkeletonTxCard = () => (
    <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_16px_48px_rgba(0,0,0,0.35)] p-4 sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_60%)]" />
      <div className="relative z-[1] flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-5 w-48 bg-white/10 rounded mb-2 animate-pulse" />
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
              <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  // Skeleton for balance summary
  const SkeletonBalanceCard = () => (
    <Card className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_16px_48px_rgba(0,0,0,0.30)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-3 w-28 bg-white/10 rounded mb-2 animate-pulse" />
          <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-9 w-24 bg-white/10 rounded-full animate-pulse" />
      </div>
    </Card>
  );

  // Toggle mock data for previewing UI
  const useMockData = false;

  // Convert backend transaction data to UI format
  const convertTransactionData = (backendTransactions, userPrincipal) => {
    return backendTransactions
      .map((tx, index) => {
        const timestamp = parseInt(tx.timestamp) / 1000000; // Convert nanoseconds to milliseconds
        const date = new Date(timestamp);

        let type = "unknown";
        let amount = 0;
        let description = "";
        let txHash = `tx_${index}_${timestamp}`; // Generate unique hash

        // Determine transaction type and amount based on transaction structure
        if (tx.transfer) {
          const transfer = tx.transfer;
          const fromPrincipal = transfer.from.owner.toString();
          const toPrincipal = transfer.to.owner.toString();
          const txAmount = convertE8sToToken(BigInt(transfer.amount));

          if (fromPrincipal === userPrincipal && toPrincipal !== userPrincipal) {
            type = "sent";
            amount = -txAmount;
            description = "Token transfer";
          } else if (toPrincipal === userPrincipal && fromPrincipal !== userPrincipal) {
            type = "receive";
            amount = txAmount;
            description = "Token received";
          }

          // Decode memo if available
          if (transfer.memo && transfer.memo.length > 0) {
            const memoBytes = Object.values(transfer.memo[0]);
            const memoText = String.fromCharCode(...memoBytes);
            description = memoText;
          }
        } else if (tx.mint) {
          const mint = tx.mint;
          const toPrincipal = mint.to.owner.toString();

          if (toPrincipal === userPrincipal) {
            type = "receive";
            amount = convertE8sToToken(BigInt(mint.amount));
            description = "Token minted";
          }

          // Decode memo if available
          if (mint.memo && mint.memo.length > 0) {
            const memoBytes = Object.values(mint.memo[0]);
            const memoText = String.fromCharCode(...memoBytes);
            description = memoText;
          }
        } else if (tx.burn) {
          const burn = tx.burn;
          const fromPrincipal = burn.from.owner.toString();

          if (fromPrincipal === userPrincipal) {
            type = "sent";
            amount = -convertE8sToToken(BigInt(burn.amount));
            description = "Token burned";
          }

          // Decode memo if available
          if (burn.memo && burn.memo.length > 0) {
            const memoBytes = Object.values(burn.memo[0]);
            const memoText = String.fromCharCode(...memoBytes);
            description = memoText;
          }
        } else if (tx.approve) {
          const approve = tx.approve;
          const fromPrincipal = approve.from.owner.toString();

          if (fromPrincipal === userPrincipal) {
            type = "sent";
            amount = 0; // Approve doesn't transfer tokens
            description = "Token approval";
          }

          // Decode memo if available
          if (approve.memo && approve.memo.length > 0) {
            const memoBytes = Object.values(approve.memo[0]);
            const memoText = String.fromCharCode(...memoBytes);
            description = memoText;
          }
        }

        return {
          id: index + 1,
          type,
          description,
          amount,
          date: date.toISOString(),
          txHash,
          timestamp: timestamp, // Add timestamp for sorting
        };
      })
      .filter((tx) => tx.type !== "unknown") // Filter out unknown transactions
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
  };

  // Fetch user balance and transactions from token canister
  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !identity) {
        return;
      }

      try {
        if (useMockData) {
          // Mock balance
          setUserBalance(4.9996);
          setWalletAddress(identity.getPrincipal().toString());

          // Mock transactions
          setIsLoadingTransactions(true);
          const now = Date.now();
          const mock = [
            {
              id: 1,
              type: "sent",
              description: "Report Stake",
              amount: -4.9996,
              date: new Date(now - 1000 * 60 * 60 * 1).toISOString(),
              txHash: "tx_a_1234567890abcdef",
              timestamp: now - 1000 * 60 * 60 * 1,
            },
            {
              id: 2,
              type: "sent",
              description: "Approve for staking report creation",
              amount: 0,
              date: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
              txHash: "tx_b_abcdef1234567890",
              timestamp: now - 1000 * 60 * 60 * 2,
            },
            {
              id: 3,
              type: "receive",
              description: "Faucet Claim",
              amount: 10,
              date: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
              txHash: "tx_c_9876543210fedcba",
              timestamp: now - 1000 * 60 * 60 * 24,
            },
          ];
          setTransactions(mock);
          setFilteredTransactions(mock);
          setIsLoadingTransactions(false);
        } else {
          // Fetch balance
          setIsLoadingBalance(true);
          const balance = await token.icrc1_balance_of({
            owner: identity.getPrincipal(),
            subaccount: [],
          });
          const convertedBalance = convertE8sToToken(balance);

          setUserBalance(convertedBalance);
          setWalletAddress(identity.getPrincipal().toString());
          setIsLoadingBalance(false);

          // Fetch transactions via index service (Fradium only)
          setIsLoadingTransactions(true);
          let fradiumTx = await getICRCTransactionHistory("fradium", identity.getPrincipal(), null, 100);
          // Fallback ke ledger langsung jika indexer belum ada data
          if (!fradiumTx || fradiumTx.length === 0) {
            try {
              const backendTransactions = await token.get_transactions({ start: 0, length: 100 });
              const userPrincipal = identity.getPrincipal().toString();
              const userTransactions = backendTransactions.transactions.filter((tx) => {
                if (tx.transfer) {
                  return tx.transfer.from.owner.toString() === userPrincipal || tx.transfer.to.owner.toString() === userPrincipal;
                }
                if (tx.mint) {
                  return tx.mint.to.owner.toString() === userPrincipal;
                }
                if (tx.burn) {
                  return tx.burn.from.owner.toString() === userPrincipal;
                }
                if (tx.approve) {
                  return tx.approve.from.owner.toString() === userPrincipal;
                }
                return false;
              });
              const converted = convertTransactionData(userTransactions, userPrincipal);
              setTransactions(converted);
              setFilteredTransactions(converted);
              setIsLoadingTransactions(false);
              return;
            } catch (_e) {
              // ignore fallback error; will proceed with empty list
            }
          }

          const mapped = fradiumTx.map((t, idx) => {
            const type = t.amount < 0 ? "sent" : "receive";
            return {
              id: idx + 1,
              type,
              description: t.title || (type === "sent" ? "Token transfer" : "Token received"),
              amount: t.amount, // already in FRADIUM units; negative for sent
              date: new Date(Number(t.timestamp)).toISOString(),
              txHash: t.hash || `tx_${idx}_${t.timestamp}`,
              timestamp: Number(t.timestamp),
            };
          });
          setTransactions(mapped);
          setFilteredTransactions(mapped);
          setIsLoadingTransactions(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoadingBalance(false);
        setIsLoadingTransactions(false);
      }
    };

    fetchData();

    // Listen for balance update events
    const handleBalanceUpdate = () => {
      fetchData();
    };

    window.addEventListener("balance-updated", handleBalanceUpdate);

    return () => {
      window.removeEventListener("balance-updated", handleBalanceUpdate);
    };
  }, [isConnected, identity]);

  // Filter transactions based on search and type filter
  useEffect(() => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((tx) => tx.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((tx) => tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, filterType]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  // Format transaction hash
  const formatTxHash = (hash) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  // Get transaction icon
  const getTransactionIcon = (type) => {
    return type === "receive" ? <ArrowDownLeft className="w-4 h-4 text-green-400" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />;
  };

  // Get transaction color
  const getTransactionColor = (type) => {
    return type === "receive" ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="min-h-screen bg-[#000510] text-white relative overflow-hidden flex flex-col">
      {/* Background layer - starts below navbar (not from top) */}
      <div className="absolute inset-x-0 top-20 md:top-28 bottom-0 z-0 pointer-events-none select-none">
        <img src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp" alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-cover object-top" />
      </div>
      {/* Soft fade at top edge to blend with navbar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent z-0" />
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/80 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link to="/" className="text-xl sm:text-2xl font-bold">
                Fradium
              </Link>
              <nav className="hidden lg:flex space-x-6">
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Community Vote
                </Link>
                <Link href="#" className="text-white font-medium">
                  My Wallet
                </Link>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Analytics
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isConnected && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2">
                  <span className="font-mono text-sm">{formatAddress(walletAddress)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 flex-1">
        <div className="container mx-auto max-w-4xl">
          {!isConnected ? (
            <div className="text-center py-16">
              <Coins className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-gray-300 mb-6">Connect your wallet to view your balance and transaction history.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Current Balance with Top Up (with skeleton + reveal) */}
              {isLoadingBalance ? (
                <SkeletonBalanceCard />
              ) : (
                <Reveal>
                  <Card className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_16px_48px_rgba(0,0,0,0.30)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/70 mb-1">Current Balance</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-semibold text-white">{userBalance ? userBalance : "0"}</span>
                          <span className="text-sm text-white/70">FRADIUM</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              )}

              {/* Transaction History */}
              <div className="rounded-2xl pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                  <h2 className="text-xl sm:text-2xl font-medium">Transaction History</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                    {/* Filter pills */}
                    <div className="flex items-center space-x-2">
                      <Button onClick={() => setFilterType("all")} className={`text-sm rounded-full px-4 py-1.5 border ${filterType === "all" ? "bg-white/10 text-white border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "bg-transparent text-white/80 border-white/15 hover:bg-white/10 hover:text-white"}`}>
                        All
                      </Button>
                      <Button onClick={() => setFilterType("receive")} className={`text-sm rounded-full px-4 py-1.5 border ${filterType === "receive" ? "bg-green-400 text-black border-green-400" : "bg-transparent text-white/80 border-white/15 hover:bg-white/10 hover:text-white"}`}>
                        Received
                      </Button>
                      <Button onClick={() => setFilterType("sent")} className={`text-sm rounded-full px-4 py-1.5 border ${filterType === "sent" ? "bg-red-400 text-white border-red-400" : "bg-transparent text-white/80 border-white/15 hover:bg-white/10 hover:text-white"}`}>
                        Sent
                      </Button>
                    </div>

                    {/* Search pill */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input placeholder="Search transactions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 bg-white/5 border-white/15 text-white placeholder-gray-400 focus:bg-white/10 rounded-full w-[220px] sm:w-[260px]" />
                    </div>
                  </div>
                </div>

                {/* Transaction List */}
                {isLoadingTransactions ? (
                  <div className="space-y-4">
                    {[0, 1, 2, 3].map((i) => (
                      <Reveal key={i} delay={i * 80}>
                        <SkeletonTxCard />
                      </Reveal>
                    ))}
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-12 text-center">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_60%)]" />
                    <Search className="relative z-[1] w-10 h-10 text-white/70 mx-auto mb-4" />
                    <h3 className="relative z-[1] text-base font-semibold text-white mb-1">No transactions found</h3>
                    <p className="relative z-[1] text-sm text-gray-400">{searchTerm || filterType !== "all" ? "Try adjusting your search terms or filters" : "Your transaction history will appear here"}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTransactions.map((transaction, idx) => {
                      const { date, time } = formatDate(transaction.date);
                      return (
                        <Reveal key={transaction.id} delay={idx * 80}>
                          <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_16px_48px_rgba(0,0,0,0.35)] p-4 sm:p-5">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_60%)]" />
                            <div className="relative z-[1] flex items-start justify-between">
                              <div className="flex items-start space-x-4 flex-1 min-w-0">
                                {/* Transaction Icon */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${transaction.type === "receive" ? "bg-green-400/10" : "bg-red-400/10"}`}>{getTransactionIcon(transaction.type)}</div>

                                {/* Transaction Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-medium text-white truncate pr-2">{transaction.description}</h3>
                                    <div className={`ml-2 font-medium text-lg sm:text-xl ${getTransactionColor(transaction.type)}`}>
                                      {transaction.amount > 0 ? "+" : ""}
                                      {transaction.amount} FRADIUM
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 text-sm text-white/70">
                                      <span className="capitalize">{transaction.type}</span>
                                      <span>•</span>
                                      <span>
                                        {date} at {time}
                                      </span>
                                    </div>
                                    <div className="font-mono text-xs text-white/60">{formatTxHash(transaction.txHash)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Reveal>
                      );
                    })}
                  </div>
                )}

                {/* Summary */}
                {filteredTransactions.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10 text-center text-gray-400 text-sm">
                    Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
                    {filterType !== "all" && ` (${filterType})`}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
