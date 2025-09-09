import { createActor as createWalletActor, canisterId as walletCanisterId } from "../../src/declarations/wallet"
import { backend } from "../../src/declarations/backend"
import { HttpAgent } from "@dfinity/agent"

// Background script will receive identity from UI/popup
let user: any = null


// LOGIN - Not supported in background (MV3 service worker)
async function handleLogin(identityProvider?: string) {
  console.warn("Background: Login not supported in MV3 service worker")
  return { ok: false, error: "Login not supported in background script" }
}

// LOGOUT - Not supported in background (MV3 service worker)
async function handleLogout() {
  console.warn("Background: Logout not supported in MV3 service worker")
  return { ok: false, error: "Logout not supported in background script" }
}

// ANALYZE ADDRESS (Backend)
async function handleAnalyzeAddress(address: string, identity?: any) {
  try {
    if (!identity) {
      console.warn("Background: No identity provided for analyze address")
      return { ok: false, error: "No identity provided" }
    }
    
    const result = await backend.analyze_address(address)

    if ("Ok" in result) {
      console.log("Background: Analyze address successful")
      return { ok: true, data: result.Ok }
    } else {
      console.log("Background: Analyze address failed:", result.Err)
      return { ok: false, error: result.Err }
    }
  } catch (err) {
    console.error("Background: analyze_address error:", err)
    return { ok: false, error: String(err) }
  }
}

// REFRESH PROFILE - Not supported in background
async function refreshUser(getProfileFunction?: () => Promise<any>) {
  console.warn("Background: Profile refresh not supported in MV3 service worker")
  return { ok: false, error: "Profile refresh not supported in background" }
}

// GET WALLET ADDRESSES
async function handleGetWalletAddresses(identity?: any) {
  try {
    if (!identity) {
      console.warn("Background: No identity provided for wallet addresses")
      return { ok: false, error: "No identity provided" }
    }

    if (!walletCanisterId) {
      console.error("Background: Wallet canister ID not found")
      return { ok: false, error: "Wallet canister ID not configured" }
    }

    // Create authenticated wallet actor
    const agent = new HttpAgent({
      identity,
    })

    // Fetch root key for certificate validation during development
    if (process.env.DFX_NETWORK !== "ic") {
      agent.fetchRootKey().catch((err) => {
        console.warn(
          "Unable to fetch root key. Check to ensure that your local replica is running"
        )
        console.error(err)
      })
    }

    const authenticatedWallet = createWalletActor(walletCanisterId, {
      agent: agent as any,
    })

    const addresses = await authenticatedWallet.wallet_addresses()
    console.log("Background: Wallet addresses result:", addresses)

    return {
      ok: true,
      addresses: {
        bitcoin: addresses.bitcoin,
        ethereum: addresses.ethereum,
        solana: addresses.solana,
        icp_principal: addresses.icp_principal,
        icp_account: addresses.icp_account
      }
    }
  } catch (err) {
    console.error("Background: Get wallet addresses error:", err)
    return { ok: false, error: String(err) }
  }
}

// Listener pesan dari popup/content
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.type) {
        case "LOGIN_WITH_ICP":
          const loginResult = await handleLogin(msg.identityProvider)
          sendResponse(loginResult)
          break

        case "LOGOUT":
          const logoutResult = await handleLogout()
          sendResponse(logoutResult)
          break

        case "GET_AUTH_STATE":
          console.warn("Background: GET_AUTH_STATE not supported - use UI auth state")
          sendResponse({
            isAuthenticated: false,
            principal: null,
            user: null,
            error: "Auth state managed in UI only"
          })
          break

        case "REFRESH_USER":
          const refreshed = await refreshUser(msg.getProfileFunction)
          sendResponse(refreshed)
          break

        case "GET_WALLET_ADDRESSES":
          const addressesResult = await handleGetWalletAddresses(msg.identity)
          sendResponse(addressesResult)
          break

        case "ANALYZE_ADDRESS":
          const analyzeResult = await handleAnalyzeAddress(msg.address, msg.identity)
          sendResponse(analyzeResult)
          break

        default:
          sendResponse({ ok: false, error: "Unknown message type" })
      }
    } catch (err) {
      console.error("Auth error:", err)
      sendResponse({ ok: false, error: err })
    }
  })()

  return true // keep message channel open for async
})
