# 🔗 LoRa to Backend Integration — Complete Workflow Plan

> **Guide for connecting the LoRa Tourist Safety System to the Node.js Backend**

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE SYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────┐                                                               │
│   │   TOURIST   │ ─── LoRa Signal ───┐                                          │
│   │   DEVICE    │                    │                                          │
│   │ (Sender Pi) │                    ▼                                          │
│   └─────────────┘           ┌─────────────────┐                                 │
│                             │   RELAY NODES   │                                 │
│                             │  (Anchor 2 & 3) │                                 │
│                             └────────┬────────┘                                 │
│                                      │ RSSI Reports                             │
│                                      ▼                                          │
│                             ┌─────────────────┐                                 │
│                             │   MASTER NODE   │ ◄── Trilateration Engine        │
│                             │   (Anchor 1)    │                                 │
│                             │  Raspberry Pi   │                                 │
│                             └────────┬────────┘                                 │
│                                      │                                          │
│                                      │ HTTP POST (Position + SOS Data)          │
│                                      ▼                                          │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                         BACKEND SERVER                                   │  │
│   │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────────┐  │  │
│   │  │  Express.js │   │  MongoDB    │   │  Socket.IO  │   │  REST API    │  │  │
│   │  │   Server    │──▶│  Database   │──▶│  Real-Time  │──▶│  Endpoints   │  │  │
│   │  └─────────────┘   └─────────────┘   └─────────────┘   └──────────────┘  │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                          │
│                                      │ WebSocket / HTTP                         │
│                                      ▼                                          │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  📱 MOBILE APP        🖥️ WEB DASHBOARD        🚨 ALERT SYSTEMS           │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Current Project Structure

### LoRa System (`tourist-safety-system/`)
| File | Purpose |
|------|---------|
| `main.py` | CLI entry point for node roles |
| `src/nodes/master.py` | **Gateway** - Collects RSSI, trilaterates position |
| `src/nodes/relay.py` | Anchor nodes that report RSSI to master |
| `src/nodes/tourist.py` | Tourist wearable that broadcasts pings |
| `src/utils/math_helper.py` | RSSI → Distance + Trilateration |
| `config/settings.py` | LoRa & environment configuration |

### Backend (`tourist safety backend/`)
| File | Purpose |
|------|---------|
| `src/server.js` | Main server with Socket.IO |
| `src/app.js` | Express app configuration |
| `src/routes/apiRoutes.js` | All API endpoints |
| `src/controllers/locationController.js` | **Key file** - Handles location updates |
| `src/controllers/touristController.js` | Tourist registration |
| `src/controllers/adminController.js` | SOS management |
| `src/models/*.js` | MongoDB schemas |
| `src/utils/socketService.js` | Socket.IO broadcast service |

---

## 🎯 Integration Tasks Checklist

### Phase 1: Core Backend Connection
- [ ] Create API client module in LoRa system
- [ ] Modify `master.py` to send positions to backend
- [ ] Add device_id to tourist ping messages
- [ ] Handle SOS flag detection and forwarding
- [ ] Add retry logic for failed API calls

### Phase 2: Configuration
- [ ] Add backend URL to `config/settings.py`
- [ ] Set up API key authentication
- [ ] Configure request timeouts

### Phase 3: Testing & Validation
- [ ] Test with simulated data
- [ ] Test SOS trigger flow
- [ ] Verify Socket.IO broadcasts
- [ ] Test offline/reconnection behavior

---

## 🔧 Implementation Details

### Step 1: Create API Client Module

Create a new file: `src/utils/backend_client.py`

