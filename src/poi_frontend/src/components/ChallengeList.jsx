import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { ChallengeService } from '../services/challengeService';

function ChallengeList() {
  const { isAuthenticated, identity } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    description: '',
    userToFollow: '',
    points: ''
  });
  const [verifyingChallenge, setVerifyingChallenge] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});
  const [challengeStatuses, setChallengeStatuses] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  const challengeService = new ChallengeService(identity);

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
      console.error('Failed to check admin status:', error);
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
      console.error('Failed to load challenges:', error);
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
        console.error(`Failed to load status for challenge ${challenge.id}:`, error);
      }
    }
    setChallengeStatuses(statuses);
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!newChallenge.description || !newChallenge.userToFollow || !newChallenge.points) return;

    try {
      const challengeType = { follows: { user: newChallenge.userToFollow } };
      const points = BigInt(newChallenge.points);
      await challengeService.createChallenge(newChallenge.description, challengeType, points);
      setNewChallenge({ description: '', userToFollow: '', points: '' });
      setShowCreateForm(false);
      loadChallenges(); // Refresh the list
    } catch (error) {
      console.error('Failed to create challenge:', error);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (window.confirm('Are you sure you want to delete this challenge?')) {
      try {
        await challengeService.deleteChallenge(challengeId);
        loadChallenges(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete challenge:', error);
      }
    }
  };

  const handleVerifyChallenge = async (challengeId) => {
    setVerifyingChallenge(challengeId);
    try {
      const result = await challengeService.verifyChallenge(challengeId);
      setVerificationResults(prev => ({
        ...prev,
        [challengeId]: result
      }));

      // Refresh challenge status after verification
      const status = await challengeService.getChallengeStatus(challengeId);
      if (status) {
        setChallengeStatuses(prev => ({
          ...prev,
          [challengeId]: status
        }));
      }
    } catch (error) {
      console.error('Failed to verify challenge:', error);
      setVerificationResults(prev => ({
        ...prev,
        [challengeId]: { error: 'Verification failed' }
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
          <svg className="w-6 h-6 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Challenge
            </>
          )}
        </button>
        )}
      </div>

      {showCreateForm && isAdmin && (
        <form onSubmit={handleCreateChallenge} className="bg-slate-700 rounded-lg p-6 mb-6 border border-slate-600">
          <h4 className="text-lg font-semibold text-white mb-4">Create New Challenge</h4>

          <div className="space-y-4">
            <div>
              <label className="label">
                Challenge Description
              </label>
              <input
                type="text"
                value={newChallenge.description}
                onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                className="input-field w-full"
                placeholder="e.g., Follow this amazing developer!"
                required
              />
            </div>

            <div>
              <label className="label">
                User Handle / Username
              </label>
              <input
                type="text"
                value={newChallenge.userToFollow}
                onChange={(e) => setNewChallenge({...newChallenge, userToFollow: e.target.value})}
                className="input-field w-full"
                placeholder="e.g. roadblock_icp"
                required
              />
              <p className="text-slate-400 text-sm mt-1">
                Enter the Twitter/X username of the person to follow
              </p>
            </div>

            <div>
              <label className="label">
                Points Reward
              </label>
              <input
                type="number"
                value={newChallenge.points}
                onChange={(e) => setNewChallenge({...newChallenge, points: e.target.value})}
                className="input-field w-full"
                placeholder="e.g., 100"
                min="1"
                required
              />
              <p className="text-slate-400 text-sm mt-1">
                Points awarded to users who complete this challenge
              </p>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white mb-2">No Challenges Yet</h4>
              <p className="text-slate-400 mb-4">Create your first challenge to get started!</p>
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
                  {challenges.length} challenge{challenges.length !== 1 ? 's' : ''} found
                </p>
              </div>

               <div className="space-y-3">
                 {challenges.map((challenge) => (
                    <div
                      key={challenge.id.toString()}
                      className="bg-slate-700/50 rounded-xl p-6 border border-slate-600 hover:border-slate-500 hover:bg-slate-700/70 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-white mb-3 leading-tight">
                            {challenge.description}
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Follow User</p>
                                <p className="text-white font-medium">@{challenge.challengeType.follows.user}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Reward Points</p>
                                <p className="text-yellow-400 font-bold text-lg">{challenge.points.toString()}</p>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {challengeStatuses[challenge.id] && (
                            <div className="flex items-center justify-start">
                              {challengeStatuses[challenge.id].verified !== undefined ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Verified
                                </span>
                              ) : challengeStatuses[challenge.id].pending !== undefined ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Pending Verification
                                </span>
                              ) : challengeStatuses[challenge.id].failed ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Failed
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>

                        {/* Admin Actions */}
                        {isAdmin && (
                          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-600">
                            <button
                              onClick={() => handleVerifyChallenge(challenge.id)}
                              disabled={verifyingChallenge === challenge.id}
                              className="btn-primary text-sm px-4 py-2 flex items-center justify-center"
                              title="Verify challenge"
                            >
                              {verifyingChallenge === challenge.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Verify Challenge
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDeleteChallenge(challenge.id)}
                              className="btn-danger text-sm px-4 py-2 flex items-center justify-center"
                              title="Delete challenge"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Challenge
                            </button>
                          </div>
                        )}

                        {/* Verification Result */}
                        {verificationResults[challenge.id] && (
                          <div className="mt-3 p-3 rounded-lg border border-slate-600 bg-slate-700/50">
                            {verificationResults[challenge.id].success !== undefined ? (
                              verificationResults[challenge.id].success ? (
                                <div className="flex items-start text-green-400">
                                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div className="min-w-0 flex-1">
                                    <span className="font-medium block">Challenge Verified!</span>
                                    <span className="text-sm text-slate-400">
                                      You are following @{challenge.challengeType.follows.user}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start text-yellow-400">
                                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                  <div className="min-w-0 flex-1">
                                    <span className="font-medium block">Not Verified</span>
                                    <span className="text-sm text-slate-400">
                                      You are not following @{challenge.challengeType.follows.user}
                                    </span>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="flex items-start text-red-400">
                                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium block">Verification Failed</span>
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
               </div>
             </div>
           )}
         </div>
       )}
     </div>
   );
 }

 export default ChallengeList;