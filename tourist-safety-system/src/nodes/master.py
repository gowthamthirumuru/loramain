import time
import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import SX126X
from src.utils.math_helper import MathEngine
from config.settings import get_anchors

def run_master():
    print("--- STARTING MASTER NODE (ANCHOR 1) ---")
    
    lora = SX126X()
    anchors = get_anchors() # Load coordinates from config
    
    # Storage for current calculation cycle
    # Format: {'MASTER': -50, 'ANCHOR_2': -80, 'ANCHOR_3': -90}
    current_readings = {}
    last_ping_time = time.time()
    
    while True:
        msg, rssi = lora.receive()
        
        if msg:
            # Case A: Direct hit from Tourist (Master hears it directly)
            if "PING" in msg:
                print(f"[Rx] Direct Hit! RSSI: {rssi}")
                current_readings["MASTER"] = rssi
                last_ping_time = time.time()
            
            # Case B: Report from Relay (Anchor 2 or 3 hears it)
            elif "REPORT" in msg:
                # Payload: "REPORT:ANCHOR_2:-80"
                try:
                    parts = msg.split(":")
                    sender_id = parts[1] # e.g., ANCHOR_2
                    reported_rssi = int(parts[2])
                    
                    print(f"[Rx] Report from {sender_id}: {reported_rssi}")
                    current_readings[sender_id] = reported_rssi
                except:
                    print("[Err] Bad Report Packet")

        # Check if we have enough data to calculate location
        # We need data from MASTER + ANCHOR_2 + ANCHOR_3
        if len(current_readings) >= 3:
            print("\n--- TRIANGULATING ---")
            
            # 1. Prepare Data for Math Engine
            tri_input = []
            
            # Add Master Data
            dist_m = MathEngine.rssi_to_distance(current_readings["MASTER"])
            tri_input.append({'x': anchors["MASTER"]["x"], 'y': anchors["MASTER"]["y"], 'r': dist_m})
            
            # Add Anchor 2 Data
            if "ANCHOR_2" in current_readings:
                dist_2 = MathEngine.rssi_to_distance(current_readings["ANCHOR_2"])
                tri_input.append({'x': anchors["ANCHOR_2"]["x"], 'y': anchors["ANCHOR_2"]["y"], 'r': dist_2})

            # Add Anchor 3 Data
            if "ANCHOR_3" in current_readings:
                dist_3 = MathEngine.rssi_to_distance(current_readings["ANCHOR_3"])
                tri_input.append({'x': anchors["ANCHOR_3"]["x"], 'y': anchors["ANCHOR_3"]["y"], 'r': dist_3})

            print(f"Distances: {dist_m}m, {dist_2}m, {dist_3}m")

            # 2. Calculate
            result = MathEngine.trilaterate(tri_input)
            
            if result:
                print(f"✅ TOURIST LOCATED AT: X={result[0]}, Y={result[1]}")
                # TODO: Save this to a file for the dashboard later
            else:
                print("❌ Calculation Failed (Math Error)")
            
            # 3. Reset for next cycle
            current_readings = {}
            print("--- WAITING FOR NEXT PING ---\n")

        # Timeout: If readings are too old (e.g., > 10 seconds), clear them
        if time.time() - last_ping_time > 10 and len(current_readings) > 0:
             print("[Info] Data timeout. Clearing buffer.")
             current_readings = {}
            
        time.sleep(0.01)