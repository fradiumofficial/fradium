import { useState, useEffect } from "react";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/core/components/ui/card";
import { TransactionHistory } from "@/core/components/balance/transaction-history";
import { Receipt } from "lucide-react";
import { convertE8sToToken } from "@/core/lib/canisterUtils";
import { token } from "declarations/token";
import { useAuth } from "@/core/providers/auth-provider";

export default function CommunityBalance() {
  const { identity } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [balanceData, setBalanceData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [timeframe, setTimeframe] = useState("month");

  useEffect(() => {
    fetchBalanceData();
  }, []);

  const fetchBalanceData = async () => {
    setIsLoading(true);

    try {
      // Run balance and transaction history fetch in parallel
      const [balance, transactionHistory] = await Promise.all([
        token.icrc1_balance_of({
          owner: identity.getPrincipal(),
          subaccount: [],
        }),
        token.transactionHistoryOf({
          owner: identity.getPrincipal(),
          subaccount: [],
        }),
      ]);

      setTransactions(transactionHistory);

      setBalanceData({
        balance: convertE8sToToken(balance),
        totalEarned: transactionHistory
          .filter((tx) => {
            if ("Mint" in tx.operation) {
              return tx.operation.Mint.to.owner.toText() === identity.getPrincipal().toText();
            } else if ("Transfer" in tx.operation) {
              return tx.operation.Transfer.to.owner.toText() === identity.getPrincipal().toText();
            }
            return false;
          })
          .reduce((sum, tx) => {
            if ("Mint" in tx.operation) {
              return sum + convertE8sToToken(tx.operation.Mint.amount);
            } else if ("Transfer" in tx.operation) {
              return sum + convertE8sToToken(tx.operation.Transfer.amount);
            }
            return sum;
          }, 0),
        totalSpent: transactionHistory
          .filter((tx) => {
            if ("Burn" in tx.operation) {
              return tx.operation.Burn.from.owner.toText() === identity.getPrincipal().toText();
            } else if ("Transfer" in tx.operation) {
              return tx.operation.Transfer.from.owner.toText() === identity.getPrincipal().toText();
            }
            return false;
          })
          .reduce((sum, tx) => {
            if ("Burn" in tx.operation) {
              return sum + convertE8sToToken(tx.operation.Burn.amount);
            } else if ("Transfer" in tx.operation) {
              return sum + convertE8sToToken(tx.operation.Transfer.amount);
            }
            return sum;
          }, 0),
      });
    } catch (error) {
      console.error("Error fetching balance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-64 bg-muted rounded mb-4"></div>
              <div className="h-4 w-48 bg-muted rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container py-8">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 border-emerald-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold">{balanceData.balance}</div>
                <div className="ml-1 text-lg">LUM</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Allocated to Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold">{balanceData.totalSpent}</div>
                <div className="ml-1 text-lg">LUM</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Distributed Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold">{balanceData.totalEarned}</div>
                <div className="ml-1 text-lg">LUM</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Transaction History</CardTitle>
            </div>
            <CardDescription>View all community token transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">There are no transactions to display at the moment. Transactions will appear here once they are made.</p>
              </div>
            ) : (
              <TransactionHistory transactions={transactions} isCommunity={true} />
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <div className="text-sm text-muted-foreground">{transactions.length === 0 ? "No transactions" : `Showing ${transactions.length} transactions`}</div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
