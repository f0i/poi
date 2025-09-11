import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { PointsProvider } from "./PointsContext";
import Dashboard from "./components/Dashboard";
import UserProfile from "./components/UserProfile";
import Leaderboard from "./components/Leaderboard";
import FeedbackModal from "./components/FeedbackModal";

function AuthApp() {
  const { isAuthenticated, login, loading, userData } = useAuth();
  const [activeView, setActiveView] = React.useState("dashboard");
  const [showFeedback, setShowFeedback] = React.useState(false);

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
            <Leaderboard onNavigate={() => {}} />
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
              <h2 className="text-2xl font-bold text-white mb-2">Join POI</h2>
              <p className="text-slate-400 mb-4">
                Sign in to earn points, complete challenges, and climb the
                leaderboard!
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
        <div className="min-h-screen bg-slate-900">
           {/* Header */}
           <header className="bg-slate-800 border-b border-slate-700 p-8">
             <div className="max-w-6xl mx-auto flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <h1 className="text-white text-2xl font-bold">
                   {activeView === "dashboard" && "POI"}
                   {activeView === "profile" && "Profile"}
                 </h1>
                  {activeView === "dashboard" && (
                    <span className="text-slate-400 text-sm">
                      Social Media Influence Platform
                    </span>
                  )}
               </div>

               {/* Centered Feedback Button */}
               <div className="flex-1 flex justify-center">
                 <button
                   onClick={() => setShowFeedback(true)}
                   className="btn-secondary flex items-center gap-2 px-4 py-2"
                   title="Give Feedback"
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
                       d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                     />
                   </svg>
                   <span className="hidden sm:inline text-sm font-medium">Feedback</span>
                 </button>
               </div>

               <div className="flex items-center gap-4">
                 <button
                   onClick={() =>
                     setActiveView(
                       activeView === "dashboard" ? "profile" : "dashboard",
                     )
                   }
                   className="flex items-center gap-3 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors cursor-pointer"
                   title={
                     activeView === "dashboard"
                       ? "Go to Profile"
                       : "Go to Dashboard"
                   }
                 >
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
                  </button>
                </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="max-w-6xl mx-auto p-8">
            {activeView === "dashboard" && (
              <Dashboard onNavigate={setActiveView} />
            )}
              {activeView === "profile" && <UserProfile onBack={() => setActiveView("dashboard")} />}
           </main>

           {/* Feedback Modal */}
           <FeedbackModal
             isOpen={showFeedback}
             onClose={() => setShowFeedback(false)}
           />
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
