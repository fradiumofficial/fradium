import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Star, Leaf, Zap, Crown, Gift } from "lucide-react";
import { convertE8sToToken } from "../../lib/canisterUtils";

const cardVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

const imageVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const contentVariants = {
  initial: { y: 0 },
  hover: {
    y: -5,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
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

export function NFTCard({ tokenId, metadata, price, canRedeem, userTokens, onRedeemClick, onClick, isRedeemed, role = "participant" }) {
  const rarity = metadata.attributes.find((attr) => attr.trait_type === "Rarity")?.value || "Common";

  return (
    <motion.div variants={cardVariants} initial="initial" whileHover="hover" className="cursor-pointer" onClick={onClick}>
      <Card className="overflow-hidden border-border/40 hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-square overflow-hidden">
          <motion.img src={metadata.image} alt={metadata.name} variants={imageVariants} className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <Badge className={`absolute top-2 right-2 ${getRarityColor(rarity)}`}>
            {getRarityIcon(rarity)}
            {rarity}
          </Badge>
          {isRedeemed && (
            <Badge className="absolute top-2 left-2 bg-emerald-500">
              <Gift className="h-3 w-3 mr-1" />
              Redeemed
            </Badge>
          )}
        </div>
        <motion.div variants={contentVariants}>
          <CardContent className="p-4">
            <h3 className="font-medium text-lg mb-1">{metadata.name}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{metadata.description}</p>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Leaf className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="font-medium">{convertE8sToToken(price)} LUM</span>
              </div>
              {canRedeem && !isRedeemed ? (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={userTokens < price}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRedeemClick({ tokenId, metadata, price });
                  }}>
                  <Gift className="h-4 w-4 mr-1" />
                  Redeem
                </Button>
              ) : isRedeemed ? (
                <Button size="sm" variant="outline" disabled onClick={(e) => e.stopPropagation()}>
                  <Gift className="h-4 w-4 mr-1" />
                  Redeemed
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled onClick={(e) => e.stopPropagation()}>
                  {role === "participant" ? "Login to Redeem" : "Participant Only"}
                </Button>
              )}
            </div>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
}
