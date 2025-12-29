import time
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import sx126x
from config.settings import SERIAL_PORT, LORA_SETTINGS

# ANSI Color Codes
class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
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
    
    freq = LORA_SETTINGS.get("FREQUENCY", 868)
    print(f"{Colors.DIM}Frequency: {freq} MHz{Colors.RESET}")
    
    # Initialize LoRa
    node = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=100, power=22, rssi=False)
    
    print(f"{Colors.GREEN}✓ Tracker active!{Colors.RESET}\n")
    
    ping_count = 0
    
    try:
        while True:
            ping_count += 1
            message = "PING:ID100"
            node.send(message.encode())
            
            # Animated ping display
            print(f"\r{Colors.GREEN}📡 Ping #{ping_count}{Colors.RESET}  ", end='', flush=True)
            
            time.sleep(2)
            
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Stopped after {ping_count} pings.{Colors.RESET}")
    finally:
        try:
            import RPi.GPIO as GPIO
            GPIO.cleanup()
        except:
            pass