```python
"""
Backend API Client for LoRa Tourist Safety System
Sends trilaterated positions to the Node.js backend
"""

import requests
import time
from config.settings import BACKEND_URL, API_KEY

class BackendClient:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        }
        self.timeout = 5  # seconds
        self.retry_count = 3
    
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
        # Convert local X,Y to lat/lng (requires anchor GPS calibration)
        # For now, we use X,Y directly as relative coordinates
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
                    print(f"[Backend] ✅ Location sent successfully")
                    return True
                elif response.status_code == 404:
                    print(f"[Backend] ⚠️ Device not registered: {device_id}")
                    return False
                else:
                    print(f"[Backend] ❌ Error {response.status_code}: {response.text}")
                    
            except requests.exceptions.Timeout:
                print(f"[Backend] ⏱️ Timeout (attempt {attempt + 1}/{self.retry_count})")
            except requests.exceptions.ConnectionError:
                print(f"[Backend] 🔌 Connection failed (attempt {attempt + 1}/{self.retry_count})")
            except Exception as e:
                print(f"[Backend] ❌ Error: {e}")
            
            time.sleep(1)  # Wait before retry
        
        return False
    
    def _convert_to_gps(self, x, y):
        """
        Convert local X,Y coordinates to GPS lat/lng.
        
        This requires calibration with actual GPS reference points.
        For now, returns placeholder values.
        
        TODO: Implement proper coordinate transformation based on:
        1. GPS coordinates of MASTER anchor
        2. Orientation of the anchor triangle
        3. Scale factor (meters to degrees)
        """
        # Placeholder: Use config-defined reference point
        # These should be the GPS coords of your MASTER anchor
        REF_LAT = 11.0168  # Example: Coimbatore area
        REF_LNG = 76.9558
        
        # Approximate conversion (1 degree ≈ 111,000 meters at equator)
        # This is a rough approximation - use proper projection for production
        METERS_PER_DEGREE_LAT = 111000
        METERS_PER_DEGREE_LNG = 111000 * 0.9  # Adjust for latitude
        
        lat = REF_LAT + (y / METERS_PER_DEGREE_LAT)
        lng = REF_LNG + (x / METERS_PER_DEGREE_LNG)
        
        return round(lat, 6), round(lng, 6)
    
    def check_connection(self):
        """Test if backend is reachable"""
        try:
            response = requests.get(
                f"{self.base_url}/",
                timeout=3
            )
            return response.status_code == 200
        except:
            return False
```

---

### Step 2: Update Configuration

Add to `config/settings.py`:

```python
# --- 5. Backend API Configuration ---
BACKEND_URL = "http://localhost:5000"  # Change to your server IP in production
API_KEY = "your-api-key-here"          # For authentication

# GPS Reference Point (MASTER anchor location)
# This is needed to convert X,Y coordinates to lat/lng
GPS_REFERENCE = {
    "lat": 11.0168,   # Latitude of MASTER anchor
    "lng": 76.9558    # Longitude of MASTER anchor
}
```

---

### Step 3: Modify Master Node

Update `src/nodes/master.py` to send data to backend:

