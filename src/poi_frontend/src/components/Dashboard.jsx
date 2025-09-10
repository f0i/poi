import { useAuth } from "../AuthContext";
import { usePoints } from "../PointsContext";

function Dashboard() {
  const { userData } = useAuth();
  const { points: userPoints, getPoints } = usePoints();

  const formatNumber = (num) => {
    const numValue = typeof num === "bigint" ? Number(num) : parseInt(num);
    return new Intl.NumberFormat().format(numValue);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <div className="flex items-center gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {userData?.avatar_url?.[0] ? (
              <img
                src={userData.avatar_url[0]}
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-slate-600"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
            ) : null}
            <div
              className={`w-16 h-16 rounded-full border-2 border-slate-600 flex items-center justify-center bg-slate-700 ${
                userData?.avatar_url?.[0] ? "hidden" : "block"
              }`}
            >
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome back,{" "}
              {userData?.name?.[0] || userData?.username?.[0] || "User"}! 👋
            </h2>
            <p className="text-slate-400 mb-4">
              Here's your current progress and available challenges.
            </p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {userPoints ? formatNumber(userPoints.totalPoints) : "0"}
                </div>
                <p className="text-slate-400 text-sm">Total Points</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-green-400">
                  {userPoints ? formatNumber(userPoints.challengePoints) : "0"}
                </div>
                <p className="text-slate-400 text-sm">Challenge Points</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-purple-400">
                  {userPoints ? formatNumber(userPoints.followerPoints) : "0"}
                </div>
                <p className="text-slate-400 text-sm">Follower Points</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Challenges */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-green-500"
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
            Recent Challenges
          </h3>
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 text-slate-600 mx-auto mb-4"
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
            <p className="text-slate-400">
              Complete challenges to earn points!
            </p>
            <p className="text-slate-500 text-sm">
              Check the Challenges tab to get started.
            </p>
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            Your Rank
          </h3>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">#</span>
            </div>
            <p className="text-slate-400">View the full leaderboard</p>
            <p className="text-slate-500 text-sm">
              See how you rank against other users.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => getPoints(true)}
            className="flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Refresh Points</p>
              <p className="text-slate-400 text-sm">
                Update your latest points from X
              </p>
            </div>
          </button>

          <button
            onClick={() => (window.location.hash = "#challenges")}
            className="flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
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
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">
          Recent Activity
        </h3>
        <div className="text-center py-8">
          <svg
            className="w-12 h-12 text-slate-600 mx-auto mb-4"
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
          <p className="text-slate-400">Activity tracking coming soon...</p>
          <p className="text-slate-500 text-sm">
            We'll show your recent challenge completions and point earnings
            here.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
