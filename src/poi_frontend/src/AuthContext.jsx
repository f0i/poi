import { createContext, useContext, useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { UserDataService } from "./services/userDataService";
import { ChallengeService } from "./services/challengeService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userIdentity) => {
    if (!userIdentity) return;

    setUserDataLoading(true);
    try {
      const userDataService = new UserDataService(userIdentity);
      const user = await userDataService.getUser(window.location.origin);
      setUserData(user);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUserData(null);
    } finally {
      setUserDataLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = await AuthClient.create();
        setAuthClient(client);

        const isAuth = await client.isAuthenticated();
        setIsAuthenticated(isAuth);

        if (isAuth) {
          const userIdentity = client.getIdentity();
          setIdentity(userIdentity);
          await fetchUserData(userIdentity);
        }
      } catch (error) {
        console.error("Failed to initialize auth client:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    if (!authClient) return;

    try {
      // Configure login with maximum session duration and idle timeout
      const loginOptions = {
        onSuccess: async () => {
          setIsAuthenticated(true);
          const userIdentity = authClient.getIdentity();
          setIdentity(userIdentity);
          await fetchUserData(userIdentity);

          // Automatically refresh points for new user
          try {
            const challengeService = new ChallengeService(userIdentity);
            await challengeService.refreshUserPoints(window.location.origin);
            console.log(
              "🔄 AuthContext: Automatically refreshed points for new user",
            );
          } catch (error) {
            console.error(
              "🔄 AuthContext: Failed to auto-refresh points:",
              error,
            );
          }
        },
        onError: (error) => {
          console.error("Login failed:", error);
        },
      };

      // Set maximum session duration (30 days) and configure idle timeout
      loginOptions.maxTimeToLive = 2592000000000000n; // 30 days in nanoseconds
      loginOptions.idleOptions = {
        idleTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
        disableDefaultIdleCallback: true, // Prevent automatic page reload
        captureScroll: false, // Don't capture scroll events
        scrollDebounce: 100, // Default scroll debounce
      };

      if (process.env.DFX_NETWORK === "ic") {
        loginOptions.identityProvider = "https://login.f0i.de?provider=x";
      } else {
        loginOptions.identityProvider = `http://localhost:4943/?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}`;
      }

      // Debug logging for session configuration
      console.log("🔍 DEBUG AuthContext: Session configuration:");
      console.log(
        "🔍 DEBUG AuthContext: maxTimeToLive:",
        loginOptions.maxTimeToLive?.toString() + "n",
      );
      console.log(
        "🔍 DEBUG AuthContext: idleOptions:",
        loginOptions.idleOptions,
      );
      console.log(
        "🔍 DEBUG AuthContext: identityProvider:",
        loginOptions.identityProvider,
      );

      await authClient.login(loginOptions);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    if (!authClient) return;

    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setIdentity(null);
      setUserData(null);
      setUserDataLoading(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    authClient,
    isAuthenticated,
    identity,
    userData,
    userDataLoading,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