```python
import time
import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import SX126X
from src.utils.math_helper import MathEngine
from src.utils.backend_client import BackendClient  # NEW
from config.settings import get_anchors

def run_master():
    print("--- STARTING MASTER NODE (ANCHOR 1) ---")
    
    lora = SX126X()
    anchors = get_anchors()
    backend = BackendClient()  # NEW: Initialize backend client
    
    # Check backend connection
    if backend.check_connection():
        print("[Backend] ✅ Connected to backend server")
    else:
        print("[Backend] ⚠️ Backend unreachable - will retry on each update")
    
    current_readings = {}
    last_ping_time = time.time()
    current_device_id = None  # Track which device sent the ping
    is_sos = False            # Track SOS status
    
    print("[DEBUG] Entering Main Loop...")
    
    while True:
        print(".", end="", flush=True)
        
        # 1. RECEIVE DATA
        msg, rssi = lora.receive() 
        
        if msg:
            print(f"[DEBUG] Raw RX: {msg} | RSSI: {rssi}")
            
            # Case A: Direct hit from Tourist - NOW WITH DEVICE ID
            # Expected format: "PING:DEV001" or "SOS:DEV001"
            if "PING" in msg or "SOS" in msg:
                print(f"[Rx] Direct Hit! RSSI: {rssi}")
                current_readings["MASTER"] = rssi
                last_ping_time = time.time()
                
                # Extract device ID
                try:
                    parts = msg.split(":")
                    if len(parts) >= 2:
                        current_device_id = parts[1].strip()
                    is_sos = "SOS" in msg
                except:
                    current_device_id = "UNKNOWN"
            
            # Case B: Report from Relay
            elif "REPORT" in msg:
                try:
                    parts = msg.split(":")
                    sender_id = parts[1] 
                    reported_rssi = int(parts[2])
                    
                    print(f"[Rx] Report from {sender_id}: {reported_rssi}")
                    current_readings[sender_id] = reported_rssi
                except:
                    print(f"[Err] Bad Packet Format: {msg}")

        # 2. CHECK FOR COMPLETE DATA
        if len(current_readings) > 0:
            print(f"[Status] Have readings: {list(current_readings.keys())} ({len(current_readings)}/3)")

        if len(current_readings) >= 3:
            print("\n--- TRIANGULATING ---")
            
            tri_input = []
            rssi_values = []
            
            # Add Master
            dist_m = MathEngine.rssi_to_distance(current_readings["MASTER"])
            tri_input.append({'x': anchors["MASTER"]["x"], 'y': anchors["MASTER"]["y"], 'r': dist_m})
            rssi_values.append(current_readings["MASTER"])
            
            # Add Anchor 2
            if "ANCHOR_2" in current_readings:
                dist_2 = MathEngine.rssi_to_distance(current_readings["ANCHOR_2"])
                tri_input.append({'x': anchors["ANCHOR_2"]["x"], 'y': anchors["ANCHOR_2"]["y"], 'r': dist_2})
                rssi_values.append(current_readings["ANCHOR_2"])

            # Add Anchor 3
            if "ANCHOR_3" in current_readings:
                dist_3 = MathEngine.rssi_to_distance(current_readings["ANCHOR_3"])
                tri_input.append({'x': anchors["ANCHOR_3"]["x"], 'y': anchors["ANCHOR_3"]["y"], 'r': dist_3})
                rssi_values.append(current_readings["ANCHOR_3"])

            print(f"Distances: {dist_m:.2f}m, {dist_2:.2f}m, {dist_3:.2f}m")

            result = MathEngine.trilaterate(tri_input)
            
            if result:
                x, y = result[0], result[1]
                print(f"✅ TOURIST LOCATED AT: X={x:.2f}, Y={y:.2f}")
                
                # ========== SEND TO BACKEND ==========
                rssi_avg = int(sum(rssi_values) / len(rssi_values))
                backend.send_location(
                    device_id=current_device_id or "UNKNOWN",
                    x=x,
                    y=y,
                    rssi_avg=rssi_avg,
                    sos_flag=is_sos
                )
                # =====================================
                
            else:
                print("❌ Calculation Failed (Math Error)")
            
            # Reset for next cycle
            current_readings = {}
            current_device_id = None
            is_sos = False
            print("--- WAITING FOR NEXT PING ---\n")

        # Timeout Logic
        if time.time() - last_ping_time > 10 and len(current_readings) > 0:
             print("[Info] Data timeout. Clearing buffer.")
             current_readings = {}
             last_ping_time = time.time()
            
        time.sleep(0.01)
```

---

### Step 4: Update Tourist Node Message Format

Update `src/nodes/tourist.py` to include device ID:

```python
import time
import sys
from src.drivers.sx126x import sx126x

# CONFIGURATION
DEVICE_ID = "DEV001"  # Unique ID for this tourist device

def run_tourist():
    print(f"[Tourist] Initializing LoRa Tracker (ID: {DEVICE_ID})...")
    
    node = sx126x(serial_num='/dev/ttyS0', freq=865, addr=100, power=22, rssi=False)
    
    # SOS Button (GPIO setup would go here)
    is_sos = False  # Set to True when SOS button pressed
    
    try:
        while True:
            # Check SOS button status (hardware dependent)
            # is_sos = GPIO.input(SOS_PIN) == GPIO.HIGH
            
            # MESSAGE FORMAT: "TYPE:DEVICE_ID"
            if is_sos:
                message = f"SOS:{DEVICE_ID}"
                print(f"[Tourist] 🚨 SOS SENT: {message}")
            else:
                message = f"PING:{DEVICE_ID}"
                print(f"[Tourist] Ping Sent: {message}")
            
            node.send(message.encode())
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("[Tourist] Stopping...")
```

---

## 🌐 API Endpoints Reference

### Backend Expects:

| Endpoint | Method | Request Body | Description |
|----------|--------|--------------|-------------|
| `/api/tourist/register` | POST | `{name, phone, device_id, emergency_contact}` | Register tourist before trip |
| `/api/location/update` | POST | `{device_id, lat, lng, rssi, sos_flag}` | **Called by Master Node** |
| `/api/tourist/:id/history` | GET | - | Get location history |
| `/api/sos/active` | GET | - | Get all active SOS alerts |
| `/api/sos/resolve` | POST | `{sos_id}` | Mark SOS as resolved |

### Socket.IO Events:

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `location_update` | Server → Client | `{tourist_id, name, lat, lng, status, sos}` | Real-time position update |
| `sos_alert` | Server → Client | `{tourist_name, location}` | Emergency notification |

---

## 🔄 Data Flow Sequence

