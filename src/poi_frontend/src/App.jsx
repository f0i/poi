import { useState } from "react";
import { poi_backend } from "declarations/poi_backend";
import { AuthProvider, useAuth } from "./AuthContext";
import ChallengeList from "./components/ChallengeList";

function AuthApp() {
  const {
    isAuthenticated,
    identity,
    userData,
    userDataLoading,
    login,
    logout,
    loading,
  } = useAuth();
  const [greeting, setGreeting] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    poi_backend.greet(name).then((greeting) => {
      setGreeting(greeting);
    });
    return false;
  }

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
        {/* Header */}
        <header className="text-center mb-12">
          <img
            src="/logo2.svg"
            alt="DFINITY logo"
            className="mx-auto mb-6 w-24 h-24"
          />
          <h1 className="text-4xl font-bold text-white mb-2">
            POI Challenge Platform
          </h1>
          <p className="text-slate-400 text-lg">
            Points of Interest - Challenge Management System
          </p>
        </header>

        {!isAuthenticated ? (
          <div className="card text-center max-w-md mx-auto">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome</h2>
              <p className="text-slate-400">Please sign in to access the platform</p>
            </div>
            <button onClick={login} className="btn-primary w-full">
              Sign In with Internet Identity
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Welcome back!</h2>
                  <p className="text-slate-400">You are successfully signed in</p>
                </div>
                <button onClick={logout} className="btn-secondary">
                  Sign Out
                </button>
              </div>

              <div className="bg-slate-700 rounded-lg p-4 font-mono text-sm">
                <p className="text-slate-300">
                  <span className="text-slate-500">Principal ID:</span>{" "}
                  <span className="text-blue-400 break-all">
                    {identity?.getPrincipal().toString()}
                  </span>
                </p>
              </div>
            </div>

            {/* User Profile Section */}
            {userDataLoading ? (
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <p className="text-slate-400">Loading user profile...</p>
                </div>
              </div>
            ) : userData ? (
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  User Profile
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userData.name && userData.name.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-500 text-sm mb-1">Name</p>
                      <p className="text-white font-medium">{userData.name[0]}</p>
                    </div>
                  )}

                  {userData.username && userData.username.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-500 text-sm mb-1">Username</p>
                      <p className="text-white font-medium">@{userData.username[0]}</p>
                    </div>
                  )}

                  {userData.email && userData.email.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-500 text-sm mb-1">Email</p>
                      <p className="text-white font-medium">{userData.email[0]}</p>
                    </div>
                  )}

                  {userData.bio && userData.bio.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-500 text-sm mb-1">Bio</p>
                      <p className="text-white">{userData.bio[0]}</p>
                    </div>
                  )}

                  {userData.location && userData.location.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-500 text-sm mb-1">Location</p>
                      <p className="text-white font-medium">{userData.location[0]}</p>
                    </div>
                  )}

                  {userData.website && userData.website.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-500 text-sm mb-1">Website</p>
                      <a
                        href={userData.website[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {userData.website[0]}
                      </a>
                    </div>
                  )}

                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-500 text-sm mb-1">Provider</p>
                    <p className="text-white font-medium capitalize">
                      {Object.keys(userData.provider)[0]}
                    </p>
                  </div>

                  {(userData.followers_count || userData.following_count) && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-500 text-sm mb-1">Social Stats</p>
                      <div className="flex space-x-4">
                        {userData.followers_count && userData.followers_count.length > 0 && (
                          <span className="text-white">
                            <span className="font-medium">{userData.followers_count[0].toString()}</span>{" "}
                            <span className="text-slate-400">followers</span>
                          </span>
                        )}
                        {userData.following_count && userData.following_count.length > 0 && (
                          <span className="text-white">
                            <span className="font-medium">{userData.following_count[0].toString()}</span>{" "}
                            <span className="text-slate-400">following</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center">
                <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No User Data Found</h3>
                <p className="text-slate-400">Unable to load your profile information</p>
              </div>
            )}

            {/* Greeting Test Section */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0V1m10 3V1m0 3l1 1v16a2 2 0 01-2 2H6a2 2 0 01-2-2V5l1-1z" />
                </svg>
                Backend Test
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="label">
                    Enter your name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="input-field w-full"
                    placeholder="Your name"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Test Backend
                </button>
              </form>

              {greeting && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <p className="text-green-400 font-medium">{greeting}</p>
                </div>
              )}
            </div>

            {/* Challenges Section */}
            <ChallengeList />
          </div>
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
