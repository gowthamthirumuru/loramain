import time
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import sx126x
from src.utils.math_helper import MathEngine
from config.settings import SERIAL_PORT, LORA_SETTINGS

# Unique addresses for each relay to prevent message collision
RELAY_ADDRESSES = {
    "ANCHOR_2": 2,
    "ANCHOR_3": 3,
}

def run_relay(relay_id):
    print(f"[{relay_id}] Anchor Active. Listening...")
    
    # Get configuration
    freq = LORA_SETTINGS.get("FREQUENCY", 868)
    
    # Get unique address for this relay (prevents receiving our own forwarded messages)
    addr = RELAY_ADDRESSES.get(relay_id, 0)
    print(f"[{relay_id}] Using address: {addr}, frequency: {freq} MHz")
    
    # SETUP: rssi=True is CRITICAL to enable signal strength reading
    node = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=addr, power=22, rssi=True)
    
    # RSSI smoothing buffer (collect multiple samples for accuracy)
    rssi_buffer = []
    RSSI_SAMPLES = 3
    
    try:
        while True:
            # 1. Get Packet & RSSI from driver
            message, rssi = node.receive()
            
            # 2. If we got a PING message from tourist
            if message and "PING" in message:
                # Add to RSSI buffer for smoothing
                rssi_buffer.append(rssi)
                
                # Only report after collecting enough samples
                if len(rssi_buffer) >= RSSI_SAMPLES:
                    # Use median for robustness against outliers
                    sorted_rssi = sorted(rssi_buffer)
                    median_rssi = sorted_rssi[len(sorted_rssi) // 2]
                    
                    # Calculate distance
                    distance = MathEngine.rssi_to_distance(median_rssi)
                    
                    print(f"\n[{relay_id}] TARGET DETECTED!")
                    print(f"   Raw samples: {rssi_buffer}")
                    print(f"   Median RSSI: {median_rssi} dBm")
                    print(f"   Distance: {distance:.2f} meters")
                    
                    # 3. Forward RSSI to Master Node
                    # STAGGERED DELAY: Wait based on address to prevent RF collision
                    # ANCHOR_2 (addr=2) waits ~0.5s, ANCHOR_3 (addr=3) waits ~1.0s
                    import random
                    base_delay = addr * 0.3  # 0.6s for ANCHOR_2, 0.9s for ANCHOR_3
                    jitter = random.uniform(0, 0.2)  # Add 0-200ms random jitter
                    stagger_delay = base_delay + jitter
                    print(f"   Waiting {stagger_delay:.2f}s to avoid collision...")
                    time.sleep(stagger_delay)
                    
                    report = f"REPORT:{relay_id}:{median_rssi}"
                    node.send(report.encode())
                    print(f"   ✓ Forwarded to Master: {report}")
                    print("-" * 40)
                    
                    # Clear buffer for next round
                    rssi_buffer = []
                    
            # 3. Ignore REPORT messages from other relays (we only care about PING)
            elif message and "REPORT" in message:
                pass  # Intentionally ignore relay-to-relay messages
                
            # Small delay to prevent CPU overload
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print(f"\n[{relay_id}] Shutting down...")
    finally:
        # Cleanup GPIO on exit
        try:
            import RPi.GPIO as GPIO
            GPIO.cleanup()
            print(f"[{relay_id}] GPIO cleaned up.")
        except:
            pass