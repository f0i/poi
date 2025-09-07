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
  const [bearerToken, setBearerToken] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(""); // "saving", "saved", "error"

  function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    poi_backend.greet(name).then((greeting) => {
      setGreeting(greeting);
    });
    return false;
  }

  async function handleSetBearerToken(event) {
    event.preventDefault();
    if (!bearerToken.trim()) return;

    setTokenStatus("saving");
    try {
      await poi_backend.setTwitterBearerToken(bearerToken);
      setTokenStatus("saved");
      setBearerToken("");
      setTimeout(() => setTokenStatus(""), 3000);
    } catch (error) {
      console.error("Failed to set Bearer token:", error);
      setTokenStatus("error");
      setTimeout(() => setTokenStatus(""), 3000);
    }
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

              <div className="bg-slate-700 rounded-lg p-4 font-mono text-sm mb-4">
                <p className="text-slate-300">
                  <span className="text-slate-500">Principal ID:</span>{" "}
                  <span className="text-blue-400 break-all">
                    {identity?.getPrincipal().toString()}
                  </span>
                </p>
              </div>

              <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                <div className="flex items-center text-green-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="font-medium">Extended Session Active</p>
                    <p className="text-sm text-green-300">30-day session with no idle timeout</p>
                  </div>
                </div>
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

            {/* Settings Section */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </h3>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="btn-secondary"
                >
                  {showSettings ? "Hide Settings" : "Show Settings"}
                </button>
              </div>

              {showSettings && (
                <div className="space-y-6">
                  <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                    <h4 className="text-lg font-semibold text-white mb-3">Twitter API Configuration</h4>
                    <p className="text-slate-400 text-sm mb-4">
                      Set your Twitter Bearer Token for challenge verification. This token is stored securely in the backend and cannot be retrieved.
                    </p>

                    <form onSubmit={handleSetBearerToken} className="space-y-4">
                      <div>
                        <label className="label">
                          Twitter Bearer Token
                        </label>
                        <input
                          type="password"
                          value={bearerToken}
                          onChange={(e) => setBearerToken(e.target.value)}
                          className="input-field w-full"
                          placeholder="Enter your Twitter Bearer Token"
                          required
                        />
                        <p className="text-slate-400 text-sm mt-1">
                          Get your token from <a href="https://developer.twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Twitter Developer Portal</a>
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={tokenStatus === "saving"}
                        >
                          {tokenStatus === "saving" ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            "Save Token"
                          )}
                        </button>

                        {tokenStatus === "saved" && (
                          <div className="flex items-center text-green-400">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Token saved successfully!
                          </div>
                        )}

                        {tokenStatus === "error" && (
                          <div className="flex items-center text-red-400">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Failed to save token
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>

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
