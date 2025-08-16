import { Check } from "lucide-react";

type NetworkItem = {
    key: string;
    name: string;
    amount?: string;
};

type AllNetworksDropdownProps = {
    isOpen: boolean;
    onClose: () => void;
    selectedKey: string;
    onSelect: (key: string) => void;
    items?: NetworkItem[];
};

const DEFAULT_ITEMS: NetworkItem[] = [
    { key: "all", name: "All Networks", amount: "$0.00" },
    { key: "btc", name: "Bitcoin", amount: "$0.00" },
    { key: "eth", name: "Ethereum", amount: "$0.00" },
    { key: "fra", name: "Fradium", amount: "$0.00" },
];

export default function AllNetworksDropdown({
    isOpen,
    onClose,
    selectedKey,
    onSelect,
    items = DEFAULT_ITEMS,
}: AllNetworksDropdownProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            {/* click outside to close */}
            <div className="absolute inset-0 bg-black/0" onClick={onClose} />

            {/* Panel area below header and above bottom nav */}
            <div className="absolute left-0 right-0 top-16 bottom-16 overflow-hidden">
                <div className="h-full w-full bg-[#1C1D22]">
                    <div className="px-4 pt-6 pb-3">
                        <h2 className="text-white text-[28px] font-bold">All Network</h2>
                    </div>

                    <div className="px-4">
                        <div className="rounded-sm border border-white/10 divide-y divide-white/5 bg-[#23252a]">
                            {items.map((item, idx) => {
                                const isActive = item.key === selectedKey;
                                return (
                                    <button
                                        key={item.key}
                                        onClick={() => onSelect(item.key)}
                                        className={`w-full flex items-center justify-between px-4 py-5 text-left ${isActive ? "bg-white/5" : "bg-transparent"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isActive ? (
                                                <Check className="w-5 h-5 text-[#9BE4A0]" />
                                            ) : (
                                                <div className="w-5 h-5" />
                                            )}
                                            <span className="text-white text-[18px] font-medium">{item.name}</span>
                                        </div>
                                        <span className="text-white/70 text-[18px] font-medium">
                                            {item.amount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-center mt-8">
                            <button
                                type="button"
                                className="flex items-center gap-2 text-[#9BE4A0] text-[18px] font-medium"
                            >
                                <img src="/assets/construction.svg" className="w-5 h-5" alt="manage" />
                                Manage Networks
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
