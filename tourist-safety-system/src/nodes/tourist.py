"""
LoRa Tourist Device (Wearable/Handheld)
Broadcasts periodic pings and SOS signals.
"""

import time
import sys
import os
import argparse

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import sx126x
from config.settings import SERIAL_PORT, LORA_SETTINGS, IS_RASPBERRY_PI

# ============ CONFIGURATION ============
DEFAULT_DEVICE_ID = os.environ.get('DEVICE_ID', 'DEV001')
PING_INTERVAL = 2
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

def clear_screen():
    os.system('clear' if os.name != 'nt' else 'cls')

class TouristNode:
    def __init__(self, device_id=None, test_mode=False):
        self.device_id = device_id or DEFAULT_DEVICE_ID
        self.node = None
        self.sos_button_available = False
        self.test_mode = test_mode  # For simulating SOS sequences
        self.ping_count = 0
        
        self.setup_hardware()
        
    def setup_hardware(self):
        freq = LORA_SETTINGS.get("FREQUENCY", 865)
        
        if IS_RASPBERRY_PI:
            import RPi.GPIO as GPIO
            try:
                self.node = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=100, power=22, rssi=False)
                print(f"{Colors.GREEN}✓ LoRa initialized at {freq} MHz{Colors.RESET}")
                
                # Setup SOS button
                GPIO.setmode(GPIO.BCM)
                GPIO.setup(SOS_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
                self.sos_button_available = True
                print(f"{Colors.GREEN}✓ SOS button on GPIO {SOS_PIN}{Colors.RESET}")
            except Exception as e:
                print(f"{Colors.YELLOW}⚠ Hardware init failed: {e}{Colors.RESET}")
        else:
            print(f"{Colors.YELLOW}⚠ Running in simulation mode (not on Pi){Colors.RESET}")

    def check_sos_status(self):
        """Returns True if SOS is triggered (Hardware button or Test simulation)"""
        if self.test_mode:
            # Simulate SOS on pings 5, 6, 7
            return 5 <= self.ping_count <= 7
            
        if self.sos_button_available:
            try:
                import RPi.GPIO as GPIO
                return GPIO.input(SOS_PIN) == GPIO.HIGH
            except:
                pass
        return False

    def send_data(self, is_sos):
        msg_type = "SOS" if is_sos else "PING"
        message = f"{msg_type}:{self.device_id}"
        
        if self.node:
            self.node.send(message.encode())
        
        # UI Output
        if is_sos:
             print(f"\r{Colors.RED}🚨 SOS #{self.ping_count}: {message}{Colors.RESET}  ", end='', flush=True)
             if self.test_mode: print() # Newline for test mode readability
        else:
             print(f"\r{Colors.GREEN}📡 Ping #{self.ping_count}: {message}{Colors.RESET}  ", end='', flush=True)
             if self.test_mode: print()

    def run(self):
        clear_screen()
        print(f"\n{Colors.CYAN}{Colors.BOLD}")
        print("╔════════════════════════════════════════╗")
        print("║   🚶  TOURIST TRACKER DEVICE           ║")
        print("╚════════════════════════════════════════╝")
        print(f"{Colors.RESET}")
        print(f"Device ID: {Colors.GREEN}{self.device_id}{Colors.RESET}")
        if self.test_mode:
            print(f"{Colors.YELLOW}running in SOS TEST MODE{Colors.RESET}")

        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ Tracker active!{Colors.RESET}\n")
        
        try:
            while True:
                self.ping_count += 1
                is_sos = self.check_sos_status()
                self.send_data(is_sos)
                time.sleep(PING_INTERVAL)
                
        except KeyboardInterrupt:
            print(f"\n\n{Colors.YELLOW}Stopped after {self.ping_count} pings.{Colors.RESET}")
        finally:
            self.cleanup()

    def cleanup(self):
        if IS_RASPBERRY_PI:
            try:
                import RPi.GPIO as GPIO
                GPIO.cleanup()
            except:
                pass


def run_tourist(device_id=None, test_mode=False):
    """
    Run the tourist node.
    """
    tourist = TouristNode(device_id=device_id, test_mode=test_mode)
    tourist.run()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tourist Device")
    parser.add_argument("--test-sos", action="store_true", help="Run in SOS test mode")
    parser.add_argument("--device-id", type=str, help="Override device ID")
    
    args = parser.parse_args()
    
    run_tourist(device_id=args.device_id, test_mode=args.test_sos)
