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
    const client = await AuthClient.create();

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
    } catch (e) {
        // ignore
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
