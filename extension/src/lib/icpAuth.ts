import { AuthClient } from "@dfinity/auth-client";

export function getInternetIdentityProvider(): string {
    // Vite envs are on import.meta.env
    const network = (import.meta as any).env?.DFX_NETWORK;
    const canisterId = (import.meta as any).env?.CANISTER_ID_INTERNET_IDENTITY;

    if (network === 'local' && canisterId) {
        return `http://${canisterId}.localhost:4943`;
    }
    return 'https://identity.ic0.app';
}

export function shortPrincipal(principalText?: string): string {
    if (!principalText) return 'Au...Ux';
    if (principalText.length <= 10) return principalText;
    return `${principalText.slice(0, 2)}...${principalText.slice(-2)}`;
}

export async function loginWithInternetIdentity(): Promise<string> {
    const identityProvider = getInternetIdentityProvider();
    
    // Use consistent AuthClient with proper storage configuration
    const client = await getAuthClient();

    const windowFeatures = [
        "width=500",
        "height=600",
        "scrollbars=yes",
        "resizable=yes",
        "toolbar=no",
        "menubar=no",
        "location=no",
        "status=no",
        "directories=no",
    ].join(",");

    await new Promise<void>((resolve, reject) =>
        client.login({
            identityProvider,
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
            windowOpenerFeatures: windowFeatures,
        })
    );

    const principal = client.getIdentity().getPrincipal().toText();
    try {
        localStorage.setItem("icp_principal", principal);
        localStorage.setItem("icp_authenticated", "true");
        console.log("ICP Auth: Stored authentication state");
    } catch (e) {
        console.error("ICP Auth: Failed to store authentication state:", e);
    }
    return principal;
}

export function readStoredPrincipal(): string | null {
    try {
        return localStorage.getItem("icp_principal");
    } catch {
        return null;
    }
}

export function isStoredAuthenticated(): boolean {
    try {
        const authenticated = localStorage.getItem("icp_authenticated");
        const principal = localStorage.getItem("icp_principal");
        return authenticated === "true" && !!principal;
    } catch {
        return false;
    }
}

export function clearStoredAuth(): void {
    try {
        // Clear our custom storage
        localStorage.removeItem("icp_principal");
        localStorage.removeItem("icp_authenticated");
        
        // Clear AuthClient storage keys (common ones)
        localStorage.removeItem("identity");
        localStorage.removeItem("delegation");
        
        // Clear Chrome storage as well
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.remove(["icp_principal", "icp_authenticated", "identity", "delegation"]);
        }
        
        console.log("ICP Auth: Cleared all stored authentication state");
    } catch (e) {
        console.error("ICP Auth: Failed to clear authentication state:", e);
    }
}

export async function resetAuthState(): Promise<void> {
    try {
        console.log("ICP Auth: Resetting all authentication state...");
        
        // Clear storage first
        clearStoredAuth();
        
        // Create new AuthClient and logout
        const client = await AuthClient.create({
            keyType: 'Ed25519',
        });
        
        await client.logout();
        console.log("ICP Auth: Authentication state reset complete");
    } catch (e) {
        console.error("ICP Auth: Failed to reset authentication state:", e);
    }
}

export async function getAuthClient() {
    return await AuthClient.create({
        // Use Ed25519 key type for string serialization compatibility
        keyType: 'Ed25519',
        storage: {
            get: async (key: string) => {
                try {
                    // Try localStorage first
                    const value = localStorage.getItem(key);
                    if (value !== null) {
                        return value;
                    }
                    
                    // Fallback to Chrome storage for extension environment
                    if (typeof chrome !== 'undefined' && chrome.storage) {
                        const result = await chrome.storage.local.get(key);
                        return result[key] || null;
                    }
                    
                    return null;
                } catch {
                    return null;
                }
            },
            set: async (key: string, value: string) => {
                try {
                    // Set in localStorage
                    localStorage.setItem(key, value);
                    
                    // Also set in Chrome storage for persistence
                    if (typeof chrome !== 'undefined' && chrome.storage) {
                        await chrome.storage.local.set({ [key]: value });
                    }
                } catch {
                    // ignore
                }
            },
            remove: async (key: string) => {
                try {
                    // Remove from localStorage
                    localStorage.removeItem(key);
                    
                    // Also remove from Chrome storage
                    if (typeof chrome !== 'undefined' && chrome.storage) {
                        await chrome.storage.local.remove(key);
                    }
                } catch {
                    // ignore
                }
            }
        }
    });
}
