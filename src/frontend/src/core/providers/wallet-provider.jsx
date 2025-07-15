import React, { createContext, useContext, useState, useEffect } from "react";
import { backend } from "declarations/backend";
import { bitcoin } from "declarations/bitcoin";

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

  useEffect(() => {
    const fetchUserWallet = async () => {
      setIsLoading(true);
      const response = await backend.get_wallet();
      setIsLoading(false);

      if (response.Ok) {
        setUserWallet(response.Ok);
      } else {
        createWallet();
      }
    };
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
        token_type: tokenType === "bitcoin" ? { Bitcoin: null } : tokenType === "ethereum" ? { Ethereum: null } : tokenType === "solana" ? { Solana: null } : null,
        address: address,
      };

      const updatedAddresses = [...userWallet.addresses, newAddress];

      // Update wallet with new address
      const response = await backend.create_wallet({
        addresses: updatedAddresses,
      });

      if (response.ok) {
        setUserWallet(response.value);
        return true;
      } else {
        console.error("Failed to add address:", response.err);
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

  return <WalletContext.Provider value={walletContextValue}>{children}</WalletContext.Provider>;
};
