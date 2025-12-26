import time
import sys
from src.drivers.sx126x import sx126x
# Import your math helper
from src.utils.math_helper import calculate_distance

def run_relay(relay_id):
    print(f"[{relay_id}] Anchor Active. Listening...")
    
    # SETUP: Address 0 (Receiver Mode)
    # rssi=True is CRITICAL to enable signal strength reading
    node = sx126x(serial_num='/dev/ttyS0', freq=865, addr=0, power=22, rssi=True)
    
    try:
        while True:
            # 1. Get Packet & RSSI from our modified driver
            message, rssi = node.receive()
            
            # 2. If we got a valid message...
            if message:
                # Calculate distance using your math helper
                distance = calculate_distance(rssi)
                
                print(f"[{relay_id}] TARGET DETECTED!")
                print(f"   Signal: {rssi} dBm")
                print(f"   Distance: {distance} meters")
                print("-" * 30)
                
            # Small delay to prevent CPU overload
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print(f"[{relay_id}] Stopping...")