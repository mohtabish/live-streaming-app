import React, { useState } from 'react';
import { Play, ExternalLink, CheckCircle, Zap, Settings, Shield } from 'lucide-react';

const LandingPage = ({ rtspUrl, setRtspUrl, onStartStream, loading, error }) => {
  const [showExamples, setShowExamples] = useState(false);

  const sampleUrls = [
    {
      name: 'Big Buck Bunny (Demo)',
      url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4',
      description: 'Sample video stream for testing'
    },
    {
      name: 'Pattern Stream',
      url: 'rtsp://rtsp.stream/pattern',
      description: 'Test pattern for overlay positioning'
    }
  ];

  const handleSampleSelect = (url) => {
    setRtspUrl(url);
    setShowExamples(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onStartStream();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Live{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Streaming App
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Stream RTSP feeds with custom overlays, drag-and-drop positioning, and real-time controls
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                <CheckCircle size={16} className="mr-2" />
                RTSP/RTMP Support
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                <Zap size={16} className="mr-2" />
                Real-time Overlays
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                <Settings size={16} className="mr-2" />
                Full CRUD API
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                <Shield size={16} className="mr-2" />
                Production Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stream Input Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Start Your Live Stream
              </h2>
              <p className="text-gray-600">
                Enter your RTSP URL below to begin streaming with custom overlay support
              </p>
            </div>

            {/* Stream form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="rtsp-url" className="block text-sm font-medium text-gray-700 mb-2">
                  RTSP Stream URL
                </label>
                <div className="relative">
                  <input
                    id="rtsp-url"
                    type="url"
                    value={rtspUrl}
                    onChange={(e) => setRtspUrl(e.target.value)}
                    placeholder="rtsp://your-stream-server.com/live/stream"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowExamples(!showExamples)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Show example URLs"
                  >
                    <ExternalLink size={20} />
                  </button>
                </div>
              </div>

              {/* Example URLs dropdown */}
              {showExamples && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-800 mb-3">Sample RTSP URLs:</h4>
                  <div className="space-y-2">
                    {sampleUrls.map((sample, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSampleSelect(sample.url)}
                        className="w-full text-left p-3 bg-white hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">{sample.name}</div>
                            <div className="text-sm text-gray-500">{sample.description}</div>
                          </div>
                          <ExternalLink size={16} className="text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !rtspUrl.trim()}
                className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:hover:scale-100 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Starting Stream...
                  </>
                ) : (
                  <>
                    <Play size={20} className="mr-3" />
                    Start Live Stream
                  </>
                )}
              </button>
            </form>

            {/* Help text */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                Need help? Try our{' '}
                <button
                  type="button"
                  onClick={() => setShowExamples(true)}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  sample streams
                </button>
                {' '}or visit{' '}
                <a 
                  href="http://rtsp.me" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  rtsp.me
                </a>
                {' '}to create a test stream
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Streaming Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for professional livestreaming with custom overlays
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Play size={28} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">RTSP Streaming</h3>
              <p className="text-gray-600">
                Stream from any RTSP source with automatic conversion to web-compatible HLS format
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Settings size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Custom Overlays</h3>
              <p className="text-gray-600">
                Add text and logo overlays with drag-and-drop positioning and real-time editing
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap size={28} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Real-time Controls</h3>
              <p className="text-gray-600">
                Full playback controls with volume adjustment and instant overlay management
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">REST API</h3>
              <p className="text-gray-600">
                Complete CRUD API for overlay management with comprehensive documentation
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center p-6">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Production Ready</h3>
              <p className="text-gray-600">
                Built with Flask and React, featuring error handling and scalable architecture
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center p-6">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ExternalLink size={28} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Multiple Sources</h3>
              <p className="text-gray-600">
                Support for RTSP, RTMP, and other streaming protocols with automatic detection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Quick Start Guide
            </h2>
            <p className="text-xl text-gray-600">
              Get started with your livestream in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4 font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Enter RTSP URL</h3>
                <p className="text-gray-600">
                  Paste your RTSP stream URL or use one of our sample streams for testing
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-center">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4 font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Start Streaming</h3>
                <p className="text-gray-600">
                  Click "Start Live Stream" and watch your RTSP feed convert to web format
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-center">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4 font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Add Overlays</h3>
                <p className="text-gray-600">
                  Create custom text and logo overlays with drag-and-drop positioning
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;