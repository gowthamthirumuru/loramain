import requests
import time
import sys
import os
import logging

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from config.settings import BACKEND_URL, GATEWAY_API_KEY
from src.utils.math_helper import MathEngine

logger = logging.getLogger(__name__)

class BackendClient:
    """HTTP client for communicating with the Tourist Safety Backend"""
    
    def __init__(self, session=None):
        self.base_url = BACKEND_URL
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': GATEWAY_API_KEY
        }
        self.timeout = 10  # increased from 5
        self.retry_count = 5 # increased from 3
        self.connected = False
        self.config_cache = {}  # Cache for system settings
        
        self.session = session or requests.Session()
        # If headers were set on session, update them
        self.session.headers.update(self.headers)
    
    def fetch_config(self):
        """
        Fetch system settings from backend and update local cache.
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/system/settings",
                headers=self.headers,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json().get('data', {})
                # Store specific keys we care about
                if 'gps_reference' in data:
                    self.config_cache['gps_reference'] = data['gps_reference']
                    logger.info(f"[Backend] Updated GPS Reference: {self.config_cache['gps_reference']}")
                return True
            else:
                logger.warning(f"[Backend] Failed to fetch config: {response.status_code}")
                return False
        except Exception as e:
            logger.warning(f"[Backend] Config fetch error: {e}")
            return False

    def check_connection(self):
        """Test if backend is reachable"""
        try:
            # Using health endpoint if available, or just root
            # Assuming backend has /api/health or similar. 
            response = self.session.get(
                f"{self.base_url}/health",
                timeout=3
            )
            self.connected = response.status_code == 200
            return self.connected
        except Exception as e:
            logger.warning(f"[Backend] Connection check failed: {e}")
            self.connected = False
            return False
    
    def send_location(self, device_id, x, y, rssi_avg, sos_flag=False):
        """
        Send trilaterated location to backend.
        """
        # Convert to GPS using MathEngine and specific reference if available
        lat, lng = MathEngine.convert_to_gps(
            x, y, 
            reference_point=self.config_cache.get('gps_reference')
        )

        # Send raw X,Y coordinates (meters) and GPS
        payload = {
            "device_id": device_id,
            "x": round(x, 2),
            "y": round(y, 2),
            "lat": lat,
            "lng": lng,
            "rssi": rssi_avg,
            "sos_flag": sos_flag
        }
        
        for attempt in range(self.retry_count):
            try:
                response = self.session.post(
                    f"{self.base_url}/api/location/update",
                    json=payload,
                    headers=self.headers,
                    timeout=self.timeout
                )
                
                if response.status_code == 200 or response.status_code == 201:
                    logger.info(f"[Backend] Location sent: {device_id} ({lat}, {lng})")
                    self.connected = True
                    return True
                elif response.status_code == 404:
                    logger.warning(f"[Backend] Device not registered: {device_id}")
                    return False
                elif response.status_code == 401:
                    logger.error(f"[Backend] Invalid API key")
                    return False
                else:
                    logger.warning(f"[Backend] Error {response.status_code}: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                logger.warning(f"[Backend] Connection failed (attempt {attempt + 1}/{self.retry_count}): {e}")
                self.connected = False
            
            # Exponential backoff: 1s, 2s, 4s
            if attempt < self.retry_count - 1:
                sleep_time = 2 ** attempt
                time.sleep(sleep_time)
        
        logger.error(f"[Backend] Failed to send location for {device_id} after retries")
        return False
    
    def send_heartbeat(self, anchor_id="MASTER", stats=None):
        """
        Send gateway heartbeat to backend.
        """
        payload = {
            "anchor_id": anchor_id,
            "stats": stats or {}
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/gateway/heartbeat",
                json=payload,
                headers=self.headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                self.connected = True
                return True
            return False
            
        except Exception as e:
            self.connected = False
            return False
    
    def send_batch_locations(self, locations):
        """
        Send multiple locations at once (for offline sync).
        """
        # Convert all locations to GPS
        converted = []
        for loc in locations:
            lat, lng = MathEngine.convert_to_gps(
                loc['x'], loc['y'],
                reference_point=self.config_cache.get('gps_reference')
            )
            converted.append({
                "device_id": loc['device_id'],
                "x": loc.get('x', 0),
                "y": loc.get('y', 0),
                "lat": lat,
                "lng": lng,
                "rssi": loc.get('rssi', -70),
                "sos_flag": loc.get('sos_flag', False),
                "timestamp": loc.get('timestamp')
            })
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/gateway/batch-update",
                json={"locations": converted},
                headers=self.headers,
                timeout=self.timeout * 2
            )
            
            if response.status_code == 200:
                return response.json().get('data', {})
            return {"processed": 0, "failed": len(locations)}
            
        except Exception as e:
            logger.error(f"[Backend] Batch update failed: {e}")
            return {"processed": 0, "failed": len(locations)}
    
    def register_anchor(self, anchor_id, name, x, y, gps_lat=None, gps_lng=None, is_master=False):
        """
        Register or update an anchor in the backend.
        """
        payload = {
            "anchor_id": anchor_id,
            "name": name,
            "local_position": {"x": x, "y": y},
            "is_master": is_master
        }
        
        if gps_lat and gps_lng:
            payload["gps_position"] = {"lat": gps_lat, "lng": gps_lng}
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/gateway/anchors",
                json=payload,
                headers=self.headers,
                timeout=self.timeout
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"[Backend] Anchor {anchor_id} registered")
                return True
            logger.warning(f"[Backend] Failed to register anchor: {response.text}")
            return False
            
        except Exception as e:
            logger.error(f"[Backend] Anchor registration failed: {e}")
            return False


# ============ TEST BLOCK ============
if __name__ == "__main__":
    print("--- Testing Backend Client ---")
    
    client = BackendClient()
    
    # Test connection
    print("\n1. Testing connection...")
    if client.check_connection():
        print("   ✅ Backend is reachable")
    else:
        print("   ❌ Backend is not reachable")
        print(f"   URL: {client.base_url}")
        sys.exit(1)
    
    # Test heartbeat
    print("\n2. Sending heartbeat...")
    if client.send_heartbeat():
        print("   ✅ Heartbeat acknowledged")
    else:
        print("   ❌ Heartbeat failed")
    
    # Test location (will fail if tourist not registered)
    print("\n3. Sending test location...")
    result = client.send_location(
        device_id="DEV001",
        x=50.0,
        y=30.0,
        rssi_avg=-65,
        sos_flag=False
    )
    
    if result:
        print("   ✅ Location sent successfully")
    else:
        print("   ⚠️ Location send failed (tourist may not be registered)")
    
    print("\n--- Test Complete ---")