```
1. TOURIST DEVICE
   │
   │ Broadcasts: "PING:DEV001" or "SOS:DEV001"
   │ (every 2 seconds via LoRa)
   ▼
2. ALL ANCHOR NODES RECEIVE
   │
   │ Each anchor measures RSSI
   │ Relays report to Master: "REPORT:ANCHOR_2:-65"
   ▼
3. MASTER NODE (trilateration)
   │
   │ Collects 3 RSSI values
   │ Calculates position (X, Y)
   │ Converts to GPS (lat, lng)
   ▼
4. HTTP POST to Backend
   │
   │ POST /api/location/update
   │ {device_id, lat, lng, rssi, sos_flag}
   ▼
5. BACKEND PROCESSES
   │
   │ ├─ Saves to MongoDB (LocationLog)
   │ ├─ Updates Tourist record
   │ ├─ If SOS → Creates SOSAlert
   │ └─ Emits Socket.IO event
   ▼
6. DASHBOARD RECEIVES
   │
   │ Socket.IO: 'location_update' or 'sos_alert'
   │ Updates map in real-time
   ▼
7. RESCUE TEAM ACTS (if SOS)
```

---

## 🔐 Security Considerations

### Current (Phase 1)
- [ ] Add `X-API-Key` header check in backend middleware
- [ ] Use environment variables for sensitive config
- [ ] Validate device_id exists before accepting updates

### Future (Phase 2)
- [ ] JWT authentication for dashboard users
- [ ] Rate limiting on `/api/location/update`
- [ ] HTTPS for production deployment

---

## 🧪 Testing the Integration

### 1. Test Backend Manually
```bash
# Start backend
cd "tourist safety backend"
npm run dev

# Test location update with curl
curl -X POST http://localhost:5000/api/location/update \
  -H "Content-Type: application/json" \
  -d '{"device_id":"DEV001","lat":11.0168,"lng":76.9558,"rssi":-65,"sos_flag":false}'
```

### 2. Test with Python Script
```python
# test_backend_connection.py
import requests

response = requests.post(
    "http://localhost:5000/api/location/update",
    json={
        "device_id": "DEV001",
        "lat": 11.0168,
        "lng": 76.9558,
        "rssi": -65,
        "sos_flag": False
    }
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
```

### 3. Register a Test Tourist First
```bash
curl -X POST http://localhost:5000/api/tourist/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"9999999999","device_id":"DEV001","emergency_contact":"8888888888"}'
```

---

## 📦 Dependencies to Install

### On Raspberry Pi (Master Node)
```bash
pip3 install requests
```

### Backend (if not already installed)
```bash
cd "tourist safety backend"
npm install
```

---

## 🚀 Deployment Checklist

### Raspberry Pi (Master Node)
- [ ] Install `requests` library
- [ ] Add `backend_client.py` to `src/utils/`
- [ ] Update `settings.py` with backend URL
- [ ] Set WiFi/Ethernet connection to reach backend server
- [ ] Configure GPS reference point for your location

### Backend Server
- [ ] Set `MONGO_URI` in `.env`
- [ ] Deploy to cloud (Render/Railway/VPS) OR run on local network
- [ ] Note the server IP/URL
- [ ] Update `BACKEND_URL` in Pi's `settings.py`

---

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Device not associated" error | Register tourist with device_id first via `/api/tourist/register` |
| Connection timeout | Check network, firewall rules, backend server status |
| Position not appearing on map | Verify lat/lng conversion, check browser console for Socket errors |
| Multiple tourists not tracked | Each tourist device needs unique `DEVICE_ID` |

---

## 📝 Summary

The integration connects:

1. **LoRa Master Node** → Sends HTTP POST with position data
2. **Backend API** → Receives, stores, and broadcasts
3. **Dashboard** → Displays via Socket.IO real-time updates

**Key Files to Modify:**
- [`src/utils/backend_client.py`](file:///a:/loramain/tourist-safety-system/src/utils/backend_client.py) — NEW
- [`src/nodes/master.py`](file:///a:/loramain/tourist-safety-system/src/nodes/master.py) — Add backend calls
- [`src/nodes/tourist.py`](file:///a:/loramain/tourist-safety-system/src/nodes/tourist.py) — Add device ID
- [`config/settings.py`](file:///a:/loramain/tourist-safety-system/config/settings.py) — Add backend URL

**Key Backend Files:**
- [`locationController.js`](file:///a:/loramain/tourist%20safety%20backend/src/controllers/locationController.js) — Handles incoming data

---

*Last Updated: December 30, 2025*
