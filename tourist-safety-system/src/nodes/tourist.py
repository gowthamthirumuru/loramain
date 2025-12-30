"""
LoRa Tourist Device (Wearable/Handheld)
Broadcasts periodic pings and SOS signals.
"""

import time
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import sx126x
from config.settings import SERIAL_PORT, LORA_SETTINGS, IS_RASPBERRY_PI

# ============ CONFIGURATION ============
# Each tourist device should have a unique ID
# This ID must be registered in the backend before use
DEVICE_ID = os.environ.get('DEVICE_ID', 'DEV001')

# Ping interval in seconds
PING_INTERVAL = 2

# SOS button GPIO pin (Raspberry Pi)
SOS_PIN = 17

# ANSI Color Codes
class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    DIM = '\033[2m'
    BOLD = '\033[1m'
    RESET = '\033[0m'


def run_tourist():
    # Clear screen
    os.system('clear' if os.name != 'nt' else 'cls')
    
    print(f"\n{Colors.CYAN}{Colors.BOLD}")
    print("╔════════════════════════════════════════╗")
    print("║   🚶  TOURIST TRACKER DEVICE           ║")
    print("╚════════════════════════════════════════╝")
    print(f"{Colors.RESET}")
    
    print(f"Device ID: {Colors.GREEN}{DEVICE_ID}{Colors.RESET}")
    
    freq = LORA_SETTINGS.get("FREQUENCY", 865)
    print(f"{Colors.DIM}Frequency: {freq} MHz{Colors.RESET}")
    print(f"{Colors.DIM}Ping Interval: {PING_INTERVAL}s{Colors.RESET}")
    
    # Initialize LoRa
    if IS_RASPBERRY_PI:
        import RPi.GPIO as GPIO
        node = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=100, power=22, rssi=False)
        print(f"{Colors.GREEN}✓ LoRa initialized{Colors.RESET}")
        
        # Setup SOS button
        try:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(SOS_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
            print(f"{Colors.GREEN}✓ SOS button on GPIO {SOS_PIN}{Colors.RESET}")
            sos_button_available = True
        except Exception as e:
            print(f"{Colors.YELLOW}⚠ SOS button not configured: {e}{Colors.RESET}")
            sos_button_available = False
    else:
        node = None
        sos_button_available = False
        print(f"{Colors.YELLOW}⚠ Running in simulation mode (not on Pi){Colors.RESET}")
    
    print(f"\n{Colors.GREEN}{Colors.BOLD}✓ Tracker active!{Colors.RESET}\n")
    
    ping_count = 0
    is_sos = False
    
    try:
        while True:
            # Check SOS button
            if sos_button_available:
                try:
                    import RPi.GPIO as GPIO
                    is_sos = GPIO.input(SOS_PIN) == GPIO.HIGH
                except:
                    pass
            
            ping_count += 1
            
            # Build message
            if is_sos:
                message = f"SOS:{DEVICE_ID}"
                print(f"\r{Colors.RED}🚨 SOS #{ping_count}: {message}{Colors.RESET}  ", end='', flush=True)
            else:
                message = f"PING:{DEVICE_ID}"
                print(f"\r{Colors.GREEN}📡 Ping #{ping_count}: {message}{Colors.RESET}  ", end='', flush=True)
            
            # Transmit
            if node:
                node.send(message.encode())
            
            time.sleep(PING_INTERVAL)
            
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Stopped after {ping_count} pings.{Colors.RESET}")
    finally:
        if IS_RASPBERRY_PI:
            try:
                import RPi.GPIO as GPIO
                GPIO.cleanup()
            except:
                pass


def run_tourist_with_sos_test():
    """Test mode: Simulates SOS trigger after a few pings."""
    os.system('clear' if os.name != 'nt' else 'cls')
    
    print(f"\n{Colors.CYAN}{Colors.BOLD}")
    print("╔════════════════════════════════════════╗")
    print("║   🚶  TOURIST DEVICE (SOS TEST MODE)   ║")
    print("╚════════════════════════════════════════╝")
    print(f"{Colors.RESET}")
    print(f"Device ID: {DEVICE_ID}")
    print(f"{Colors.YELLOW}Will send SOS on pings 5-7{Colors.RESET}\n")
    
    freq = LORA_SETTINGS.get("FREQUENCY", 865)
    
    if IS_RASPBERRY_PI:
        node = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=100, power=22, rssi=False)
    else:
        node = None
        print(f"{Colors.YELLOW}⚠ Simulation mode{Colors.RESET}")
    
    ping_count = 0
    
    try:
        while True:
            ping_count += 1
            is_sos = 5 <= ping_count <= 7
            
            if is_sos:
                message = f"SOS:{DEVICE_ID}"
                print(f"{Colors.RED}🚨 [{ping_count}] SOS: {message}{Colors.RESET}")
            else:
                message = f"PING:{DEVICE_ID}"
                print(f"{Colors.GREEN}📡 [{ping_count}] Ping: {message}{Colors.RESET}")
            
            if node:
                node.send(message.encode())
            
            time.sleep(PING_INTERVAL)
            
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Stopped{Colors.RESET}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Tourist Device")
    parser.add_argument("--test-sos", action="store_true", help="Run in SOS test mode")
    parser.add_argument("--device-id", type=str, help="Override device ID")
    
    args = parser.parse_args()
    
    if args.device_id:
        DEVICE_ID = args.device_id
    
    if args.test_sos:
        run_tourist_with_sos_test()
    else:
        run_tourist()
