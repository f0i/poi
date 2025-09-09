import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { ChallengeService } from '../services/challengeService';

function Settings() {
  const { isAuthenticated, identity } = useAuth();
  const [tokenSet, setTokenSet] = useState(false);
  const [tokenMasked, setTokenMasked] = useState(null);
  const [cookiesSet, setCookiesSet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [newCookies, setNewCookies] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settingAdmin, setSettingAdmin] = useState(false);

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
        challengeService.getApifyBearerTokenMasked()
      ]);
      setTokenSet(isSet);
      setTokenMasked(masked);
      // For cookies, we don't have a getter, so just check if token is set (assuming both are set together)
      setCookiesSet(isSet);
    } catch (error) {
      console.error('Failed to load token status:', error);
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
      console.error('Failed to load admin status:', error);
      setIsAdmin(false);
    }
  };

  const handleSetAdmin = async () => {
    if (window.confirm('Are you sure you want to set yourself as the admin? This can only be done once.')) {
      setSettingAdmin(true);
      try {
        // Note: The backend will handle the admin setting logic
        // We don't need to pass any parameters as it uses the caller's identity
        await challengeService.setAdmin();
        await loadAdminStatus(); // Refresh admin status
      } catch (error) {
        console.error('Failed to set admin:', error);
        alert('Failed to set admin. You might not be authorized or admin is already set.');
      } finally {
        setSettingAdmin(false);
      }
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
        challengeService.setApifyCookies(newCookies.trim())
      ]);
      setNewToken('');
      setNewCookies('');
      setShowTokenForm(false);
      await loadTokenStatus(); // Refresh status
    } catch (error) {
      console.error('Failed to set token and cookies:', error);
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
        {/* Admin Management */}
        <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin Management
            </h4>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${currentAdmin ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-slate-300">
                  Admin: {currentAdmin ? 'Set' : 'Not Set'}
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
                Current Admin: <code className="bg-slate-600 px-2 py-1 rounded text-blue-400 font-mono">
                  {currentAdmin.toString().slice(0, 20)}...
                </code>
              </div>
            )}

            {!currentAdmin && (
              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h5 className="text-yellow-400 font-medium">Admin Not Set</h5>
                    <p className="text-yellow-300 text-sm mt-1">
                      No admin has been set yet. The first person to set themselves as admin will have full control over the system.
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
                      <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Set Myself as Admin
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Apify API Configuration */}
        <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Apify API Configuration
            </h4>
            <button
              onClick={() => setShowTokenForm(!showTokenForm)}
              className={showTokenForm ? "btn-secondary" : "btn-primary"}
            >
              {showTokenForm ? 'Cancel' : 'Configure API'}
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
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${cookiesSet ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-slate-300">
                    Cookies: {cookiesSet ? 'Set' : 'Not Set'}
                  </span>
                </div>
              </div>

              {(!tokenSet || !cookiesSet) && (
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h5 className="text-yellow-400 font-medium">Apify API Configuration Required</h5>
                      <p className="text-yellow-300 text-sm mt-1">
                        Set a valid Apify Bearer Token and cookies string to enable challenge verification.
                        Get your token from the <a href="https://console.apify.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">Apify Console</a>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {showTokenForm && (
                <form onSubmit={handleSetToken} className="bg-slate-600 rounded-lg p-4 border border-slate-500">
                  <h5 className="text-white font-medium mb-3">Set Apify API Configuration</h5>
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
                        placeholder="Enter your Apify Bearer Token"
                        required
                      />
                      <p className="text-slate-400 text-xs mt-1">
                        Your token will be stored securely and only the last 5 characters will be displayed for verification.
                      </p>
                    </div>
                    <div>
                      <label className="label text-sm">
                        Cookies String
                      </label>
                      <textarea
                        value={newCookies}
                        onChange={(e) => setNewCookies(e.target.value)}
                        className="input-field w-full"
                        placeholder='Enter your cookies string (e.g., [{"name":"ct0","value":"your-csrf-token-here"}])'
                        rows={3}
                        required
                      />
                      <p className="text-slate-400 text-xs mt-1">
                        Your cookies will be stored securely for Twitter API access.
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
                          'Save Configuration'
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