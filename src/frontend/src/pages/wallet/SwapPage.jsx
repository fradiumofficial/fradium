import React from "react";
import SwapTokenModal from "@/core/components/modals/SwapTokenModal.jsx";

export default function SwapPage() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="relative flex flex-col max-w-[33rem] gap-8 mx-auto w-full bg-transparent px-4">
      <div className="mt-8" />
      <SwapTokenModal open={open} onClose={() => setOpen(false)} defaultInSymbol="ICP" />
      {!open && (
        <div className="text-center text-white/70 mt-10">Swap closed. Use the sidebar to reopen.</div>
      )}
    </div>
  );
}


