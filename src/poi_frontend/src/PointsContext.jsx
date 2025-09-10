import { createContext, useContext, useState, useEffect } from "react";
import { ChallengeService } from "./services/challengeService";
import { useAuth } from "./AuthContext";

const PointsContext = createContext();

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error("usePoints must be used within a PointsProvider");
  }
  return context;
};

export const PointsProvider = ({ children }) => {
  const { identity } = useAuth();
  const [points, setPoints] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log("🔍 DEBUG PointsProvider: Initializing PointsProvider");

  // Automatically load points when identity is available
  useEffect(() => {
    if (identity) {
      getPoints();
    }
  }, [identity]);

  // Smart refresh logic - only refresh if data is older than 5 minutes
  const shouldRefresh = () => {
    const now = Date.now();
    const timeSinceUpdate = now - lastUpdate;
    return timeSinceUpdate > 5 * 60 * 1000; // 5 minutes
  };

  // Get points with smart caching
  const getPoints = async (forceRefresh = false) => {
    console.log("🔍 DEBUG PointsContext: getPoints called", {
      forceRefresh,
      hasCachedPoints: !!points,
      shouldRefresh: shouldRefresh(),
    });

    // Return cached data if available and not forcing refresh
    if (!forceRefresh && points && !shouldRefresh()) {
      console.log("🔍 DEBUG PointsContext: Returning cached points", points);
      return points;
    }

    console.log("🔍 DEBUG PointsContext: Fetching fresh points...");
    setIsRefreshing(true);

    try {
      // Get user points directly (no external API refresh to avoid inter-canister calls)
      console.log("🔍 DEBUG PointsContext: Creating ChallengeService...");
      console.log("🔍 DEBUG PointsContext: Current identity:", identity);
      console.log(
        "🔍 DEBUG PointsContext: Current principal:",
        identity?.getPrincipal().toString(),
      );
      const challengeService = new ChallengeService(identity);
      console.log("🔍 DEBUG PointsContext: Calling getUserPoints()...");

      const userPoints = await challengeService.getUserPoints();
      console.log(
        "🔍 DEBUG PointsContext: getUserPoints() returned:",
        userPoints,
      );

      console.log("🔍 DEBUG PointsContext: Setting points in state...");
      setPoints(userPoints);
      setLastUpdate(Date.now());

      console.log("🔍 DEBUG PointsContext: Points successfully updated");
      return userPoints;
    } catch (error) {
      console.error(
        "🔍 DEBUG PointsContext: Failed to load user points:",
        error,
      );
      console.error("🔍 DEBUG PointsContext: Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      // Fallback: Use existing cached points if available
      if (points) {
        console.log(
          "🔍 DEBUG PointsContext: Using cached points as fallback",
          points,
        );
        return points;
      }

      console.log(
        "🔍 DEBUG PointsContext: No cached points available, returning zeros",
      );
      // Return empty points as last resort
      const emptyPoints = {
        challengePoints: 0n,
        followerPoints: 0n,
        totalPoints: 0n,
      };
      console.log(
        "🔍 DEBUG PointsContext: Returning empty points",
        emptyPoints,
      );
      return emptyPoints;
    } finally {
      console.log("🔍 DEBUG PointsContext: Setting isRefreshing to false");
      setIsRefreshing(false);
    }
  };

  const value = {
    points,
    getPoints,
    isRefreshing,
    lastUpdate,
    shouldRefresh: shouldRefresh(),
  };

  return (
    <PointsContext.Provider value={value}>{children}</PointsContext.Provider>
  );
};
