import { AuthClient } from "@dfinity/auth-client"
import { getInternetIdentityNetwork } from "~lib/utils/utils"

let authClient: AuthClient | null = null
let identity: any = null
let user: any = null
let isAuthenticated = false
const STORAGE_KEY_HAS_WALLET = "fradium_has_confirmed_wallet"

// Ambil identity provider default atau custom
function getIdentityProvider(custom?: string) {
  return custom || getInternetIdentityNetwork()
}

// Inisialisasi AuthClient sekali di background
async function initAuth() {
  if (!authClient) {
    authClient = await AuthClient.create({})
    if (await authClient.isAuthenticated()) {
      identity = authClient.getIdentity()
      isAuthenticated = true
    }
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
        isAuthenticated = true

        // TODO: call your canister profile function if needed
        // user = await getProfileFunction?.()

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
  isAuthenticated = false
  return { ok: true }
}

// REFRESH PROFILE
async function refreshUser(getProfileFunction?: () => Promise<any>) {
  if (!isAuthenticated || !getProfileFunction) return null

  try {
    const profile = await getProfileFunction()
    user = profile
    return { ok: true, user }
  } catch (err) {
    console.error("Profile refresh error:", err)
    return { ok: false }
  }
}

// CREATE/CONFIRM WALLET (persist simple flag in storage)
async function handleCreateWallet() {
  try {
    await chrome.storage?.local?.set?.({ [STORAGE_KEY_HAS_WALLET]: "true" })
    return { ok: true }
  } catch (err) {
    console.error("Create wallet error:", err)
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
            isAuthenticated,
            principal: identity ? identity.getPrincipal().toText() : null,
            user
          })
          break

        case "REFRESH_USER":
          const refreshed = await refreshUser(msg.getProfileFunction)
          sendResponse(refreshed)
          break

        case "CREATE_WALLET":
          const created = await handleCreateWallet()
          sendResponse(created)
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
