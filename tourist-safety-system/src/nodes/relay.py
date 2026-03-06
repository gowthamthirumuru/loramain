"""
LoRa Relay Node (Anchor 2 / Anchor 3)
Receives tourist pings and reports RSSI to the master node.
"""

import time
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

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
    from src.drivers.sx126x import sx126x
    from config.settings import SERIAL_PORT
    
    # Setup as receiver with RSSI enabled
    node = sx126x(
        serial_num=SERIAL_PORT,
        freq=865,
        addr=0,      # Address 0 to receive all broadcasts
        power=22,
        rssi=True    # Enable RSSI reading
    )
    print("[LoRa] ✅ Hardware initialized (RSSI enabled)")
    
    # Stats
    pings_received = 0
    reports_sent = 0
    
    print(f"\n[{relay_id}] Listening for tourist pings...")
    print(f"[{relay_id}] Press Ctrl+C to stop\n")
    
    try:
        while True:
            # Receive message
            message, rssi = node.receive()
            
            # Process if we got a message
            if message:
                print(f"[{relay_id}] 📥 Received: {message} | RSSI: {rssi} dBm")
                
                # Only respond to PING or SOS from tourists (NOT other relays' REPORTs)
                # REPORT messages contain "PING"/"SOS" as substring, so exclude them
                if ("PING" in message or "SOS" in message) and "REPORT" not in message:
                    pings_received += 1
                    
                    # Extract Tourist ID
                    # Message format: "PING:DEVICE_ID" or "SOS:DEVICE_ID"
                    try:
                        parts = message.split(":")
                        if len(parts) >= 2:
                            tourist_id = parts[1].strip()
                        else:
                            tourist_id = "UNKNOWN"
                    except:
                        tourist_id = "UNKNOWN"

                    # Small delay to avoid collision with other relays
                    # Each relay should have different delay
                    delay = REPORT_DELAY
                    if relay_id == "ANCHOR_3":
                        delay = REPORT_DELAY * 2  # Anchor 3 waits longer
                    
                    time.sleep(delay)
                    
                    msg_type = "SOS" if "SOS" in message else "PING"
                    
                    # Send report to master
                    # Format: "REPORT:ANCHOR_ID:TOURIST_ID:RSSI:MSG_TYPE"
                    report = f"REPORT:{relay_id}:{tourist_id}:{rssi}:{msg_type}"
                    
                    node.send(report.encode())
                    reports_sent += 1
                    print(f"[{relay_id}] 📤 Report sent: {report}")
                    
                    print(f"[{relay_id}] Stats: Pings={pings_received}, Reports={reports_sent}")
                    print("-" * 40)
            
            # Small delay to prevent CPU overload
            time.sleep(0.05)
            
    except KeyboardInterrupt:
        print(f"\n\n[{relay_id}] Shutting down...")
        print(f"[{relay_id}] Final stats: Pings={pings_received}, Reports={reports_sent}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Relay/Anchor Node")
    parser.add_argument("--id", type=str, default=DEFAULT_RELAY_ID,
                       help="Relay ID (ANCHOR_2, ANCHOR_3, etc.)")
    
    args = parser.parse_args()
    
    run_relay(args.id)