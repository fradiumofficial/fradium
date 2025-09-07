import React, { createContext, useContext, useState } from "react";

export type SelectedNetworkKey = "all" | "btc" | "eth" | "fra" | "sol";

type NetworkContextValue = {
    selectedNetwork: SelectedNetworkKey;
    setSelectedNetwork: (key: SelectedNetworkKey) => void;
    getNetworkDisplayName: (key: SelectedNetworkKey) => string;
    getNetworkTokenType: (key: SelectedNetworkKey) => string;
};

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
    const [selectedNetwork, setSelectedNetwork] = useState<SelectedNetworkKey>("all");

    const getNetworkDisplayName = (key: SelectedNetworkKey): string => {
        switch (key) {
            case "all": return "All Networks";
            case "btc": return "Bitcoin";
            case "eth": return "Ethereum";
            case "fra": return "Fradium";
            case "sol": return "Solana";
            default: return "All Networks";
        }
    };

    const getNetworkTokenType = (key: SelectedNetworkKey): string => {
        switch (key) {
            case "btc": return "Bitcoin";
            case "eth": return "Ethereum";
            case "fra": return "Fradium";
            case "sol": return "Solana";
            default: return "All";
        }
    };

    return (
        <NetworkContext.Provider value={{ 
            selectedNetwork, 
            setSelectedNetwork, 
            getNetworkDisplayName,
            getNetworkTokenType
        }}>
            {children}
        </NetworkContext.Provider>
    );
}

export function useNetwork() {
    const ctx = useContext(NetworkContext);
    if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
    return ctx;
}
