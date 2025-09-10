import { API_URLS } from "@/core/lib/tokenUtils";

// Function to get ETH transaction history from Etherscan API
export async function getETHTransactionHistory(address, network = "sepolia", limit = 20) {
  try {
    const apiUrl = API_URLS.ethereum[network];
    if (!apiUrl) {
      throw new Error(`Unsupported Ethereum network: ${network}`);
    }

    // Construct Etherscan API URL with address and pagination
    const url = `${apiUrl}&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc`;

    console.log("Fetching from Etherscan API:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== "1") {
      throw new Error(`Etherscan API error: ${data.message}`);
    }

    if (!data.result || !Array.isArray(data.result)) {
      console.log("No transactions found or invalid response format");
      return [];
    }

    // Parse Etherscan transaction data
    const transactions = data.result.map((tx) => {
      const isSent = tx.from.toLowerCase() === address.toLowerCase();
      const amount = parseFloat(tx.value) / Math.pow(10, 18); // Convert from wei to ETH

      return {
        hash: tx.hash,
        chain: "Ethereum",
        title: isSent ? `Transfer to ${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : `Received from ${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`,
        amount: isSent ? -amount : amount,
        status: tx.isError === "0" ? "Completed" : "Failed",
        timestamp: parseInt(tx.timeStamp) * 1000, // Convert to milliseconds
        from: tx.from,
        to: tx.to,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        blockNumber: tx.blockNumber,
        confirmations: tx.confirmations,
      };
    });

    console.log(`Found ${transactions.length} transactions`);
    return transactions;
  } catch (error) {
    console.error("Error fetching ETH transaction history:", error);
    return [];
  }
}

// Function to get Solana transaction history from RPC
export async function getSolanaTransactionHistory(address, network = "devnet", limit = 20) {
  try {
    const rpcUrl = API_URLS.solana[network];
    if (!rpcUrl) {
      throw new Error(`Unsupported Solana network: ${network}`);
    }

    console.log("Fetching Solana transactions from RPC:", rpcUrl);
    console.log("Address:", address);

    // Get recent signatures for the address
    const signaturesResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [
          address,
          {
            limit: limit,
          },
        ],
      }),
    });

    if (!signaturesResponse.ok) {
      throw new Error(`Solana RPC error: ${signaturesResponse.status} ${signaturesResponse.statusText}`);
    }

    const signaturesData = await signaturesResponse.json();

    if (signaturesData.error) {
      throw new Error(`Solana RPC error: ${signaturesData.error.message}`);
    }

    if (!signaturesData.result || !Array.isArray(signaturesData.result)) {
      console.log("No Solana transactions found");
      return [];
    }

    // Get transaction details for each signature
    const transactionPromises = signaturesData.result.map(async (sig) => {
      try {
        const txResponse = await fetch(rpcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "getTransaction",
            params: [
              sig.signature,
              {
                encoding: "json",
                maxSupportedTransactionVersion: 0,
              },
            ],
          }),
        });

        if (!txResponse.ok) {
          console.warn(`Failed to fetch transaction ${sig.signature}`);
          return null;
        }

        const txData = await txResponse.json();

        if (txData.error || !txData.result) {
          console.warn(`Transaction ${sig.signature} not found or error:`, txData.error);
          return null;
        }

        return {
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime,
          confirmationStatus: sig.confirmationStatus,
          err: sig.err,
          transaction: txData.result,
        };
      } catch (error) {
        console.warn(`Error fetching transaction ${sig.signature}:`, error);
        return null;
      }
    });

    const transactionDetails = await Promise.all(transactionPromises);
    const validTransactions = transactionDetails.filter((tx) => tx !== null);

    // Parse Solana transaction data
    const transactions = validTransactions.map((txData) => {
      const { signature, slot, blockTime, confirmationStatus, err, transaction } = txData;

      // Determine if this is a sent or received transaction
      const isSent = transaction.transaction.message.accountKeys.some(
        (key, index) => key === address && index === 0 // First account is usually the signer
      );

      // Calculate SOL amount (in lamports, 1 SOL = 1,000,000,000 lamports)
      let amount = 0;
      if (transaction.meta && transaction.meta.preBalances && transaction.meta.postBalances) {
        const preBalance = transaction.meta.preBalances[0] || 0;
        const postBalance = transaction.meta.postBalances[0] || 0;
        amount = Math.abs(postBalance - preBalance) / 1e9; // Convert lamports to SOL
      }

      // Get the other party's address
      const otherParty = transaction.transaction.message.accountKeys.find((key) => key !== address) || "Unknown";

      return {
        hash: signature,
        chain: "Solana",
        title: isSent ? `Transfer to ${otherParty.slice(0, 6)}...${otherParty.slice(-4)}` : `Received from ${otherParty.slice(0, 6)}...${otherParty.slice(-4)}`,
        amount: isSent ? -amount : amount,
        status: err ? "Failed" : confirmationStatus === "finalized" ? "Completed" : "Pending",
        timestamp: blockTime ? blockTime * 1000 : Date.now(), // Convert to milliseconds
        from: isSent ? address : otherParty,
        to: isSent ? otherParty : address,
        slot: slot,
        confirmationStatus: confirmationStatus,
        fee: transaction.meta?.fee ? transaction.meta.fee / 1e9 : 0, // Convert lamports to SOL
      };
    });

    console.log(`Found ${transactions.length} Solana transactions`);
    return transactions;
  } catch (error) {
    console.error("Error fetching Solana transaction history:", error);
    return [];
  }
}

// Function to get Bitcoin transaction history from BlockCypher API
export async function getBitcoinTransactionHistory(address, network = "testnet", limit = 20) {
  try {
    const apiUrl = API_URLS.bitcoin[network];
    if (!apiUrl) {
      throw new Error(`Unsupported Bitcoin network: ${network}`);
    }

    console.log(`Fetching Bitcoin transaction history for ${address} on ${network}`);

    // Get address info and transactions
    const response = await fetch(`${apiUrl}/addrs/${address}?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`BlockCypher API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.txs || !Array.isArray(data.txs)) {
      console.log("No Bitcoin transactions found");
      return [];
    }

    console.log(`Found ${data.txs.length} Bitcoin transactions`);

    const transactions = data.txs.map((tx) => {
      // Determine if this is a sent or received transaction
      const isSent = tx.inputs.some((input) => input.addresses.includes(address));
      const isReceived = tx.outputs.some((output) => output.addresses.includes(address));

      // Calculate amount based on transaction direction
      let amount = 0;
      if (isSent && isReceived) {
        // This is a change transaction - calculate net amount
        const totalInput = tx.inputs.filter((input) => input.addresses.includes(address)).reduce((sum, input) => sum + (input.output_value || 0), 0);
        const totalOutput = tx.outputs.filter((output) => output.addresses.includes(address)).reduce((sum, output) => sum + (output.value || 0), 0);
        amount = totalOutput - totalInput;
      } else if (isReceived) {
        // Received transaction
        amount = tx.outputs.filter((output) => output.addresses.includes(address)).reduce((sum, output) => sum + (output.value || 0), 0);
      } else if (isSent) {
        // Sent transaction
        const totalInput = tx.inputs.filter((input) => input.addresses.includes(address)).reduce((sum, input) => sum + (input.output_value || 0), 0);
        const totalOutput = tx.outputs.filter((output) => !output.addresses.includes(address)).reduce((sum, output) => sum + (output.value || 0), 0);
        amount = -(totalInput - totalOutput - (tx.fees || 0));
      }

      // Convert satoshis to BTC
      const amountInBTC = amount / 100000000;

      // Get other party address
      let otherParty = "Unknown";
      if (isSent) {
        const output = tx.outputs.find((output) => !output.addresses.includes(address));
        if (output && output.addresses && output.addresses.length > 0) {
          otherParty = output.addresses[0];
        }
      } else if (isReceived) {
        const input = tx.inputs.find((input) => !input.addresses.includes(address));
        if (input && input.addresses && input.addresses.length > 0) {
          otherParty = input.addresses[0];
        }
      }

      // Determine transaction status
      let status = "Completed";
      if (tx.confirmations === 0) {
        status = "Pending";
      } else if (tx.confirmations < 6) {
        status = "Confirming";
      }

      return {
        hash: tx.hash,
        chain: "Bitcoin",
        title: isSent ? `Transfer to ${otherParty.slice(0, 6)}...${otherParty.slice(-4)}` : `Received from ${otherParty.slice(0, 6)}...${otherParty.slice(-4)}`,
        amount: amountInBTC,
        status: status,
        timestamp: new Date(tx.received).getTime(),
        from: isSent ? address : otherParty,
        to: isSent ? otherParty : address,
        confirmations: tx.confirmations || 0,
        fee: tx.fees ? tx.fees / 100000000 : 0, // Convert satoshis to BTC
        blockHeight: tx.block_height,
        size: tx.size,
        weight: tx.weight,
      };
    });

    console.log(`Processed ${transactions.length} Bitcoin transactions`);
    return transactions;
  } catch (error) {
    console.error("Error fetching Bitcoin transaction history:", error);
    return [];
  }
}

// Generic function to get transaction history for any supported network
export async function getTransactionHistory(address, network, limit = 20) {
  try {
    switch (network.toLowerCase()) {
      case "ethereum":
      case "sepolia":
        return await getETHTransactionHistory(address, "sepolia", limit);
      case "bitcoin":
      case "testnet":
        return await getBitcoinTransactionHistory(address, "testnet", limit);
      case "solana":
      case "devnet":
        return await getSolanaTransactionHistory(address, "devnet", limit);
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  } catch (error) {
    console.error(`Error fetching transaction history for ${network}:`, error);
    return [];
  }
}
