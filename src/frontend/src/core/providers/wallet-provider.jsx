import React, { createContext, useContext, useState, useEffect } from "react";
import { backend } from "declarations/backend";
import { bitcoin } from "declarations/bitcoin";
import { useAuth } from "./auth-provider";

// Create context for wallet data
const WalletContext = createContext();

// Custom hook to use wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userWallet, setUserWallet] = useState(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [network, setNetwork] = useState("testnet");

  console.log("User Address", userWallet?.addresses[0]?.address);

  const fetchUserWallet = async () => {
    setIsLoading(true);
    const response = await backend.get_wallet();

    if (response.Ok) {
      setUserWallet(response.Ok);
      setIsLoading(false);
    } else {
      createWallet();
    }
  };

  useEffect(() => {
    fetchUserWallet();
  }, []);

  async function createWallet() {
    setIsCreatingWallet(true);
    try {
      // Get bitcoin address
      const bitcoinResponse = await bitcoin.get_p2pkh_address();

      // Create wallet with new structure
      const response = await backend.create_wallet({
        addresses: [
          {
            network: { Testnet: null },
            token_type: { Bitcoin: null },
            address: bitcoinResponse,
          },
        ],
      });

      setIsCreatingWallet(false);
      if (response.Ok) {
        setUserWallet(response.value);
        await fetchUserWallet();
        setIsLoading(false);
      } else {
        console.error("Failed to create wallet:", response);
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      setIsCreatingWallet(false);
    }
  }

  // Helper function to add new address to existing wallet
  const addAddressToWallet = async (network, tokenType, address) => {
    if (!userWallet) {
      console.error("No wallet found");
      return false;
    }

    try {
      const newAddress = {
        network: network === "testnet" ? { Testnet: null } : { Mainnet: null },
        token_type:
          tokenType === "bitcoin"
            ? { Bitcoin: null }
            : tokenType === "ethereum"
            ? { Ethereum: null }
            : tokenType === "solana"
            ? { Solana: null }
            : null,
        address: address,
      };

      const updatedAddresses = [...userWallet.addresses, newAddress];

      // Update wallet with new address
      const response = await backend.create_wallet({
        addresses: updatedAddresses,
      });

      if (response.Ok) {
        setUserWallet(response.value);
        await fetchUserWallet();
        return true;
      } else {
        console.error("Failed to add address:", response.Err);
        return false;
      }
    } catch (error) {
      console.error("Error adding address:", error);
      return false;
    }
  };

  const walletContextValue = {
    isLoading,
    userWallet,
    setUserWallet,
    isCreatingWallet,
    setIsCreatingWallet,
    addAddressToWallet,
    network,
    setNetwork,
  };

  return (
    <WalletContext.Provider value={walletContextValue}>
      {children}
    </WalletContext.Provider>
  );
};
