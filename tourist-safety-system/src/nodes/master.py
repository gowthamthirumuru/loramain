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
    anchors = get_anchors()
    
    current_readings = {}
    last_ping_time = time.time()
    
    print("[DEBUG] Entering Main Loop...") # <--- Debug 1
    
    while True:
        # Check if code freezes here
        # print(".", end="", flush=True) # Uncomment this if you suspect total freeze
        
        # 1. RECEIVE DATA
        msg, rssi = lora.receive() 
        
        # 2. DEBUG PRINT: Print EVERYTHING we hear
        if msg:
            print(f"[DEBUG] Raw RX: {msg} | RSSI: {rssi}")
        
        if msg:
            # Case A: Direct hit from Tourist
            if "PING" in msg:
                print(f"[Rx] Direct Hit! RSSI: {rssi}")
                current_readings["MASTER"] = rssi
                last_ping_time = time.time()
            
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

        # 3. CHECK FOR COMPLETE DATA
        # Print status so we know what we are missing
        if len(current_readings) > 0:
            print(f"[Status] Have readings: {list(current_readings.keys())} ({len(current_readings)}/3)")

        if len(current_readings) >= 3:
            print("\n--- TRIANGULATING ---")
            
            tri_input = []
            
            # Add Master
            dist_m = MathEngine.rssi_to_distance(current_readings["MASTER"])
            tri_input.append({'x': anchors["MASTER"]["x"], 'y': anchors["MASTER"]["y"], 'r': dist_m})
            
            # Add Anchor 2
            if "ANCHOR_2" in current_readings:
                dist_2 = MathEngine.rssi_to_distance(current_readings["ANCHOR_2"])
                tri_input.append({'x': anchors["ANCHOR_2"]["x"], 'y': anchors["ANCHOR_2"]["y"], 'r': dist_2})

            # Add Anchor 3
            if "ANCHOR_3" in current_readings:
                dist_3 = MathEngine.rssi_to_distance(current_readings["ANCHOR_3"])
                tri_input.append({'x': anchors["ANCHOR_3"]["x"], 'y': anchors["ANCHOR_3"]["y"], 'r': dist_3})

            print(f"Distances: {dist_m:.2f}m, {dist_2:.2f}m, {dist_3:.2f}m")

            result = MathEngine.trilaterate(tri_input)
            
            if result:
                print(f"✅ TOURIST LOCATED AT: X={result[0]:.2f}, Y={result[1]:.2f}")
            else:
                print("❌ Calculation Failed (Math Error)")
            
            current_readings = {}
            print("--- WAITING FOR NEXT PING ---\n")

        # Timeout Logic
        if time.time() - last_ping_time > 10 and len(current_readings) > 0:
             print("[Info] Data timeout. Clearing buffer.")
             current_readings = {}
             last_ping_time = time.time() # Reset timer so we don't spam print
            
        time.sleep(0.01)