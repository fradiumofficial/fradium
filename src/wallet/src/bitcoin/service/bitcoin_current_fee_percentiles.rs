use crate::bitcoin::BTC_CONTEXT;
use ic_cdk::{
    api::management_canister::bitcoin::{
        bitcoin_get_current_fee_percentiles, GetCurrentFeePercentilesRequest, MillisatoshiPerByte,
    },
    update,
};

/// Returns the 100 fee percentiles measured in millisatoshi/byte.
/// Percentiles are computed from the last 10,000 transactions (if available).
#[update]
pub async fn bitcoin_current_fee_percentiles() -> Vec<MillisatoshiPerByte> {
    let ctx = BTC_CONTEXT.with(|ctx| ctx.get());

    let (percentiles,) = bitcoin_get_current_fee_percentiles(GetCurrentFeePercentilesRequest {
        network: ctx.network,
    })
    .await
    .unwrap();

    percentiles
}
