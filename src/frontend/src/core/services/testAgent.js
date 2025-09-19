/**
 * Test file untuk Agent Service
 * File ini bisa dijalankan untuk testing functionality agent
 */

import { agentService } from "./agentService.js";

/**
 * Test function untuk agent service
 */
export async function testAgentService() {
  console.log("🚀 Starting Agent Service Test...");

  try {
    // Test 1: Check initialization
    console.log("\n📋 Test 1: Checking initialization...");
    console.log("Agent ready:", agentService.isReady());

    // Test 2: Initialize agent
    console.log("\n🔧 Test 2: Initializing agent...");
    await agentService.initialize();
    console.log("Agent ready after init:", agentService.isReady());

    // Test 3: Test get balance tool directly
    console.log("\n💰 Test 3: Testing get balance tool...");
    const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
    const balanceResult = await agentService.getBalance(testAddress);
    console.log("Balance result:", balanceResult);

    // Test 4: Test chat message processing
    console.log("\n💬 Test 4: Testing chat message processing...");
    const chatResponse = await agentService.processMessage(`Berapa balance wallet ${testAddress}?`);
    console.log("Chat response:", chatResponse);

    // Test 5: Test with different message
    console.log("\n💬 Test 5: Testing different message...");
    const chatResponse2 = await agentService.processMessage("Halo, bisa bantu saya cek balance wallet?");
    console.log("Chat response 2:", chatResponse2);

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Error details:", error.message);
  }
}

/**
 * Test function untuk environment variables
 */
export function testEnvironmentVariables() {
  console.log("🔍 Checking environment variables...");

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ VITE_GEMINI_API_KEY tidak ditemukan!");
    console.log("📝 Silakan tambahkan VITE_GEMINI_API_KEY ke file .env");
    return false;
  }

  if (apiKey === "your_gemini_api_key_here") {
    console.error("❌ VITE_GEMINI_API_KEY masih menggunakan nilai default!");
    console.log("📝 Silakan ganti dengan API key Gemini yang sebenarnya");
    return false;
  }

  console.log("✅ VITE_GEMINI_API_KEY ditemukan");
  console.log("🔑 API Key (masked):", apiKey.substring(0, 10) + "...");

  return true;
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log("🧪 Running Agent Service Tests...\n");

  // Test environment variables first
  const envOk = testEnvironmentVariables();

  if (!envOk) {
    console.log("\n❌ Environment test failed. Please fix environment variables first.");
    return;
  }

  // Run agent tests
  await testAgentService();
}

// Auto-run tests jika file ini dijalankan langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}
