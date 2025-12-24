import time
import random
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import SX126X

def run_relay(anchor_id):
    print(f"--- STARTING RELAY NODE ({anchor_id}) ---")
    
    lora = SX126X()
    
    while True:
        # 1. Listen for packets
        msg, rssi = lora.receive()
        
        if msg and "PING" in msg:
            print(f"[Rx] Heard Tourist! RSSI: {rssi}dBm")
            
            # 2. Avoid Collisions
            # Anchor 2 waits 0.5s, Anchor 3 waits 1.0s (Approx)
            delay = 0.5 if "RELAY_1" in anchor_id else 1.0
            time.sleep(delay)
            
            # 3. Send Report to Master
            # Format: "REPORT:MY_ID:DETECTED_RSSI"
            report_payload = f"REPORT:{anchor_id}:{rssi}"
            lora.send(report_payload)
            print(f"[Tx] Relayed: {report_payload}")
            
        time.sleep(0.1) # Small CPU rest