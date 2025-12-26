import time
import sys
# Import the driver class
from src.drivers.sx126x import sx126x

def run_tourist():
    print("[Tourist] Initializing LoRa Tracker...")
    
    # SETUP: Freq 865MHz (Change to 915/868 if needed), Address 100
    # M0=22, M1=27 are handled inside sx126x automatically
    node = sx126x(serial_num='/dev/ttyS0', freq=865, addr=100, power=22, rssi=False)
    
    try:
        while True:
            # MESSAGE FORMAT: "ID,STATUS"
            message = "ID:100,SOS"
            
            # Send the message
            node.send(message.encode())
            print(f"[Tourist] Ping Sent: {message}")
            
            # Wait 2 seconds (don't flood the channel)
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("[Tourist] Stopping...")