import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { ChallengeService } from "../services/challengeService";
import ReactMarkdown from "react-markdown";

function ChallengeList() {
  const { isAuthenticated, identity } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    description: "",
    userToFollow: "",
    points: "",
    markdownMessage: "",
  });
  const [verifyingChallenge, setVerifyingChallenge] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});
  const [challengeStatuses, setChallengeStatuses] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [rateLimitedChallenges, setRateLimitedChallenges] = useState({});
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [updatingChallenge, setUpdatingChallenge] = useState(null);
  const [editForm, setEditForm] = useState({
    description: "",
    userToFollow: "",
    points: "",
    markdownMessage: "",
  });

  const challengeService = new ChallengeService(identity);

  // Helper function to detect rate limiting errors
  const isRateLimitError = (errorMessage) => {
    return (
      errorMessage &&
      (errorMessage.includes("temporarily locked") ||
        errorMessage.includes("Too many verification attempts") ||
        errorMessage.includes("Verification delayed") ||
        errorMessage.includes("currently verifying another challenge") ||
        errorMessage.includes("permanently blocked"))
    );
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadChallenges();
      checkAdminStatus();
    }
  }, [isAuthenticated]);

  const checkAdminStatus = async () => {
    try {
      const admin = await challengeService.getAdmin();
      if (admin && identity) {
        setIsAdmin(admin.toString() === identity.getPrincipal().toString());
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsAdmin(false);
    }
  };

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const result = await challengeService.getChallenges();
      setChallenges(result);
      await loadChallengeStatuses(result);
    } catch (error) {
      console.error("Failed to load challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChallengeStatuses = async (challengesList) => {
    const statuses = {};
    for (const challenge of challengesList) {
      try {
        const status = await challengeService.getChallengeStatus(challenge.id);
        if (status) {
          statuses[challenge.id] = status;
        }
      } catch (error) {
        console.error(
          `Failed to load status for challenge ${challenge.id}:`,
          error,
        );
      }
    }
    setChallengeStatuses(statuses);
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (
      !newChallenge.description ||
      !newChallenge.userToFollow ||
      !newChallenge.points ||
      !newChallenge.markdownMessage?.trim()
    )
      return;

    try {
      const challengeType = { follows: { user: newChallenge.userToFollow } };
      const points = BigInt(newChallenge.points);
      await challengeService.createChallenge(
        newChallenge.description,
        challengeType,
        points,
        newChallenge.markdownMessage,
      );
      setNewChallenge({
        description: "",
        userToFollow: "",
        points: "",
        markdownMessage: "",
      });
      setShowCreateForm(false);
      loadChallenges(); // Refresh the list
    } catch (error) {
      console.error("Failed to create challenge:", error);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (window.confirm("Are you sure you want to delete this challenge?")) {
      try {
        await challengeService.deleteChallenge(challengeId);
        loadChallenges(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete challenge:", error);
      }
    }
  };

  const handleEditChallenge = (challenge) => {
    setEditingChallenge(challenge.id);
    setEditForm({
      description: challenge.description,
      userToFollow: challenge.challengeType.follows.user,
      points: challenge.points.toString(),
      markdownMessage: challenge.markdownMessage || "",
    });
  };

  const handleUpdateChallenge = async (e) => {
    e.preventDefault();
    console.log("🔍 DEBUG: handleUpdateChallenge called", {
      editingChallenge,
      editForm,
    });

    if (editingChallenge == null) {
      console.log("🔍 DEBUG: No editingChallenge, returning");
      return;
    }

    // Validate form
    if (
      !editForm.description.trim() ||
      !editForm.userToFollow.trim() ||
      !editForm.points ||
      !editForm.markdownMessage?.trim()
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setUpdatingChallenge(editingChallenge);
    try {
      const challengeType = { follows: { user: editForm.userToFollow } };
      const points = BigInt(editForm.points);
      console.log("🔍 DEBUG: Calling challengeService.updateChallenge", {
        editingChallenge,
        description: editForm.description,
        challengeType,
        points,
        markdownMessage: editForm.markdownMessage,
      });

      const result = await challengeService.updateChallenge(
        editingChallenge,
        editForm.description,
        challengeType,
        points,
        editForm.markdownMessage,
      );

      console.log("🔍 DEBUG: challengeService.updateChallenge result:", result);

      // Show success message
      alert("Challenge updated successfully!");

      setEditingChallenge(null);
      setEditForm({
        description: "",
        userToFollow: "",
        points: "",
        markdownMessage: "",
      });
      loadChallenges(); // Refresh the list
    } catch (error) {
      console.error("Failed to update challenge:", error);
      // Show error to user
      alert(`Failed to update challenge: ${error.message || "Unknown error"}`);
    } finally {
      setUpdatingChallenge(null);
    }
  };

  const handleDisableChallenge = async (challengeId) => {
    try {
      await challengeService.disableChallenge(challengeId);
      loadChallenges(); // Refresh the list
    } catch (error) {
      console.error("Failed to disable challenge:", error);
    }
  };

  const handleEnableChallenge = async (challengeId) => {
    try {
      await challengeService.enableChallenge(challengeId);
      loadChallenges(); // Refresh the list
    } catch (error) {
      console.error("Failed to enable challenge:", error);
    }
  };

  const handleVerifyChallenge = async (challengeId) => {
    setVerifyingChallenge(challengeId);
    try {
      const result = await challengeService.verifyChallenge(challengeId);
      setVerificationResults((prev) => ({
        ...prev,
        [challengeId]: result,
      }));

      // Check if this is a rate limiting error
      if (result.error && isRateLimitError(result.error)) {
        setRateLimitedChallenges((prev) => ({
          ...prev,
          [challengeId]: true,
        }));
      } else {
        // Clear rate limit status if not rate limited
        setRateLimitedChallenges((prev) => ({
          ...prev,
          [challengeId]: false,
        }));
      }

      // Refresh challenge status after verification
      const status = await challengeService.getChallengeStatus(challengeId);
      if (status) {
        setChallengeStatuses((prev) => ({
          ...prev,
          [challengeId]: status,
        }));
      }
    } catch (error) {
      console.error("Failed to verify challenge:", error);
      setVerificationResults((prev) => ({
        ...prev,
        [challengeId]: { error: "Verification failed. Please try again." },
      }));
    } finally {
      setVerifyingChallenge(null);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <svg
            className="w-6 h-6 mr-2 text-purple-500"
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
          Challenges
        </h3>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={showCreateForm ? "btn-secondary" : "btn-primary"}
          >
            {showCreateForm ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancel
              </>
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Challenge
              </>
            )}
          </button>
        )}
      </div>

      {showCreateForm && isAdmin && (
        <form
          onSubmit={handleCreateChallenge}
          className="bg-slate-700 rounded-lg p-6 mb-6 border border-slate-600"
        >
          <h4 className="text-lg font-semibold text-white mb-4">
            Create New Challenge
          </h4>

          <div className="space-y-4">
            <div>
              <label className="label">Challenge Description</label>
              <input
                type="text"
                value={newChallenge.description}
                onChange={(e) =>
                  setNewChallenge({
                    ...newChallenge,
                    description: e.target.value,
                  })
                }
                className="input-field w-full"
                placeholder="e.g., Follow this amazing developer!"
                required
              />
            </div>

            <div>
              <label className="label">User Handle / Username</label>
              <input
                type="text"
                value={newChallenge.userToFollow}
                onChange={(e) =>
                  setNewChallenge({
                    ...newChallenge,
                    userToFollow: e.target.value,
                  })
                }
                className="input-field w-full"
                placeholder="e.g. roadblock_icp"
                required
              />
              <p className="text-slate-400 text-sm mt-1">
                Enter the Twitter/X username of the person to follow
              </p>
            </div>

            <div>
              <label className="label">Points Reward</label>
              <input
                type="number"
                value={newChallenge.points}
                onChange={(e) =>
                  setNewChallenge({ ...newChallenge, points: e.target.value })
                }
                className="input-field w-full"
                placeholder="e.g., 100"
                min="1"
                required
              />
              <p className="text-slate-400 text-sm mt-1">
                Points awarded to users who complete this challenge
              </p>
            </div>

            <div>
              <label className="label">Additional Information (Markdown)</label>
              <textarea
                value={newChallenge.markdownMessage}
                onChange={(e) =>
                  setNewChallenge({
                    ...newChallenge,
                    markdownMessage: e.target.value,
                  })
                }
                className="input-field w-full"
                placeholder="Add extra details, promotional content, or explanations using Markdown..."
                rows={4}
                required
              />
              <p className="text-slate-400 text-sm mt-1">
                Optional: Add additional information that will be displayed with
                the challenge
              </p>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Create Challenge
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-slate-400">Loading challenges...</span>
        </div>
      ) : (
        <div>
          {challenges.length === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white mb-2">
                No Challenges Yet
              </h4>
              <p className="text-slate-400 mb-4">
                Create your first challenge to get started!
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Create Your First Challenge
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-400">
                  {challenges.length} challenge
                  {challenges.length !== 1 ? "s" : ""} found
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id.toString()}
                    className={`rounded-xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
                      challenge.disabled
                        ? "bg-slate-800/30 border-slate-700/50 opacity-75"
                        : "bg-slate-700/50 border-slate-600 hover:border-slate-500 hover:bg-slate-700/70"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="text-white mb-4 leading-relaxed">
                          <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                            {challenge.description}
                          </ReactMarkdown>
                        </div>

                        {challenge.markdownMessage && (
                          <div className="text-slate-300 mb-4 leading-relaxed border-l-2 border-blue-500/30 pl-4">
                            <ReactMarkdown className="prose prose-invert prose-xs max-w-none">
                              {challenge.markdownMessage}
                            </ReactMarkdown>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-4 h-4 text-blue-400"
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
                               <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                                 Follow User
                               </p>
                               <a
                                 href={`https://x.com/${challenge.challengeType.follows.user}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                 title={`Visit @${challenge.challengeType.follows.user} on X/Twitter`}
                               >
                                 @{challenge.challengeType.follows.user}
                               </a>
                             </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-4 h-4 text-yellow-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                                Reward Points
                              </p>
                              <p className="text-yellow-400 font-bold text-lg">
                                {challenge.points.toString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {challengeStatuses[challenge.id] && (
                          <div className="flex items-center justify-start">
                            {challengeStatuses[challenge.id].verified !==
                            undefined ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                <svg
                                  className="w-4 h-4 mr-2"
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
                                Verified
                              </span>
                            ) : challengeStatuses[challenge.id].pending !==
                              undefined ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                <svg
                                  className="w-4 h-4 mr-2 animate-spin"
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
                                Pending Verification
                              </span>
                            ) : challengeStatuses[challenge.id].failed ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                Failed
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Disabled Indicator */}
                      {challenge.disabled && (
                        <div className="mb-4">
                          <div className="bg-amber-900/20 border border-amber-600/50 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="w-5 h-5 text-amber-500"
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
                              <span className="text-amber-400 font-medium">
                                This challenge is currently disabled
                              </span>
                            </div>
                            <p className="text-amber-300 text-sm mt-1">
                              This challenge was active for a limited time and
                              is no longer accepting new verifications.
                            </p>
                          </div>
                        </div>
                      )}

                       {/* Verify Button - Available to all users */}
                       {!challenge.disabled &&
                         !(
                           challengeStatuses[challenge.id] &&
                           challengeStatuses[challenge.id].verified !==
                             undefined
                         ) && (
                         <div className="mt-4 pt-4 border-t border-slate-600">
                           <button
                             onClick={() =>
                               handleVerifyChallenge(challenge.id)
                             }
                             disabled={
                               verifyingChallenge === challenge.id ||
                               rateLimitedChallenges[challenge.id] ||
                               (verificationResults[challenge.id] &&
                                 verificationResults[challenge.id].error &&
                                 verificationResults[
                                   challenge.id
                                 ].error.includes("permanently blocked"))
                             }
                             className={`text-sm px-4 py-2 flex items-center justify-center ${
                               verificationResults[challenge.id] &&
                               verificationResults[challenge.id].error &&
                               verificationResults[
                                 challenge.id
                               ].error.includes("permanently blocked")
                                 ? "btn-danger opacity-50 cursor-not-allowed"
                                 : rateLimitedChallenges[challenge.id]
                                   ? "btn-secondary opacity-50 cursor-not-allowed"
                                   : "btn-primary"
                             }`}
                             title={
                               verificationResults[challenge.id] &&
                               verificationResults[challenge.id].error &&
                               verificationResults[
                                 challenge.id
                               ].error.includes("permanently blocked")
                                 ? "Account permanently blocked"
                                 : rateLimitedChallenges[challenge.id]
                                   ? "Rate limited - please wait"
                                   : "Verify challenge"
                             }
                           >
                             {verifyingChallenge === challenge.id ? (
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                             ) : (
                               <>
                                 <svg
                                   className="w-4 h-4 mr-2"
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
                                 Verify Challenge
                               </>
                             )}
                           </button>
                         </div>
                       )}

                       {/* Admin Actions */}
                       {isAdmin && (
                         <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-600">
                           {/* Edit Button */}
                           <button
                             onClick={() => handleEditChallenge(challenge)}
                             className="btn-secondary text-sm px-4 py-2 flex items-center justify-center"
                             title="Edit challenge"
                           >
                             <svg
                               className="w-4 h-4 mr-2"
                               fill="none"
                               stroke="currentColor"
                               viewBox="0 0 24 24"
                             >
                               <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                               />
                             </svg>
                             Edit Challenge
                           </button>

                           {/* Disable/Enable Button */}
                           <button
                             onClick={() =>
                               challenge.disabled
                                 ? handleEnableChallenge(challenge.id)
                                 : handleDisableChallenge(challenge.id)
                             }
                             className={`text-sm px-4 py-2 flex items-center justify-center ${
                               challenge.disabled
                                 ? "btn-primary"
                                 : "btn-secondary"
                             }`}
                             title={
                               challenge.disabled
                                 ? "Enable challenge"
                                 : "Disable challenge"
                             }
                           >
                             <svg
                               className="w-4 h-4 mr-2"
                               fill="none"
                               stroke="currentColor"
                               viewBox="0 0 24 24"
                             >
                               {challenge.disabled ? (
                                 <path
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                                   strokeWidth={2}
                                   d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H13m-3 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                 />
                               ) : (
                                 <path
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                                   strokeWidth={2}
                                   d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                 />
                               )}
                             </svg>
                             {challenge.disabled ? "Enable" : "Disable"}
                           </button>

                           <button
                             onClick={() => handleDeleteChallenge(challenge.id)}
                             className="btn-danger text-sm px-4 py-2 flex items-center justify-center"
                             title="Delete challenge"
                           >
                             <svg
                               className="w-4 h-4 mr-2"
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
                             Delete Challenge
                           </button>
                         </div>
                       )}

                      {/* Verification Result */}
                      {verificationResults[challenge.id] && (
                        <div
                          className={`mt-3 p-3 rounded-lg border bg-slate-700/50 ${
                            verificationResults[challenge.id].error &&
                            verificationResults[challenge.id].error.includes(
                              "permanently blocked",
                            )
                              ? "border-red-500/50 bg-red-500/10"
                              : rateLimitedChallenges[challenge.id]
                                ? "border-orange-500/50 bg-orange-500/10"
                                : "border-slate-600"
                          }`}
                        >
                          {verificationResults[challenge.id].success !==
                          undefined ? (
                            verificationResults[challenge.id].success ? (
                              <div className="flex items-start text-green-400">
                                <svg
                                  className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
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
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium block">
                                    Challenge Verified!
                                  </span>
                                  <span className="text-sm text-slate-400">
                                    You are following @
                                    {challenge.challengeType.follows.user}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start text-yellow-400">
                                <svg
                                  className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
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
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium block">
                                    Not Verified
                                  </span>
                                  <span className="text-sm text-slate-400">
                                    You are not following @
                                    {challenge.challengeType.follows.user}
                                  </span>
                                </div>
                              </div>
                            )
                          ) : (
                            <div
                              className={`flex items-start ${
                                verificationResults[challenge.id].error &&
                                verificationResults[
                                  challenge.id
                                ].error.includes("permanently blocked")
                                  ? "text-red-400"
                                  : rateLimitedChallenges[challenge.id]
                                    ? "text-orange-400"
                                    : "text-red-400"
                              }`}
                            >
                              <svg
                                className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={
                                    verificationResults[challenge.id].error &&
                                    verificationResults[
                                      challenge.id
                                    ].error.includes("permanently blocked")
                                      ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                      : rateLimitedChallenges[challenge.id]
                                        ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        : "M6 18L18 6M6 6l12 12"
                                  }
                                />
                              </svg>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium block">
                                  {verificationResults[challenge.id].error &&
                                  verificationResults[
                                    challenge.id
                                  ].error.includes("permanently blocked")
                                    ? "Account Blocked"
                                    : rateLimitedChallenges[challenge.id]
                                      ? "Rate Limited"
                                      : "Verification Failed"}
                                </span>
                                <span className="text-sm text-slate-400 break-words">
                                  {verificationResults[challenge.id].error}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Edit Form - Separate section below challenges */}
                {challenges
                  .map(
                    (challenge) =>
                      editingChallenge === challenge.id && (
                        <div
                          key={`edit-${challenge.id.toString()}`}
                          className="mt-6 bg-slate-700 rounded-lg p-6 border border-slate-600"
                        >
                          <form
                            onSubmit={handleUpdateChallenge}
                            className="space-y-4"
                          >
                            <h5 className="text-white font-medium flex items-center">
                              <svg
                                className="w-5 h-5 mr-2 text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit Challenge
                            </h5>

                            <div>
                              <label className="label text-sm">
                                Challenge Description
                              </label>
                              <input
                                type="text"
                                value={editForm.description}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    description: e.target.value,
                                  })
                                }
                                className="input-field w-full"
                                required
                              />
                            </div>

                            <div>
                              <label className="label text-sm">
                                User Handle / Username
                              </label>
                              <input
                                type="text"
                                value={editForm.userToFollow}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    userToFollow: e.target.value,
                                  })
                                }
                                className="input-field w-full"
                                required
                              />
                            </div>

                            <div>
                              <label className="label text-sm">
                                Points Reward
                              </label>
                              <input
                                type="number"
                                value={editForm.points}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    points: e.target.value,
                                  })
                                }
                                className="input-field w-full"
                                min="1"
                                required
                              />
                            </div>

                            <div>
                              <label className="label text-sm">
                                Additional Information (Markdown)
                              </label>
                              <textarea
                                value={editForm.markdownMessage}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    markdownMessage: e.target.value,
                                  })
                                }
                                className="input-field w-full"
                                rows={3}
                                required
                              />
                            </div>

                            <div className="flex space-x-3">
                              <button
                                type="submit"
                                disabled={
                                  updatingChallenge === editingChallenge
                                }
                                className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingChallenge === editingChallenge ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Updating...
                                  </>
                                ) : (
                                  "Update Challenge"
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingChallenge(null)}
                                disabled={
                                  updatingChallenge === editingChallenge
                                }
                                className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      ),
                  )
                  .filter(Boolean)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChallengeList;
