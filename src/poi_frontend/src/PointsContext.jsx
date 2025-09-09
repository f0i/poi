import { createContext, useContext, useState } from 'react';
import { ChallengeService } from './services/challengeService';

const PointsContext = createContext();

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};

export const PointsProvider = ({ children }) => {
  const [points, setPoints] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Smart refresh logic - only refresh if data is older than 5 minutes
  const shouldRefresh = () => {
    const now = Date.now();
    const timeSinceUpdate = now - lastUpdate;
    return timeSinceUpdate > 5 * 60 * 1000; // 5 minutes
  };

  // Get points with smart caching
  const getPoints = async (forceRefresh = false) => {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && points && !shouldRefresh()) {
      return points;
    }

    setIsRefreshing(true);
    try {
      // Get user points directly (no external API refresh to avoid inter-canister calls)
      const challengeService = new ChallengeService();
      const userPoints = await challengeService.getUserPoints();
      setPoints(userPoints);
      setLastUpdate(Date.now());
      return userPoints;
    } catch (error) {
      console.error('Failed to load user points:', error);

      // Fallback: Use existing cached points if available
      if (points) {
        return points;
      }

      // Return empty points as last resort
      return {
        challengePoints: 0n,
        followerPoints: 0n,
        totalPoints: 0n,
      };
    } finally {
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
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
};