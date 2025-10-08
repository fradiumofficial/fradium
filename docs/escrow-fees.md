# Escrow Fees & Pricing

## Fee Structure

### Creation Fee

| Action            | Fee Amount     | Token   | Equivalent     |
| ----------------- | -------------- | ------- | -------------- |
| **Create Escrow** | **10,000 e8s** | FRADIUM | 0.0001 FRADIUM |

**Dibayar saat:** Membuat escrow baru (call `create_escrow`)
**Digunakan untuk:** **🔥 BURNED** (dihapus dari total supply)

### No Other Fees

✅ **Gratis:**

- Accept escrow
- Reject escrow
- Cancel escrow
- Release funds
- View escrow history
- Query escrow status

## Kenapa Ada Fee?

### 1. Spam Prevention

Mencegah user membuat escrow secara berlebihan atau spam yang dapat:

- Menghabiskan cycles canister
- Membuat network congested
- Menurunkan kualitas platform

### 2. Token Deflation 🔥

Fee di-**BURN** (dihapus dari supply), yang berarti:

- **Mengurangi total supply FRADIUM** - Setiap escrow creation mengurangi supply
- **Meningkatkan scarcity** - Semakin banyak escrow, semakin langka token
- **Value appreciation** - Berkurangnya supply dapat meningkatkan nilai token
- **Holder benefit** - Semua holder mendapat benefit dari deflasi

### 3. Quality Assurance

Fee kecil memastikan:

- Escrow dibuat dengan serius
- Reduce fraudulent/test transactions
- Better user experience overall

## Cara Bayar Fee

### Option 1: Single Approval (Recommended)

Approve sekali dengan jumlah total (fee + escrow amount):

```motoko
// For FRADIUM escrow with 100 FRADIUM amount
let total_approval = 100_00000000 + 10_000; // 100 FRADIUM + fee

let approve_args = {
  spender = {
    owner = escrow_canister;
    subaccount = null;
  };
  amount = total_approval;
  // ... other fields
};

await fradium_ledger.icrc2_approve(approve_args);
```

### Option 2: Separate Approvals

Approve fee dan escrow amount secara terpisah:

```motoko
// Step 1: Approve fee (FRADIUM)
await fradium_ledger.icrc2_approve({
  spender = { owner = escrow_canister; subaccount = null };
  amount = 10_000; // Fee
  // ...
});

// Step 2: Approve escrow amount (e.g., ckBTC)
await ckbtc_ledger.icrc2_approve({
  spender = { owner = escrow_canister; subaccount = null };
  amount = 100_000; // 0.001 BTC
  // ...
});
```

### Option 3: Bulk Approval

Untuk multiple escrow, approve sekaligus:

```motoko
// Plan to create 10 escrows
let num_escrows = 10;
let total_fees = 10_000 * num_escrows; // 100,000 e8s

let bulk_approve = {
  spender = {
    owner = escrow_canister;
    subaccount = null;
  };
  amount = total_fees;
  // ...
};

await fradium_ledger.icrc2_approve(bulk_approve);
// Now you can create 10 escrows without re-approving
```

## Fee Check Flow

Ketika user call `create_escrow()`:

```
1. Check FRADIUM balance
   ├─ Balance >= 10,000 e8s? ✅ Continue
   └─ Balance < 10,000 e8s? ❌ Error: Insufficient balance

2. Collect fee via icrc2_transfer_from
   ├─ Approved? ✅ Collect fee
   └─ Not approved? ❌ Error: Approve required

3. 🔥 Burn collected fee
   ├─ Transfer to minting account (burn)
   └─ Fee removed from total supply

4. Process escrow (lock funds or verify balance)
   ├─ Success ✅ Create escrow record
   └─ Fail ❌ Fee already burned (NOT refunded)

5. Return escrow_id or error
```

**⚠️ Important:** Fee dikumpulkan di STEP 2, sebelum lock funds. Jika escrow gagal di STEP 3, fee TIDAK dikembalikan.

## Fee Refund Policy

### Fee TIDAK Dikembalikan Jika:

- ❌ Escrow creation berhasil (normal case)
- ❌ Locking funds gagal (balance insufficient di token escrow)
- ❌ Native coin balance verification gagal
- ❌ User cancel escrow setelah dibuat

### Fee Dikembalikan Jika:

- ✅ Transaction gagal di STEP 1 (balance check)
- ✅ Transaction gagal di STEP 2 (fee collection error)

**Alasan:** Fee sudah dikumpulkan berarti request sudah diproses oleh canister.

## Minimum Balance Required

Untuk create escrow, user harus punya:

```
Total Required = Escrow Amount + Fee + Transfer Fee

Example (ckBTC escrow):
- Escrow amount: 100,000 satoshi (0.001 BTC)
- Escrow fee: 10,000 e8s FRADIUM (0.0001 FRADIUM)
- ICRC-2 transfer fee: ~10,000 e8s (per transfer)

Minimum FRADIUM balance: 20,000 e8s (fee + transfer fee)
Minimum ckBTC balance: 110,000 satoshi (escrow + transfer fee)
```

