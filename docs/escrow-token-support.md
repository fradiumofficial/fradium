# Escrow Token Support

## Supported Tokens

Escrow system mendukung berbagai jenis token melalui ICRC-2 standard (Chain Key Tokens).

### Token Mapping

| Token Type      | Ledger Canister             | Description                      |
| --------------- | --------------------------- | -------------------------------- |
| `FRADIUM`       | `fradium_ledger`            | Token utama Fradium              |
| `ICP`           | `icp_ledger`                | Native ICP token                 |
| `BTC` / `ckBTC` | `ckbtc_ledger`              | Wrapped Bitcoin (Chain Key BTC)  |
| `ETH` / `ckETH` | `cketh_ledger`              | Wrapped Ethereum (Chain Key ETH) |
| `SOL`           | `fradium_ledger` (fallback) | Belum tersedia wrapped version   |

## Kenapa Menggunakan Wrapped Tokens?

Native blockchain tokens (BTC, ETH, SOL) **tidak bisa langsung disimpan** dalam escrow canister karena:

1. Memerlukan integration dengan blockchain external
2. Tidak support ICRC-2 approval/transfer_from mechanism
3. Kompleksitas key management untuk multi-chain

### Solusi: Chain Key Tokens

Chain Key Tokens (ckBTC, ckETH) adalah wrapped versions yang:

- ✅ Backed 1:1 dengan native tokens
- ✅ Menggunakan ICRC-2 standard (support approval & transfer_from)
- ✅ Dapat disimpan langsung dalam canister ICP
- ✅ Dapat di-unwrap kembali ke native tokens kapan saja

## Cara Penggunaan

### 1. Untuk BTC/ckBTC

```motoko
// User harus approve escrow canister dulu
let params = {
  recipient = recipient_principal;
  token_type = #ckBTC; // atau #BTC (sama saja)
  amount = 100_000; // 0.001 BTC (dalam satoshi)
  duration_seconds = 86400; // 24 jam
  description = ?"Payment for services";
  metadata = null;
};

let result = await backend.create_escrow(params);
```

### 2. Untuk ETH/ckETH

```motoko
let params = {
  recipient = recipient_principal;
  token_type = #ckETH; // atau #ETH
  amount = 10_000_000_000_000_000; // 0.01 ETH (dalam wei)
  duration_seconds = 3600;
  description = ?"Escrow payment";
  metadata = null;
};
```

### 3. Untuk ICP

```motoko
let params = {
  recipient = recipient_principal;
  token_type = #ICP;
  amount = 100_000_000; // 1 ICP (8 decimals)
  duration_seconds = 7200;
  description = ?"ICP payment";
  metadata = null;
};
```

### 4. Untuk FRADIUM

```motoko
let params = {
  recipient = recipient_principal;
  token_type = #FRADIUM;
  amount = 10_000_000_000; // 10 FRADIUM
  duration_seconds = 3600;
  description = ?"Fradium payment";
  metadata = null;
};
```

## Escrow Fee

**Setiap pembuatan escrow dikenakan fee:**

| Fee Amount     | Token   | Description                        |
| -------------- | ------- | ---------------------------------- |
| **10,000 e8s** | FRADIUM | 0.0001 FRADIUM per escrow creation |

### Kenapa Ada Fee?

1. **Spam Prevention** - Mencegah spam escrow creation
2. **Token Deflation** 🔥 - Fee di-BURN, mengurangi total supply FRADIUM
3. **Quality Control** - Memastikan escrow dibuat dengan serius

### Fee Payment & Burn:

- Fee dibayar dalam **FRADIUM token**
- Dipotong otomatis saat `create_escrow()`
- **100% fee di-BURN** 🔥 (dihapus dari total supply)
- User **harus approve** escrow canister terlebih dahulu
- Balance FRADIUM dicek sebelum create escrow

**Benefits:** Setiap escrow creation mengurangi supply FRADIUM, meningkatkan scarcity dan value untuk semua holders.

**Catatan:** Tidak ada minimum amount untuk escrow. Anda bisa create escrow dengan jumlah berapapun (selama > 0).

## Important Notes

1. **Double Approval Required**: Sebelum membuat escrow, user harus approve 2 hal:

   ```motoko
   // A. Approve FRADIUM for fee (10,000 e8s)
   let fee_approve_args = {
     spender = {
       owner = escrow_canister_principal;
       subaccount = null;
     };
     amount = 10_000; // Fee amount
     expires_at = null;
     fee = null;
     memo = null;
     from_subaccount = null;
     created_at_time = null;
     expected_allowance = null;
   };
   await fradium_ledger.icrc2_approve(fee_approve_args);

   // B. Approve token for escrow amount (e.g., ckBTC)
   let escrow_approve_args = {
     spender = {
       owner = escrow_canister_principal;
       subaccount = null;
     };
     amount = escrow_amount; // Your escrow amount
     expires_at = null;
     fee = null;
     memo = null;
     from_subaccount = null;
     created_at_time = null;
     expected_allowance = null;
   };
   await ckbtc_ledger.icrc2_approve(escrow_approve_args);
   ```

   **💡 Tip:** Approve dengan jumlah lebih besar untuk multiple escrow:

   ```motoko
   // Approve untuk 10 escrow sekaligus
   amount = escrow_amount + (10_000 * 10); // Escrow amount + 10 fees
   ```

2. **Token Conversion**:

   - Native BTC → Wrap ke ckBTC via ckBTC minter
   - Native ETH → Wrap ke ckETH via ckETH minter
   - ckBTC → Unwrap ke native BTC
   - ckETH → Unwrap ke native ETH

3. **SOL Support**:
   - SOL wrapped version belum tersedia
   - Sementara menggunakan FRADIUM sebagai fallback
   - Update akan dilakukan ketika SOL chain key tersedia

## Architecture

```
User Wallet
    ↓ (icrc2_approve)
Ledger Canister (ckBTC/ckETH/ICP/FRADIUM)
    ↓ (icrc2_transfer_from)
Escrow Canister (holds funds in escrow)
    ↓ (icrc1_transfer - when released)
Recipient Wallet
```

## Future Enhancements

- [ ] Support untuk lebih banyak Chain Key tokens
- [ ] Support untuk SOL wrapped version
- [ ] Multi-token escrow (escrow dengan multiple tokens)
- [ ] Partial release mechanism
