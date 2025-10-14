import { backend } from "declarations/backend";

class ApiTokenService {
  /**
   * Create a new API token
   * @param {string} name - Token name
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async createToken(name) {
    try {
      const result = await backend.create_api_token({ name });

      if (result.ok) {
        return {
          success: true,
          data: result.ok,
        };
      } else {
        return {
          success: false,
          error: result.err,
        };
      }
    } catch (error) {
      console.error("Error creating API token:", error);
      return {
        success: false,
        error: "Failed to create API token",
      };
    }
  }

  /**
   * Get all API tokens for the current user
   * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
   */
  async getTokens() {
    try {
      const result = await backend.get_api_tokens();

      if (result.ok) {
        return {
          success: true,
          data: result.ok,
        };
      } else {
        return {
          success: false,
          error: result.err,
        };
      }
    } catch (error) {
      console.error("Error getting API tokens:", error);
      return {
        success: false,
        error: "Failed to get API tokens",
      };
    }
  }

  /**
   * Regenerate an API token
   * @param {string} tokenId - Token ID to regenerate
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async regenerateToken(tokenId) {
    try {
      console.log("Regenerating token with ID:", tokenId);
      const result = await backend.regenerate_api_token({ tokenId });
      console.log("Regenerate result:", result);

      if (result && result.ok) {
        return {
          success: true,
          data: result.ok,
        };
      } else {
        return {
          success: false,
          error: result?.err || "Unknown error occurred",
        };
      }
    } catch (error) {
      console.error("Error regenerating API token:", error);
      return {
        success: false,
        error: "Failed to regenerate API token: " + error.message,
      };
    }
  }

  /**
   * Revoke an API token
   * @param {string} tokenId - Token ID to revoke
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async revokeToken(tokenId) {
    try {
      console.log("Revoking token with ID:", tokenId);
      const result = await backend.revoke_api_token({ tokenId });
      console.log("Revoke result:", result);

      if (result && result.ok) {
        return {
          success: true,
          data: result.ok,
        };
      } else {
        return {
          success: false,
          error: result?.err || "Unknown error occurred",
        };
      }
    } catch (error) {
      console.error("Error revoking API token:", error);
      return {
        success: false,
        error: "Failed to revoke API token: " + error.message,
      };
    }
  }

  /**
   * Delete an API token (permanently remove)
   * @param {string} tokenId - Token ID to delete
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async deleteToken(tokenId) {
    try {
      const result = await backend.delete_api_token({ tokenId });

      if (result.ok) {
        return {
          success: true,
          data: result.ok,
        };
      } else {
        return {
          success: false,
          error: result.err,
        };
      }
    } catch (error) {
      console.error("Error deleting API token:", error);
      return {
        success: false,
        error: "Failed to delete API token",
      };
    }
  }

  /**
   * Validate an API token
   * @param {string} tokenString - Token string to validate
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async validateToken(tokenString) {
    try {
      const result = await backend.validate_api_token(tokenString);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error validating API token:", error);
      return {
        success: false,
        error: "Failed to validate API token",
      };
    }
  }

  /**
   * Get token info by token string
   * @param {string} tokenString - Token string
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getTokenInfo(tokenString) {
    try {
      const result = await backend.get_api_token_info(tokenString);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error getting token info:", error);
      return {
        success: false,
        error: "Failed to get token info",
      };
    }
  }

  /**
   * Format token data for frontend display
   * @param {Object} token - Raw token data from backend
   * @returns {Object} Formatted token data
   */
  formatTokenForDisplay(token) {
    return {
      id: token.id,
      name: token.name,
      token: token.token,
      created: new Date(Number(token.created) / 1000000).toLocaleDateString(),
      status: this.mapTokenStatus(token.status),
    };
  }

  /**
   * Map backend token status to frontend status
   * @param {Object} status - Backend status variant
   * @returns {string} Frontend status string
   */
  mapTokenStatus(status) {
    // Motoko variant types are objects with the variant name as key
    if (status && typeof status === "object") {
      if ("active" in status) return "active";
      if ("revoked" in status) return "revoked";
      if ("expired" in status) return "expired";
    }
    return "unknown";
  }
}

// Export singleton instance
export const apiTokenService = new ApiTokenService();
export default apiTokenService;
