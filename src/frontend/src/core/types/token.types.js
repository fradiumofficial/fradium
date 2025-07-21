/**
 * Token Operation Types
 */
export const TOKEN_OPERATIONS = {
  BALANCE: "balance",
  SEND: "send",
  RECEIVE: "receive",
  ANALYZE: "analyze",
  HISTORY: "history",
};

/**
 * Analysis Source Types
 */
export const ANALYSIS_SOURCES = {
  COMMUNITY: "community",
  AI: "ai",
  HYBRID: "hybrid",
};

/**
 * Transaction Status Types
 */
export const TRANSACTION_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

/**
 * Transaction Direction Types
 */
export const TRANSACTION_DIRECTION = {
  SEND: "send",
  RECEIVE: "receive",
};

/**
 * Address Validation Result
 */
export const createAddressValidationResult = (isValid, error = null) => ({
  isValid,
  error,
});

/**
 * Balance Result
 */
export const createBalanceResult = (balances = {}, errors = {}) => ({
  balances,
  errors,
  hasBalances: Object.keys(balances).length > 0,
  hasErrors: Object.keys(errors).length > 0,
});

/**
 * Amount and Value Result
 */
export const createAmountValueResult = (amount = 0, value = "$0.00", isLoading = false) => ({
  amount,
  value,
  isLoading,
});

/**
 * Send Transaction Parameters
 */
export const createSendParams = (destinationAddress, amount, tokenType, metadata = {}) => ({
  destinationAddress,
  amount,
  tokenType,
  metadata,
});

/**
 * Send Transaction Result
 */
export const createSendResult = (transactionId, status, error = null) => ({
  transactionId,
  status,
  error,
  isSuccess: status === TRANSACTION_STATUS.COMPLETED,
  isError: error !== null,
});

/**
 * Analysis Result
 */
export const createAnalysisResult = (isSafe, source, data = null, confidence = 0) => ({
  isSafe,
  source,
  data,
  confidence,
  timestamp: Date.now(),
});

/**
 * Transaction History Item
 */
export const createTransactionHistoryItem = (params) => ({
  id: params.id,
  type: params.type,
  tokenType: params.tokenType,
  amount: params.amount,
  address: params.address,
  timestamp: params.timestamp,
  status: params.status,
  transactionHash: params.transactionHash,
  metadata: params.metadata || {},
});

/**
 * Service Operation States
 */
export const SERVICE_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

/**
 * Create Service State
 */
export const createServiceState = (state = SERVICE_STATES.IDLE, data = null, error = null) => ({
  state,
  data,
  error,
  isIdle: state === SERVICE_STATES.IDLE,
  isLoading: state === SERVICE_STATES.LOADING,
  isSuccess: state === SERVICE_STATES.SUCCESS,
  isError: state === SERVICE_STATES.ERROR,
});

/**
 * Token Info for UI
 */
export const createTokenInfo = (config, balanceResult, amountValueResult) => ({
  ...config,
  ...balanceResult,
  ...amountValueResult,
  hasBalance: amountValueResult.amount > 0,
});

/**
 * Error Types
 */
export const ERROR_TYPES = {
  NETWORK_ERROR: "network_error",
  VALIDATION_ERROR: "validation_error",
  INSUFFICIENT_BALANCE: "insufficient_balance",
  INVALID_ADDRESS: "invalid_address",
  SERVICE_UNAVAILABLE: "service_unavailable",
  UNKNOWN_ERROR: "unknown_error",
};

/**
 * Create Error Object
 */
export const createError = (type, message, details = null) => ({
  type,
  message,
  details,
  timestamp: Date.now(),
});
