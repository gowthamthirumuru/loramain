import time
import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import sx126x
from src.utils.math_helper import MathEngine
from config.settings import get_anchors, SERIAL_PORT, LORA_SETTINGS

def run_master():
    print("--- STARTING MASTER NODE (ANCHOR 1) ---")
    
    # Get frequency from centralized config
    freq = LORA_SETTINGS.get("FREQUENCY", 868)
    
    # Initialize LoRa: addr=1 for Master, rssi=True to get signal strength
    lora = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=1, power=22, rssi=True)
    anchors = get_anchors()
    
    # Validate required anchors exist
    required_anchors = ["MASTER", "ANCHOR_2", "ANCHOR_3"]
    missing = [a for a in required_anchors if a not in anchors]
    if missing:
        print(f"[ERROR] Missing anchor config: {missing}")
        print("Please check config/anchors.json")
        return
    
    print(f"[INFO] Loaded anchors: {list(anchors.keys())}")
    print(f"[INFO] Using frequency: {freq} MHz")
    
    current_readings = {}
    last_ping_time = time.time()
    
    print("[INFO] Entering Main Loop... Waiting for signals.")
    
    try:
        while True:
            # 1. RECEIVE DATA
            msg, rssi = lora.receive() 
            
            if msg:
                # Case A: Direct hit from Tourist (PING message)
                if "PING" in msg:
                    print(f"\n[Rx] Direct Hit from Tourist! RSSI: {rssi} dBm")
                    current_readings["MASTER"] = rssi
                    last_ping_time = time.time()
                
                # Case B: Report from Relay
                elif "REPORT" in msg:
                    try:
                        parts = msg.split(":")
                        sender_id = parts[1] 
                        reported_rssi = int(parts[2])
                        
                        print(f"[Rx] Report from {sender_id}: {reported_rssi} dBm")
                        current_readings[sender_id] = reported_rssi
                    except (IndexError, ValueError) as e:
                        print(f"[Err] Bad Packet Format: {msg} - {e}")

            # 2. STATUS UPDATE (only when we have some data)
            if len(current_readings) > 0 and len(current_readings) < 3:
                print(f"[Status] Readings: {list(current_readings.keys())} ({len(current_readings)}/3)", end='\r')

            # 3. TRIANGULATE when we have all 3 readings
            if len(current_readings) >= 3:
                print("\n" + "="*50)
                print("--- TRIANGULATING POSITION ---")
                
                tri_input = []
                distances = {}
                
                # Add Master reading
                if "MASTER" in current_readings:
                    dist = MathEngine.rssi_to_distance(current_readings["MASTER"])
                    distances["MASTER"] = dist
                    tri_input.append({
                        'x': anchors["MASTER"]["x"], 
                        'y': anchors["MASTER"]["y"], 
                        'r': dist
                    })
                
                # Add Anchor 2 reading
                if "ANCHOR_2" in current_readings:
                    dist = MathEngine.rssi_to_distance(current_readings["ANCHOR_2"])
                    distances["ANCHOR_2"] = dist
                    tri_input.append({
                        'x': anchors["ANCHOR_2"]["x"], 
                        'y': anchors["ANCHOR_2"]["y"], 
                        'r': dist
                    })

                # Add Anchor 3 reading
                if "ANCHOR_3" in current_readings:
                    dist = MathEngine.rssi_to_distance(current_readings["ANCHOR_3"])
                    distances["ANCHOR_3"] = dist
                    tri_input.append({
                        'x': anchors["ANCHOR_3"]["x"], 
                        'y': anchors["ANCHOR_3"]["y"], 
                        'r': dist
                    })

                # Print distances
                dist_str = ", ".join([f"{k}: {v:.2f}m" for k, v in distances.items()])
                print(f"Distances: {dist_str}")

                # Calculate position
                if len(tri_input) >= 3:
                    result = MathEngine.trilaterate(tri_input)
                    
                    if result:
                        print(f"✅ TOURIST LOCATED AT: X={result[0]:.2f}, Y={result[1]:.2f}")
                    else:
                        print("❌ Calculation Failed (Math Error - check if anchors are collinear)")
                else:
                    print("❌ Not enough valid readings for triangulation")
                
                current_readings = {}
                print("="*50)
                print("--- WAITING FOR NEXT PING ---\n")

            # 4. TIMEOUT: Clear stale data after 10 seconds
            if time.time() - last_ping_time > 10 and len(current_readings) > 0:
                print("\n[Info] Data timeout (10s). Clearing incomplete readings.")
                current_readings = {}
                last_ping_time = time.time()
                
            time.sleep(0.01)
            
    except KeyboardInterrupt:
        print("\n[Master] Shutting down...")
    finally:
        # Cleanup GPIO on exit
        try:
            import RPi.GPIO as GPIO
            GPIO.cleanup()
            print("[Master] GPIO cleaned up.")
        except:
            pass