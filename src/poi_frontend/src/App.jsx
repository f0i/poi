import React from 'react';
import { AuthProvider, useAuth } from "./AuthContext";
import { PointsProvider } from "./PointsContext";
import Dashboard from "./components/Dashboard";
import Leaderboard from "./components/Leaderboard";
import ChallengeList from "./components/ChallengeList";
import UserProfile from "./components/UserProfile";
import Settings from "./components/Settings";

function AuthApp() {
  const { isAuthenticated, login, loading, logout, userData } = useAuth();
  const [activeView, setActiveView] = React.useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {!isAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="card text-center max-w-md mx-auto">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to POI</h2>
              <p className="text-slate-400">
                Earn points by completing challenges and climb the leaderboard
              </p>
            </div>
            <button onClick={login} className="btn-primary w-full flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Sign in with X<br />
              <span className="text-sm opacity-75">powered by Identify</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">POI</h1>
                  <p className="text-slate-400 text-xs">Points Platform</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeView === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                Dashboard
              </button>

              <button
                onClick={() => setActiveView('challenges')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeView === 'challenges'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Challenges
              </button>

              <button
                onClick={() => setActiveView('leaderboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeView === 'leaderboard'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Leaderboard
              </button>

              <button
                onClick={() => setActiveView('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeView === 'profile'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>

              <button
                onClick={() => setActiveView('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeView === 'settings'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {userData?.name?.[0] || userData?.username?.[0] || 'User'}
                  </p>
                  <p className="text-slate-400 text-xs truncate">
                    @{userData?.username?.[0] || 'user'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-white text-xl font-semibold">
                  {activeView === 'dashboard' && 'Dashboard'}
                  {activeView === 'challenges' && 'Challenges'}
                  {activeView === 'leaderboard' && 'Leaderboard'}
                  {activeView === 'profile' && 'Profile'}
                  {activeView === 'settings' && 'Settings'}
                </h1>
                <div className="text-slate-400 text-sm">
                  Welcome back!
                </div>
              </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-6">
              {activeView === 'dashboard' && <Dashboard />}
              {activeView === 'challenges' && <ChallengeList />}
              {activeView === 'leaderboard' && <Leaderboard />}
              {activeView === 'profile' && <UserProfile />}
              {activeView === 'settings' && <Settings />}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <PointsProvider>
        <AuthApp />
      </PointsProvider>
    </AuthProvider>
  );
}

export default App;
