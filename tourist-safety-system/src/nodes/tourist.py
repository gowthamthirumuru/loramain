import time
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import SX126X

def run_tourist(node_id="TOURIST_01"):
    print(f"--- STARTING TOURIST NODE ({node_id}) ---")
    
    # Initialize Hardware
    lora = SX126X()
    
    seq_num = 0
    
    while True:
        # Create Payload: "PING:TOURIST_ID:SEQUENCE"
        payload = f"PING:{node_id}:{seq_num}"
        
        print(f"[Tx] Sending: {payload}")
        lora.send(payload)
        
        seq_num += 1
        time.sleep(5) # Broadcast every 5 seconds