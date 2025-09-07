import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { ChallengeService } from '../services/challengeService';

function Settings() {
  const { isAuthenticated, identity } = useAuth();
  const [tokenSet, setTokenSet] = useState(false);
  const [tokenMasked, setTokenMasked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [saving, setSaving] = useState(false);

  const challengeService = new ChallengeService(identity);

  useEffect(() => {
    if (isAuthenticated) {
      loadTokenStatus();
    }
  }, [isAuthenticated]);

  const loadTokenStatus = async () => {
    setLoading(true);
    try {
      const [isSet, masked] = await Promise.all([
        challengeService.isTwitterBearerTokenSet(),
        challengeService.getTwitterBearerTokenMasked()
      ]);
      setTokenSet(isSet);
      setTokenMasked(masked);
    } catch (error) {
      console.error('Failed to load token status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetToken = async (e) => {
    e.preventDefault();
    if (!newToken.trim()) return;

    setSaving(true);
    try {
      // Note: In a real app, you'd want to add authentication/authorization here
      // For now, this is a simple implementation
      await challengeService.setTwitterBearerToken(newToken.trim());
      setNewToken('');
      setShowTokenForm(false);
      await loadTokenStatus(); // Refresh status
    } catch (error) {
      console.error('Failed to set token:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </h3>
      </div>

      <div className="space-y-6">
        {/* Twitter API Configuration */}
        <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Twitter API Configuration
            </h4>
            <button
              onClick={() => setShowTokenForm(!showTokenForm)}
              className={showTokenForm ? "btn-secondary" : "btn-primary"}
            >
              {showTokenForm ? 'Cancel' : 'Configure Token'}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-slate-400">Loading token status...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${tokenSet ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-slate-300">
                    Bearer Token: {tokenSet ? 'Set' : 'Not Set'}
                  </span>
                </div>
                {tokenMasked && (
                  <div className="text-slate-400 text-sm">
                    Token ends with: <code className="bg-slate-600 px-2 py-1 rounded text-blue-400 font-mono">{tokenMasked}</code>
                  </div>
                )}
              </div>

              {!tokenSet && (
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h5 className="text-yellow-400 font-medium">Twitter API Token Required</h5>
                      <p className="text-yellow-300 text-sm mt-1">
                        Set a valid Twitter API Bearer Token to enable challenge verification.
                        Get your token from the <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">Twitter Developer Portal</a>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {showTokenForm && (
                <form onSubmit={handleSetToken} className="bg-slate-600 rounded-lg p-4 border border-slate-500">
                  <h5 className="text-white font-medium mb-3">Set Twitter Bearer Token</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="label text-sm">
                        Bearer Token
                      </label>
                      <input
                        type="password"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        className="input-field w-full"
                        placeholder="Enter your Twitter API Bearer Token"
                        required
                      />
                      <p className="text-slate-400 text-xs mt-1">
                        Your token will be stored securely and only the last 5 characters will be displayed for verification.
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
                          'Save Token'
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
      </div>
    </div>
  );
}

export default Settings;