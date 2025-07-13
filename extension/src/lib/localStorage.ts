import type { Transaction } from "@/modules/analyze_address/model/AnalyzeAddressModel";

// Fungsi untuk menyimpan data ke localStorage
// Jika localStorage penuh, kita akan membersihkan cache lama
// dan mencoba menyimpan ulang
// Data disimpan dengan key yang diberikan, dan akan disimpan dalam format JSON
// Data yang disimpan adalah array dari Transaction
export function saveToLocalStorage(key: string, data: Transaction[]): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Saved ${data.length} transactions to localStorage with key: ${key}`);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        // Jika localStorage penuh, kita bisa mencoba membersihkan cache lama
        try {
            // Mencoba membersihkan cache lama dan menyimpan ulang
            clearOldCaches();
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Still unable to save to localStorage after cleanup:', e);
        }
    }
}

// Fungsi untuk membersihkan cache lama
// Kita akan menyimpan maksimal 10 entri cache
// Jika ada lebih dari 10 entri, kita akan menghapus yang paling lama
// Cache yang disimpan dengan prefix "analyze_address_"
function clearOldCaches(): void {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("analyze_address_")) {
            keys.push(key);
        }
    }

    if (keys.length > 10) {
        keys.slice(0, keys.length - 10).forEach(key => {
            localStorage.removeItem(key);
            console.log(`Removed old cache entry: ${key}`);
        });
    }
}

// Fungsi untuk memeriksa apakah cache masih valid
// Cache dianggap valid jika data disimpan dalam 24 jam terakhir
// Jika tidak ada data yang disimpan, dianggap tidak valid
export function isCacheFresh(key: string): boolean {
    const cacheTimeKey = `${key}-timestamp`;
    const timestamp = localStorage.getItem(cacheTimeKey);
    
    if (!timestamp) return false;
    
    const savedTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 1 hari dalam milidetik
    
    return currentTime - savedTime < maxAge;
}

// Fungsi untuk mengambil data dari localStorage
// Jika data tidak ada atau cache tidak valid, mengembalikan null
// Jika data ada, mengembalikan array Transaction
// Jika terjadi kesalahan saat parsing, mengembalikan null
export function getFromLocalStorage(key: string): Transaction[] | null {
    try {
        const data = localStorage.getItem(key);
        if (!data) return null;
        
        const parsedData = JSON.parse(data) as Transaction[];
        console.log(`Retrieved ${parsedData.length} transactions from localStorage with key: ${key}`);
        return parsedData;
    } catch (error) {
        console.error('Error retrieving from localStorage:', error);
        return null;
    }
}