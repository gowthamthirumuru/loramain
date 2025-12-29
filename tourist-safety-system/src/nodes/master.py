import time
import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import sx126x
from src.utils.math_helper import MathEngine
from config.settings import get_anchors, SERIAL_PORT, LORA_SETTINGS

# ANSI Color Codes for terminal output
class Colors:
    HEADER = '\033[95m'      # Magenta
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'

def clear_screen():
    os.system('clear' if os.name != 'nt' else 'cls')

def print_header():
    print(f"\n{Colors.CYAN}{Colors.BOLD}")
    print("╔══════════════════════════════════════════════════════════╗")
    print("║          🛰️  LoRa Tourist Positioning System  🛰️          ║")
    print("║                    MASTER NODE ACTIVE                     ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"{Colors.RESET}")

def print_status(anchors_received, total=3):
    bar = "█" * anchors_received + "░" * (total - anchors_received)
    color = Colors.GREEN if anchors_received == total else Colors.YELLOW
    print(f"\r{Colors.DIM}Signal Collection: {color}[{bar}] {anchors_received}/{total}{Colors.RESET}", end='', flush=True)

def print_location(x, y, distances):
    print(f"\n\n{Colors.GREEN}{Colors.BOLD}")
    print("┌──────────────────────────────────────────────────────────┐")
    print(f"│  📍 TOURIST LOCATED                                      │")
    print("├──────────────────────────────────────────────────────────┤")
    print(f"│                                                          │")
    print(f"│     X = {x:>8.2f} meters                                 │")
    print(f"│     Y = {y:>8.2f} meters                                 │")
    print(f"│                                                          │")
    print("├──────────────────────────────────────────────────────────┤")
    print(f"│  {Colors.DIM}Distances:{Colors.GREEN}{Colors.BOLD}                                              │")
    for anchor, dist in distances.items():
        print(f"│    • {anchor}: {dist:.2f}m                                       │"[:60] + "│")
    print("└──────────────────────────────────────────────────────────┘")
    print(f"{Colors.RESET}")

def print_waiting():
    print(f"\n{Colors.DIM}⏳ Waiting for signals...{Colors.RESET}", end='\r')

def run_master():
    clear_screen()
    print_header()
    
    # Get frequency from centralized config
    freq = LORA_SETTINGS.get("FREQUENCY", 868)
    
    # Initialize LoRa
    print(f"{Colors.DIM}Initializing LoRa at {freq} MHz...{Colors.RESET}")
    lora = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=1, power=22, rssi=True)
    anchors = get_anchors()
    
    # Validate required anchors
    required_anchors = ["MASTER", "ANCHOR_2", "ANCHOR_3"]
    missing = [a for a in required_anchors if a not in anchors]
    if missing:
        print(f"{Colors.RED}[ERROR] Missing anchor config: {missing}{Colors.RESET}")
        return
    
    print(f"{Colors.GREEN}✓ Ready! Awaiting tourist signals...{Colors.RESET}\n")
    
    current_readings = {}
    last_ping_time = time.time()
    location_count = 0
    
    try:
        while True:
            # Receive data
            msg, rssi = lora.receive() 
            
            if msg:
                # Direct PING from tourist
                if "PING" in msg:
                    current_readings["MASTER"] = rssi
                    last_ping_time = time.time()
                
                # Report from relay
                elif "REPORT" in msg:
                    try:
                        parts = msg.split(":")
                        sender_id = parts[1]
                        reported_rssi = int(parts[2])
                        current_readings[sender_id] = reported_rssi
                    except:
                        pass

            # Update status bar
            if len(current_readings) > 0:
                print_status(len(current_readings))

            # Triangulate when we have all 3 readings
            if len(current_readings) >= 3:
                location_count += 1
                
                tri_input = []
                distances = {}
                
                # Build trilateration input
                for anchor_id in ["MASTER", "ANCHOR_2", "ANCHOR_3"]:
                    if anchor_id in current_readings:
                        dist = MathEngine.rssi_to_distance(current_readings[anchor_id])
                        distances[anchor_id] = dist
                        tri_input.append({
                            'x': anchors[anchor_id]["x"], 
                            'y': anchors[anchor_id]["y"], 
                            'r': dist
                        })

                # Calculate position
                if len(tri_input) >= 3:
                    result = MathEngine.trilaterate(tri_input)
                    
                    if result:
                        print_location(result[0], result[1], distances)
                        
                        # Also output as JSON for software integration
                        location_data = {
                            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                            "location": {"x": result[0], "y": result[1]},
                            "distances": distances,
                            "reading_count": location_count
                        }
                        # Uncomment to see JSON output:
                        # print(f"{Colors.DIM}JSON: {json.dumps(location_data)}{Colors.RESET}")
                    else:
                        print(f"\n{Colors.RED}❌ Calculation failed{Colors.RESET}")
                
                current_readings = {}
                print_waiting()

            # Timeout handling
            if time.time() - last_ping_time > 15 and len(current_readings) > 0:
                print(f"\n{Colors.RED}⚠ Timeout - clearing incomplete data{Colors.RESET}")
                current_readings = {}
                last_ping_time = time.time()
                
            time.sleep(0.01)
            
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Shutting down...{Colors.RESET}")
    finally:
        try:
            import RPi.GPIO as GPIO
            GPIO.cleanup()
        except:
            pass