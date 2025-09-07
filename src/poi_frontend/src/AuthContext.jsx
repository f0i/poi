import { createContext, useContext, useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { UserDataService } from "./services/userDataService";

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
      await authClient.login({
        identityProvider:
          process.env.DFX_NETWORK === "ic"
            ? "https://login.f0i.de?provider=x"
            : `http://localhost:4943/?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}`,
        onSuccess: async () => {
          setIsAuthenticated(true);
          const userIdentity = authClient.getIdentity();
          setIdentity(userIdentity);
          await fetchUserData(userIdentity);
        },
        onError: (error) => {
          console.error("Login failed:", error);
        },
      });
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
