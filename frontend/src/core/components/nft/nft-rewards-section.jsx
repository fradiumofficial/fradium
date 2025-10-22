import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/core/components/ui/button";
import { ChevronRight, Sparkles, Coins, Leaf, Star, Zap, Crown } from "lucide-react";
import { nft } from "declarations/nft";
import { useAuth } from "../../providers/auth-provider";
import { NFTCard } from "./nft-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/core/components/ui/dialog";
import { Badge } from "@/core/components/ui/badge";
import { convertE8sToToken } from "../../lib/canisterUtils";
import { NFTRedemptionModal } from "./nft-redemption-modal";

export default function NFTRewardsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedemptionModalOpen, setIsRedemptionModalOpen] = useState(false);

  const canRedeem = user?.role ?? "-" === "participant";

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setLoading(true);
        const result = await nft.getAvailableNFTs();
        if ("Ok" in result) {
          setNfts(result.Ok.slice(0, 4));
        } else {
          setError(result.Err);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, []);

  const handleRedeemClick = (nft) => {
    setSelectedNFT(nft);
    setIsModalOpen(false);
    setIsRedemptionModalOpen(true);
  };

  const getRarityIcon = (rarity) => {
    switch (rarity.toLowerCase()) {
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

  if (loading) {
    return (
      <section className="py-12 border-t">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8">Exclusive NFT Rewards</h2>
          <div className="text-center py-8">Loading NFTs...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 border-t">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8">Exclusive NFT Rewards</h2>
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        </div>
      </section>
    );
  }

  if (nfts.length === 0) {
    return (
      <section className="py-12 border-t">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8">Exclusive NFT Rewards</h2>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No NFTs available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 border-t">
      <div className="container">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Sparkles className="h-6 w-6 mr-2 text-amber-400" />
              Exclusive NFT Rewards
            </h2>
            <p className="text-muted-foreground mt-1">Redeem your tokens for limited-edition sustainability NFTs</p>
          </div>
          {
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full">
                <Coins className="h-5 w-5 mr-2" />
                <span className="font-semibold">{convertE8sToToken(user?.balance) ?? 0} LUM Tokens</span>
              </div>
            </div>
          }
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {nfts.map(([tokenId, metadata, price, maxRedemptions, currentRedemptions, isRedeemed]) => {
            return (
              <NFTCard
                key={tokenId}
                tokenId={tokenId}
                metadata={metadata}
                price={price}
                canRedeem={canRedeem}
                isRedeemed={isRedeemed}
                userTokens={user?.balance}
                onRedeemClick={handleRedeemClick}
                onClick={() => {
                  setSelectedNFT({ tokenId, metadata, price });
                  setIsModalOpen(true);
                }}
              />
            );
          })}
        </div>

        {selectedNFT && (
          <>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-amber-400" />
                    {selectedNFT.metadata.name}
                  </DialogTitle>
                  <DialogDescription>{selectedNFT.metadata.description}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden">
                      <img src={selectedNFT.metadata.image || "/placeholder.svg"} alt={selectedNFT.metadata.name} className="object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <Badge className={`absolute top-2 right-2 ${getRarityColor(selectedNFT.metadata.attributes.find((attr) => attr.trait_type === "Rarity")?.value)}`}>
                        {getRarityIcon(selectedNFT.metadata.attributes.find((attr) => attr.trait_type === "Rarity")?.value)}
                        {selectedNFT.metadata.attributes.find((attr) => attr.trait_type === "Rarity")?.value || "Common"}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Category:</span>
                          <span>{selectedNFT.metadata.attributes.find((attr) => attr.trait_type === "Category")?.value || "General"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rarity:</span>
                          <span className="flex items-center">
                            {getRarityIcon(selectedNFT.metadata.attributes.find((attr) => attr.trait_type === "Rarity")?.value)}
                            {selectedNFT.metadata.attributes.find((attr) => attr.trait_type === "Rarity")?.value || "Common"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="flex items-center">
                            <Leaf className="h-3 w-3 mr-1 text-emerald-500" />
                            {convertE8sToToken(selectedNFT.price)} LUM
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {canRedeem && (
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleRedeemClick(selectedNFT)}>
                      Redeem NFT
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <NFTRedemptionModal
              nft={{
                isRedeemed: selectedNFT.isRedeemed,
                tokenId: selectedNFT.tokenId,
                name: selectedNFT.metadata.name,
                description: selectedNFT.metadata.description,
                image: selectedNFT.metadata.image,
                rarity: selectedNFT.metadata.attributes.find((attr) => attr.trait_type === "Rarity")?.value || "Common",
                tokenCost: convertE8sToToken(selectedNFT.price),
              }}
              isOpen={isRedemptionModalOpen}
              onClose={() => setIsRedemptionModalOpen(false)}
              userTokens={convertE8sToToken(user?.balance) ?? 0}
            />
          </>
        )}

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => navigate("/nfts")}>
            View All NFTs
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
