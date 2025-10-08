# Escrow: Native Coins vs Wrapped Tokens

## Overview

Escrow system Fradium mendukung **2 jenis escrow** yang berbeda:

1. **Wrapped Token Escrow** - Proper escrow dengan dana terkunci (Recommended ✅)
2. **Native Coin Escrow** - Trust-based escrow dengan dana dikontrol user (Limited ⚠️)

## Perbandingan

| Aspek              | Wrapped Tokens (ckBTC, ckETH, ICP)   | Native Coins (BTC, ETH, SOL) |
| ------------------ | ------------------------------------ | ---------------------------- |
| **Security**       | ✅ Funds locked in escrow canister   | ⚠️ Funds stay in user wallet |
| **Trust Model**    | Trustless (smart contract)           | Trust-based (user control)   |
| **Refund**         | Automatic (if expired/cancelled)     | Manual (user must send back) |
| **Standard**       | ICRC-2 (approval + transfer_from)    | Wallet canister functions    |
| **Lock Mechanism** | ✅ Real lock via icrc2_transfer_from | ❌ Balance check only        |
| **Best For**       | Large payments, high security        | Small payments, testing      |

## 1. Wrapped Token Escrow (Recommended ✅)

### Tokens yang Didukung:

- **ckBTC** - Chain Key Bitcoin (1:1 backed with BTC)
- **ckETH** - Chain Key Ethereum (1:1 backed with ETH)
- **ICP** - Native ICP token
- **FRADIUM** - Platform token

### Cara Kerja:

```
┌─────────────┐
│ User Wallet │
└──────┬──────┘
       │ 1. icrc2_approve (approve escrow canister)
       ▼
┌──────────────────┐
│  Ledger Canister │
└──────┬───────────┘
       │ 2. icrc2_transfer_from (escrow pulls funds)
       ▼
┌──────────────────┐
│ Escrow Canister  │ ◄─── Funds LOCKED here
│  (Holds funds)   │
└──────┬───────────┘
       │ 3. icrc1_transfer (release to recipient)
       ▼
┌──────────────────┐
│   Recipient      │
└──────────────────┘
```

### Keuntungan:

- ✅ **Trustless** - Funds benar-benar terkunci, tidak bisa ditarik oleh sender
- ✅ **Automatic Refund** - Jika expired atau cancelled, funds otomatis kembali
- ✅ **Secure** - Smart contract menjamin keamanan
- ✅ **Standard** - Menggunakan ICRC-2 standard yang mature

### Contoh Penggunaan:

```motoko
// Step 1: User approve escrow canister
let approve_args = {
  spender = {
    owner = escrow_canister_principal;
    subaccount = null;
  };
  amount = 1_000_000; // 0.01 ckBTC
  expires_at = null;
  fee = null;
  memo = null;
  from_subaccount = null;
  created_at_time = null;
  expected_allowance = null;
};
await ckbtc_ledger.icrc2_approve(approve_args);

// Step 2: Create escrow (funds will be locked)
let escrow_params = {
  recipient = recipient_principal;
  token_type = #ckBTC;  // Wrapped token
  amount = 1_000_000;   // 0.01 ckBTC
  duration_seconds = 86400; // 24 hours
  description = ?"Payment for services";
  metadata = null;
};
let result = await backend.create_escrow(escrow_params);
// ✅ Funds are now LOCKED in escrow canister
```

## 2. Native Coin Escrow (Trust-Based ⚠️)

### Tokens yang Didukung:

- **BTC** - Native Bitcoin (via wallet canister + threshold ECDSA)
- **ETH** - Native Ethereum (via wallet canister + threshold ECDSA)
- **SOL** - Native Solana (via wallet canister + Ed25519)

### Cara Kerja:

```
┌─────────────┐
│ User Wallet │ ◄─── Funds STAY here (NOT locked!)
│  Canister   │
└──────┬──────┘
       │ 1. Balance check only
       │ (no actual transfer)
       ▼
┌──────────────────┐
│ Escrow Canister  │ ◄─── Only records escrow info
│  (No funds held) │
└──────┬───────────┘
       │ 2. Manual: User sends via wallet
       ▼
┌──────────────────┐
│   Recipient      │
│   Wallet         │
└──────────────────┘
```

