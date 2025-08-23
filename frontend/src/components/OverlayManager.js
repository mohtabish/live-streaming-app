import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff, Type, Image } from 'lucide-react';

const OverlayManager = ({ 
  overlays, 
  onOverlayCreate, 
  onOverlayUpdate, 
  onOverlayDelete, 
  loading, 
  disabled 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState(null);
  const [formData, setFormData] = useState({
    type: 'text',
    content: '',
    position: { x: 10, y: 10 },
    size: { width: 200, height: 50 },
    style: { 
      color: '#ffffff', 
      fontSize: '16px',
      fontWeight: 'normal',
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: '6px'
    },
    visible: true
  });
  const [formErrors, setFormErrors] = useState({});

  // Reset form to default state
  const resetForm = () => {
    setFormData({
      type: 'text',
      content: '',
      position: { x: 10, y: 10 },
      size: { width: 200, height: 50 },
      style: { 
        color: '#ffffff', 
        fontSize: '16px',
        fontWeight: 'normal',
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: '6px'
      },
      visible: true
    });
    setEditingOverlay(null);
    setShowForm(false);
    setFormErrors({});
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.content.trim()) {
      errors.content = formData.type === 'text' ? 'Text content is required' : 'Image URL is required';
    }
    
    if (formData.type === 'logo' && formData.content.trim() && !isValidUrl(formData.content)) {
      errors.content = 'Please enter a valid image URL';
    }
    
    if (formData.position.x < 0 || formData.position.y < 0) {
      errors.position = 'Position values must be non-negative';
    }
    
    if (formData.size.width <= 0 || formData.size.height <= 0) {
      errors.size = 'Size values must be positive';
    }
    
    if (formData.size.width > 1920 || formData.size.height > 1080) {
      errors.size = 'Size values are too large (max: 1920x1080)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if URL is valid
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (editingOverlay) {
        await onOverlayUpdate(editingOverlay._id, formData);
      } else {
        await onOverlayCreate(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving overlay:', error);
      // Error is handled by parent component
    }
  };

  // Start editing an overlay
  const startEdit = (overlay) => {
    setFormData({
      ...overlay,
      style: { 
        color: '#ffffff', 
        fontSize: '16px',
        fontWeight: 'normal',
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: '6px',
        ...overlay.style 
      }
    });
    setEditingOverlay(overlay);
    setShowForm(true);
  };

  // Toggle overlay visibility
  const toggleVisibility = async (overlay) => {
    try {
      await onOverlayUpdate(overlay._id, { visible: !overlay.visible });
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handlePositionChange = (axis, value) => {
    setFormData(prev => ({
      ...prev,
      position: { ...prev.position, [axis]: parseInt(value) || 0 }
    }));
  };

  const handleSizeChange = (dimension, value) => {
    setFormData(prev => ({
      ...prev,
      size: { ...prev.size, [dimension]: parseInt(value) || 0 }
    }));
  };

  const handleStyleChange = (property, value) => {
    setFormData(prev => ({
      ...prev,
      style: { ...prev.style, [property]: value }
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Overlay Manager</h3>
          <button
            onClick={() => setShowForm(true)}
            disabled={disabled || loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            title={disabled ? 'Start a stream to add overlays' : 'Add new overlay'}
          >
            <Plus size={16} className="mr-2" />
            Add Overlay
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Disabled state message */}
        {disabled && (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-3">
              <svg className="w-12 h-12 mx-auto opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-medium">Start a stream to manage overlays</p>
            <p className="text-sm text-gray-400 mt-1">
              Overlays will appear here once you begin streaming
            </p>
          </div>
        )}

        {/* Overlay List */}
        {!disabled && (
          <>
            {loading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-3"></div>
                <p className="text-gray-500">Loading overlays...</p>
              </div>
            ) : overlays.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-3">
                  <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="font-medium">No overlays yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Click "Add Overlay" to create your first overlay
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {overlays.map((overlay) => (
                  <div key={overlay._id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex-shrink-0">
                            {overlay.type === 'text' ? (
                              <Type size={16} className="text-blue-500" />
                            ) : (
                              <Image size={16} className="text-green-500" />
                            )}
                          </div>
                          <span className="font-medium text-gray-800 truncate">
                            {overlay.content.length > 30 
                              ? `${overlay.content.substring(0, 30)}...` 
                              : overlay.content}
                          </span>
                          {overlay.visible === false && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>
                            Position: ({overlay.position.x}, {overlay.position.y})
                          </div>
                          <div>
                            Size: {overlay.size.width} × {overlay.size.height}px
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-3">
                        <button
                          onClick={() => toggleVisibility(overlay)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          title={overlay.visible ? 'Hide overlay' : 'Show overlay'}
                        >
                          {overlay.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          onClick={() => startEdit(overlay)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit overlay"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onOverlayDelete(overlay._id)}
                          className="p-1.5 text-red-600 hover:text-red-800 transition-colors"
                          title="Delete overlay"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Overlay Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">
                  {editingOverlay ? 'Edit Overlay' : 'Add New Overlay'}
                </h4>
                <button 
                  onClick={resetForm} 
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="form-label">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('type', 'text')}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                      formData.type === 'text' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Type size={16} />
                    <span>Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('type', 'logo')}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                      formData.type === 'logo' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Image size={16} />
                    <span>Logo</span>
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div>
                <label className="form-label">
                  {formData.type === 'text' ? 'Text Content' : 'Image URL'}
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleFieldChange('content', e.target.value)}
                  placeholder={formData.type === 'text' ? 'Enter your text...' : 'https://example.com/logo.png'}
                  className={`form-input resize-none ${formErrors.content ? 'border-red-500' : ''}`}
                  rows="3"
                  required
                />
                {formErrors.content && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.content}</p>
                )}
              </div>
              
              {/* Position */}
              <div>
                <label className="form-label">Position (pixels)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      value={formData.position.x}
                      onChange={(e) => handlePositionChange('x', e.target.value)}
                      className="form-input"
                      placeholder="X"
                      min="0"
                    />
                    <label className="text-xs text-gray-500 mt-1">X (horizontal)</label>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.position.y}
                      onChange={(e) => handlePositionChange('y', e.target.value)}
                      className="form-input"
                      placeholder="Y"
                      min="0"
                    />
                    <label className="text-xs text-gray-500 mt-1">Y (vertical)</label>
                  </div>
                </div>
                {formErrors.position && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.position}</p>
                )}
              </div>
              
              {/* Size */}
              <div>
                <label className="form-label">Size (pixels)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      value={formData.size.width}
                      onChange={(e) => handleSizeChange('width', e.target.value)}
                      className="form-input"
                      placeholder="Width"
                      min="1"
                      max="1920"
                    />
                    <label className="text-xs text-gray-500 mt-1">Width</label>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.size.height}
                      onChange={(e) => handleSizeChange('height', e.target.value)}
                      className="form-input"
                      placeholder="Height"
                      min="1"
                      max="1080"
                    />
                    <label className="text-xs text-gray-500 mt-1">Height</label>
                  </div>
                </div>
                {formErrors.size && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.size}</p>
                )}
              </div>
              
              {/* Style Options for Text */}
              {formData.type === 'text' && (
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <h5 className="font-medium text-gray-800">Text Styling</h5>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Text Color</label>
                      <input
                        type="color"
                        value={formData.style.color}
                        onChange={(e) => handleStyleChange('color', e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="form-label">Font Size</label>
                      <select
                        value={formData.style.fontSize}
                        onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                        className="form-input"
                      >
                        <option value="12px">12px</option>
                        <option value="14px">14px</option>
                        <option value="16px">16px</option>
                        <option value="18px">18px</option>
                        <option value="20px">20px</option>
                        <option value="24px">24px</option>
                        <option value="28px">28px</option>
                        <option value="32px">32px</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Font Weight</label>
                    <select
                      value={formData.style.fontWeight}
                      onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                      className="form-input"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="600">Semi-bold</option>
                      <option value="300">Light</option>
                    </select>
                  </div>
                </div>
              )}
              
              {/* Visibility */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="visible"
                  checked={formData.visible}
                  onChange={(e) => handleFieldChange('visible', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="visible" className="ml-2 text-sm text-gray-700">
                  Show overlay immediately
                </label>
              </div>
              
              {/* Form Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      {editingOverlay ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      {editingOverlay ? 'Update Overlay' : 'Create Overlay'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverlayManager;