import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Sparkles, Search, Lock, Leaf, Star, Zap, Crown } from "lucide-react";
import { NFTCard } from "@/core/components/nft/nft-card";
import { nft } from "declarations/nft";
import { useAuth } from "@/core/providers/auth-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/core/components/ui/dialog";
import { Badge } from "@/core/components/ui/badge";
import { convertE8sToToken } from "@/core/lib/canisterUtils";
import { NFTRedemptionModal } from "@/core/components/nft/nft-redemption-modal";

export default function NFTsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nfts, setNfts] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedemptionModalOpen, setIsRedemptionModalOpen] = useState(false);

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

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setLoading(true);
        const result = await nft.getAvailableNFTs();

        console.log(result, "result");
        if ("Ok" in result) {
          setNfts(result.Ok);
        } else {
          setError(result.Err);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserNFTs = async () => {
      if (!user) return;
      try {
        const result = await nft.getRedeemedTokens();
        if ("Ok" in result) {
          setUserNFTs(result.Ok);
        } else {
          console.error("Error fetching user NFTs:", result.Err);
        }
      } catch (err) {
        console.error("Error fetching user NFTs:", err);
      }
    };

    fetchNFTs();
    fetchUserNFTs();
  }, [user]);

  // Filter NFTs based on search and rarity
  const filteredNFTs = nfts.filter(([_, metadata, __]) => {
    const matchesSearch = metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) || metadata.description.toLowerCase().includes(searchQuery.toLowerCase());
    const rarity = metadata.attributes.find((attr) => attr.trait_type === "Rarity")?.value || "Common";
    const matchesRarity = rarityFilter === "all" || rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  const filteredUserNFTs = userNFTs.filter(([_, metadata, __]) => {
    const matchesSearch = metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) || metadata.description.toLowerCase().includes(searchQuery.toLowerCase());
    const rarity = metadata.attributes.find((attr) => attr.trait_type === "Rarity")?.value || "Common";
    const matchesRarity = rarityFilter === "all" || rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  const handleRedeemClick = (nft) => {
    setSelectedNFT(nft);
    setIsModalOpen(false);
    setIsRedemptionModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container py-8">
          <div className="text-center py-12">Loading NFTs...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container py-8">
          <div className="text-center py-12 text-red-500">Error: {error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Sparkles className="h-6 w-6 mr-2 text-amber-400" />
              NFT Collections
            </h1>
            <p className="text-muted-foreground mt-1">Explore and collect unique NFTs that represent your sustainability achievements</p>
          </div>
        </div>

        <Tabs defaultValue="collections">
          <TabsList className="mb-6">
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="my-nfts">My NFTs</TabsTrigger>
          </TabsList>

          <TabsContent value="collections">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search NFTs..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={rarityFilter} onValueChange={setRarityFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by rarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rarities</SelectItem>
                  <SelectItem value="Common">Common</SelectItem>
                  <SelectItem value="Uncommon">Uncommon</SelectItem>
                  <SelectItem value="Rare">Rare</SelectItem>
                  <SelectItem value="Epic">Epic</SelectItem>
                  <SelectItem value="Legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNFTs.map(([tokenId, metadata, price, maxRedemptions, currentRedemptions, isRedeemed]) => (
                <NFTCard
                  key={tokenId}
                  tokenId={tokenId}
                  metadata={metadata}
                  price={price}
                  role={user?.role}
                  canRedeem={user?.role === "participant"}
                  userTokens={user?.balance}
                  onRedeemClick={handleRedeemClick}
                  isRedeemed={isRedeemed}
                  onClick={() => {
                    setSelectedNFT({ tokenId, metadata, price, maxRedemptions, currentRedemptions, isRedeemed });
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-nfts">
            {!user ? (
              <div className="mt-12 flex flex-col">
                <main className="flex-1 container py-12 flex flex-col items-center justify-center">
                  <div className="text-center max-w-md">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h1 className="text-2xl font-bold mb-2">Login Required</h1>
                    <p className="text-muted-foreground mb-6">Please log in to view and manage your NFTs.</p>
                  </div>
                </main>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Your NFT Collection</h2>
                  <p className="text-muted-foreground">NFTs you've earned through your sustainability actions and token redemptions</p>
                </div>

                {userNFTs.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-medium mb-2">No NFTs Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">You haven't earned any NFTs yet. Complete sustainability challenges or redeem tokens to earn your first NFT.</p>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/projects")}>
                      Explore Projects
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredUserNFTs.map(([tokenId, metadata, price, maxRedemptions, currentRedemptions]) => (
                      <NFTCard
                        key={tokenId}
                        tokenId={tokenId}
                        metadata={metadata}
                        price={price}
                        canRedeem={false}
                        isRedeemed={true}
                        userTokens={user?.balance}
                        onRedeemClick={handleRedeemClick}
                        onClick={() => {
                          setSelectedNFT({ tokenId, metadata, price, maxRedemptions, currentRedemptions, isRedeemed: true });
                          setIsModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

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
                  {user?.role === "participant" && !selectedNFT.isRedeemed && (
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleRedeemClick(selectedNFT)}>
                      Redeem NFT
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <NFTRedemptionModal
              nft={{
                tokenId: selectedNFT.tokenId,
                name: selectedNFT.metadata.name,
                description: selectedNFT.metadata.description,
                image: selectedNFT.metadata.image,
                rarity: selectedNFT.metadata.attributes.find((attr) => attr.trait_type === "Rarity")?.value || "Common",
                tokenCost: convertE8sToToken(selectedNFT.price),
                isRedeemed: selectedNFT.isRedeemed,
              }}
              isOpen={isRedemptionModalOpen}
              onClose={() => setIsRedemptionModalOpen(false)}
              userTokens={convertE8sToToken(user?.balance) ?? 0}
            />
          </>
        )}
      </main>
    </div>
  );
}
