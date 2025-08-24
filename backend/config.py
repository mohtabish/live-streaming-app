import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration class"""
    
    # Database Configuration
    MONGODB_URI = "mongodb://localhost:27017/"
    MONGODB_DB_NAME = "livestream"
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # Stream Configuration
    STREAM_OUTPUT_DIR = "output"
    MAX_STREAM_DURATION = int(os.getenv('MAX_STREAM_DURATION', '3600'))  # 1 hour
    FFMPEG_PATH = os.getenv('FFMPEG_PATH', 'ffmpeg')
    
    # CORS Configuration
    ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
    
    # Rate Limiting
    RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'True').lower() == 'true'
    STREAM_RATE_LIMIT = int(os.getenv('STREAM_RATE_LIMIT', '10'))
    OVERLAY_RATE_LIMIT = int(os.getenv('OVERLAY_RATE_LIMIT', '100'))
    
    # Overlay Configuration
    MAX_OVERLAYS = int(os.getenv('MAX_OVERLAYS', '10'))
    MAX_OVERLAY_SIZE = int(os.getenv('MAX_OVERLAY_SIZE', '1000'))  # pixels
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/livestream.log')

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Override with production values
    SECRET_KEY = os.getenv('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY must be set in production")

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    MONGODB_DB_NAME = 'livestream_test_db'

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])