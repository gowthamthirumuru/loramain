import time
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import sx126x
from config.settings import SERIAL_PORT, LORA_SETTINGS

def run_tourist():
    print("[Tourist] Initializing LoRa Tracker...")
    
    # Get frequency from centralized config
    freq = LORA_SETTINGS.get("FREQUENCY", 868)
    
    # SETUP: Address 100 for tourist device (unique from anchors)
    # rssi=False since we're only transmitting
    node = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=100, power=22, rssi=False)
    
    print(f"[Tourist] Using frequency: {freq} MHz")
    print("[Tourist] Starting to send PING signals every 2 seconds...")
    
    ping_count = 0
    
    try:
        while True:
            ping_count += 1
            
            # MESSAGE FORMAT: "PING:ID" - Master looks for "PING" keyword
            message = "PING:ID100"
            
            # Send the message
            node.send(message.encode())
            print(f"[Tourist] Ping #{ping_count} sent: {message}")
            
            # Wait 2 seconds (don't flood the channel)
            time.sleep(2)
            
    except KeyboardInterrupt:
        print(f"\n[Tourist] Stopping after {ping_count} pings...")
    finally:
        # Cleanup GPIO on exit
        try:
            import RPi.GPIO as GPIO
            GPIO.cleanup()
            print("[Tourist] GPIO cleaned up.")
        except:
            pass