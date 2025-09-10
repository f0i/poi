import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { PointsProvider } from "./PointsContext";
import Dashboard from "./components/Dashboard";
import Leaderboard from "./components/Leaderboard";
import ChallengeList from "./components/ChallengeList";
import UserProfile from "./components/UserProfile";
import Settings from "./components/Settings";

function AuthApp() {
  const { isAuthenticated, login, loading, logout, userData } = useAuth();
  const [activeView, setActiveView] = React.useState("leaderboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Show leaderboard in background when not authenticated */}
      {!isAuthenticated && (
        <div className="min-h-screen">
          <div className="max-w-6xl mx-auto p-8">
            <Leaderboard />
          </div>
        </div>
      )}

      {/* Sign-in overlay for unauthenticated users */}
      {!isAuthenticated && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card text-center max-w-md mx-auto relative">
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
              <h2 className="text-2xl font-bold text-white mb-2">
                Join POI
              </h2>
              <p className="text-slate-400 mb-4">
                Sign in to earn points, complete challenges, and climb the leaderboard!
              </p>
               <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                 <p className="text-sm text-slate-300">
                   🚀 Join the competition and start earning points today!
                 </p>
               </div>
            </div>
            <button
              onClick={login}
              className="btn-primary w-full flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Sign in with X<br />
              <span className="text-sm opacity-75">powered by Identify</span>
            </button>
            <p className="text-xs text-slate-500 mt-4">
              Your data is secure and only used for POI functionality
            </p>
          </div>
        </div>
      )}

      {/* Authenticated app */}
      {isAuthenticated && (
        <div className="flex min-h-screen">
          {/* Compact Sidebar */}
          <div className="fixed left-0 top-0 h-screen w-20 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-6 z-10">
            {/* Logo */}
            <div className="mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>

            {/* Navigation Icons */}
            <nav className="flex-1 flex flex-col items-center space-y-4">
              <button
                onClick={() => setActiveView("dashboard")}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  activeView === "dashboard"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
                title="Dashboard"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
                  />
                </svg>
              </button>

              <button
                onClick={() => setActiveView("challenges")}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  activeView === "challenges"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
                title="Challenges"
              >
                <svg
                  className="w-6 h-6"
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
              </button>

              <button
                onClick={() => setActiveView("leaderboard")}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  activeView === "leaderboard"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
                title="Leaderboard"
              >
                <svg
                  className="w-6 h-6"
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
              </button>

              <button
                onClick={() => setActiveView("profile")}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  activeView === "profile"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
                title="Profile"
              >
                <svg
                  className="w-6 h-6"
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
              </button>

              <button
                onClick={() => setActiveView("settings")}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  activeView === "settings"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
                title="Settings"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </nav>

            {/* User Avatar & Logout */}
            <div className="mt-auto flex flex-col items-center space-y-4">
              <div className="relative">
                {userData?.avatar_url?.[0] ? (
                  <img
                    src={userData.avatar_url[0]}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-slate-600"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-10 h-10 rounded-full border-2 border-slate-600 flex items-center justify-center ${
                    userData?.avatar_url?.[0] ? "hidden" : "flex"
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-slate-400"
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
              <button
                onClick={logout}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                title="Sign Out"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-screen ml-20">
            {/* Compact Header */}
            <header className="bg-slate-800 border-b border-slate-700 px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-white text-2xl font-bold">
                    {activeView === "dashboard" && "POI"}
                    {activeView === "challenges" && "Challenges"}
                    {activeView === "leaderboard" && "Leaderboard"}
                    {activeView === "profile" && "Profile"}
                    {activeView === "settings" && "Settings"}
                  </h1>
                  {activeView === "dashboard" && (
                    <span className="text-slate-400 text-sm">
                      Points Platform
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">
                      {userData?.name?.[0] || userData?.username?.[0] || "User"}
                    </p>
                    <p className="text-slate-400 text-xs">
                      @{userData?.username?.[0] || "user"}
                    </p>
                  </div>
                  {userData?.avatar_url?.[0] ? (
                    <img
                      src={userData.avatar_url[0]}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border border-slate-600"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-slate-400"
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
                  )}
                </div>
              </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-6xl mx-auto p-8">
                {activeView === "dashboard" && <Dashboard />}
                {activeView === "challenges" && <ChallengeList />}
                {activeView === "leaderboard" && <Leaderboard />}
                {activeView === "profile" && <UserProfile />}
                {activeView === "settings" && <Settings />}
              </div>
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