### ⚠️ Limitasi:

- ❌ **NOT Trustless** - Funds masih dikontrol user, bisa ditarik kapan saja
- ❌ **Manual Release** - User harus manually transfer ke recipient
- ❌ **No Automatic Refund** - Jika expired, user tetap kontrol funds
- ⚠️ **Balance Check Only** - Hanya verify user punya balance cukup
- ⚠️ **Trust Required** - Recipient harus percaya sender akan bayar

### Kenapa Seperti Ini?

Wallet canister adalah **per-user**, bukan shared escrow. Artinya:

- Setiap user punya wallet canister sendiri
- Wallet menggunakan threshold cryptography (ECDSA/Ed25519)
- Private keys di-generate per-principal (caller-based)
- Tidak bisa "lock" funds dari wallet user ke escrow canister
- Transfer hanya bisa dilakukan oleh wallet owner (caller)

### Contoh Penggunaan:

```motoko
// Create native coin escrow (trust-based)
let escrow_params = {
  recipient = recipient_principal;
  token_type = #BTC;  // Native Bitcoin
  amount = 100_000;   // 0.001 BTC (in satoshi)
  duration_seconds = 86400;
  description = ?"Trust-based BTC payment";
  metadata = null;
};

let result = await backend.create_escrow(escrow_params);
// ⚠️ Funds are NOT locked!
// ⚠️ User still controls BTC in their wallet

// To actually pay, user must manually call:
let send_result = await wallet.bitcoin_send({
  destination_address = recipient_btc_address;
  amount_in_satoshi = 100_000;
});
```

### Use Cases Native Coin Escrow:

1. **Testing** - Untuk testing flow tanpa lock funds
2. **Informal Agreements** - Transaksi kecil dengan trust
3. **Escrow Info** - Tracking payment intent/records
4. **Hybrid Flow** - Combine dengan external verification

## Rekomendasi

### ✅ Gunakan Wrapped Tokens Jika:

- Payment amount besar (>$100)
- Butuh security tinggi
- Transaksi formal/bisnis
- Tidak kenal recipient
- Ingin trustless escrow

### ⚠️ Gunakan Native Coins Jika:

- Testing/development
- Payment amount kecil
- Sudah kenal dan trust recipient
- Hanya butuh payment tracking
- Hybrid dengan off-chain verification

## Migration Path

Untuk convert native coins ke wrapped tokens:

### BTC → ckBTC

```bash
# 1. Send BTC to ckBTC minter address
# 2. Wait for confirmations
# 3. Claim ckBTC from minter
```

### ETH → ckETH

```bash
# 1. Send ETH to ckETH minter helper contract
# 2. Wait for confirmations
# 3. Claim ckETH from minter
```

### Unwrap kembali:

```bash
# ckBTC → BTC: Burn ckBTC, provide BTC address
# ckETH → ETH: Burn ckETH, provide ETH address
```

## Security Best Practices

1. **Selalu gunakan wrapped tokens untuk escrow** kecuali ada alasan kuat
2. **Verify escrow_method** di response untuk tahu apakah wrapped atau native
3. **Untuk native coins**, pastikan ada trust atau external verification
4. **Monitor balance changes** jika menggunakan native coin escrow
5. **Educate users** tentang perbedaan wrapped vs native

## Technical Details

### Wrapped Token Flow (ICRC-2):

```motoko
// 1. Approval
icrc2_approve(spender = escrow_canister, amount)

// 2. Escrow pulls funds
icrc2_transfer_from(from = user, to = escrow_canister, amount)

// 3. Release to recipient
icrc1_transfer(to = recipient, amount)
```

### Native Coin Flow (Wallet):

```motoko
// 1. Balance check
balance = wallet.bitcoin_balance()

// 2. No transfer! Just record escrow

// 3. Manual payment by user
wallet.bitcoin_send(destination, amount)
```

## Future Improvements

- [ ] Add dispute resolution for native coin escrow
- [ ] Implement atomic swap for native coins
- [ ] Add off-chain verification hooks
- [ ] Multi-sig support for native coins
- [ ] Escrow templates for common use cases
