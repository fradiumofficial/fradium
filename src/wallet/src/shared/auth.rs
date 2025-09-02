use candid::Principal;

/// Validates that the caller is not anonymous and returns the caller's principal.
/// This function is used across all wallet modules (bitcoin, ethereum, solana) 
/// to ensure proper authentication.
pub fn validate_caller_not_anonymous() -> Principal {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        panic!("anonymous principal is not allowed");
    }
    principal
}
