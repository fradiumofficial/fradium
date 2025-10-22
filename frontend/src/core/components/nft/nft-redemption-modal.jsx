import { Coins, AlertTriangle, CheckCircle2, X, Star, Leaf, Zap, Crown } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Progress } from "@/core/components/ui/progress";
import { nft as nftCanister, canisterId as nftCanisterId } from "declarations/nft";
import { token as tokenCanister } from "declarations/token";
import { useState } from "react";
import { Principal } from "@dfinity/principal";
import { convertTokenToE8s } from "../../lib/canisterUtils";

const getRarityIcon = (rarity) => {
  switch (rarity?.toLowerCase()) {
    case "legendary":
      return <Crown className="h-3 w-3 mr-1 text-white" />;
    case "epic":
      return <Zap className="h-3 w-3 mr-1 text-white" />;
    case "rare":
      return <Star className="h-3 w-3 mr-1 text-white" />;
    default:
      return <Leaf className="h-3 w-3 mr-1 text-white" />;
  }
};

const getRarityColor = (rarity) => {
  switch (rarity) {
    case "Common":
      return "bg-slate-500";
    case "Uncommon":
      return "bg-green-500";
    case "Rare":
      return "bg-blue-500";
    case "Epic":
      return "bg-purple-500";
    case "Legendary":
      return "bg-amber-500";
    default:
      return "bg-slate-500";
  }
};

export function NFTRedemptionModal({ nft, isOpen, onClose, userTokens, isRedeemed }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleRedeem() {
    setIsLoading(true);

    try {
      const nftPrincipal = Principal.fromText(nftCanisterId);

      const approveParams = {
        from_subaccount: [],
        spender: nftPrincipal,
        amount: BigInt(nft.tokenCost) * BigInt(10 ** 8),
        expires_at: [],
        fee: [],
        memo: [new TextEncoder().encode(`Approve for NFT #${parseInt(nft.tokenId)} redemption`)],
        created_at_time: [],
      };
      const approveResult = await tokenCanister.icrc2_approve(approveParams);

      if ("Err" in approveResult) {
        toast.error(`Failed to approve tokens: ${approveResult.Err}`);
        return;
      }

      // Then proceed with redemption
      const result = await nftCanister.redeem(Number(nft.tokenId));

      if ("Ok" in result) {
        toast.success("NFT redeemed successfully!");
        window.location.reload();
      } else {
        toast.error(result.Err);
      }
    } catch (error) {
      console.error("Error in redemption process:", error);
      toast.error(error.message || "An error occurred while redeeming the NFT. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm NFT Redemption</DialogTitle>
          <DialogDescription>You are about to redeem this NFT using your LUM tokens. This action cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <div className="relative w-40 h-40 mb-4 rounded-lg overflow-hidden">
            <img src={nft.image || "/placeholder.svg"} alt={nft.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <Badge className={`absolute top-2 right-2 ${getRarityColor(nft.rarity)}`}>
              {getRarityIcon(nft.rarity)}
              {nft.rarity}
            </Badge>
          </div>

          <h3 className="text-lg font-semibold text-center mb-1">{nft.name}</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">{nft.description}</p>

          <div className="w-full bg-muted p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Your Balance</span>
              <span className="text-sm font-medium flex items-center">
                {userTokens} <Coins className="h-3 w-3 ml-1 text-emerald-500" />
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Redemption Cost</span>
              <span className="text-sm font-medium flex items-center">
                {nft.tokenCost} <Coins className="h-3 w-3 ml-1 text-emerald-500" />
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Remaining Balance</span>
              <span className="text-sm font-medium flex items-center">
                {userTokens - nft.tokenCost} <Coins className="h-3 w-3 ml-1 text-emerald-500" />
              </span>
            </div>
            <Progress value={((userTokens - nft.tokenCost) / userTokens) * 100} className="h-2 mt-2" />
          </div>

          {userTokens < nft.tokenCost ? (
            <div className="flex items-center text-amber-500 mb-4">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span className="text-sm">You don't have enough tokens to redeem this NFT.</span>
            </div>
          ) : (
            <div className="flex items-center text-emerald-500 mb-4">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              <span className="text-sm">You have enough tokens to redeem this NFT!</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleRedeem} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700" disabled={userTokens < nft.tokenCost || isLoading || isRedeemed}>
            <Coins className="h-4 w-4 mr-2" />
            {isLoading ? "Confirming..." : "Confirm Redemption"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
