import { TokenType, validateAddress, amountToBaseUnit } from "@/lib/utils/tokenUtils";
import { getBitcoinActor } from "@/icp/services/bitcoin_service";
import { getSolanaActor } from "@/icp/services/solana_service";
import { getBackendActor } from "@/icp/services/backend_service";

export interface SendTransactionParams {
  tokenType: string;
  destinationAddress: string;
  amount: string;
  senderAddress?: string;
}

export interface SendTransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * Service for handling cryptocurrency send transactions
 */
export class SendService {
  /**
   * Send Bitcoin transaction
   */
  static async sendBitcoin(
    destinationAddress: string, 
    amount: string
  ): Promise<SendTransactionResult> {
    try {
      // Get Bitcoin actor using existing service
      const bitcoin = await getBitcoinActor();

      // Validate address
      const validation = validateAddress(destinationAddress, TokenType.BITCOIN);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Convert amount to satoshi (returns BigInt, which matches Nat64 in Motoko)
      const satoshiAmount = amountToBaseUnit(TokenType.BITCOIN, parseFloat(amount));
      if (satoshiAmount <= 0) {
        return { success: false, error: "Invalid amount" };
      }
      
      // Send transaction - keep as BigInt for Bitcoin canister compatibility
      const transactionId = await bitcoin.send_from_p2pkh_address({
        destination_address: destinationAddress,
        amount_in_satoshi: satoshiAmount,
      });

      return {
        success: true,
        transactionId: transactionId
      };
    } catch (error) {
      console.error('Bitcoin send error:', error);
      return {
        success: false,
        error: `Bitcoin send failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Send Solana transaction
   */
  static async sendSolana(
    destinationAddress: string, 
    amount: string,
    identity: any
  ): Promise<SendTransactionResult> {
    try {
      // Get Solana actor using existing service
      const solana = await getSolanaActor(identity);

      // Validate address
      const validation = validateAddress(destinationAddress, TokenType.SOLANA);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Convert amount to lamports
      const lamportAmount = amountToBaseUnit(TokenType.SOLANA, parseFloat(amount));
      if (lamportAmount <= 0) {
        return { success: false, error: "Invalid amount" };
      }

      if (!identity) {
        return { success: false, error: "User identity required for Solana transactions" };
      }
      
      // Send transaction
      const transactionId = await solana.send_sol(
        [identity.getPrincipal()], 
        destinationAddress, 
        lamportAmount // Keep as BigInt for Solana
      );

      return {
        success: true,
        transactionId: transactionId
      };
    } catch (error) {
      console.error('Solana send error:', error);
      return {
        success: false,
        error: `Solana send failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create transaction history record
   */
  static async createTransactionHistory(
    tokenType: string,
    amount: string,
    destinationAddress: string,
    senderAddress: string,
    transactionId: string
  ): Promise<boolean> {
    try {
      // Get Backend actor using existing service
      const backend = await getBackendActor();

      const getTokenTypeVariant = (tokenType: string) => {
        switch (tokenType) {
          case TokenType.BITCOIN:
            return { Bitcoin: null } as const;
          case TokenType.ETHEREUM:
            return { Ethereum: null } as const;
          case TokenType.SOLANA:
            return { Solana: null } as const;
          default:
            // Fallback to Bitcoin for unsupported types
            return { Bitcoin: null } as const;
        }
      };

      let baseAmount;
      let details;
      
      switch (tokenType) {
        case TokenType.BITCOIN:
          baseAmount = amountToBaseUnit(TokenType.BITCOIN, parseFloat(amount));
          details = {
            Bitcoin: {
              txid: transactionId || "pending",
              from_address: (senderAddress ? [senderAddress] : []) as [] | [string],
              to_address: destinationAddress,
              fee_satoshi: [] as [] | [bigint],
              block_height: [] as [] | [bigint],
            },
          };
          break;
          
        case TokenType.SOLANA:
          baseAmount = amountToBaseUnit(TokenType.SOLANA, parseFloat(amount));
          details = {
            Solana: {
              signature: transactionId || "pending",
              slot: [] as [] | [bigint],
              sender: senderAddress || "",
              recipient: destinationAddress,
              lamports: baseAmount,
            },
          };
          break;
          
        default:
          console.warn(`Transaction history not supported for ${tokenType}`);
          return false;
      }

      const transactionHistoryParams = {
        chain: getTokenTypeVariant(tokenType),
        direction: { Send: null },
        amount: baseAmount,
        timestamp: BigInt(Date.now() * 1000000),
        details,
        note: [`Sent ${amount} ${tokenType} to ${destinationAddress.slice(0, 12)}...`] as [string],
      };

      await backend.create_transaction_history(transactionHistoryParams);
      return true;
    } catch (error) {
      console.error('Failed to create transaction history:', error);
      return false;
    }
  }

  /**
   * Main send function that routes to appropriate token handler
   */
  static async sendTransaction(params: SendTransactionParams, identity?: any): Promise<SendTransactionResult> {
    const { tokenType, destinationAddress, amount, senderAddress } = params;

    // Validate parameters first
    const validation = this.validateSendParams(params);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    let result: SendTransactionResult;

    switch (tokenType) {
      case TokenType.BITCOIN:
        result = await this.sendBitcoin(destinationAddress, amount);
        break;
        
      case TokenType.SOLANA:
        result = await this.sendSolana(destinationAddress, amount, identity);
        break;
        
      case TokenType.ETHEREUM:
      case TokenType.FUM:
        result = { success: false, error: "Ethereum/Fradium transactions not yet implemented" };
        break;
        
      default:
        result = { success: false, error: `Unsupported token type: ${tokenType}` };
        break;
    }

    // If send was successful, try to create transaction history
    if (result.success && result.transactionId && senderAddress) {
      try {
        await this.createTransactionHistory(
          tokenType,
          amount,
          destinationAddress,
          senderAddress,
          result.transactionId
        );
      } catch (historyError) {
        console.error("Failed to create transaction history:", historyError);
        // Don't fail the transaction if history creation fails
      }
    }

    return result;
  }

  /**
   * Validate send transaction parameters
   */
  static validateSendParams(params: SendTransactionParams): { isValid: boolean; error?: string } {
    const { tokenType, destinationAddress, amount } = params;

    // Validate token type
    if (!Object.values(TokenType).includes(tokenType as any)) {
      return { isValid: false, error: "Invalid token type" };
    }

    // Validate address
    const addressValidation = validateAddress(destinationAddress, tokenType);
    if (!addressValidation.isValid) {
      return { isValid: false, error: addressValidation.error };
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { isValid: false, error: "Invalid amount" };
    }

    return { isValid: true };
  }

  /**
   * Estimate transaction fee (placeholder implementation)
   */
  static async estimateFee(tokenType: string, _amount: string): Promise<{ fee: number; currency: string } | null> {
    // This is a placeholder implementation
    // In a real application, you would call the appropriate canister methods to estimate fees
    
    switch (tokenType) {
      case TokenType.BITCOIN:
        return { fee: 0.0001, currency: 'BTC' }; // Approximate BTC fee
        
      case TokenType.SOLANA:
        return { fee: 0.000005, currency: 'SOL' }; // Approximate SOL fee
        
      default:
        return null;
    }
  }
}

export default SendService;
