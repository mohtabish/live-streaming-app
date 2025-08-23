import { useState, useEffect, useCallback } from 'react';
import { overlayAPI, apiUtils } from '../services/api';

export const useOverlays = () => {
  const [overlays, setOverlays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all overlays
  const fetchOverlays = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await overlayAPI.getAll();
      setOverlays(data);
    } catch (error) {
      const errorMessage = apiUtils.handleError(error, 'Failed to fetch overlays');
      setError(errorMessage);
      console.error('Error fetching overlays:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new overlay
  const createOverlay = useCallback(async (overlayData) => {
    try {
      const response = await overlayAPI.create(overlayData);
      
      // Refresh overlays to get the complete object
      await fetchOverlays();
      
      return response;
    } catch (error) {
      const errorMessage = apiUtils.handleError(error, 'Failed to create overlay');
      setError(errorMessage);
      throw error;
    }
  }, [fetchOverlays]);

  // Update overlay
  const updateOverlay = useCallback(async (id, updateData) => {
    try {
      await overlayAPI.update(id, updateData);
      
      // Update local state optimistically
      setOverlays(prevOverlays => 
        prevOverlays.map(overlay => 
          overlay._id === id 
            ? { ...overlay, ...updateData, updated_at: new Date().toISOString() }
            : overlay
        )
      );
    } catch (error) {
      // Refresh overlays on error to ensure consistency
      await fetchOverlays();
      
      const errorMessage = apiUtils.handleError(error, 'Failed to update overlay');
      setError(errorMessage);
      throw error;
    }
  }, [fetchOverlays]);

  // Delete overlay
  const deleteOverlay = useCallback(async (id) => {
    try {
      await overlayAPI.delete(id);
      
      // Remove from local state
      setOverlays(prevOverlays => 
        prevOverlays.filter(overlay => overlay._id !== id)
      );
    } catch (error) {
      // Refresh overlays on error to ensure consistency
      await fetchOverlays();
      
      const errorMessage = apiUtils.handleError(error, 'Failed to delete overlay');
      setError(errorMessage);
      throw error;
    }
  }, [fetchOverlays]);

  // Bulk update overlays (for drag operations)
  const batchUpdateOverlays = useCallback(async (updates) => {
    try {
      const responses = await overlayAPI.batchUpdate(updates);
      
      // Check if all updates were successful
      const hasErrors = responses.some(response => response.status === 'rejected');
      
      if (hasErrors) {
        console.warn('Some overlay updates failed:', responses);
      }
      
      // Update local state for successful updates
      const successfulUpdates = updates.filter((_, index) => 
        responses[index].status === 'fulfilled'
      );
      
      setOverlays(prevOverlays => {
        const newOverlays = [...prevOverlays];
        successfulUpdates.forEach(({ id, data }) => {
          const index = newOverlays.findIndex(overlay => overlay._id === id);
          if (index !== -1) {
            newOverlays[index] = { 
              ...newOverlays[index], 
              ...data, 
              updated_at: new Date().toISOString() 
            };
          }
        });
        return newOverlays;
      });
      
      return responses;
    } catch (error) {
      const errorMessage = apiUtils.handleError(error, 'Failed to update overlays');
      setError(errorMessage);
      throw error;
    }
  }, []);

  // Toggle overlay visibility
  const toggleOverlayVisibility = useCallback(async (id) => {
    const overlay = overlays.find(o => o._id === id);
    if (!overlay) return;
    
    try {
      await updateOverlay(id, { visible: !overlay.visible });
    } catch (error) {
      console.error('Error toggling overlay visibility:', error);
      throw error;
    }
  }, [overlays, updateOverlay]);

  // Get overlay by ID
  const getOverlay = useCallback((id) => {
    return overlays.find(overlay => overlay._id === id);
  }, [overlays]);

  // Filter overlays by type
  const getOverlaysByType = useCallback((type) => {
    return overlays.filter(overlay => overlay.type === type);
  }, [overlays]);

  // Get visible overlays
  const getVisibleOverlays = useCallback(() => {
    return overlays.filter(overlay => overlay.visible !== false);
  }, [overlays]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh overlays (alias for fetchOverlays for external use)
  const refreshOverlays = useCallback(async () => {
    await fetchOverlays();
  }, [fetchOverlays]);

  // Validate overlay data
  const validateOverlay = useCallback((overlayData) => {
    const errors = {};
    
    if (!overlayData.type || !['text', 'logo'].includes(overlayData.type)) {
      errors.type = 'Type must be either "text" or "logo"';
    }
    
    if (!overlayData.content) {
      errors.content = 'Content is required';
    }
    
    if (!overlayData.position || typeof overlayData.position.x !== 'number' || typeof overlayData.position.y !== 'number') {
      errors.position = 'Valid position coordinates are required';
    }
    
    if (!overlayData.size || typeof overlayData.size.width !== 'number' || typeof overlayData.size.height !== 'number') {
      errors.size = 'Valid size dimensions are required';
    }
    
    // Position bounds checking
    if (overlayData.position) {
      if (overlayData.position.x < 0 || overlayData.position.y < 0) {
        errors.position = 'Position coordinates must be non-negative';
      }
    }
    
    // Size bounds checking
    if (overlayData.size) {
      if (overlayData.size.width <= 0 || overlayData.size.height <= 0) {
        errors.size = 'Size dimensions must be positive';
      }
      if (overlayData.size.width > 1920 || overlayData.size.height > 1080) {
        errors.size = 'Size dimensions are too large';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  // Load overlays on hook initialization
  useEffect(() => {
    fetchOverlays();
  }, [fetchOverlays]);

  // Return hook interface
  return {
    // State
    overlays,
    loading,
    error,
    
    // Actions
    createOverlay,
    updateOverlay,
    deleteOverlay,
    batchUpdateOverlays,
    toggleOverlayVisibility,
    refreshOverlays,
    clearError,
    
    // Selectors
    getOverlay,
    getOverlaysByType,
    getVisibleOverlays,
    
    // Utilities
    validateOverlay,
    
    // Statistics
    stats: {
      total: overlays.length,
      visible: overlays.filter(o => o.visible !== false).length,
      text: overlays.filter(o => o.type === 'text').length,
      logo: overlays.filter(o => o.type === 'logo').length,
    }
  };
};