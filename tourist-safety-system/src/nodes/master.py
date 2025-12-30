"""
LoRa Master Node (Anchor 1 / Gateway)
Collects RSSI readings, performs trilateration, and sends positions to backend.
"""

import time
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import SX126X
from src.utils.math_helper import MathEngine
from src.utils.backend_client import BackendClient
from config.settings import get_anchors, IS_RASPBERRY_PI


def run_master():
    print("=" * 50)
    print("   LoRa MASTER NODE (GATEWAY)")
    print("=" * 50)
    
    # Initialize LoRa (only on Raspberry Pi)
    if IS_RASPBERRY_PI:
        lora = SX126X()
        print("[LoRa] ✅ Hardware initialized")
    else:
        lora = None
        print("[LoRa] ⚠️ Running in simulation mode (not on Pi)")
    
    # Load anchor positions
    anchors = get_anchors()
    if anchors:
        print(f"[Config] ✅ Loaded {len(anchors)} anchors")
    else:
        print("[Config] ❌ No anchors loaded! Check anchors.json")
        return
    
    # Initialize backend client
    backend = BackendClient()
    print(f"[Backend] Connecting to {backend.base_url}...")
    
    if backend.check_connection():
        print("[Backend] ✅ Connected to backend server")
        # Send initial heartbeat
        backend.send_heartbeat(anchor_id="MASTER", stats={"startup": True})
    else:
        print("[Backend] ⚠️ Backend unreachable - will retry on each update")
    
    # State tracking
    current_readings = {}
    last_ping_time = time.time()
    last_heartbeat_time = time.time()
    current_device_id = None
    is_sos = False
    
    # Counters
    total_positions = 0
    successful_sends = 0
    
    print("\n[System] Entering main loop...")
    print("[System] Waiting for tourist PING messages...\n")
    
    while True:
        # Status indicator
        print(".", end="", flush=True)
        
        # ============ 1. RECEIVE DATA ============
        msg, rssi = None, None
        
        if lora:
            msg, rssi = lora.receive()
        else:
            # Simulation mode - uncomment to test without hardware
            # import random
            # if random.random() < 0.1:  # 10% chance of receiving
            #     msg = "PING:DEV001"
            #     rssi = random.randint(-80, -50)
            pass
        
        # ============ 2. PROCESS RECEIVED MESSAGE ============
        if msg:
            print(f"\n[Rx] Raw: {msg} | RSSI: {rssi}")
            
            # Case A: Direct ping from Tourist device
            # Expected format: "PING:DEV001" or "SOS:DEV001"
            if "PING" in msg or "SOS" in msg:
                print(f"[Rx] 📍 Direct hit from tourist! RSSI: {rssi}")
                current_readings["MASTER"] = rssi
                last_ping_time = time.time()
                
                # Extract device ID and SOS status
                try:
                    parts = msg.split(":")
                    if len(parts) >= 2:
                        current_device_id = parts[1].strip().upper()
                    is_sos = "SOS" in msg
                    
                    if is_sos:
                        print(f"[Rx] 🚨 SOS SIGNAL from {current_device_id}!")
                except Exception as e:
                    print(f"[Rx] ⚠️ Could not parse device ID: {e}")
                    current_device_id = "UNKNOWN"
            
            # Case B: Report from Relay anchor
            # Expected format: "REPORT:ANCHOR_2:-65"
            elif "REPORT" in msg:
                try:
                    parts = msg.split(":")
                    sender_id = parts[1].strip().upper()
                    reported_rssi = int(parts[2])
                    
                    print(f"[Rx] 📡 Report from {sender_id}: {reported_rssi} dBm")
                    current_readings[sender_id] = reported_rssi
                except Exception as e:
                    print(f"[Rx] ❌ Bad packet format: {msg} ({e})")

        # ============ 3. CHECK DATA STATUS ============
        if len(current_readings) > 0:
            keys = list(current_readings.keys())
            print(f"\r[Status] Readings: {keys} ({len(current_readings)}/3)", end="", flush=True)

        # ============ 4. TRILATERATION (when we have 3 readings) ============
        if len(current_readings) >= 3:
            print("\n\n" + "=" * 40)
            print("   TRIANGULATING POSITION")
            print("=" * 40)
            
            tri_input = []
            rssi_values = []
            
            # Process each anchor's reading
            for anchor_name in ["MASTER", "ANCHOR_2", "ANCHOR_3"]:
                if anchor_name in current_readings and anchor_name in anchors:
                    rssi_val = current_readings[anchor_name]
                    distance = MathEngine.rssi_to_distance(rssi_val)
                    
                    tri_input.append({
                        'x': anchors[anchor_name]["x"],
                        'y': anchors[anchor_name]["y"],
                        'r': distance
                    })
                    rssi_values.append(rssi_val)
                    
                    print(f"  {anchor_name}: RSSI={rssi_val} dBm → Distance={distance:.2f}m")
            
            # Perform trilateration
            if len(tri_input) >= 3:
                result = MathEngine.trilaterate(tri_input)
                
                if result:
                    x, y = result[0], result[1]
                    total_positions += 1
                    
                    print(f"\n  ✅ TOURIST POSITION: X={x:.2f}m, Y={y:.2f}m")
                    
                    if is_sos:
                        print(f"  🚨 SOS ACTIVE for device {current_device_id}")
                    
                    # ============ 5. SEND TO BACKEND ============
                    if current_device_id:
                        rssi_avg = int(sum(rssi_values) / len(rssi_values))
                        
                        success = backend.send_location(
                            device_id=current_device_id,
                            x=x,
                            y=y,
                            rssi_avg=rssi_avg,
                            sos_flag=is_sos
                        )
                        
                        if success:
                            successful_sends += 1
                    else:
                        print("  ⚠️ No device ID - position not sent to backend")
                    
                    print(f"\n  [Stats] Positions: {total_positions} | Sent: {successful_sends}")
                    
                else:
                    print("\n  ❌ Trilateration failed (math error)")
                    print("     Check if anchors are collinear or distances are inconsistent")
            
            # Reset for next cycle
            current_readings = {}
            current_device_id = None
            is_sos = False
            
            print("=" * 40)
            print("Waiting for next ping...\n")

        # ============ 6. TIMEOUT LOGIC ============
        if time.time() - last_ping_time > 10 and len(current_readings) > 0:
            print("\n[Timeout] No complete data in 10s. Clearing buffer.")
            current_readings = {}
            current_device_id = None
            is_sos = False
            last_ping_time = time.time()
        
        # ============ 7. PERIODIC HEARTBEAT ============
        if time.time() - last_heartbeat_time > 60:  # Every 60 seconds
            backend.send_heartbeat(
                anchor_id="MASTER",
                stats={
                    "total_positions": total_positions,
                    "successful_sends": successful_sends,
                    "uptime_minutes": int((time.time() - last_heartbeat_time) / 60)
                }
            )
            last_heartbeat_time = time.time()
        
        # Small delay to prevent CPU overload
        time.sleep(0.01)


if __name__ == "__main__":
    try:
        run_master()
    except KeyboardInterrupt:
        print("\n\n[System] Shutting down master node...")
        sys.exit(0)