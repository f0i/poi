import { useAuth } from "../AuthContext";
import { usePoints } from "../PointsContext";
import { useState, useEffect } from "react";
import ChallengeList from "./ChallengeList";
import Settings from "./Settings";

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
           {/* Profile Header with Avatar */}
           <div className="text-center mb-8">
             <div className="relative inline-block mb-4">
               {userData.avatar_url && userData.avatar_url.length > 0 ? (
                 <img
                   src={userData.avatar_url[0]}
                   alt="Profile"
                   className="w-24 h-24 rounded-full border-4 border-blue-500/50 object-cover mx-auto"
                   onError={(e) => {
                     e.target.style.display = "none";
                     e.target.nextSibling.style.display = "flex";
                   }}
                 />
               ) : null}
               <div
                 className={`w-24 h-24 bg-slate-600 rounded-full flex items-center justify-center mx-auto border-4 border-blue-500/50 ${userData.avatar_url && userData.avatar_url.length > 0 ? "hidden" : ""}`}
               >
                 <svg
                   className="w-12 h-12 text-slate-400"
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
               </div>
             </div>

             <div className="space-y-2">
               {userData.name && userData.name.length > 0 && (
                 <h1 className="text-2xl font-bold text-white">{userData.name[0]}</h1>
               )}
               {userData.username && userData.username.length > 0 && (
                 <p className="text-xl text-blue-400 font-medium">@{userData.username[0]}</p>
               )}
             </div>
           </div>

           {/* Social Stats - Prominent Display */}
           {(userData.followers_count || userData.following_count) && (
             <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30 mb-6">
               <div className="text-center mb-4">
                 <h4 className="text-white font-semibold text-lg">Social Influence</h4>
               </div>
               <div className="flex justify-center space-x-8">
                 {userData.followers_count && userData.followers_count.length > 0 && (
                   <div className="text-center">
                     <div className="text-3xl font-bold text-green-400 mb-1">
                       {formatNumber(userData.followers_count[0])}
                     </div>
                     <div className="text-slate-300 text-sm font-medium">Followers</div>
                   </div>
                 )}
                 {userData.following_count && userData.following_count.length > 0 && (
                   <div className="text-center">
                     <div className="text-3xl font-bold text-blue-400 mb-1">
                       {formatNumber(userData.following_count[0])}
                     </div>
                     <div className="text-slate-300 text-sm font-medium">Following</div>
                   </div>
                 )}
               </div>
             </div>
           )}

           {/* Additional Info - Less Prominent */}
           {(userData.email || userData.location) && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
               {userData.email && userData.email.length > 0 && (
                 <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                   <div className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Email</div>
                   <div className="text-white font-medium">{userData.email[0]}</div>
                 </div>
               )}

               {userData.location && userData.location.length > 0 && (
                 <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                   <div className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Location</div>
                   <div className="text-white font-medium">{userData.location[0]}</div>
                 </div>
               )}
             </div>
           )}

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

           {/* Challenges Section */}
           <div className="mt-6">
             <ChallengeList />
           </div>

           {/* Settings Section - Admin Only */}
           {isAdmin && (
             <div className="mt-6">
               <Settings />
             </div>
           )}

            {/* Principal ID - Moved to bottom */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <div className="text-center">
                <div className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">Principal ID</div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-slate-300 text-xs font-mono break-all">
                    {identity?.getPrincipal().toString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button - Less prominent */}
            <div className="mt-4 text-center">
              <button
                onClick={logout}
                className="text-slate-400 hover:text-slate-300 text-sm underline transition-colors"
              >
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
