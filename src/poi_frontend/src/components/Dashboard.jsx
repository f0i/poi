import { useAuth } from '../AuthContext';
import { usePoints } from '../PointsContext';

function Dashboard() {
  const { userData } = useAuth();
  const { points: userPoints, getPoints } = usePoints();

  const formatNumber = (num) => {
    const numValue = typeof num === 'bigint' ? Number(num) : parseInt(num);
    return new Intl.NumberFormat().format(numValue);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome back, {userData?.name?.[0] || userData?.username?.[0] || 'User'}! 👋
            </h2>
            <p className="text-slate-400">
              Here's your current progress and available challenges.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {userPoints ? formatNumber(userPoints.totalPoints) : '0'}
            </div>
            <p className="text-slate-400 text-sm">Total Points</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Points */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Points</p>
              <p className="text-2xl font-bold text-white">
                {userPoints ? formatNumber(userPoints.totalPoints) : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Challenge Points */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Challenge Points</p>
              <p className="text-2xl font-bold text-white">
                {userPoints ? formatNumber(userPoints.challengePoints) : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Follower Points */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Follower Points</p>
              <p className="text-2xl font-bold text-white">
                {userPoints ? formatNumber(userPoints.followerPoints) : '0'}
              </p>
            </div>
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
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Refresh Points</p>
              <p className="text-slate-400 text-sm">Update your latest points from X</p>
            </div>
          </button>

          <button
            onClick={() => window.location.hash = '#challenges'}
            className="flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
          >
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">View Challenges</p>
              <p className="text-slate-400 text-sm">Complete challenges to earn points</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-slate-400">Activity tracking coming soon...</p>
          <p className="text-slate-500 text-sm">We'll show your recent challenge completions and point earnings here.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;