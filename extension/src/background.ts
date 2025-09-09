import { AuthClient } from "@dfinity/auth-client"
import { getInternetIdentityNetwork } from "~lib/utils/utils"
import { createActor, canisterId } from "../../src/declarations/wallet"

let authClient: AuthClient | null = null
let identity: any = null
let user: any = null
let isUserAuthenticated = false

// Initialize authentication on startup
const initializeAuth = async () => {
  try {
    await initAuth()
  } catch (error) {
    console.error("Failed to initialize auth on startup:", error)
  }
}

// Call initialization
initializeAuth()

// Ambil identity provider default atau custom
function getIdentityProvider(custom?: string) {
  return custom || getInternetIdentityNetwork()
}

// Inisialisasi AuthClient sekali di background
async function initAuth() {
  try {
    if (!authClient) {
      authClient = await AuthClient.create({})
    }

    const authenticated = await authClient.isAuthenticated()
    if (authenticated) {
      identity = authClient.getIdentity()
      isUserAuthenticated = true
      console.log("Background: User authenticated with principal:", identity.getPrincipal().toString())
    } else {
      identity = null
      isUserAuthenticated = false
      console.log("Background: User not authenticated")
    }
  } catch (error) {
    console.error("Background auth initialization error:", error)
    identity = null
    isUserAuthenticated = false
  }
}


// LOGIN
async function handleLogin(identityProvider?: string) {
  await initAuth()
  if (!authClient) throw new Error("AuthClient not initialized")

  return new Promise(async (resolve, reject) => {
    await authClient!.login({
      identityProvider: getIdentityProvider(identityProvider),
      onSuccess: async () => {
        identity = authClient!.getIdentity()
        isUserAuthenticated = true
        resolve({
          ok: true,
          principal: identity.getPrincipal().toText(),
          user
        })
      },
      onError: (err) => {
        console.error("Login failed", err)
        reject({ ok: false, error: err })
      },
      windowOpenerFeatures:
        "width=500,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no,directories=no"
    })
  })
}

// LOGOUT
async function handleLogout() {
  if (!authClient) return { ok: false }

  await authClient.logout()
  identity = null
  user = null
  isUserAuthenticated = false
  return { ok: true }
}

// REFRESH PROFILE
async function refreshUser(getProfileFunction?: () => Promise<any>) {
  if (!isUserAuthenticated || !getProfileFunction) return null

  try {
    const profile = await getProfileFunction()
    user = profile
    return { ok: true, user }
  } catch (err) {
    console.error("Profile refresh error:", err)
    return { ok: false }
  }
}

// GET WALLET ADDRESSES
async function handleGetWalletAddresses() {
  try {
    // Ensure authentication is initialized
    await initAuth()
    
    console.log("Background: Checking authentication state...")
    console.log("Background: isUserAuthenticated:", isUserAuthenticated)
    console.log("Background: identity:", identity ? identity.getPrincipal().toString() : "null")
    
    if (!isUserAuthenticated || !identity) {
      console.warn("Background: User not authenticated when trying to get wallet addresses")
      return { ok: false, error: "User not authenticated" }
    }

    console.log("Background: Creating wallet actor with identity:", identity.getPrincipal().toString())
    
    if (!canisterId) {
      console.error("Background: Wallet canister ID not configured")
      return { ok: false, error: "Wallet canister ID not configured" }
    }

    // Create wallet actor with authenticated identity
    const walletActor = createActor(canisterId, {
      agentOptions: { identity }
    })

    console.log("Background: Calling wallet_addresses method...")
    // Call wallet_addresses function
    const addresses = await walletActor.wallet_addresses()
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
          sendResponse({
            isAuthenticated: isUserAuthenticated,
            principal: identity ? identity.getPrincipal().toText() : null,
            user
          })
          break

        case "REFRESH_USER":
          const refreshed = await refreshUser(msg.getProfileFunction)
          sendResponse(refreshed)
          break

        case "GET_WALLET_ADDRESSES":
          const addressesResult = await handleGetWalletAddresses()
          sendResponse(addressesResult)
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
