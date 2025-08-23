import React from 'react';
import { ArrowLeft, Square, Settings, Wifi } from 'lucide-react';

const Header = ({ isStreaming, rtspUrl, onGoBack, onStopStream, loading }) => {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Left side - Title and navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onGoBack}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              title="Go back to landing page"
            >
              <ArrowLeft size={20} className="mr-2" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                RTSP Livestream Player
              </h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                Stream with custom overlays
              </p>
            </div>
          </div>

          {/* Center - Stream status */}
          <div className="flex items-center space-x-3">
            {isStreaming && (
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Wifi size={14} className="ml-2 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-700 hidden md:inline">
                  Live Stream Active
                </span>
              </div>
            )}
            
            {/* Stream URL display (truncated on mobile) */}
            {rtspUrl && (
              <div className="hidden lg:flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg max-w-xs">
                <span className="text-xs text-gray-500">Source:</span>
                <code className="text-xs font-mono text-gray-700 truncate">
                  {rtspUrl.length > 40 ? `${rtspUrl.substring(0, 40)}...` : rtspUrl}
                </code>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Settings button */}
            <button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>

            {/* Stop stream button */}
            {isStreaming && (
              <button
                onClick={onStopStream}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors"
                title="Stop stream"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="hidden sm:inline">Stopping...</span>
                  </>
                ) : (
                  <>
                    <Square size={16} className="mr-2" />
                    <span className="hidden sm:inline">Stop Stream</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile stream info bar */}
      {isStreaming && rtspUrl && (
        <div className="lg:hidden border-t border-gray-200 px-4 py-2 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Stream Source:</span>
            <code className="text-xs font-mono text-gray-700 truncate max-w-48">
              {rtspUrl}
            </code>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;