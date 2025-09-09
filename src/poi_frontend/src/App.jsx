import React from 'react';
import { AuthProvider, useAuth } from "./AuthContext";
import Layout from "./components/Layout";
import Leaderboard from "./components/Leaderboard";
import ChallengeList from "./components/ChallengeList";
import UserProfile from "./components/UserProfile";
import Settings from "./components/Settings";

function AuthApp() {
  const { isAuthenticated, login, loading } = useAuth();
  const [activeTab, setActiveTab] = React.useState('challenges');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {!isAuthenticated ? (
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
              <h2 className="text-2xl font-bold text-white mb-2">Welcome</h2>
              <p className="text-slate-400">
                Please sign in to access the platform
              </p>
            </div>
            <button onClick={login} className="btn-primary w-full">
              Sign In with Internet Identity
            </button>
          </div>
        ) : (
          <Layout
            sidebar={
              <>
                <UserProfile />
                <Settings />
              </>
            }
            main={
              <div>
                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('challenges')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'challenges'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Challenges
                  </button>
                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'leaderboard'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Leaderboard
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'challenges' && <ChallengeList />}
                {activeTab === 'leaderboard' && <Leaderboard />}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthApp />
    </AuthProvider>
  );
}

export default App;
