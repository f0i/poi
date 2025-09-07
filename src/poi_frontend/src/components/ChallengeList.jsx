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
    userToFollow: ''
  });

  const challengeService = new ChallengeService(identity);

  useEffect(() => {
    if (isAuthenticated) {
      loadChallenges();
    }
  }, [isAuthenticated]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const result = await challengeService.getChallenges();
      setChallenges(result);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!newChallenge.description || !newChallenge.userToFollow) return;

    try {
      const challengeType = { follows: { user: newChallenge.userToFollow } };
      await challengeService.createChallenge(newChallenge.description, challengeType);
      setNewChallenge({ description: '', userToFollow: '' });
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
      </div>

      {showCreateForm && (
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
                User to Follow
              </label>
              <input
                type="text"
                value={newChallenge.userToFollow}
                onChange={(e) => setNewChallenge({...newChallenge, userToFollow: e.target.value})}
                className="input-field w-full"
                placeholder="e.g., octocat"
                required
              />
              <p className="text-slate-400 text-sm mt-1">
                Enter the username of the person to follow
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
                    className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {challenge.description}
                        </h4>

                        <div className="flex items-center space-x-2 mb-3">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-slate-300">Follow user:</span>
                          <code className="bg-slate-600 px-2 py-1 rounded text-blue-400 font-mono text-sm">
                            {challenge.challengeType.follows.user}
                          </code>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            ID: {challenge.id.toString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteChallenge(challenge.id)}
                        className="btn-danger ml-4 flex-shrink-0"
                        title="Delete challenge"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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