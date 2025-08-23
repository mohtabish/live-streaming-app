import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import VideoPlayer from './components/VideoPlayer';
import OverlayManager from './components/OverlayManager';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import { useOverlays } from './hooks/useOverlays';
import { streamAPI } from './services/api';
import toast from 'react-hot-toast';

const App = () => {
  // State management
  const [rtspUrl, setRtspUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLanding, setShowLanding] = useState(true);

  // Custom hook for overlay management
  const {
    overlays,
    loading: overlaysLoading,
    error: overlaysError,
    createOverlay,
    updateOverlay,
    deleteOverlay,
    refreshOverlays
  } = useOverlays();

  // Check stream status on component mount
  useEffect(() => {
    checkStreamStatus();
  }, []);

  const checkStreamStatus = async () => {
    try {
      const status = await streamAPI.getStatus();
      if (status.active && status.hls_url) {
        setIsStreaming(true);
        setStreamUrl(status.hls_url);
        setShowLanding(false);
      }
    } catch (error) {
      console.error('Error checking stream status:', error);
    }
  };

  const startStream = async () => {
    if (!rtspUrl.trim()) {
      setError('Please enter a valid RTSP URL');
      toast.error('Please enter a valid RTSP URL');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // For demo purposes, we'll use a sample video
      // In production, this would call the actual API
      if (rtspUrl.includes('demo') || rtspUrl.includes('sample')) {
        const sampleVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        setStreamUrl(sampleVideo);
        setIsStreaming(true);
        setShowLanding(false);
        toast.success('Stream started successfully!');
      } else {
        // Real RTSP stream
        const response = await streamAPI.start(rtspUrl);
        setStreamUrl(response.hls_url);
        setIsStreaming(true);
        setShowLanding(false);
        toast.success('RTSP stream started successfully!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to start stream';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Stream start error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopStream = async () => {
    try {
      setLoading(true);
      await streamAPI.stop();
      setStreamUrl('');
      setIsStreaming(false);
      setRtspUrl('');
      toast.success('Stream stopped successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to stop stream';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Stream stop error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayCreate = async (overlayData) => {
    try {
      await createOverlay(overlayData);
      toast.success('Overlay created successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create overlay';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleOverlayUpdate = async (id, updateData) => {
    try {
      await updateOverlay(id, updateData);
      // Don't show toast for position updates (too frequent)
      if (!updateData.position) {
        toast.success('Overlay updated successfully!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update overlay';
      if (!updateData.position) { // Only show error toast for non-position updates
        toast.error(errorMessage);
      }
      console.error('Overlay update error:', error);
    }
  };

  const handleOverlayDelete = async (id) => {
    try {
      await deleteOverlay(id);
      toast.success('Overlay deleted successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete overlay';
      toast.error(errorMessage);
      console.error('Overlay delete error:', error);
    }
  };

  const goBackToLanding = () => {
    if (isStreaming) {
      stopStream();
    }
    setShowLanding(true);
    setError('');
  };

  // Show landing page if not streaming
  if (showLanding && !isStreaming) {
    return (
      <>
        <LandingPage
          rtspUrl={rtspUrl}
          setRtspUrl={setRtspUrl}
          onStartStream={startStream}
          loading={loading}
          error={error}
        />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <Header
        isStreaming={isStreaming}
        rtspUrl={rtspUrl}
        onGoBack={goBackToLanding}
        onStopStream={stopStream}
        loading={loading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Overlays Error Display */}
        {overlaysError && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Overlay system error: {overlaysError}
              </div>
              <button
                onClick={refreshOverlays}
                className="text-yellow-800 hover:text-yellow-900 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            {streamUrl ? (
              <VideoPlayer
                streamUrl={streamUrl}
                overlays={overlays}
                onOverlayUpdate={handleOverlayUpdate}
                isLoading={loading}
              />
            ) : (
              <div className="bg-gray-900 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="loading-spinner mx-auto mb-4"></div>
                      <p className="text-lg">Starting stream...</p>
                    </div>
                  ) : (
                    <>
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      <p className="text-lg">No active stream</p>
                      <p className="text-sm mt-2">Stream will appear here when started</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Stream Info */}
            {isStreaming && (
              <div className="mt-4 bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Stream Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Source:</span>
                    <p className="font-mono text-xs break-all">{rtspUrl}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      Live
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Overlay Manager */}
          <div className="lg:col-span-1">
            <OverlayManager
              overlays={overlays}
              onOverlayCreate={handleOverlayCreate}
              onOverlayUpdate={handleOverlayUpdate}
              onOverlayDelete={handleOverlayDelete}
              loading={overlaysLoading}
              disabled={!isStreaming}
            />

            {/* Overlay Statistics */}
            {overlays.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Overlay Statistics</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{overlays.length}</div>
                    <div className="text-gray-600">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {overlays.filter(o => o.visible !== false).length}
                    </div>
                    <div className="text-gray-600">Active</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {overlays.filter(o => o.type === 'text').length}
                    </div>
                    <div className="text-gray-600">Text</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {overlays.filter(o => o.type === 'logo').length}
                    </div>
                    <div className="text-gray-600">Logos</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.open('/api', '_blank')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                API Documentation
              </div>
              <p className="text-sm text-gray-600">View available API endpoints and documentation</p>
            </button>

            <button
              onClick={() => setRtspUrl('rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              disabled={isStreaming}
            >
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Load Demo Stream
              </div>
              <p className="text-sm text-gray-600">Load a sample RTSP stream for testing</p>
            </button>

            <button
              onClick={refreshOverlays}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              disabled={overlaysLoading}
            >
              <div className="flex items-center mb-2">
                <svg className={`w-5 h-5 text-purple-600 mr-2 ${overlaysLoading ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh Overlays
              </div>
              <p className="text-sm text-gray-600">Reload overlay data from the server</p>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default App;