import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";

import BitcoinApi "BitcoinApi";
import P2pkh "P2pkh";
import P2trKeyOnly "P2trKeyOnly";
import P2tr "P2tr";
import Types "Types";
import Utils "Utils";
import EcdsaApi "EcdsaApi";

actor class BasicBitcoin(network : Types.Network) {
  type GetUtxosResponse = Types.GetUtxosResponse;
  type MillisatoshiPerVByte = Types.MillisatoshiPerVByte;
  type SendRequest = Types.SendRequest;
  type Network = Types.Network;
  type BitcoinAddress = Types.BitcoinAddress;
  type Satoshi = Types.Satoshi;
  type TransactionId = Text;
  type EcdsaCanisterActor = Types.EcdsaCanisterActor;
  type SchnorrCanisterActor = Types.SchnorrCanisterActor;
  type P2trDerivationPaths = Types.P2trDerivationPaths;

  public type UtxoInfo = {
    txidHex : Text;
    vout : Nat32;
    value : Nat64;
    height : Nat32;
  };

  /// The Bitcoin network to connect to.
  ///
  /// When developing locally this should be `regtest`.
  /// When deploying to the IC this should be `testnet`.
  /// `mainnet` is currently unsupported.
  stable let NETWORK : Network = network;

  /// The derivation path to use for ECDSA secp256k1 or Schnorr BIP340/BIP341 key
  /// derivation.
  let DERIVATION_PATH : [[Nat8]] = [];

  // The ECDSA key name.
  let KEY_NAME : Text = switch NETWORK {
    // For local development, we use a special test key with dfx.
    case (#regtest) "dfx_test_key";
    // On the IC we're using a test ECDSA key.
    case _ "test_key_1";
  };

  // Threshold signing APIs instantiated with the management canister ID. Can be
  // replaced for cheaper testing.
  var ecdsa_canister_actor : EcdsaCanisterActor = actor ("aaaaa-aa");
  var schnorr_canister_actor : SchnorrCanisterActor = actor ("aaaaa-aa");

  /// Returns the balance of the given Bitcoin address.
  public func get_balance(address : BitcoinAddress) : async Satoshi {
    await BitcoinApi.get_balance(NETWORK, address);
  };

  /// Returns the UTXOs of the given Bitcoin address
  public func get_utxos(address : BitcoinAddress) : async GetUtxosResponse {
    let utxos = await BitcoinApi.get_utxos(NETWORK, address);
    return utxos;
  };

  // Convert Blob (little‑endian) to big‑endian hex string
  func blobToTxidHex(txid : Blob) : Text {
    let bytes = Blob.toArray(txid);
    let reversed = Array.reverse<Nat8>(bytes);
    let hexChars = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
    let hex = Array.map<Nat8, Text>(reversed, func (b) {
      let hi = b / 16;
      let lo = b % 16;
      hexChars[Nat8.toNat(hi)] # hexChars[Nat8.toNat(lo)]
    });
    Text.join("", hex.vals())
  };

  // Return the utxo info of the given address
  public func get_utxos_info(address : Text) : async [UtxoInfo] {
    let resp = await BitcoinApi.get_utxos(NETWORK, address);
    
    var out : [UtxoInfo] = [];
    for (utxo in resp.utxos.vals()) {
      let txidHex = blobToTxidHex(utxo.outpoint.txid);
      out := Array.append(out, [{
        txidHex = txidHex;
        vout = utxo.outpoint.vout;
        value = utxo.value;
        height = utxo.height;
      }]);
    };
    return out;
  };

  /// Returns ALL UTXOs of the given Bitcoin address
  public func get_all_utxos(address : BitcoinAddress) : async [UtxoInfo] {
    // Set min confirmations for regtest
    let minConfirmations = if (NETWORK == #regtest) { ?1 } else { null };
    let initialFilter : ?Types.UtxosFilter = switch (minConfirmations) {
      case (?confirmations) { ?#MinConfirmations(Nat32.fromNat(confirmations)) };
      case null { null };
    };
    
    // Get first page
    var utxosResponse = await BitcoinApi.get_utxos_with_filter(NETWORK, address, initialFilter);
    var allUtxos : [UtxoInfo] = [];
    
    // Convert first page
    for (utxo in utxosResponse.utxos.vals()) {
      let txidHex = blobToTxidHex(utxo.outpoint.txid);
      allUtxos := Array.append(allUtxos, [{
        txidHex = txidHex;
        vout = utxo.outpoint.vout;
        value = utxo.value;
        height = utxo.height;
      }]);
    };
    
    // Get remaining pages
    var nextPage = utxosResponse.next_page;
    while (nextPage != null) {
      switch (nextPage) {
        case (?page) {
          utxosResponse := await BitcoinApi.get_utxos_with_filter(NETWORK, address, ?#Page(page));
          
          // Convert current page
          for (utxo in utxosResponse.utxos.vals()) {
            let txidHex = blobToTxidHex(utxo.outpoint.txid);
            allUtxos := Array.append(allUtxos, [{
              txidHex = txidHex;
              vout = utxo.outpoint.vout;
              value = utxo.value;
              height = utxo.height;
            }]);
          };
          
          nextPage := utxosResponse.next_page;
        };
        case null {
          nextPage := null;
        };
      };
    };
    
    return allUtxos;
  };

  /// Returns the 100 fee percentiles measured in millisatoshi/vbyte.
  /// Percentiles are computed from the last 10,000 transactions (if available).
  public func get_current_fee_percentiles() : async [MillisatoshiPerVByte] {
    await BitcoinApi.get_current_fee_percentiles(NETWORK);
  };

  /// Returns the public key based on caller's principal
  public shared({caller}) func get_public_key() : async Blob {
    let derivation_path = derivationPathWithPrincipal(caller);
    await EcdsaApi.ecdsa_public_key(ecdsa_canister_actor, KEY_NAME, Array.map(derivation_path, Blob.fromArray));
  };

  /// Returns the P2PKH address based on caller's principal
  public shared({caller}) func get_p2pkh_address() : async BitcoinAddress {
    let derivation_path = derivationPathWithPrincipal(caller);
    await P2pkh.get_address(ecdsa_canister_actor, NETWORK, KEY_NAME, derivation_path);
  };

  /// Sends the given amount of bitcoin from caller's address to the given address.
  /// Returns the transaction ID.
  public shared({caller}) func send_from_p2pkh_address(request : SendRequest) : async TransactionId {
    let derivation_path = derivationPathWithPrincipal(caller);
    Utils.bytesToText(await P2pkh.send(ecdsa_canister_actor, NETWORK, derivation_path, KEY_NAME, request.destination_address, request.amount_in_satoshi));
  };

  public shared({caller}) func get_p2tr_key_only_address() : async BitcoinAddress {
    let derivation_path = derivationPathWithPrincipal(caller);
    await P2trKeyOnly.get_address_key_only(schnorr_canister_actor, NETWORK, KEY_NAME, derivation_path);
  };

  public shared({caller}) func send_from_p2tr_key_only_address(request : SendRequest) : async TransactionId {
    let derivation_path = derivationPathWithPrincipal(caller);
    Utils.bytesToText(await P2trKeyOnly.send(schnorr_canister_actor, NETWORK, derivation_path, KEY_NAME, request.destination_address, request.amount_in_satoshi));
  };

  public shared({caller}) func get_p2tr_address() : async BitcoinAddress {
    let derivation_path = derivationPathWithPrincipal(caller);
    await P2tr.get_address(schnorr_canister_actor, NETWORK, KEY_NAME, {
      key_path_derivation_path = derivation_path;
      script_path_derivation_path = derivation_path;
    });
  };

  public shared({caller}) func send_from_p2tr_address_key_path(request : SendRequest) : async TransactionId {
    let derivation_path = derivationPathWithPrincipal(caller);
    Utils.bytesToText(await P2tr.send_key_path(schnorr_canister_actor, NETWORK, {
      key_path_derivation_path = derivation_path;
      script_path_derivation_path = derivation_path;
    }, KEY_NAME, request.destination_address, request.amount_in_satoshi));
  };

  public shared({caller}) func send_from_p2tr_address_script_path(request : SendRequest) : async TransactionId {
    let derivation_path = derivationPathWithPrincipal(caller);
    Utils.bytesToText(await P2tr.send_script_path(schnorr_canister_actor, NETWORK, {
      key_path_derivation_path = derivation_path;
      script_path_derivation_path = derivation_path;
    }, KEY_NAME, request.destination_address, request.amount_in_satoshi));
  };



  // ===== FUNGSI HELPER =====

  /// Generate derivation path berdasarkan principal
  func derivationPathWithPrincipal(principal : Principal) : [[Nat8]] {
    let principal_bytes = Blob.toArray(Principal.toBlob(principal));
    Array.flatten([DERIVATION_PATH, [principal_bytes]]);
  };
};