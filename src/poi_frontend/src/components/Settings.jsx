import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { ChallengeService } from "../services/challengeService";

function Settings() {
  const { isAuthenticated, identity } = useAuth();
  const [tokenSet, setTokenSet] = useState(false);
  const [tokenMasked, setTokenMasked] = useState(null);
  const [cookiesSet, setCookiesSet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [newToken, setNewToken] = useState("");
  const [newCookies, setNewCookies] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settingAdmin, setSettingAdmin] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState(null);
  const [systemData, setSystemData] = useState(null);
  const [loadingSystemData, setLoadingSystemData] = useState(false);
  const [userPrincipal, setUserPrincipal] = useState("");
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  const challengeService = new ChallengeService(identity);

  useEffect(() => {
    if (isAuthenticated) {
      loadTokenStatus();
      loadAdminStatus();
    }
  }, [isAuthenticated]);

  const loadTokenStatus = async () => {
    setLoading(true);
    try {
      const [isSet, masked] = await Promise.all([
        challengeService.isApifyBearerTokenSet(),
        challengeService.getApifyBearerTokenMasked(),
      ]);
      setTokenSet(isSet);
      setTokenMasked(masked);
      // For cookies, we don't have a getter, so just check if token is set (assuming both are set together)
      setCookiesSet(isSet);
    } catch (error) {
      console.error("Failed to load token status:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminStatus = async () => {
    try {
      const admin = await challengeService.getAdmin();
      setCurrentAdmin(admin);
      // Check if current user is admin
      if (admin && identity) {
        setIsAdmin(admin.toString() === identity.getPrincipal().toString());
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Failed to load admin status:", error);
      setIsAdmin(false);
    }
  };

  const handleSetAdmin = async () => {
    if (
      window.confirm(
        "Are you sure you want to set yourself as the admin? This can only be done once.",
      )
    ) {
      setSettingAdmin(true);
      try {
        // Note: The backend will handle the admin setting logic
        // We don't need to pass any parameters as it uses the caller's identity
        await challengeService.setAdmin();
        await loadAdminStatus(); // Refresh admin status
      } catch (error) {
        console.error("Failed to set admin:", error);
        alert(
          "Failed to set admin. You might not be authorized or admin is already set.",
        );
      } finally {
        setSettingAdmin(false);
      }
    }
  };

  const handleRecalculatePoints = async () => {
    if (
      window.confirm(
        "Are you sure you want to recalculate points for all users? This may take some time.",
      )
    ) {
      setRecalculating(true);
      setRecalcResult(null);
      try {
        const result = await challengeService.recalculateAllUserPoints();
        setRecalcResult(result);
        alert(
          `Successfully recalculated points for ${typeof result.usersProcessed === "bigint" ? Number(result.usersProcessed) : parseInt(result.usersProcessed)} users. Total points updated: ${typeof result.totalPointsUpdated === "bigint" ? Number(result.totalPointsUpdated) : parseInt(result.totalPointsUpdated)}`,
        );
      } catch (error) {
        console.error("Failed to recalculate points:", error);
        alert("Failed to recalculate points. Check console for details.");
      } finally {
        setRecalculating(false);
      }
    }
  };

  const handleLoadSystemData = async () => {
    setLoadingSystemData(true);
    try {
      const data = await challengeService.getSystemData();
      setSystemData(data);
      console.log("System data loaded:", data);
    } catch (error) {
      console.error("Failed to load system data:", error);
      alert("Failed to load system data. Check console for details.");
    } finally {
      setLoadingSystemData(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userPrincipal.trim()) {
      alert("Please enter a user principal");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete user with principal ${userPrincipal}? This will permanently remove ALL data for this user including points, challenges, and verification history. This action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingUser(true);
    setDeleteResult(null);
    try {
      const result = await challengeService.deleteUser(userPrincipal.trim());
      setDeleteResult(result);
      if (result.success) {
        alert(`User deleted successfully: ${result.message}`);
        setUserPrincipal("");
      } else {
        alert(`Failed to delete user: ${result.message}`);
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user. Check console for details.");
    } finally {
      setDeletingUser(false);
    }
  };

  const handleSetToken = async (e) => {
    e.preventDefault();
    if (!newToken.trim() || !newCookies.trim()) return;

    setSaving(true);
    try {
      // Note: In a real app, you'd want to add authentication/authorization here
      // For now, this is a simple implementation
      await Promise.all([
        challengeService.setApifyBearerToken(newToken.trim()),
        challengeService.setApifyCookies(newCookies.trim()),
      ]);
      setNewToken("");
      setNewCookies("");
      setShowTokenForm(false);
      await loadTokenStatus(); // Refresh status
    } catch (error) {
      console.error("Failed to set token and cookies:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Completely hide settings page for non-admins when admin is already set
  if (currentAdmin && !isAdmin) {
    return null;
  }

  return (
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Settings
        </h3>
      </div>

      <div className="space-y-6">
        {/* Admin Management */}
        <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-red-500"
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
              Admin Management
            </h4>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${currentAdmin ? "bg-green-500" : "bg-red-500"}`}
                ></div>
                <span className="text-slate-300">
                  Admin: {currentAdmin ? "Set" : "Not Set"}
                </span>
              </div>
              {isAdmin && (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                  YOU ARE ADMIN
                </span>
              )}
            </div>

            {currentAdmin && (
              <div className="text-slate-400 text-sm">
                Current Admin:{" "}
                <code className="bg-slate-600 px-2 py-1 rounded text-blue-400 font-mono break-all">
                  {currentAdmin.toString()}
                </code>
              </div>
            )}

            {!currentAdmin && (
              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-yellow-500 mt-0.5"
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
                  <div>
                    <h5 className="text-yellow-400 font-medium">
                      Admin Not Set
                    </h5>
                    <p className="text-yellow-300 text-sm mt-1">
                      No admin has been set yet. The first person to set
                      themselves as admin will have full control over the
                      system.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!currentAdmin && (
              <div className="flex space-x-3">
                <button
                  onClick={handleSetAdmin}
                  disabled={settingAdmin}
                  className="btn-primary text-sm"
                >
                  {settingAdmin ? (
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
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Set Myself as Admin
                    </>
                  )}
                </button>
              </div>
            )}

            {isAdmin && (
              <div className="border-t border-slate-600 pt-4 mt-4">
                <h5 className="text-white font-medium mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Point System Management
                </h5>
                <div className="space-y-3">
                  <p className="text-slate-400 text-sm">
                    Recalculate points for all users based on their actual
                    challenge completion status. This ensures data integrity and
                    fixes any inconsistencies.
                  </p>
                  <button
                    onClick={handleRecalculatePoints}
                    disabled={recalculating}
                    className="btn-primary text-sm"
                  >
                    {recalculating ? (
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
                        Recalculate All Points
                      </>
                    )}
                  </button>
                  {recalcResult && (
                    <div className="bg-green-900/20 border border-green-600 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4 text-green-500"
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
                        <div className="text-green-400 text-sm">
                          <strong> Recalculation Complete:</strong>{" "}
                          {typeof recalcResult.usersProcessed === "bigint"
                            ? Number(recalcResult.usersProcessed)
                            : parseInt(recalcResult.usersProcessed)}{" "}
                          users processed,{" "}
                          {typeof recalcResult.totalPointsUpdated === "bigint"
                            ? Number(recalcResult.totalPointsUpdated)
                            : parseInt(recalcResult.totalPointsUpdated)}{" "}
                          total points
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-600 pt-4 mt-4">
                    <h6 className="text-white font-medium mb-3 flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      System Diagnostics
                    </h6>
                    <div className="space-y-3">
                      <p className="text-slate-400 text-sm">
                        Load comprehensive system data including all challenges,
                        users, and completion status for debugging.
                      </p>
                      <button
                        onClick={handleLoadSystemData}
                        disabled={loadingSystemData}
                        className="btn-primary text-sm"
                      >
                        {loadingSystemData ? (
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
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Load System Data
                          </>
                        )}
                      </button>

                      {systemData && (
                        <div className="bg-slate-600 rounded-lg p-4 border border-slate-500 max-h-96 overflow-y-auto">
                          <h6 className="text-white font-medium mb-3">
                            System Data Overview
                          </h6>

                          <div className="space-y-4">
                            <div>
                              <h6 className="text-blue-400 font-medium mb-2">
                                Challenges ({systemData.challenges.length})
                              </h6>
                              <div className="space-y-1">
                                {systemData.challenges.map(
                                  (challenge, index) => (
                                    <div
                                      key={index}
                                      className="text-slate-300 text-sm bg-slate-700 rounded p-2"
                                    >
                                      <strong>
                                        ID{" "}
                                        {typeof challenge.id === "bigint"
                                          ? Number(challenge.id)
                                          : parseInt(challenge.id)}
                                        :
                                      </strong>{" "}
                                      {challenge.description} (
                                      {typeof challenge.points === "bigint"
                                        ? Number(challenge.points)
                                        : parseInt(challenge.points)}{" "}
                                      pts)
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>

                            <div>
                              <h6 className="text-green-400 font-medium mb-2">
                                Users ({systemData.users.length})
                              </h6>
                              <div className="space-y-2">
                                {systemData.users.map((user, index) => (
                                  <div
                                    key={index}
                                    className="text-slate-300 text-sm bg-slate-700 rounded p-3"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <strong>
                                          {user.name || "Anonymous"}
                                        </strong>
                                        {user.username && (
                                          <span className="text-slate-400">
                                            {" "}
                                            (@{user.username})
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <div className="text-green-400 font-medium">
                                          {typeof user.totalPoints === "bigint"
                                            ? Number(user.totalPoints)
                                            : parseInt(user.totalPoints)}{" "}
                                          pts
                                        </div>
                                        <div className="text-xs text-slate-400">
                                          {typeof user.challengePoints ===
                                          "bigint"
                                            ? Number(user.challengePoints)
                                            : parseInt(
                                                user.challengePoints,
                                              )}{" "}
                                          +{" "}
                                          {typeof user.followerPoints ===
                                          "bigint"
                                            ? Number(user.followerPoints)
                                            : parseInt(user.followerPoints)}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-xs text-slate-400 mb-2">
                                      Principal:{" "}
                                      <span className="font-mono break-all">
                                        {user.principal.toString()}
                                      </span>
                                      <br />
                                      Provider: {
                                        Object.keys(user.provider)[0]
                                      }{" "}
                                      | Cache:{" "}
                                      {user.cacheValid ? "Valid" : "Invalid"}
                                      {user.followersCount && (
                                        <span>
                                          {" "}
                                          | Followers:{" "}
                                          {typeof user.followersCount ===
                                          "bigint"
                                            ? Number(user.followersCount)
                                            : parseInt(user.followersCount)}
                                        </span>
                                      )}
                                    </div>

                                    {user.completedChallenges.length > 0 && (
                                      <div className="mt-2">
                                        <div className="text-xs text-slate-400 mb-1">
                                          Completed Challenges:
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {user.completedChallenges.map(
                                            (challenge, idx) => (
                                              <span
                                                key={idx}
                                                className={`text-xs px-2 py-1 rounded ${
                                                  challenge.status.verified
                                                    ? "bg-green-600 text-white"
                                                    : challenge.status.pending
                                                      ? "bg-yellow-600 text-white"
                                                      : "bg-red-600 text-white"
                                                }`}
                                              >
                                                #
                                                {typeof challenge.challengeId ===
                                                "bigint"
                                                  ? Number(
                                                      challenge.challengeId,
                                                    )
                                                  : parseInt(
                                                      challenge.challengeId,
                                                    )}{" "}
                                                (
                                                {typeof challenge.points ===
                                                "bigint"
                                                  ? Number(challenge.points)
                                                  : parseInt(challenge.points)}
                                                pts)
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* User Management Section */}
                      <div className="border-t border-slate-600 pt-4 mt-4">
                        <h6 className="text-white font-medium mb-3 flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-red-500"
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
                          User Management
                        </h6>
                        <div className="space-y-4">
                          <div>
                            <label className="label text-sm">
                              User Principal
                            </label>
                             <input
                               type="text"
                               value={userPrincipal}
                               onChange={(e) => setUserPrincipal(e.target.value)}
                               className="input-field w-full"
                               placeholder="Enter full user principal (63 characters, base32)"
                             />
                             <p className="text-slate-400 text-xs mt-1">
                               Enter the full 63-character principal string of the user you want to delete
                             </p>
                          </div>

                          <div className="flex justify-center">
                            <button
                              onClick={handleDeleteUser}
                              disabled={deletingUser || !userPrincipal.trim()}
                              className="btn-danger text-sm"
                            >
                              {deletingUser ? (
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
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  Delete User
                                </>
                              )}
                            </button>
                          </div>

                          {deleteResult && (
                            <div
                              className={`rounded-lg p-3 ${
                                deleteResult.success
                                  ? "bg-green-900/20 border border-green-600"
                                  : "bg-red-900/20 border border-red-600"
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <svg
                                  className={`w-4 h-4 ${
                                    deleteResult.success
                                      ? "text-green-500"
                                      : "text-red-500"
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  {deleteResult.success ? (
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  ) : (
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  )}
                                </svg>
                                <div
                                  className={`text-sm ${
                                    deleteResult.success
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  <strong>Delete User:</strong>{" "}
                                  {deleteResult.message}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <svg
                                className="w-5 h-5 text-yellow-500 mt-0.5"
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
                              <div>
                                <h5 className="text-yellow-400 font-medium">
                                  Warning: Destructive Action
                                </h5>
                                <p className="text-yellow-300 text-sm mt-1">
                                  <strong>Delete User:</strong> Permanently
                                  removes ALL data for the specified user
                                  including points, challenges, and verification
                                  history. This action cannot be undone.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Apify API Configuration - Admin Only */}
        {isAdmin && (
          <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Apify API Configuration
              </h4>
              <button
                onClick={() => setShowTokenForm(!showTokenForm)}
                className={showTokenForm ? "btn-secondary" : "btn-primary"}
              >
                {showTokenForm ? "Cancel" : "Configure API"}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-slate-400">
                  Loading token status...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${tokenSet ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <span className="text-slate-300">
                      Bearer Token: {tokenSet ? "Set" : "Not Set"}
                    </span>
                  </div>
                  {tokenMasked && (
                    <div className="text-slate-400 text-sm">
                      Token ends with:{" "}
                      <code className="bg-slate-600 px-2 py-1 rounded text-blue-400 font-mono">
                        {tokenMasked}
                      </code>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${cookiesSet ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <span className="text-slate-300">
                      Cookies: {cookiesSet ? "Set" : "Not Set"}
                    </span>
                  </div>
                </div>

                {(!tokenSet || !cookiesSet) && (
                  <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 text-yellow-500 mt-0.5"
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
                      <div>
                        <h5 className="text-yellow-400 font-medium">
                          Apify API Configuration Required
                        </h5>
                        <p className="text-yellow-300 text-sm mt-1">
                          Set a valid Apify Bearer Token and cookies string to
                          enable challenge verification. Get your token from the{" "}
                          <a
                            href="https://console.apify.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-yellow-200"
                          >
                            Apify Console
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {showTokenForm && (
                  <form
                    onSubmit={handleSetToken}
                    className="bg-slate-600 rounded-lg p-4 border border-slate-500"
                  >
                    <h5 className="text-white font-medium mb-3">
                      Set Apify API Configuration
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <label className="label text-sm">Bearer Token</label>
                        <input
                          type="password"
                          value={newToken}
                          onChange={(e) => setNewToken(e.target.value)}
                          className="input-field w-full"
                          placeholder="Enter your Apify Bearer Token"
                          required
                        />
                        <p className="text-slate-400 text-xs mt-1">
                          Your token will be stored securely and only the last 5
                          characters will be displayed for verification.
                        </p>
                      </div>
                      <div>
                        <label className="label text-sm">Cookies String</label>
                        <textarea
                          value={newCookies}
                          onChange={(e) => setNewCookies(e.target.value)}
                          className="input-field w-full"
                          placeholder='Enter your cookies string (e.g., [{"name":"ct0","value":"your-csrf-token-here"}])'
                          rows={3}
                          required
                        />
                        <p className="text-slate-400 text-xs mt-1">
                          Your cookies will be stored securely for Twitter API
                          access.
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="btn-primary text-sm"
                        >
                          {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            "Save Configuration"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowTokenForm(false)}
                          className="btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
