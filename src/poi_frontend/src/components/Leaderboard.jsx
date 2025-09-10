import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { usePoints } from "../PointsContext";
import { ChallengeService } from "../services/challengeService";

function Leaderboard() {
  const { isAuthenticated, identity } = useAuth();
  const { points: userPoints, getPoints } = usePoints();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRank, setUserRank] = useState(null);

  const challengeService = new ChallengeService(isAuthenticated ? identity : undefined);

  useEffect(() => {
    console.log("🔍 DEBUG Leaderboard: useEffect triggered", {
      isAuthenticated,
      hasUserPoints: !!userPoints,
    });

    // Always load leaderboard data for visibility
    loadLeaderboard();

    if (isAuthenticated) {
      // Load points if we don't have them yet
      if (!userPoints) {
        console.log(
          "🔍 DEBUG Leaderboard: No user points, calling getPoints()",
        );
        getPoints();
      } else {
        console.log(
          "🔍 DEBUG Leaderboard: User points already available",
          userPoints,
        );
      }
    }
  }, [isAuthenticated, userPoints]);

  const loadLeaderboard = async () => {
    console.log("🔍 DEBUG Leaderboard: loadLeaderboard called");
    setLoading(true);
    try {
      console.log("🔍 DEBUG Leaderboard: Calling getLeaderboard()...");
      const result = await challengeService.getLeaderboard();
      console.log(
        "🔍 DEBUG Leaderboard: getLeaderboard() returned",
        result.length,
        "users",
      );

      // Find current user's data in leaderboard
      const userPrincipal = identity?.getPrincipal().toString();
      console.log(
        "🔍 DEBUG Leaderboard: Current user principal:",
        userPrincipal,
      );

      const userInLeaderboard = result.find(
        (user) => user.principal.toString() === userPrincipal,
      );
      console.log(
        "🔍 DEBUG Leaderboard: User in leaderboard:",
        userInLeaderboard,
      );

      const rank = result.findIndex(
        (user) => user.principal.toString() === userPrincipal,
      );
      setUserRank(rank >= 0 ? rank + 1 : null);
      console.log(
        "🔍 DEBUG Leaderboard: User rank:",
        rank >= 0 ? rank + 1 : null,
      );

      setLeaderboard(result);
    } catch (error) {
      console.error("🔍 DEBUG Leaderboard: Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    const numValue = typeof num === "bigint" ? Number(num) : parseInt(num);
    return new Intl.NumberFormat().format(numValue);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50";
      case 3:
        return "bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/50";
      default:
        return "bg-slate-700/50 border-slate-600";
    }
  };

  // Generate placeholder entries to fill up to 10 users
  const generatePlaceholders = (currentCount) => {
    const placeholders = [];
    const needed = Math.max(0, 10 - currentCount);

    for (let i = 0; i < needed; i++) {
      placeholders.push({
        principal: `placeholder-${i}`,
        name: null,
        username: null,
        avatar_url: null,
        totalPoints: 0n,
        challengePoints: 0n,
        followerPoints: 0n,
        isPlaceholder: true
      });
    }

    return placeholders;
  };

  // Leaderboard is now available without authentication

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="card text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Proof of Influence Leaderboard
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Compete with the community by completing challenges and growing your
          social media influence. Earn points from challenges and bonus points
          from your follower count!
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Full Leaderboard */}
        <div className="xl:col-span-2 order-2 xl:order-1">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-yellow-500"
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
                Full Leaderboard
              </h3>
              <button
                onClick={loadLeaderboard}
                disabled={loading}
                className="btn-secondary text-sm"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2 inline"
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
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-slate-400">Loading leaderboard...</span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-white mb-2">
                  No Rankings Yet
                </h4>
                <p className="text-slate-400">
                  Complete challenges to start climbing the leaderboard!
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="space-y-3 max-h-[800px] overflow-y-auto scrollbar-hide">
                  {[...leaderboard, ...generatePlaceholders(leaderboard.length)].map((user, index) => {
                    const rank = index + 1;
                    const isCurrentUser =
                      user.principal.toString() ===
                      identity?.getPrincipal().toString();

                      return (
                        <div
                          key={user.principal.toString()}
                          className={`rounded-lg p-4 border transition-all duration-200 relative ${
                            user.isPlaceholder
                              ? "bg-slate-800/30 border-slate-700/50 border-dashed opacity-60"
                              : isCurrentUser
                                ? "bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500/20 hover:scale-[1.02]"
                                : `${getRankStyle(rank)} ${index >= 3 && isAuthenticated ? 'blur-sm opacity-60' : 'shadow-lg ring-1 ring-white/10 hover:scale-[1.02]'}`
                          }`}
                          style={{
                            filter: user.isPlaceholder ? 'none' : (index >= 3 && isAuthenticated ? `blur(${Math.min((index - 2) * 0.5, 2)}px)` : 'none')
                          }}
                        >
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                              {/* Rank */}
                              <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
                                <div
                                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                                    user.isPlaceholder
                                      ? "bg-slate-700 text-slate-500"
                                      : rank <= 3
                                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                                        : "bg-slate-600 text-slate-300"
                                  }`}
                                >
                                  {user.isPlaceholder ? "—" : (rank <= 3 ? getRankIcon(rank) : rank)}
                                </div>
                                {isCurrentUser && !user.isPlaceholder && (
                                  <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full hidden sm:inline">
                                    YOU
                                  </span>
                                )}
                              </div>

                              {/* User Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                   {/* Profile Picture */}
                                   <div className="relative flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                                     {user.avatar_url && !user.isPlaceholder ? (
                                       <img
                                         src={user.avatar_url}
                                         alt={`${user.name || "User"} avatar`}
                                         className="w-full h-full rounded-full object-cover border-2 border-slate-600"
                                         onError={(e) => {
                                           e.target.style.display = "none";
                                           e.target.nextSibling.style.display = "flex";
                                         }}
                                       />
                                     ) : null}
                                     <div
                                       className={`w-full h-full bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600 ${user.avatar_url && !user.isPlaceholder ? "hidden" : ""}`}
                                     >
                                       <svg
                                         className="w-4 h-4 sm:w-6 sm:h-6 text-slate-500"
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
                                  <div className="min-w-0 flex-1">
                                    <p className="text-slate-400 font-medium text-sm sm:text-base truncate">
                                      {user.isPlaceholder ? "Join the competition!" : (user.name ? user.name : "Anonymous User")}
                                    </p>
                                    {user.username && !user.isPlaceholder && (
                                      <p className="text-slate-500 text-xs sm:text-sm truncate">
                                        @{user.username}
                                      </p>
                                    )}
                                    {user.isPlaceholder && (
                                      <p className="text-slate-500 text-xs sm:text-sm truncate">
                                        Be the next champion
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                           </div>

                            {/* Points */}
                            <div className="flex items-center space-x-2 sm:space-x-6 text-right flex-shrink-0">
                              <div>
                                <p className={`font-bold text-base sm:text-lg ${user.isPlaceholder ? 'text-slate-500' : 'text-white'}`}>
                                  {user.isPlaceholder ? "—" : formatNumber(user.totalPoints)}
                                </p>
                                <p className="text-slate-400 text-xs sm:text-sm">Total Points</p>
                              </div>

                              <div className="hidden md:block">
                                <div className="flex space-x-2 sm:space-x-4 text-xs sm:text-sm">
                                  <div>
                                    <p className={`font-medium ${user.isPlaceholder ? 'text-slate-600' : 'text-purple-400'}`}>
                                      {user.isPlaceholder ? "—" : formatNumber(user.challengePoints)}
                                    </p>
                                    <p className="text-slate-500">Challenge</p>
                                  </div>
                                  <div>
                                    <p className={`font-medium ${user.isPlaceholder ? 'text-slate-600' : 'text-orange-400'}`}>
                                      {user.isPlaceholder ? "—" : formatNumber(user.followerPoints)}
                                    </p>
                                    <p className="text-slate-500">Followers</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                        </div>
                      </div>
                    );
                  })}
                </div>


              </div>
            )}
          </div>
        </div>

        {/* Right Column - Top 3 + User Profile */}
        <div className="space-y-6 order-1 xl:order-2">
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Top 3 Champions
              </h3>
               <div className="grid grid-cols-3 gap-2 sm:gap-4">
                 {/* 2nd Place */}
                 <div className="text-center order-1">
                   <div className="relative">
                     {leaderboard[1]?.avatar_url ? (
                       <img
                         src={leaderboard[1].avatar_url}
                         alt={`${leaderboard[1].name || "User"} avatar`}
                         className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-3 sm:border-4 border-gray-400 mx-auto mb-1 sm:mb-2"
                         onError={(e) => {
                           e.target.style.display = "none";
                           e.target.nextSibling.style.display = "flex";
                         }}
                       />
                     ) : null}
                     <div
                       className={`w-12 h-12 sm:w-16 sm:h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2 border-3 sm:border-4 border-gray-400 ${leaderboard[1]?.avatar_url ? "hidden" : ""}`}
                     >
                       <svg
                         className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400"
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
                     <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-400 rounded-full flex items-center justify-center mx-auto -mt-1 sm:-mt-2 mb-1 sm:mb-2">
                       <span className="text-white font-bold text-xs sm:text-sm">🥈</span>
                     </div>
                   </div>
                   <p className="text-white font-medium text-xs sm:text-sm truncate">
                     {leaderboard[1]?.name || "Anonymous"}
                   </p>
                   <p className="text-slate-400 text-xs">
                     {formatNumber(leaderboard[1]?.totalPoints || 0)}
                   </p>
                 </div>

                 {/* 1st Place */}
                 <div className="text-center order-2">
                   <div className="relative">
                     {leaderboard[0]?.avatar_url ? (
                       <img
                         src={leaderboard[0].avatar_url}
                         alt={`${leaderboard[0].name || "User"} avatar`}
                         className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-3 sm:border-4 border-yellow-500 mx-auto mb-1 sm:mb-2"
                         onError={(e) => {
                           e.target.style.display = "none";
                           e.target.nextSibling.style.display = "flex";
                         }}
                       />
                     ) : null}
                     <div
                       className={`w-14 h-14 sm:w-20 sm:h-20 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2 border-3 sm:border-4 border-yellow-500 ${leaderboard[0]?.avatar_url ? "hidden" : ""}`}
                     >
                       <svg
                         className="w-7 h-7 sm:w-10 sm:h-10 text-slate-400"
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
                     <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-full flex items-center justify-center mx-auto -mt-2 sm:-mt-3 mb-1 sm:mb-2">
                       <span className="text-white font-bold text-sm sm:text-base">🥇</span>
                     </div>
                   </div>
                   <p className="text-white font-bold text-sm sm:text-base truncate">
                     {leaderboard[0]?.name || "Anonymous"}
                   </p>
                   <p className="text-yellow-400 text-xs sm:text-sm font-bold">
                     {formatNumber(leaderboard[0]?.totalPoints || 0)}
                   </p>
                 </div>

                 {/* 3rd Place */}
                 <div className="text-center order-3">
                   <div className="relative">
                     {leaderboard[2]?.avatar_url ? (
                       <img
                         src={leaderboard[2].avatar_url}
                         alt={`${leaderboard[2].name || "User"} avatar`}
                         className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-3 sm:border-4 border-orange-500 mx-auto mb-1 sm:mb-2"
                         onError={(e) => {
                           e.target.style.display = "none";
                           e.target.nextSibling.style.display = "flex";
                         }}
                       />
                     ) : null}
                     <div
                       className={`w-12 h-12 sm:w-16 sm:h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2 border-3 sm:border-4 border-orange-500 ${leaderboard[2]?.avatar_url ? "hidden" : ""}`}
                     >
                       <svg
                         className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400"
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
                     <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full flex items-center justify-center mx-auto -mt-1 sm:-mt-2 mb-1 sm:mb-2">
                       <span className="text-white font-bold text-xs sm:text-sm">🥉</span>
                     </div>
                   </div>
                   <p className="text-white font-medium text-xs sm:text-sm truncate">
                     {leaderboard[2]?.name || "Anonymous"}
                   </p>
                   <p className="text-slate-400 text-xs">
                     {formatNumber(leaderboard[2]?.totalPoints || 0)}
                   </p>
                 </div>
              </div>
            </div>
          )}

          {/* Current User Section or Sign Up Prompt */}
          {userPoints ? (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-blue-500"
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
                  Your Performance
                </h3>
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

              {/* Rank Display */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {userRank ? getRankIcon(userRank) : "—"}
                </div>
                <p className="text-slate-400 text-sm">
                  {userRank ? `Rank #${userRank}` : "Not ranked yet"}
                </p>
              </div>

              {/* Points Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Points</span>
                    <span className="text-green-400 font-bold text-lg">
                      {formatNumber(userPoints.totalPoints)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-purple-400 font-bold text-lg mb-1">
                        {formatNumber(userPoints.challengePoints)}
                      </div>
                      <p className="text-slate-400 text-sm">Challenge Points</p>
                    </div>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-orange-400 font-bold text-lg mb-1">
                        {formatNumber(userPoints.followerPoints)}
                      </div>
                      <p className="text-slate-400 text-sm">Follower Points</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => (window.location.hash = "#challenges")}
                  className="w-full flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                  </div>
                  <div>
                    <p className="text-white font-medium">View Challenges</p>
                    <p className="text-slate-400 text-sm">
                      Complete challenges to earn points
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => (window.location.hash = "#profile")}
                  className="w-full flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                  <div>
                    <p className="text-white font-medium">View Profile</p>
                    <p className="text-slate-400 text-sm">
                      Manage your account settings
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Sign Up to Compete Section for Unauthenticated Users */
            <div className="card">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Ready to Compete?
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Join the leaderboard and start earning points today!
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
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
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Complete Challenges</p>
                    <p className="text-slate-400 text-xs">Earn points by following influencers</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Climb the Leaderboard</p>
                    <p className="text-slate-400 text-xs">Get recognized for your influence</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Earn Rewards</p>
                    <p className="text-slate-400 text-xs">Points based on your follower count</p>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-4">
                  Sign in now to see your ranking and start earning points!
                </p>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4">
                  <p className="text-white font-medium text-sm">
                    🚀 Your journey to the top starts here!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
