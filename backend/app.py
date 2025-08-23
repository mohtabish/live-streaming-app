from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import os
import subprocess
import threading
import time
import signal
from datetime import datetime
from config import Config
from utils.rtsp_converter import RTSPConverter
from models.overlay import OverlayModel

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Database connection
client = MongoClient(app.config['MONGODB_URI'])
db = client[app.config['MONGODB_DB_NAME']]
overlays_collection = db.overlays

# Initialize RTSP converter
rtsp_converter = RTSPConverter()

# Initialize models
overlay_model = OverlayModel(overlays_collection)

# Global variables for stream management
stream_active = False

# Utility functions
def serialize_overlay(overlay):
    """Convert MongoDB document to JSON-serializable format"""
    overlay['_id'] = str(overlay['_id'])
    return overlay

def validate_overlay_data(data):
    """Validate overlay data structure"""
    required_fields = ['type', 'content', 'position', 'size']
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    if data['type'] not in ['text', 'logo']:
        return False, "Type must be 'text' or 'logo'"
    
    return True, "Valid"

# Routes

@app.route('/')
def home():
    return jsonify({
        "message": "RTSP Livestream API",
        "version": "1.0.0",
        "endpoints": {
            "overlays": "/api/overlays",
            "stream": "/api/stream"
        }
    })

# Overlay CRUD Routes
@app.route('/api/overlays', methods=['GET'])
def get_overlays():
    """Get all overlay settings"""
    try:
        # Support query parameters
        type_filter = request.args.get('type')
        visible_filter = request.args.get('visible')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        query = {}
        if type_filter:
            query['type'] = type_filter
        if visible_filter is not None:
            query['visible'] = visible_filter.lower() == 'true'
        
        overlays = list(overlays_collection.find(query).skip(offset).limit(limit))
        return jsonify([serialize_overlay(overlay) for overlay in overlays])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/overlays', methods=['POST'])
def create_overlay():
    """Create a new overlay"""
    try:
        data = request.get_json()
        
        # Validate data
        is_valid, message = validate_overlay_data(data)
        if not is_valid:
            return jsonify({"error": message}), 400
        
        # Add default values
        data.setdefault('visible', True)
        data.setdefault('layer', 1)
        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        
        # Insert into database
        result = overlays_collection.insert_one(data)
        
        return jsonify({
            "_id": str(result.inserted_id),
            "message": "Overlay created successfully"
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/overlays/<overlay_id>', methods=['GET'])
def get_overlay(overlay_id):
    """Get a specific overlay by ID"""
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({"error": "Invalid overlay ID format"}), 400
            
        overlay = overlays_collection.find_one({"_id": ObjectId(overlay_id)})
        if not overlay:
            return jsonify({"error": "Overlay not found"}), 404
        
        return jsonify(serialize_overlay(overlay))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/overlays/<overlay_id>', methods=['PUT'])
def update_overlay(overlay_id):
    """Update an existing overlay"""
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({"error": "Invalid overlay ID format"}), 400
            
        data = request.get_json()
        data['updated_at'] = datetime.utcnow()
        
        result = overlays_collection.update_one(
            {"_id": ObjectId(overlay_id)},
            {"$set": data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Overlay not found"}), 404
        
        return jsonify({
            "message": "Overlay updated successfully",
            "updated_fields": list(data.keys())
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/overlays/<overlay_id>', methods=['DELETE'])
def delete_overlay(overlay_id):
    """Delete an overlay"""
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({"error": "Invalid overlay ID format"}), 400
            
        result = overlays_collection.delete_one({"_id": ObjectId(overlay_id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Overlay not found"}), 404
        
        return jsonify({
            "message": "Overlay deleted successfully",
            "deleted_id": overlay_id
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Stream Management Routes
@app.route('/api/stream/start', methods=['POST'])
def start_stream():
    """Start RTSP stream conversion"""
    global stream_active
    try:
        data = request.get_json()
        rtsp_url = data.get('rtsp_url')
        
        if not rtsp_url:
            return jsonify({"error": "RTSP URL is required"}), 400
        
        # Validate RTSP URL format
        if not rtsp_url.startswith(('rtsp://', 'rtmp://')):
            return jsonify({"error": "Invalid RTSP/RTMP URL format"}), 400
        
        # Start conversion
        success = rtsp_converter.start_conversion(rtsp_url)
        
        if success:
            stream_active = True
            return jsonify({
                "hls_url": f"http://localhost:5000/stream/playlist.m3u8",
                "status": "started",
                "rtsp_url": rtsp_url,
                "started_at": datetime.utcnow().isoformat()
            })
        else:
            return jsonify({"error": "Failed to start stream conversion"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/stream/stop', methods=['POST'])
def stop_stream():
    """Stop the current stream"""
    global stream_active
    try:
        rtsp_converter.stop_conversion()
        stream_active = False
        return jsonify({
            "status": "stopped",
            "message": "Stream stopped successfully",
            "stopped_at": datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/stream/status', methods=['GET'])
def stream_status():
    """Get current stream status"""
    return jsonify({
        "active": stream_active,
        "hls_url": f"http://localhost:5000/stream/playlist.m3u8" if stream_active else None,
        "timestamp": datetime.utcnow().isoformat()
    })

# Serve HLS files
@app.route('/stream/<filename>')
def serve_stream_file(filename):
    """Serve HLS playlist and segment files"""
    try:
        return send_from_directory(app.config['STREAM_OUTPUT_DIR'], filename)
    except FileNotFoundError:
        return jsonify({"error": "Stream file not found"}), 404

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test MongoDB connection
        db.command('ping')
        
        # Check stream output directory
        output_dir_exists = os.path.exists(app.config['STREAM_OUTPUT_DIR'])
        
        return jsonify({
            "status": "healthy",
            "mongodb": "connected",
            "stream_output_dir": "exists" if output_dir_exists else "missing",
            "active_stream": stream_active,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0"
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad request"}), 400

# Cleanup on shutdown
def cleanup():
    """Cleanup resources on shutdown"""
    rtsp_converter.stop_conversion()
    print("Cleanup completed")

if __name__ == '__main__':
    # Ensure stream output directory exists
    os.makedirs(app.config['STREAM_OUTPUT_DIR'], exist_ok=True)
    
    # Register cleanup function
    import atexit
    atexit.register(cleanup)
    
    try:
        print(f"Starting RTSP Livestream API on port 5000...")
        print(f"MongoDB URI: {app.config['MONGODB_URI']}")
        print(f"Stream output directory: {app.config['STREAM_OUTPUT_DIR']}")
        
        # Start Flask app
        app.run(
            debug=app.config['DEBUG'], 
            host='0.0.0.0', 
            port=5000, 
            threaded=True
        )
    except KeyboardInterrupt:
        cleanup()