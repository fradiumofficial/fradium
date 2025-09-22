import { AuthClient } from "@dfinity/auth-client"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react"

import { getInternetIdentityNetwork } from "~lib/utils/utils"

type AuthContextType = {
  isLoading: boolean
  isAuthenticated: boolean
  principalText: string | null
  user: any | null
  identity: any | null
  authClient: AuthClient | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [principalText, setPrincipalText] = useState<string | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [identity, setIdentity] = useState<any | null>(null)
  const [authClient, setAuthClient] = useState<AuthClient | null>(null)

  // Use provided identity provider or default
  const getIdentityProvider = useCallback(() => {
    return getInternetIdentityNetwork()
  }, [])

  // Update identity function (similar to AuthProvider.jsx)
  const updateIdentity = useCallback(async (client: AuthClient) => {
    console.log(
      "🔐 AuthContext: updateIdentity called, checking authentication status..."
    )
    try {
      const authenticated = await client.isAuthenticated()
      console.log(
        "🔐 AuthContext: AuthClient.isAuthenticated() result:",
        authenticated
      )

      setIsAuthenticated(authenticated)

      if (authenticated) {
        console.log(
          "🔐 AuthContext: User is authenticated, getting identity..."
        )
        const newIdentity = client.getIdentity()
        const principal = newIdentity.getPrincipal().toString()
        console.log("🔐 AuthContext: Identity obtained:", principal)

        setIdentity(newIdentity)
        setPrincipalText(principal)

        console.log("🔐 AuthContext: Setting loading state temporarily...")
        setIsLoading(true)

        // For extension, we don't have profile function, so just set user to null
        console.log("🔐 AuthContext: Setting user to null (extension mode)")
        setUser(null)
        setIsAuthenticated(true)

        setIsLoading(false)

        console.log("🔐 AuthContext: Principal obtained and set:", principal)
      } else {
        console.log("🔐 AuthContext: User is not authenticated")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("🔐 AuthContext: Auth error in updateIdentity:", err)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      console.log("🔐 AuthContext: Initializing authentication...")
      try {
        console.log(
          "🔐 AuthContext: Creating AuthClient to check authentication status..."
        )
        // Initialize AuthClient
        const client = await AuthClient.create({})
        setAuthClient(client)
        console.log(
          "🔐 AuthContext: AuthClient created, checking authentication status..."
        )
        await updateIdentity(client)
        console.log("🔐 AuthContext: Authentication initialization completed")
      } catch (err) {
        console.error("🔐 AuthContext: Auth initialization error:", err)
        setIsLoading(false)
      }
    }
    initAuth()
  }, [updateIdentity])

  const signIn = useCallback(async () => {
    console.log(
      "🔐 AuthContext: signIn called, starting Internet Identity authentication flow"
    )

    if (!authClient) {
      console.log("🔐 AuthContext: No existing authClient, creating new one...")
      const client = await AuthClient.create({})
      console.log("🔐 AuthContext: New AuthClient created successfully")
      setAuthClient(client)
    }

    const currentClient = authClient || (await AuthClient.create({}))
    console.log("🔐 AuthContext: Using AuthClient for login")

    const identityProvider = getIdentityProvider()
    console.log("🔐 AuthContext: Identity provider URL:", identityProvider)

    // Konfigurasi untuk membuka window baru, bukan tab (same as AuthProvider.jsx)
    const windowFeatures = [
      "width=500",
      "height=600",
      "scrollbars=yes",
      "resizable=yes",
      "toolbar=no",
      "menubar=no",
      "location=no",
      "status=no",
      "directories=no"
    ].join(",")

    try {
      await new Promise<void>((resolve, reject) =>
        currentClient.login({
          derivationOrigin: "https://t4sse-tyaaa-aaaae-qfduq-cai.icp0.io",
          identityProvider: identityProvider,
          onSuccess: () => {
            console.log("🔐 AuthContext: Internet Identity login successful")
            resolve()
          },
          onError: (error) => {
            console.error(
              "🔐 AuthContext: Internet Identity login failed:",
              error
            )
            reject(error)
          },
          windowOpenerFeatures: windowFeatures
        })
      )

      console.log(
        "🔐 AuthContext: Getting identity from authenticated client..."
      )
      const newIdentity = currentClient.getIdentity()
      console.log(
        "🔐 AuthContext: Identity obtained:",
        newIdentity.getPrincipal().toString()
      )

      await handleLoginSuccess(newIdentity)
    } catch (error) {
      console.error("🔐 AuthContext: Error during signIn process:", error)
      throw error
    }
  }, [authClient, getIdentityProvider])

  // Handle login success (similar to AuthProvider.jsx)
  const handleLoginSuccess = useCallback(async (newIdentity: any) => {
    const principal = newIdentity.getPrincipal().toString()
    console.log("🔐 AuthContext: Login success, setting identity:", principal)

    console.log("🔐 AuthContext: Setting authentication state...")
    setIdentity(newIdentity)
    setPrincipalText(principal)

    console.log("🔐 AuthContext: Setting loading state to true temporarily...")
    setIsLoading(true)

    // For extension, we don't have profile function, so just set user to null
    console.log(
      "🔐 AuthContext: Setting user to null (no profile function in extension)"
    )
    setUser(null)
    setIsAuthenticated(true)

    console.log("🔐 AuthContext: Setting loading state to false")
    setIsLoading(false)

    console.log("🔐 AuthContext: Authentication flow completed successfully")
  }, [])

  const refreshUser = useCallback(async () => {
    console.log(
      "🔐 AuthContext: refreshUser called, current auth state:",
      isAuthenticated
    )

    if (!isAuthenticated) {
      console.log("🔐 AuthContext: User not authenticated, skipping refresh")
      return
    }

    try {
      console.log("🔐 AuthContext: Refreshing user authentication status...")
      // For extension, we don't have profile function, so just refresh identity
      if (authClient) {
        console.log(
          "🔐 AuthContext: Checking authentication with existing AuthClient..."
        )
        const isAuth = await authClient.isAuthenticated()
        console.log(
          "🔐 AuthContext: AuthClient.isAuthenticated() result:",
          isAuth
        )

        if (isAuth) {
          const newIdentity = authClient.getIdentity()
          const principal = newIdentity.getPrincipal().toString()
          console.log(
            "🔐 AuthContext: User still authenticated, updating identity:",
            principal
          )

          setIdentity(newIdentity)
          setPrincipalText(principal)
          console.log("🔐 AuthContext: User refresh completed successfully")
        } else {
          console.log(
            "🔐 AuthContext: User no longer authenticated, clearing state..."
          )
          // User is no longer authenticated
          setIsAuthenticated(false)
          setPrincipalText(null)
          setIdentity(null)
          setUser(null)
          console.log("🔐 AuthContext: Authentication state cleared")
        }
      } else {
        console.warn("🔐 AuthContext: No authClient available for refresh")
      }
    } catch (err) {
      console.error("🔐 AuthContext: User refresh error:", err)
      // On error, assume user is no longer authenticated
      console.log(
        "🔐 AuthContext: Clearing authentication state due to error..."
      )
      setIsAuthenticated(false)
      setPrincipalText(null)
      setIdentity(null)
      setUser(null)
    }
  }, [isAuthenticated, authClient])

  const signOut = useCallback(async () => {
    console.log("🔐 AuthContext: signOut called, starting logout process...")

    console.log("🔐 AuthContext: Clearing local authentication state...")
    setIsAuthenticated(false)
    setPrincipalText(null)
    setIdentity(null)
    setUser(null)
    setAuthClient(null)

    console.log("🔐 AuthContext: Logout process completed")
  }, [])

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      principalText,
      user,
      identity,
      authClient,
      signIn,
      signOut,
      refreshUser
    }),
    [
      isLoading,
      isAuthenticated,
      principalText,
      user,
      identity,
      authClient,
      signIn,
      signOut,
      refreshUser
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
