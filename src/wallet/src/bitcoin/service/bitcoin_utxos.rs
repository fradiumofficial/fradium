use crate::bitcoin::BTC_CONTEXT;
use ic_cdk::{
    api::management_canister::bitcoin::{bitcoin_get_utxos, GetUtxosRequest, GetUtxosResponse},
    update,
};

/// Returns the UTXOs of the given Bitcoin address.
#[update]
pub async fn bitcoin_utxos(address: String) -> GetUtxosResponse {
    let ctx = BTC_CONTEXT.with(|ctx| ctx.get());

    let (resp,) = bitcoin_get_utxos(GetUtxosRequest {
        address,
        network: ctx.network,
        filter: None,
    })
    .await
    .unwrap();

    resp
}
