import { useEffect } from 'react';

function FeedbackModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      // Load the feedback script when modal opens
      const script = document.createElement('script');
      script.src = 'https://feedback-g5y.caffeine.xyz/feedback-embed.js';
      script.async = true;
      document.body.appendChild(script);

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = 'unset';
        // Clean up script if needed
        const existingScript = document.querySelector('script[src*="feedback-embed.js"]');
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Share Your Feedback</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Feedback Form Content */}
        <div className="p-6">
          <div data-feedback-app="poi" data-feedback-gateway="https://feedback-g5y.caffeine.xyz"></div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackModal;