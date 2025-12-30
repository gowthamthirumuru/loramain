"""
LoRa Tourist Device (Wearable/Handheld)
Broadcasts periodic pings and SOS signals.
"""

import time
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from config.settings import IS_RASPBERRY_PI

# ============ CONFIGURATION ============
# Each tourist device should have a unique ID
# This ID must be registered in the backend before use
DEVICE_ID = os.environ.get('DEVICE_ID', 'DEV001')

# Ping interval in seconds
PING_INTERVAL = 2

# SOS button GPIO pin (Raspberry Pi)
SOS_PIN = 17  # Change to your actual pin


def run_tourist():
    print("=" * 50)
    print("   LoRa TOURIST DEVICE")
    print("=" * 50)
    print(f"Device ID: {DEVICE_ID}")
    print(f"Ping Interval: {PING_INTERVAL}s")
    print("=" * 50)
    
    # Initialize LoRa
    if IS_RASPBERRY_PI:
        from src.drivers.sx126x import sx126x
        import RPi.GPIO as GPIO
        
        # Setup LoRa
        node = sx126x(
            serial_num='/dev/ttyS0',
            freq=865,
            addr=100,
            power=22,
            rssi=False
        )
        print("[LoRa] ✅ Hardware initialized")
        
        # Setup SOS button (optional)
        try:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(SOS_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
            print(f"[SOS] ✅ Button configured on GPIO {SOS_PIN}")
            sos_button_available = True
        except Exception as e:
            print(f"[SOS] ⚠️ Button not configured: {e}")
            sos_button_available = False
    else:
        node = None
        sos_button_available = False
        print("[LoRa] ⚠️ Running in simulation mode (not on Pi)")
    
    # State
    is_sos = False
    ping_count = 0
    
    print("\n[System] Starting broadcast loop...")
    print("[System] Press Ctrl+C to stop\n")
    
    try:
        while True:
            # Check SOS button (if available)
            if sos_button_available:
                try:
                    import RPi.GPIO as GPIO
                    is_sos = GPIO.input(SOS_PIN) == GPIO.HIGH
                except:
                    pass
            
            # Build message
            if is_sos:
                message = f"SOS:{DEVICE_ID}"
                print(f"🚨 [{ping_count}] SOS SIGNAL SENT: {message}")
            else:
                message = f"PING:{DEVICE_ID}"
                print(f"📍 [{ping_count}] Ping sent: {message}")
            
            # Transmit
            if node:
                node.send(message.encode())
            else:
                # Simulation mode - just print
                print(f"   (Simulation - not actually transmitted)")
            
            ping_count += 1
            time.sleep(PING_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\n[System] Stopping tourist device...")
        
        # Cleanup GPIO if on Pi
        if IS_RASPBERRY_PI:
            try:
                import RPi.GPIO as GPIO
                GPIO.cleanup()
            except:
                pass


def run_tourist_with_sos_test():
    """
    Test mode: Simulates SOS trigger after a few pings.
    Use this to test the SOS flow without hardware button.
    """
    print("=" * 50)
    print("   LoRa TOURIST DEVICE (SOS TEST MODE)")
    print("=" * 50)
    print(f"Device ID: {DEVICE_ID}")
    print("Will send SOS after 5 normal pings")
    print("=" * 50)
    
    if IS_RASPBERRY_PI:
        from src.drivers.sx126x import sx126x
        node = sx126x(
            serial_num='/dev/ttyS0',
            freq=865,
            addr=100,
            power=22,
            rssi=False
        )
    else:
        node = None
        print("[LoRa] ⚠️ Simulation mode")
    
    ping_count = 0
    
    try:
        while True:
            # Trigger SOS after 5 pings
            is_sos = ping_count >= 5 and ping_count < 8
            
            if is_sos:
                message = f"SOS:{DEVICE_ID}"
                print(f"🚨 [{ping_count}] SOS: {message}")
            else:
                message = f"PING:{DEVICE_ID}"
                print(f"📍 [{ping_count}] Ping: {message}")
            
            if node:
                node.send(message.encode())
            
            ping_count += 1
            time.sleep(PING_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n[System] Stopped")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Tourist Device")
    parser.add_argument("--test-sos", action="store_true", 
                       help="Run in SOS test mode")
    parser.add_argument("--device-id", type=str, default=DEVICE_ID,
                       help="Override device ID")
    
    args = parser.parse_args()
    
    if args.device_id:
        DEVICE_ID = args.device_id
    
    if args.test_sos:
        run_tourist_with_sos_test()
    else:
        run_tourist()