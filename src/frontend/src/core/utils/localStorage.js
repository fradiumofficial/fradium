// Utility functions untuk mengelola localStorage

export const CACHE_KEYS = {
    FIRST_TIME_VISIT: 'fradium_first_time_visit',
    LAST_VISIT: 'fradium_last_visit',
    VISIT_COUNT: 'fradium_visit_count'
};

/**
 * Cek apakah user sudah pernah mengunjungi halaman
 * @returns {boolean} true jika user sudah pernah visit, false jika first time
 */
export const hasVisitedBefore = () => {
    try {
        const visited = localStorage.getItem(CACHE_KEYS.FIRST_TIME_VISIT);
        return visited === 'true';
    } catch (error) {
        console.error('Error checking visit status:', error);
        return false; // Default to showing modal if localStorage fails
    }
};

/**
 * Tandai bahwa user sudah pernah mengunjungi halaman
 */
export const markAsVisited = () => {
    try {
        localStorage.setItem(CACHE_KEYS.FIRST_TIME_VISIT, 'true');
        localStorage.setItem(CACHE_KEYS.LAST_VISIT, new Date().toISOString());

        // Increment visit count
        const currentCount = getVisitCount();
        localStorage.setItem(CACHE_KEYS.VISIT_COUNT, (currentCount + 1).toString());
    } catch (error) {
        console.error('Error marking visit status:', error);
    }
};

/**
 * Reset visit status (untuk testing purposes)
 */
export const resetVisitStatus = () => {
    try {
        localStorage.removeItem(CACHE_KEYS.FIRST_TIME_VISIT);
        localStorage.removeItem(CACHE_KEYS.LAST_VISIT);
        localStorage.removeItem(CACHE_KEYS.VISIT_COUNT);
    } catch (error) {
        console.error('Error resetting visit status:', error);
    }
};

/**
 * Get visit count
 * @returns {number} jumlah kunjungan user
 */
export const getVisitCount = () => {
    try {
        const count = localStorage.getItem(CACHE_KEYS.VISIT_COUNT);
        return count ? parseInt(count, 10) : 0;
    } catch (error) {
        console.error('Error getting visit count:', error);
        return 0;
    }
};

/**
 * Get last visit date
 * @returns {string|null} tanggal kunjungan terakhir atau null
 */
export const getLastVisit = () => {
    try {
        return localStorage.getItem(CACHE_KEYS.LAST_VISIT);
    } catch (error) {
        console.error('Error getting last visit:', error);
        return null;
    }
};
