import { useAuth } from "../AuthContext";
import { usePoints } from "../PointsContext";
import { useState, useEffect } from "react";

function UserProfile() {
  const { isAuthenticated, identity, userData, userDataLoading, logout } =
    useAuth();

  const { points: userPoints, getPoints } = usePoints();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      checkAdminStatus();
      // Load points if we don't have them yet
      if (!userPoints) {
        getPoints();
      }
    }
  }, [isAuthenticated, userPoints]);

  const formatNumber = (num) => {
    const numValue = typeof num === "bigint" ? Number(num) : parseInt(num);
    return new Intl.NumberFormat().format(numValue);
  };

  const checkAdminStatus = async () => {
    try {
      // We need to create a temporary service instance for admin check
      const { ChallengeService } = await import("../services/challengeService");
      const challengeService = new ChallengeService(identity);
      const admin = await challengeService.getAdmin();
      if (admin && identity) {
        setIsAdmin(admin.toString() === identity.getPrincipal().toString());
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsAdmin(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* User Profile Section */}
      {userDataLoading ? (
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="text-slate-400">Loading profile...</p>
          </div>
        </div>
      ) : userData ? (
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile
          </h3>

          {/* Principal ID */}
          <div className="bg-slate-700 rounded-lg p-3 mb-4">
            <p className="text-slate-300 text-sm font-mono break-all">
              {identity?.getPrincipal().toString()}
            </p>
          </div>

          {/* User Info Grid */}
          <div className="space-y-3">
            {userData.name && userData.name.length > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400 text-sm">Name</span>
                <span className="text-white font-medium">
                  {userData.name[0]}
                </span>
              </div>
            )}

            {userData.username && userData.username.length > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400 text-sm">Username</span>
                <span className="text-white font-medium">
                  @{userData.username[0]}
                </span>
              </div>
            )}

            {userData.email && userData.email.length > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400 text-sm">Email</span>
                <span className="text-white font-medium">
                  {userData.email[0]}
                </span>
              </div>
            )}

            {userData.location && userData.location.length > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400 text-sm">Location</span>
                <span className="text-white font-medium">
                  {userData.location[0]}
                </span>
              </div>
            )}

            {userData.website && userData.website.length > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400 text-sm">Website</span>
                <a
                  href={userData.website[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  {userData.website[0]}
                </a>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">Provider</span>
              <span className="text-white font-medium capitalize">
                {Object.keys(userData.provider)[0]}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 text-sm">Admin Status</span>
              <span
                className={`font-medium ${isAdmin ? "text-green-400" : "text-slate-400"}`}
              >
                {isAdmin ? "Administrator" : "Regular User"}
              </span>
            </div>

            {(userData.followers_count || userData.following_count) && (
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 text-sm">Social Stats</span>
                <div className="text-right">
                  {userData.followers_count &&
                    userData.followers_count.length > 0 && (
                      <div className="text-white font-medium">
                        {userData.followers_count[0].toString()} followers
                      </div>
                    )}
                  {userData.following_count &&
                    userData.following_count.length > 0 && (
                      <div className="text-slate-400 text-sm">
                        {userData.following_count[0].toString()} following
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Points Stats */}
          {userPoints && (
            <div className="mt-6 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-white flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Your Points
                </h4>
                <button
                  onClick={() => getPoints(true)}
                  className="btn-secondary text-sm px-3 py-1"
                  title="Refresh points from Twitter/X"
                >
                  <svg
                    className="w-4 h-4 mr-1 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {formatNumber(userPoints.totalPoints)}
                  </div>
                  <p className="text-slate-400 text-sm">Total Points</p>
                </div>

                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {formatNumber(userPoints.challengePoints)}
                  </div>
                  <p className="text-slate-400 text-sm">Challenge Points</p>
                </div>

                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-1">
                    {formatNumber(userPoints.followerPoints)}
                  </div>
                  <p className="text-slate-400 text-sm">Follower Points</p>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <button onClick={logout} className="btn-secondary w-full">
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="card text-center">
          <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h4 className="text-white font-medium mb-1">No Profile Data</h4>
          <p className="text-slate-400 text-sm">
            Unable to load your profile information
          </p>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
