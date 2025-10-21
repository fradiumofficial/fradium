// Utility functions untuk testing modal functionality

import { resetVisitStatus, hasVisitedBefore, markAsVisited, getVisitCount, getLastVisit } from "./localStorage.js";

/**
 * Reset semua data visit untuk testing modal
 * Gunakan ini di console browser untuk testing
 */
export const resetModalForTesting = () => {
  resetVisitStatus();
  console.log("✅ Modal test data reset. Refresh halaman untuk melihat modal.");
};

/**
 * Cek status visit saat ini
 */
export const checkVisitStatus = () => {
  const hasVisited = hasVisitedBefore();
  const visitCount = getVisitCount();
  const lastVisit = getLastVisit();

  console.log("📊 Visit Status:", {
    hasVisited,
    visitCount,
    lastVisit: lastVisit ? new Date(lastVisit).toLocaleString() : "Never",
  });

  return { hasVisited, visitCount, lastVisit };
};

/**
 * Simulasi kunjungan pertama
 */
export const simulateFirstVisit = () => {
  resetVisitStatus();
  console.log("🎯 Simulated first visit. Modal should appear on next page load.");
};

/**
 * Simulasi kunjungan berulang
 */
export const simulateReturningVisit = () => {
  markAsVisited();
  console.log("🔄 Simulated returning visit. Modal should NOT appear on next page load.");
};

// Export functions ke window object untuk easy access di console
if (typeof window !== "undefined") {
  window.fradiumModalTest = {
    reset: resetModalForTesting,
    status: checkVisitStatus,
    firstVisit: simulateFirstVisit,
    returningVisit: simulateReturningVisit,
  };
}