## Fee Usage: Token Burn 🔥

**100% fee di-BURN** (dihapus dari total supply)

### Deflation Model

Setiap escrow creation mengurangi total supply FRADIUM:

```
Initial Supply: 1,000,000,000 FRADIUM (1 billion)

After 1,000 escrows: -10,000,000 e8s (0.1 FRADIUM)
After 10,000 escrows: -100,000,000 e8s (1 FRADIUM)
After 100,000 escrows: -1,000,000,000 e8s (10 FRADIUM)
After 1,000,000 escrows: -10,000,000,000 e8s (100 FRADIUM)
```

### Benefits untuk Token Holders

1. **Supply Reduction** ⬇️

   - Permanent burn, tidak bisa di-mint lagi
   - Semakin banyak escrow = semakin sedikit supply

2. **Scarcity Increase** 📈

   - Limited supply dengan demand yang terus ada
   - Berkurangnya circulating supply

3. **Value Appreciation** 💎

   - Basic economics: less supply + same/more demand = higher price
   - All holders benefit tanpa dilution

4. **Incentive Alignment** 🤝
   - Platform growth = token value growth
   - Escrow usage langsung benefit holders

## Fee Changes

**Current Fee:** 10,000 e8s (0.0001 FRADIUM)

Fee dapat berubah berdasarkan:

- Network load
- Token price
- Community voting
- Platform needs

**Notice:** Any fee change akan diumumkan minimal 30 hari sebelumnya.

## Example Costs

Real-world cost comparison:

| Escrow Amount         | Fee (FRADIUM)  | Percentage |
| --------------------- | -------------- | ---------- |
| 10 FRADIUM (1M e8s)   | 0.0001 FRADIUM | 0.001%     |
| 100 FRADIUM (10M e8s) | 0.0001 FRADIUM | 0.0001%    |
| 1,000 FRADIUM         | 0.0001 FRADIUM | 0.00001%   |

**Conclusion:** Fee sangat kecil dibanding escrow amount, making it affordable untuk semua ukuran transaksi.

## FAQ

### Q: Apakah fee wajib?

**A:** Ya, fee 10,000 e8s FRADIUM wajib untuk setiap pembuatan escrow.

### Q: Bisa bayar fee pakai token lain (BTC, ETH)?

**A:** Tidak, fee hanya bisa dibayar dengan FRADIUM token.

### Q: Bagaimana jika FRADIUM balance kurang?

**A:** Escrow creation akan gagal dengan error "Insufficient FRADIUM balance".

### Q: Apakah ada minimum amount untuk escrow?

**A:** Tidak! Anda bisa create escrow dengan jumlah berapapun (> 0).

### Q: Fee dikembalikan jika escrow expire/cancel?

**A:** Tidak, fee sudah dikumpulkan saat creation dan tidak dikembalikan.

### Q: Bisa dapat diskon fee?

**A:** Saat ini belum ada program diskon. Future: mungkin ada tier system untuk large volume users.

### Q: Fee masuk kemana?

**A:** Fee di-**BURN** 🔥 (dihapus dari total supply). Tidak disimpan di treasury, tapi langsung mengurangi circulating supply FRADIUM.

## Best Practices

1. **Approve in Bulk** - Approve fee untuk multiple escrows sekaligus
2. **Check Balance First** - Pastikan FRADIUM balance >= 10,000 e8s
3. **Monitor Allowance** - Track remaining approval untuk avoid re-approval
4. **Use Total Approval** - Approve (escrow_amount + fee) untuk simplicity

## Technical Details

```motoko
// Fee constant in escrow module
private let ESCROW_FEE : Nat = 10_000; // 0.0001 FRADIUM (e8s)

// Step 1: Collect fee from user
let feeCollectArgs : TransferFromArgs = {
  from = { owner = caller; subaccount = null };
  to = { owner = escrow_canister; subaccount = null };
  amount = ESCROW_FEE;
  memo = ?Text.encodeUtf8("Escrow Fee (to burn)");
  // ...
};
await fradiumLedger.icrc2_transfer_from(feeCollectArgs);

// Step 2: Burn the fee (transfer to minting account)
let mintingAccount = Principal.fromText("aaaaa-aa"); // ICRC-1 minting/burning account

let burnArgs : TransferArg = {
  from_subaccount = null;
  to = { owner = mintingAccount; subaccount = null };
  amount = ESCROW_FEE;
  memo = ?Text.encodeUtf8("Burn Escrow Fee");
  // ...
};
await fradiumLedger.icrc1_transfer(burnArgs);
// 🔥 Fee removed from total supply
```

### ICRC-1 Burn Mechanism

In ICRC-1 standard, burning tokens is done by:

1. Transfer to **minting account** (Principal `aaaaa-aa`)
2. Minting account is special: tokens sent here are removed from supply
3. Cannot be retrieved (permanent burn)

## Future Enhancements

- [ ] Dynamic fee based on escrow amount
- [ ] Volume discount tiers
- [ ] Fee token flexibility (accept other tokens)
- [ ] Staking for fee reduction
- [ ] Fee rebate program
