"""
LoRa Relay Node (Anchor 2 / Anchor 3)
Receives tourist pings and reports RSSI to the master node.
"""

import time
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from config.settings import IS_RASPBERRY_PI

# ============ CONFIGURATION ============
# This relay's ID (e.g., "ANCHOR_2" or "ANCHOR_3")
DEFAULT_RELAY_ID = "ANCHOR_2"

# Report interval after receiving a ping
REPORT_DELAY = 0.5  # seconds


def run_relay(relay_id=None):
    """
    Run the relay node.
    
    Args:
        relay_id: Anchor identifier (ANCHOR_2, ANCHOR_3, etc.)
    """
    relay_id = relay_id or DEFAULT_RELAY_ID
    relay_id = relay_id.upper()
    
    print("=" * 50)
    print(f"   LoRa RELAY NODE: {relay_id}")
    print("=" * 50)
    
    # Initialize LoRa
    if IS_RASPBERRY_PI:
        from src.drivers.sx126x import sx126x
        
        # Setup as receiver with RSSI enabled
        node = sx126x(
            serial_num='/dev/ttyS0',
            freq=865,
            addr=0,      # Address 0 to receive all broadcasts
            power=22,
            rssi=True    # Enable RSSI reading
        )
        print("[LoRa] ✅ Hardware initialized (RSSI enabled)")
    else:
        node = None
        print("[LoRa] ⚠️ Running in simulation mode (not on Pi)")
    
    # Stats
    pings_received = 0
    reports_sent = 0
    
    print(f"\n[{relay_id}] Listening for tourist pings...")
    print(f"[{relay_id}] Press Ctrl+C to stop\n")
    
    try:
        while True:
            # Receive message
            if node:
                message, rssi = node.receive()
            else:
                # Simulation - no messages
                message, rssi = None, None
            
            # Process if we got a message
            if message:
                print(f"[{relay_id}] 📥 Received: {message} | RSSI: {rssi} dBm")
                
                # Only respond to PING or SOS from tourists
                if "PING" in message or "SOS" in message:
                    pings_received += 1
                    
                    # Small delay to avoid collision with other relays
                    # Each relay should have different delay
                    delay = REPORT_DELAY
                    if relay_id == "ANCHOR_3":
                        delay = REPORT_DELAY * 2  # Anchor 3 waits longer
                    
                    time.sleep(delay)
                    
                    # Send report to master
                    # Format: "REPORT:ANCHOR_ID:RSSI"
                    report = f"REPORT:{relay_id}:{rssi}"
                    
                    if node:
                        node.send(report.encode())
                        reports_sent += 1
                        print(f"[{relay_id}] 📤 Report sent: {report}")
                    else:
                        print(f"[{relay_id}] 📤 Would send: {report} (simulation)")
                    
                    print(f"[{relay_id}] Stats: Pings={pings_received}, Reports={reports_sent}")
                    print("-" * 40)
            
            # Small delay to prevent CPU overload
            time.sleep(0.05)
            
    except KeyboardInterrupt:
        print(f"\n\n[{relay_id}] Shutting down...")
        print(f"[{relay_id}] Final stats: Pings={pings_received}, Reports={reports_sent}")


def run_relay_simulation():
    """
    Simulation mode for testing without hardware.
    Generates fake RSSI readings and reports.
    """
    import random
    
    relay_id = "ANCHOR_2"
    print(f"[{relay_id}] Running in simulation mode")
    print(f"[{relay_id}] Generating fake readings every 3 seconds")
    
    while True:
        # Simulate receiving a ping
        rssi = random.randint(-80, -50)
        report = f"REPORT:{relay_id}:{rssi}"
        print(f"[{relay_id}] 📤 Simulated report: {report}")
        time.sleep(3)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Relay/Anchor Node")
    parser.add_argument("--id", type=str, default=DEFAULT_RELAY_ID,
                       help="Relay ID (ANCHOR_2, ANCHOR_3, etc.)")
    parser.add_argument("--simulate", action="store_true",
                       help="Run in simulation mode")
    
    args = parser.parse_args()
    
    if args.simulate:
        run_relay_simulation()
    else:
        run_relay(args.id)