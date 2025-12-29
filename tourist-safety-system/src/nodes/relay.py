import time
import sys
import os
import random

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import sx126x
from src.utils.math_helper import MathEngine
from config.settings import SERIAL_PORT, LORA_SETTINGS

# ANSI Color Codes
class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    DIM = '\033[2m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

# Unique addresses for each relay
RELAY_ADDRESSES = {
    "ANCHOR_2": 2,
    "ANCHOR_3": 3,
}

def run_relay(relay_id):
    # Clear screen
    os.system('clear' if os.name != 'nt' else 'cls')
    
    print(f"\n{Colors.CYAN}{Colors.BOLD}")
    print(f"╔════════════════════════════════════════╗")
    print(f"║   📡  RELAY NODE: {relay_id:<10}          ║")
    print(f"╚════════════════════════════════════════╝")
    print(f"{Colors.RESET}")
    
    # Get configuration
    freq = LORA_SETTINGS.get("FREQUENCY", 868)
    addr = RELAY_ADDRESSES.get(relay_id, 0)
    
    print(f"{Colors.DIM}Address: {addr} | Frequency: {freq} MHz{Colors.RESET}")
    
    # Initialize LoRa
    node = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=addr, power=22, rssi=True)
    
    print(f"{Colors.GREEN}✓ Ready! Listening for signals...{Colors.RESET}\n")
    
    # RSSI smoothing buffer
    rssi_buffer = []
    RSSI_SAMPLES = 3
    detection_count = 0
    
    try:
        while True:
            message, rssi = node.receive()
            
            # If we got a PING message from tourist
            if message and "PING" in message:
                rssi_buffer.append(rssi)
                
                # Progress indicator
                print(f"\r{Colors.DIM}Samples: {'█' * len(rssi_buffer)}{'░' * (RSSI_SAMPLES - len(rssi_buffer))}{Colors.RESET}", end='', flush=True)
                
                # Report after collecting enough samples
                if len(rssi_buffer) >= RSSI_SAMPLES:
                    detection_count += 1
                    
                    # Calculate median RSSI
                    sorted_rssi = sorted(rssi_buffer)
                    median_rssi = sorted_rssi[len(sorted_rssi) // 2]
                    distance = MathEngine.rssi_to_distance(median_rssi)
                    
                    # Display detection
                    print(f"\r{Colors.GREEN}🎯 #{detection_count} | RSSI: {median_rssi} dBm | Distance: {distance:.2f}m{Colors.RESET}")
                    
                    # Staggered delay to prevent RF collision
                    stagger_delay = addr * 0.3 + random.uniform(0, 0.2)
                    time.sleep(stagger_delay)
                    
                    # Forward to master
                    report = f"REPORT:{relay_id}:{median_rssi}"
                    node.send(report.encode())
                    print(f"{Colors.DIM}   → Forwarded to Master{Colors.RESET}")
                    
                    rssi_buffer = []
                    
            # Ignore REPORT messages from other relays
            elif message and "REPORT" in message:
                pass
                
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Shutting down...{Colors.RESET}")
    finally:
        try:
            import RPi.GPIO as GPIO
            GPIO.cleanup()
        except:
            pass