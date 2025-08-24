from bson import ObjectId
from datetime import datetime
from marshmallow import Schema, fields, ValidationError

class OverlaySchema(Schema):
    """Schema for overlay validation"""
    type = fields.Str(required=True, validate=lambda x: x in ['text', 'logo'])
    content = fields.Str(required=True)
    position = fields.Dict(required=True, keys=fields.Str(), values=fields.Integer())
    size = fields.Dict(required=True, keys=fields.Str(), values=fields.Integer())
    layer = fields.Integer(load_default=1)
    style = fields.Dict(load_default={})
    visible = fields.Bool(load_default=True)  # <-- Fix here

class OverlayModel:
    """Model class for overlay operations"""
    
    def __init__(self, collection):
        self.collection = collection
        self.schema = OverlaySchema()
    
    def validate_overlay(self, data):
        """Validate overlay data"""
        try:
            return self.schema.load(data)
        except ValidationError as err:
            return None, err.messages
    
    def create_overlay(self, data):
        """Create a new overlay"""
        validated_data, errors = self.validate_overlay(data)
        if errors:
            return None, errors
        
        # Add timestamps
        validated_data['created_at'] = datetime.utcnow()
        validated_data['updated_at'] = datetime.utcnow()
        
        # Validate position and size constraints
        if not self._validate_position_size(validated_data):
            return None, {"error": "Invalid position or size values"}
        
        result = self.collection.insert_one(validated_data)
        return str(result.inserted_id), None
    
    def get_overlay(self, overlay_id):
        """Get overlay by ID"""
        try:
            if not ObjectId.is_valid(overlay_id):
                return None, {"error": "Invalid overlay ID"}
            
            overlay = self.collection.find_one({"_id": ObjectId(overlay_id)})
            return overlay, None
        except Exception as e:
            return None, {"error": str(e)}
    
    def update_overlay(self, overlay_id, data):
        """Update overlay"""
        try:
            if not ObjectId.is_valid(overlay_id):
                return False, {"error": "Invalid overlay ID"}
            
            # Add update timestamp
            data['updated_at'] = datetime.utcnow()
            
            # Validate position and size if provided
            if 'position' in data or 'size' in data:
                overlay = self.collection.find_one({"_id": ObjectId(overlay_id)})
                if overlay:
                    test_data = overlay.copy()
                    test_data.update(data)
                    if not self._validate_position_size(test_data):
                        return False, {"error": "Invalid position or size values"}
            
            result = self.collection.update_one(
                {"_id": ObjectId(overlay_id)},
                {"$set": data}
            )
            
            return result.matched_count > 0, None
        except Exception as e:
            return False, {"error": str(e)}
    
    def delete_overlay(self, overlay_id):
        """Delete overlay"""
        try:
            if not ObjectId.is_valid(overlay_id):
                return False, {"error": "Invalid overlay ID"}
            
            result = self.collection.delete_one({"_id": ObjectId(overlay_id)})
            return result.deleted_count > 0, None
        except Exception as e:
            return False, {"error": str(e)}
    
    def get_all_overlays(self, filters=None, limit=50, offset=0):
        """Get all overlays with optional filtering"""
        try:
            query = filters or {}
            overlays = list(
                self.collection.find(query)
                .skip(offset)
                .limit(limit)
                .sort("created_at", -1)
            )
            return overlays, None
        except Exception as e:
            return None, {"error": str(e)}
    
    def _validate_position_size(self, data):
        """Validate position and size values"""
        position = data.get('position', {})
        size = data.get('size', {})
        
        # Check position values
        if 'x' in position and (position['x'] < 0 or position['x'] > 3840):  # Max 4K width
            return False
        if 'y' in position and (position['y'] < 0 or position['y'] > 2160):  # Max 4K height
            return False
        
        # Check size values
        if 'width' in size and (size['width'] < 1 or size['width'] > 1920):
            return False
        if 'height' in size and (size['height'] < 1 or size['height'] > 1080):
            return False
        
        return True
    
    def get_overlay_stats(self):
        """Get overlay statistics"""
        try:
            total = self.collection.count_documents({})
            visible = self.collection.count_documents({"visible": True})
            text_overlays = self.collection.count_documents({"type": "text"})
            logo_overlays = self.collection.count_documents({"type": "logo"})
            
            return {
                "total": total,
                "visible": visible,
                "hidden": total - visible,
                "text_overlays": text_overlays,
                "logo_overlays": logo_overlays
            }, None
        except Exception as e:
            return None, {"error": str(e)}