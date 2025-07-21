// Debug script untuk troubleshoot masalah Solana
// Jalankan di browser console untuk debugging

console.log("=== DEBUGGING SOLANA INTEGRATION ===");

// 1. Check localStorage untuk network filters
const checkNetworkFilters = () => {
  console.log("\n1. Checking localStorage network filters:");
  const keys = Object.keys(localStorage).filter((key) => key.includes("networkFilters"));
  keys.forEach((key) => {
    const value = localStorage.getItem(key);
    console.log(`${key}:`, JSON.parse(value));
  });
};

// 2. Check user wallet data
const checkWalletData = () => {
  console.log("\n2. Checking wallet data from backend:");
  // Anda perlu run ini di browser console dengan akses ke backend
  // backend.get_wallet().then(result => {
  //   console.log("Wallet data:", result);
  //   if (result.Ok && result.Ok.addresses) {
  //     const solanaAddresses = result.Ok.addresses.filter(addr =>
  //       addr.token_type?.Solana !== undefined
  //     );
  //     console.log("Solana addresses found:", solanaAddresses);
  //   }
  // });
};

// 3. Check current network state
const checkNetworkState = () => {
  console.log("\n3. Current network states to check:");
  console.log("- Pilih 'All Networks' di dropdown untuk melihat semua token");
  console.log("- Pastikan Solana filter enabled di network filters");
  console.log("- Check console browser untuk error saat create wallet");
};

// 4. Reset localStorage untuk testing
const resetNetworkFilters = () => {
  console.log("\n4. Reset network filters (OPTIONAL - hanya jika diperlukan):");
  const keys = Object.keys(localStorage).filter((key) => key.includes("networkFilters"));
  keys.forEach((key) => {
    const defaultFilters = {
      Bitcoin: true,
      Ethereum: true,
      Solana: true,
      Fradium: true,
    };
    localStorage.setItem(key, JSON.stringify(defaultFilters));
    console.log(`Reset ${key} to default filters`);
  });
  console.log("Refresh halaman setelah reset!");
};

// Run checks
checkNetworkFilters();
checkWalletData();
checkNetworkState();

console.log("\n=== MANUAL CHECKS ===");
console.log("1. Buka browser console dan cek error");
console.log("2. Pastikan dropdown network menampilkan 'All Networks' dan 'Solana'");
console.log("3. Pilih 'All Networks' untuk melihat semua token");
console.log("4. Buka network filter dan pastikan Solana enabled");
console.log("5. Jika wallet baru, pastikan sudah ter-create dengan alamat Solana");

console.log("\n=== NEXT STEPS ===");
console.log("Jika masih belum muncul:");
console.log("- Run: resetNetworkFilters() di console");
console.log("- Refresh halaman");
console.log("- Create wallet baru jika diperlukan");
