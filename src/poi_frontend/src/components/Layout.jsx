import { useState } from 'react';

function Layout({ sidebar, main }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Proof of Influence
          </h1>
          <p className="text-slate-400 text-lg">
            Showcase Your Social Media Impact
          </p>
        </header>

        {/* Main Layout */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className={`transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-80'
          }`}>
            <div className="sticky top-8">
              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full mb-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                <svg
                  className={`w-6 h-6 text-slate-400 mx-auto transition-transform ${
                    sidebarCollapsed ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Sidebar Content */}
              <div className={`space-y-6 ${sidebarCollapsed ? 'hidden' : ''}`}>
                {sidebar}
              </div>

              {/* Collapsed Sidebar Indicator */}
              {sidebarCollapsed && (
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-400 transform -rotate-90 whitespace-nowrap">
                    PROFILE
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {main}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-700">
          <div className="text-center">
            <img
              src="/logo2.svg"
              alt="DFINITY logo"
              className="mx-auto mb-4 w-12 h-12 opacity-60"
            />
            <p className="text-slate-500 text-sm">
              Powered by Internet Computer
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Layout;