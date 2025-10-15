#!/usr/bin/env bash
set -euo pipefail

print_help() {
  cat <<-EOF
Creates the ICP Swap Factory installation files:

- The Wasm and Candid files are downloaded.

The files are installed at the locations defined for 'icp_swap_factory' in 'dfx.json'.
EOF
}

[[ "${1:-}" != "--help" ]] || {
  print_help
  exit 0
}

DFX_NETWORK="${DFX_NETWORK:-local}"
export ICP_SWAP_FACTORY_BUILDENV="$DFX_NETWORK"

FACTORY_RELEASE_URL="https://raw.githubusercontent.com/ICPSwap-Labs/docs/ac989c62fb65ed39769dbebfa94eb57f90c86d8f/_canister/SwapFactory"
# shellcheck disable=SC2034 # This variable is used - see ${!asset_url} below.
CANDID_URL="${FACTORY_RELEASE_URL}/SwapFactory.did"
# shellcheck disable=SC2034 # This variable is used - see ${!asset_url} below.
WASM_URL="${FACTORY_RELEASE_URL}/SwapFactory.wasm"

CANDID_FILE="$(jq -r .canisters.icp_swap_factory.candid dfx.json)"
WASM_FILE_GZ="$(jq -r .canisters.icp_swap_factory.wasm dfx.json)"
WASM_FILE="${WASM_FILE_GZ%.gz}"
ARG_FILE="$(jq -r .canisters.icp_swap_factory.init_arg_file dfx.json)"

download() {
  local asset asset_url asset_file
  asset="$1"
  case "$asset" in
    candid)
      asset_url="CANDID_URL"
      asset_file="CANDID_FILE"
      ;;
    wasm)
      asset_url="WASM_URL"
      asset_file="WASM_FILE"
      ;;
    *)
      echo "Unknown asset: $asset"
      exit 1
      ;;
  esac
  scripts/download-immutable.sh "${!asset_url}" "${!asset_file}"
}

# Download candid and wasm
download candid
download wasm

# Compress Wasm
echo "Compressing Wasm: $WASM_FILE_GZ"
gzip -c "$WASM_FILE" >"$WASM_FILE_GZ"

# Generate init args for factory
echo "Generating init args..."
rm -f "$ARG_FILE"
mkdir -p "$(dirname "$ARG_FILE")"

# Factory expects 7 principals: backupCid, feeReceiverCid, infoCid, passcodeManagerCid, positionIndexCid, governanceCid (opt), trustedCanisterManagerCid
OWNER_PRINCIPAL="$(dfx identity get-principal)"

# For local development, we'll use the same principal for all required roles
# In production, these would be different canister IDs
cat <<EOF >"$ARG_FILE"
(
  principal "$OWNER_PRINCIPAL",
  principal "$OWNER_PRINCIPAL", 
  principal "$OWNER_PRINCIPAL",
  principal "$OWNER_PRINCIPAL",
  principal "$OWNER_PRINCIPAL",
  null,
  principal "$OWNER_PRINCIPAL"
)
EOF


cat <<EOF
SUCCESS: The icp_swap_factory installation files have been created:
icp_swap_factory candid:       $CANDID_FILE
icp_swap_factory Wasm:         $WASM_FILE_GZ
icp_swap_factory install args: $ARG_FILE
EOF