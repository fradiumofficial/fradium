import React from "react";
import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import SidebarButton from "@/core/components/SidebarButton";
import { LoadingState } from "@/core/components/ui/loading-state";

export default function ConfirmCreateWalletModal({ isOpen, onOpenChange, onConfirm, isLoading }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#23272f] rounded-xl max-w-[480px] p-0 overflow-hidden">
        <div className="flex items-center justify-between px-8 pt-8 pb-0">
          <div className="text-lg font-normal text-white">Confirm create wallet</div>
        </div>
        <img src="/assets/images/card-confirm-wallet.png" alt="Confirm Wallet" className="w-full object-cover mb-0" />
        <div className="px-8">
          <div className="text-2xl font-bold text-white mt-8 mb-2">Create a New Wallet?</div>
          <div className="text-[#B0B6BE] text-base mb-8">By continuing, Fradium will automatically generate a new wallet for you. This process is instant and non-reversible.</div>
        </div>
        <div className="px-8 pb-8">
          <SidebarButton onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingState type="spinner" size="sm" color="primary" />
                <span>Creating Wallet...</span>
              </div>
            ) : (
              "Confirm and Create"
            )}
          </SidebarButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
