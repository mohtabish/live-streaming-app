import subprocess
import os
import time
import threading
from datetime import datetime

class RTSPConverter:
    """Handle RTSP to HLS stream conversion using FFmpeg"""
    
    def __init__(self, output_dir="stream_output"):
        self.process = None
        self.output_dir = output_dir
        self.is_running = False
        self.start_time = None
        self.rtsp_url = None
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
    
    def start_conversion(self, rtsp_url):
        """Start converting RTSP stream to HLS format"""
        try:
            # Stop any existing stream
            self.stop_conversion()
            
            self.rtsp_url = rtsp_url
            self.start_time = datetime.utcnow()
            
            # HLS output path
            playlist_path = os.path.join(self.output_dir, 'playlist.m3u8')
            segment_pattern = os.path.join(self.output_dir, 'segment_%03d.ts')
            
            # FFmpeg command for RTSP to HLS conversion
            cmd = [
                'ffmpeg',
                '-i', rtsp_url,
                '-c:v', 'libx264',           # Video codec
                '-c:a', 'aac',               # Audio codec
                '-preset', 'ultrafast',      # Encoding speed
                '-tune', 'zerolatency',      # Low latency
                '-f', 'hls',                 # Output format
                '-hls_time', '2',            # Segment duration (seconds)
                '-hls_list_size', '5',       # Number of segments in playlist
                '-hls_flags', 'delete_segments+append_list',  # Cleanup old segments
                '-hls_segment_filename', segment_pattern,
                '-y',                        # Overwrite output files
                playlist_path
            ]
            
            print(f"Starting RTSP conversion: {' '.join(cmd)}")
            
            # Start FFmpeg process
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            
            # Monitor process in separate thread
            self.is_running = True
            monitor_thread = threading.Thread(target=self._monitor_process)
            monitor_thread.daemon = True
            monitor_thread.start()
            
            # Wait a moment to check if process started successfully
            time.sleep(2)
            
            if self.process.poll() is None:  # Process is still running
                print(f"RTSP conversion started successfully for: {rtsp_url}")
                return True
            else:
                # Process terminated immediately
                stdout, stderr = self.process.communicate()
                print(f"FFmpeg failed to start: {stderr}")
                self.is_running = False
                return False
                
        except FileNotFoundError:
            print("FFmpeg not found. Please install FFmpeg and ensure it's in your PATH.")
            return False
        except Exception as e:
            print(f"Error starting RTSP conversion: {e}")
            return False
    
    def stop_conversion(self):
        """Stop the current RTSP conversion"""
        if self.process and self.is_running:
            try:
                print("Stopping RTSP conversion...")
                self.is_running = False
                
                # Terminate the process gracefully
                self.process.terminate()
                
                # Wait for process to terminate
                try:
                    self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    # Force kill if it doesn't terminate gracefully
                    print("Force killing FFmpeg process...")
                    self.process.kill()
                    self.process.wait()
                
                print("RTSP conversion stopped")
                
            except Exception as e:
                print(f"Error stopping RTSP conversion: {e}")
            finally:
                self.process = None
                self.rtsp_url = None
                self.start_time = None
    
    def _monitor_process(self):
        """Monitor FFmpeg process and handle errors"""
        if not self.process:
            return
        
        try:
            # Read stderr in real-time
            while self.is_running and self.process.poll() is None:
                line = self.process.stderr.readline()
                if line:
                    # Log FFmpeg output (you can filter this based on your needs)
                    if "error" in line.lower() or "failed" in line.lower():
                        print(f"FFmpeg error: {line.strip()}")
                
                time.sleep(0.1)
            
            # Process has terminated
            if self.process.poll() is not None:
                stdout, stderr = self.process.communicate()
                if stderr and self.is_running:  # Only log if we didn't stop intentionally
                    print(f"FFmpeg process ended with error: {stderr}")
                
                self.is_running = False
                
        except Exception as e:
            print(f"Error monitoring FFmpeg process: {e}")
            self.is_running = False
    
    def get_status(self):
        """Get current conversion status"""
        return {
            "is_running": self.is_running,
            "rtsp_url": self.rtsp_url,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "duration": (datetime.utcnow() - self.start_time).total_seconds() if self.start_time else 0,
            "playlist_exists": os.path.exists(os.path.join(self.output_dir, 'playlist.m3u8'))
        }
    
    def cleanup_old_segments(self, max_age_seconds=300):
        """Clean up old segment files (older than max_age_seconds)"""
        try:
            current_time = time.time()
            for filename in os.listdir(self.output_dir):
                if filename.endswith('.ts'):
                    file_path = os.path.join(self.output_dir, filename)
                    file_age = current_time - os.path.getctime(file_path)
                    
                    if file_age > max_age_seconds:
                        os.remove(file_path)
                        print(f"Removed old segment: {filename}")
                        
        except Exception as e:
            print(f"Error cleaning up segments: {e}")
    
    def validate_rtsp_url(self, rtsp_url):
        """Validate RTSP URL by attempting a quick probe"""
        try:
            cmd = [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_streams',
                '-timeout', '10000000',  # 10 seconds timeout
                rtsp_url
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=15
            )
            
            return result.returncode == 0
            
        except subprocess.TimeoutExpired:
            print(f"RTSP URL validation timeout: {rtsp_url}")
            return False
        except FileNotFoundError:
            print("FFprobe not found. Cannot validate RTSP URL.")
            return True  # Assume valid if we can't validate
        except Exception as e:
            print(f"Error validating RTSP URL: {e}")
            return False