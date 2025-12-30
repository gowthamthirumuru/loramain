"""
Backend API Client for LoRa Tourist Safety System
Sends trilaterated positions to the Node.js backend
"""

import requests
import time
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from config.settings import BACKEND_URL, GATEWAY_API_KEY, GPS_REFERENCE


class BackendClient:
    """HTTP client for communicating with the Tourist Safety Backend"""
    
    def __init__(self):
        self.base_url = BACKEND_URL
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': GATEWAY_API_KEY
        }
        self.timeout = 5  # seconds
        self.retry_count = 3
        self.connected = False
    
    def check_connection(self):
        """Test if backend is reachable"""
        try:
            response = requests.get(
                f"{self.base_url}/health",
                timeout=3
            )
            self.connected = response.status_code == 200
            return self.connected
        except Exception as e:
            print(f"[Backend] Connection check failed: {e}")
            self.connected = False
            return False
    
    def send_location(self, device_id, x, y, rssi_avg, sos_flag=False):
        """
        Send trilaterated location to backend.
        
        Args:
            device_id (str): Tourist device ID (e.g., "DEV001")
            x (float): X coordinate in meters (from trilateration)
            y (float): Y coordinate in meters (from trilateration)
            rssi_avg (int): Average RSSI value
            sos_flag (bool): True if SOS button pressed
        
        Returns:
            bool: True if successful, False otherwise
        """
        # Convert local X,Y to lat/lng
        lat, lng = self._convert_to_gps(x, y)
        
        payload = {
            "device_id": device_id,
            "lat": lat,
            "lng": lng,
            "rssi": rssi_avg,
            "sos_flag": sos_flag
        }
        
        for attempt in range(self.retry_count):
            try:
                response = requests.post(
                    f"{self.base_url}/api/location/update",
                    json=payload,
                    headers=self.headers,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    print(f"[Backend] ✅ Location sent: ({lat:.6f}, {lng:.6f})")
                    self.connected = True
                    return True
                elif response.status_code == 404:
                    print(f"[Backend] ⚠️ Device not registered: {device_id}")
                    print(f"[Backend] Register tourist first at POST /api/tourist/register")
                    return False
                elif response.status_code == 401:
                    print(f"[Backend] ❌ Invalid API key")
                    return False
                else:
                    print(f"[Backend] ❌ Error {response.status_code}: {response.text}")
                    
            except requests.exceptions.Timeout:
                print(f"[Backend] ⏱️ Timeout (attempt {attempt + 1}/{self.retry_count})")
            except requests.exceptions.ConnectionError:
                print(f"[Backend] 🔌 Connection failed (attempt {attempt + 1}/{self.retry_count})")
                self.connected = False
            except Exception as e:
                print(f"[Backend] ❌ Error: {e}")
            
            if attempt < self.retry_count - 1:
                time.sleep(1)  # Wait before retry
        
        return False
    
    def send_heartbeat(self, anchor_id="MASTER", stats=None):
        """
        Send gateway heartbeat to backend.
        
        Args:
            anchor_id (str): Anchor identifier
            stats (dict): Optional statistics
        
        Returns:
            bool: True if successful
        """
        payload = {
            "anchor_id": anchor_id,
            "stats": stats or {}
        }
        
        try:
            response = requests.post(
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
        
        Args:
            locations (list): List of location dicts with device_id, x, y, rssi, sos_flag
        
        Returns:
            dict: Results with processed/failed counts
        """
        # Convert all locations to GPS
        converted = []
        for loc in locations:
            lat, lng = self._convert_to_gps(loc['x'], loc['y'])
            converted.append({
                "device_id": loc['device_id'],
                "lat": lat,
                "lng": lng,
                "rssi": loc.get('rssi', -70),
                "sos_flag": loc.get('sos_flag', False),
                "timestamp": loc.get('timestamp')
            })
        
        try:
            response = requests.post(
                f"{self.base_url}/api/gateway/batch-update",
                json={"locations": converted},
                headers=self.headers,
                timeout=self.timeout * 2
            )
            
            if response.status_code == 200:
                return response.json().get('data', {})
            return {"processed": 0, "failed": len(locations)}
            
        except Exception as e:
            print(f"[Backend] Batch update failed: {e}")
            return {"processed": 0, "failed": len(locations)}
    
    def _convert_to_gps(self, x, y):
        """
        Convert local X,Y coordinates to GPS lat/lng.
        
        Uses the GPS reference point from config and simple offset calculation.
        For production, implement proper coordinate transformation.
        
        Args:
            x (float): X coordinate in meters
            y (float): Y coordinate in meters
        
        Returns:
            tuple: (latitude, longitude)
        """
        # Reference point (GPS coords of MASTER anchor at x=0, y=0)
        ref_lat = GPS_REFERENCE.get('lat', 11.0168)
        ref_lng = GPS_REFERENCE.get('lng', 76.9558)
        
        # Approximate conversion factors
        # 1 degree latitude ≈ 111,000 meters
        # 1 degree longitude ≈ 111,000 * cos(latitude) meters
        import math
        meters_per_deg_lat = 111000
        meters_per_deg_lng = 111000 * math.cos(math.radians(ref_lat))
        
        # Calculate offset
        lat = ref_lat + (y / meters_per_deg_lat)
        lng = ref_lng + (x / meters_per_deg_lng)
        
        return round(lat, 6), round(lng, 6)
    
    def register_anchor(self, anchor_id, name, x, y, gps_lat=None, gps_lng=None, is_master=False):
        """
        Register or update an anchor in the backend.
        
        Args:
            anchor_id (str): Anchor identifier
            name (str): Display name
            x, y (float): Local coordinates
            gps_lat, gps_lng (float): Optional GPS coordinates
            is_master (bool): Is this the master node
        
        Returns:
            bool: True if successful
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
            response = requests.post(
                f"{self.base_url}/api/gateway/anchors",
                json=payload,
                headers=self.headers,
                timeout=self.timeout
            )
            
            if response.status_code in [200, 201]:
                print(f"[Backend] ✅ Anchor {anchor_id} registered")
                return True
            print(f"[Backend] ❌ Failed to register anchor: {response.text}")
            return False
            
        except Exception as e:
            print(f"[Backend] ❌ Anchor registration failed: {e}")
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
