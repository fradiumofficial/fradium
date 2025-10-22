import { useState } from "react";
import { Badge } from "@/core/components/ui/badge";
import { Download, Upload, Clock, Users, Wallet } from "lucide-react";
import { useAuth } from "../../providers/auth-provider";
import { convertE8sToToken } from "../../lib/canisterUtils";

export function TransactionHistory({ transactions: initialTransactions, isCommunity = false }) {
  const { identity } = useAuth();

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "topup":
        return <Wallet className="h-10 w-10 p-2 text-emerald-500 bg-emerald-500/10 rounded-full" />;
      case "distribution":
        return <Users className="h-10 w-10 p-2 text-red-500 bg-red-500/10 rounded-full" />;
      case "reward":
        return <Download className="h-10 w-10 p-2 text-emerald-500 bg-emerald-500/10 rounded-full" />;
      case "spend":
        return <Upload className="h-10 w-10 p-2 text-red-500 bg-red-500/10 rounded-full" />;
      case "approve":
        return <Upload className="h-10 w-10 p-2 text-amber-500 bg-amber-500/10 rounded-full" />;
      default:
        return <Clock className="h-10 w-10 p-2 text-muted-foreground bg-muted/50 rounded-full" />;
    }
  };

  const transactions = initialTransactions.map((tx) => {
    let title, subtitle, isPositive, amount, type;

    const status = "completed";
    if ("Transfer" in tx.operation) {
      const { from, amount: txAmount, memo } = tx.operation.Transfer;
      title = "Token Transfer";
      subtitle = memo?.[0] ? new TextDecoder().decode(memo[0]) : "-";
      isPositive = from.owner.toText() == identity.getPrincipal() ? false : true;
      amount = convertE8sToToken(txAmount);
    } else if ("Mint" in tx.operation) {
      const { from, amount: txAmount, memo } = tx.operation.Mint;
      title = "Mint Token";
      subtitle = memo?.[0] ? new TextDecoder().decode(memo[0]) : "-";
      isPositive = from.owner.toText() == identity.getPrincipal() ? false : true;
      amount = convertE8sToToken(txAmount);
    } else if ("Burn" in tx.operation) {
      const { amount: txAmount, memo } = tx.operation.Burn;
      title = "Token Burn";
      subtitle = memo?.[0] ? new TextDecoder().decode(memo[0]) : "-";
      isPositive = false;
      amount = convertE8sToToken(txAmount);
    } else if ("Approve" in tx.operation) {
      const { amount: txAmount, memo } = tx.operation.Approve;
      title = "Token Approval";
      subtitle = memo?.[0] ? new TextDecoder().decode(memo[0]) : "-";
      isPositive = null;
      amount = convertE8sToToken(txAmount);
    }

    if (isCommunity) {
      type = isPositive ? "topup" : "distribution";
    } else {
      type = isPositive == null ? "approve" : isPositive ? "reward" : "spend";
    }

    return {
      title,
      subtitle,
      isPositive,
      amount,
      status,
      type,
      date: parseInt(tx.timestamp) / 1_000_000,
    };
  });

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="border rounded-lg overflow-hidden">
          <div className="flex items-center p-4">
            <div className="mr-4">{getTypeIcon(transaction.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{transaction.title}</div>
              <div className="text-sm text-muted-foreground truncate">{transaction.subtitle}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(transaction.date).toLocaleDateString()} at {new Date(transaction.date).toLocaleTimeString()}
              </div>
            </div>
            <div className="flex flex-col items-end ml-4">
              <div className={`font-bold ${transaction.isPositive == null ? "text-amber-500" : transaction.isPositive ? "text-emerald-500" : "text-red-500"}`}>
                {transaction.isPositive == null ? "" : transaction.isPositive ? "+" : "-"}
                {transaction.amount} LUM
              </div>
              <div className="mt-1">{getStatusBadge(transaction.status)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
