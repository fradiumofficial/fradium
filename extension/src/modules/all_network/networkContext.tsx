import React, { createContext, useContext, useState } from "react";

export type SelectedNetworkKey = "all" | "btc" | "eth" | "fra";

type NetworkContextValue = {
    selectedNetwork: SelectedNetworkKey;
    setSelectedNetwork: (key: SelectedNetworkKey) => void;
};

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
    const [selectedNetwork, setSelectedNetwork] = useState<SelectedNetworkKey>("all");

    return (
        <NetworkContext.Provider value={{ selectedNetwork, setSelectedNetwork }}>
            {children}
        </NetworkContext.Provider>
    );
}

export function useNetwork() {
    const ctx = useContext(NetworkContext);
    if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
    return ctx;
}
