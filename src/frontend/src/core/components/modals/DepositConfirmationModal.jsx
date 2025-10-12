import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import { getBalance } from "@/core/lib/tokenUtils.js";
import { icp_ledger } from "declarations/icp_ledger";
import { fradium_ledger } from "declarations/fradium_ledger";
import { ckbtc_ledger } from "declarations/ckbtc_ledger";
import { cketh_ledger } from "declarations/cketh_ledger";
import { useAuth } from "@/core/providers/AuthProvider";

export default function DepositConfirmationModal({ isOpen, onClose, onConfirm, tokenInfo, amount, escrowId, isDepositing = false }) {
  const { identity } = useAuth();
  const [tokenBalance, setTokenBalance] = useState("0");
  const [fradiumBalance, setFradiumBalance] = useState("0");
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [tokenFeeNat, setTokenFeeNat] = useState("0");
  const [tokenDecimals, setTokenDecimals] = useState(8);

  // Helper function to get token ID from symbol
  const getTokenIdFromSymbol = (symbol) => {
    switch (symbol) {
      case "ICP":
        return 4;
      case "FRADIUM":
        return 5;
      case "ckBTC":
        return 6;
      case "ckETH":
        return 7;
      default:
        return null;
    }
  };

  const fetchBalances = async () => {
    if (!identity?.getPrincipal || !tokenInfo) return;

    setIsLoadingBalances(true);
    try {
      const principal = identity.getPrincipal();

      // Fetch token balance
      const tokenId = getTokenIdFromSymbol(tokenInfo.symbol);
      if (tokenId) {
        const balance = await getBalance(tokenId, principal);
        setTokenBalance(balance);
      }

      // Fetch FRADIUM balance (token ID 5)
      const fradiumBalance = await getBalance(5, principal);
      setFradiumBalance(fradiumBalance);
    } catch (error) {
      console.error("Error fetching balances:", error);
      setTokenBalance("0");
      setFradiumBalance("0");
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Fetch balances when modal opens
  useEffect(() => {
    if (isOpen && identity?.getPrincipal && tokenInfo) {
      fetchBalances();
    }
  }, [isOpen, identity, tokenInfo]);

  // Fetch token transfer fee and decimals from ledger
  useEffect(() => {
    const fetchFeeAndDecimals = async () => {
      if (!isOpen || !tokenInfo?.symbol) return;
      try {
        let ledger = null;
        switch (tokenInfo.symbol) {
          case "ICP":
            ledger = icp_ledger;
            break;
          case "FRADIUM":
            ledger = fradium_ledger;
            break;
          case "ckBTC":
            ledger = ckbtc_ledger;
            break;
          case "ckETH":
            ledger = cketh_ledger;
            break;
          default:
            ledger = null;
        }

        // Default decimals fallback by common conventions
        let decimals = 8;
        try {
          if (ledger?.icrc1_decimals) {
            const d = await ledger.icrc1_decimals();
            decimals = Number(d);
          } else if (ledger?.decimals) {
            const d = await ledger.decimals();
            decimals = Number(d);
          } else if (tokenInfo.symbol === "ckETH") {
            decimals = 18;
          } else if (tokenInfo.symbol === "ckBTC") {
            decimals = 8;
          }
        } catch (_e) {
          // Keep fallback
          decimals = tokenInfo.symbol === "ckETH" ? 18 : 8;
        }
        setTokenDecimals(Number.isFinite(decimals) ? decimals : 8);

        // Fetch fee from ledger (icrc1_fee)
        let feeNat = "0";
        try {
          if (ledger?.icrc1_fee) {
            const f = await ledger.icrc1_fee();
            feeNat = typeof f === "bigint" ? f.toString() : String(f);
          }
        } catch (_e2) {
          feeNat = "0";
        }
        setTokenFeeNat(feeNat);
      } catch (_err) {
        setTokenDecimals(tokenInfo?.symbol === "ckETH" ? 18 : 8);
        setTokenFeeNat("0");
      }
    };
    fetchFeeAndDecimals();
  }, [isOpen, tokenInfo]);

  // Disable page scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Format amount for display (convert from e8s to readable format)
  const formatAmount = (amountNat, decimals = 8) => {
    try {
      const n = BigInt(amountNat ?? 0);
      const d = Math.max(0, Number(decimals ?? 8));
      const base = BigInt(10) ** BigInt(d);
      const intPart = n / base;
      const fracPart = n % base;
      let fracStr = fracPart.toString().padStart(d, "0");
      fracStr = fracStr.replace(/0+$/, "");
      return fracStr.length ? `${intPart.toString()}.${fracStr}` : intPart.toString();
    } catch (_e) {
      return String(amountNat ?? 0);
    }
  };

  // Format fee amount (10_000 e8s = 0.0001 FRADIUM)
  const feeAmount = "10000"; // 10_000 e8s (10,000 smallest units)
  const feeFormatted = formatAmount(feeAmount, 8);

  // Helper to format current token using dynamic decimals
  const formatToken = (nat) => formatAmount(nat, tokenDecimals);

  // Compute total token out = deposit amount + transfer fee (same token)
  const totalTokenOutNat = (() => {
    try {
      const a = BigInt(String(amount ?? 0));
      const f = BigInt(String(tokenFeeNat ?? "0"));
      return (a + f).toString();
    } catch (_e) {
      return String(amount ?? 0);
    }
  })();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center pt-8 pl-4 pr-4 pb-4">
        <motion.div className="relative w-full max-w-[500px] mx-auto my-8 bg-[#171A1C] rounded-2xl border border-white/10" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
          <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={onClose} aria-label="Close">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex flex-col items-center p-4 gap-4 h-auto">
            <div className="w-full text-center text-white text-lg font-medium">Confirm Deposit</div>

            {/* Token Info */}
            <motion.div variants={itemVariants} className="mx-2 sm:mx-3 w-full mb-2 rounded-xl bg-[#FFFFFF08] border-white/10 p-6">
              <div className="flex items-center gap-3">
                <img src={tokenInfo?.imageUrl} alt={tokenInfo?.name} className="w-8 h-8" />
                <div className="flex-1">
                  <div className="text-white font-medium">{tokenInfo?.name}</div>
                  <div className="text-[#B0B6BE] text-sm">{tokenInfo?.symbol} • Escrow Deposit</div>
                </div>
              </div>
            </motion.div>

            {/* Balance Information */}
            <motion.div variants={itemVariants} className="mx-2 sm:mx-3 w-full mb-2 rounded-xl bg-[#FFFFFF08] border-white/10 p-6">
              <div className="space-y-4">
                <div className="text-white/90 text-sm font-medium mb-3">Your Balances</div>

                {/* Token Balance */}
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">{tokenInfo?.symbol} Balance</span>
                  <div className="text-right">{isLoadingBalances ? <div className="text-white/50 text-sm">Loading...</div> : <div className="text-white font-mono text-sm">{tokenBalance}</div>}</div>
                </div>

                {/* FRADIUM Balance */}
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">FRADIUM Balance</span>
                  <div className="text-right">{isLoadingBalances ? <div className="text-white/50 text-sm">Loading...</div> : <div className="text-white font-mono text-sm">{fradiumBalance}</div>}</div>
                </div>
              </div>
            </motion.div>

            {/* Deposit Details */}
            <motion.div variants={itemVariants} className="mx-2 sm:mx-3 w-full mb-2 rounded-xl bg-[#FFFFFF08] border-white/10 p-6">
              <div className="space-y-5">
                {/* Deposit Amount */}
                <div className="flex justify-between items-center">
                  <span className="text-white/90 text-sm font-medium">Deposit Amount</span>
                  <div className="text-right">
                    <div className="text-white font-mono text-sm">
                      {formatToken(amount)} {tokenInfo?.symbol}
                    </div>
                  </div>
                </div>

                {/* Transfer Fee (from ledger) */}
                <div className="flex justify-between items-center">
                  <span className="text-white/90 text-sm font-medium">Transfer Fee</span>
                  <div className="text-right text-white font-mono text-sm">{tokenFeeNat ? `${formatToken(tokenFeeNat)} ${tokenInfo?.symbol}` : "-"}</div>
                </div>

                {/* Escrow ID */}
                <div className="flex justify-between items-start">
                  <span className="text-white/90 text-sm font-medium">Escrow ID</span>
                  <div className="text-right flex-1 ml-4">
                    <div className="text-white font-mono text-sm">{escrowId}</div>
                  </div>
                </div>

                {/* FRADIUM Fee */}
                <div className="flex justify-between items-center">
                  <span className="text-white/90 text-sm font-medium">FRADIUM Fee</span>
                  <div className="text-white font-mono text-sm">{feeFormatted} FRADIUM</div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm font-medium">Total to Pay</span>
                    <div className="text-right">
                      <div className="text-white font-mono text-sm">
                        {formatToken(totalTokenOutNat)} {tokenInfo?.symbol}
                      </div>
                      <div className="text-[#B0B6BE] text-xs">+ {feeFormatted} FRADIUM fee</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Warning */}
            <motion.div variants={itemVariants} className="mx-2 sm:mx-3 w-full mb-2 rounded-xl p-6 bg-[rgba(155,228,160,0.06)] border border-[rgba(155,228,160,0.3)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#9BE4A0]"></div>
                <span className="text-white text-sm font-medium">Deposit Information</span>
              </div>
              <div className="text-[#B0B6BE] text-xs">Your tokens will be locked in the escrow canister. Once both parties deposit, the trade will be automatically completed.</div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div variants={itemVariants} className="w-full px-2 sm:px-3 pb-2">
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-full border border-white/15 text-white/90 font-medium hover:bg-white/[0.05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={onClose} disabled={isDepositing}>
                  Cancel
                </button>
                <ButtonGreen fullWidth className="flex-1" onClick={onConfirm} disabled={isDepositing} size="md" textSize="text-base" fontWeight="medium">
                  {isDepositing ? "Depositing..." : "Confirm Deposit"}
                </ButtonGreen>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
}
