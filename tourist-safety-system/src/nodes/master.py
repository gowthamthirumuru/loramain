"""
LoRa Master Node (Anchor 1 / Gateway)
Collects RSSI readings, performs trilateration, and sends positions to backend.
"""

import time
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import sx126x
from src.utils.math_helper import MathEngine
from src.utils.backend_client import BackendClient
from config.settings import get_anchors, SERIAL_PORT, LORA_SETTINGS, IS_RASPBERRY_PI

# ANSI Color Codes for terminal output
class Colors:
    HEADER = '\033[95m'
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

def print_location(x, y, distances, device_id=None, is_sos=False):
    print(f"\n\n{Colors.GREEN}{Colors.BOLD}")
    print("┌──────────────────────────────────────────────────────────┐")
    if is_sos:
        print(f"│  🚨 SOS ALERT - {device_id or 'UNKNOWN':<40} │")
    else:
        print(f"│  📍 TOURIST LOCATED - {device_id or 'UNKNOWN':<34} │")
    print("├──────────────────────────────────────────────────────────┤")
    print(f"│     X = {x:>8.2f} meters                                 │")
    print(f"│     Y = {y:>8.2f} meters                                 │")
    print("├──────────────────────────────────────────────────────────┤")
    print(f"│  {Colors.DIM}Distances:{Colors.GREEN}{Colors.BOLD}                                              │")
    for anchor, dist in distances.items():
        line = f"│    • {anchor}: {dist:.2f}m"
        print(f"{line:<60}│")
    print("└──────────────────────────────────────────────────────────┘")
    print(f"{Colors.RESET}")

def print_waiting():
    print(f"\n{Colors.DIM}⏳ Waiting for signals...{Colors.RESET}", end='\r')


def run_master():
    clear_screen()
    print_header()
    
    # Get frequency from centralized config
    freq = LORA_SETTINGS.get("FREQUENCY", 865)
    
    # Initialize LoRa
    print(f"{Colors.DIM}Initializing LoRa at {freq} MHz...{Colors.RESET}")
    
    if IS_RASPBERRY_PI:
        lora = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=1, power=22, rssi=True)
        print(f"{Colors.GREEN}✓ LoRa hardware initialized{Colors.RESET}")
    else:
        lora = None
        print(f"{Colors.YELLOW}⚠ Running in simulation mode (not on Pi){Colors.RESET}")
    
    # Load anchor positions
    anchors = get_anchors()
    if anchors:
        print(f"{Colors.GREEN}✓ Loaded {len(anchors)} anchors{Colors.RESET}")
    else:
        print(f"{Colors.RED}✗ No anchors loaded! Check anchors.json{Colors.RESET}")
        return
    
    # Validate required anchors
    required_anchors = ["MASTER", "ANCHOR_2", "ANCHOR_3"]
    missing = [a for a in required_anchors if a not in anchors]
    if missing:
        print(f"{Colors.RED}✗ Missing anchor config: {missing}{Colors.RESET}")
        return
    
    # Initialize backend client
    backend = BackendClient()
    print(f"{Colors.DIM}Connecting to backend at {backend.base_url}...{Colors.RESET}")
    
    if backend.check_connection():
        print(f"{Colors.GREEN}✓ Backend connected{Colors.RESET}")
        backend.send_heartbeat(anchor_id="MASTER", stats={"startup": True})
    else:
        print(f"{Colors.YELLOW}⚠ Backend unreachable - will retry on each update{Colors.RESET}")
    
    print(f"\n{Colors.GREEN}{Colors.BOLD}✓ Ready! Awaiting tourist signals...{Colors.RESET}\n")
    
    # State tracking
    current_readings = {}
    last_ping_time = time.time()
    last_heartbeat_time = time.time()
    current_device_id = None
    is_sos = False
    
    # Counters
    total_positions = 0
    successful_sends = 0
    
    try:
        while True:
            # Receive data
            msg, rssi = None, None
            if lora:
                msg, rssi = lora.receive()
            
            if msg:
                # Direct PING/SOS from tourist
                if "PING" in msg or "SOS" in msg:
                    current_readings["MASTER"] = rssi
                    last_ping_time = time.time()
                    
                    # Extract device ID
                    try:
                        parts = msg.split(":")
                        if len(parts) >= 2:
                            current_device_id = parts[1].strip().upper()
                        is_sos = "SOS" in msg
                    except:
                        current_device_id = "UNKNOWN"
                
                # Report from relay
                elif "REPORT" in msg:
                    try:
                        parts = msg.split(":")
                        sender_id = parts[1].strip().upper()
                        reported_rssi = int(parts[2])
                        current_readings[sender_id] = reported_rssi
                    except:
                        pass

            # Update status bar
            if len(current_readings) > 0:
                print_status(len(current_readings))

            # Triangulate when we have all 3 readings
            if len(current_readings) >= 3:
                total_positions += 1
                
                tri_input = []
                distances = {}
                rssi_values = []
                
                # Build trilateration input
                for anchor_id in ["MASTER", "ANCHOR_2", "ANCHOR_3"]:
                    if anchor_id in current_readings:
                        rssi_val = current_readings[anchor_id]
                        dist = MathEngine.rssi_to_distance(rssi_val)
                        distances[anchor_id] = dist
                        rssi_values.append(rssi_val)
                        tri_input.append({
                            'x': anchors[anchor_id]["x"], 
                            'y': anchors[anchor_id]["y"], 
                            'r': dist
                        })

                # Calculate position
                if len(tri_input) >= 3:
                    result = MathEngine.trilaterate(tri_input)
                    
                    if result:
                        x, y = result[0], result[1]
                        print_location(x, y, distances, current_device_id, is_sos)
                        
                        # Send to backend
                        if current_device_id:
                            rssi_avg = int(sum(rssi_values) / len(rssi_values))
                            success = backend.send_location(
                                device_id=current_device_id,
                                x=x,
                                y=y,
                                rssi_avg=rssi_avg,
                                sos_flag=is_sos
                            )
                            if success:
                                successful_sends += 1
                                print(f"{Colors.GREEN}  ✓ Sent to backend{Colors.RESET}")
                            else:
                                print(f"{Colors.YELLOW}  ⚠ Backend send failed{Colors.RESET}")
                        
                        print(f"{Colors.DIM}  Stats: Positions={total_positions}, Sent={successful_sends}{Colors.RESET}")
                    else:
                        print(f"\n{Colors.RED}❌ Trilateration failed{Colors.RESET}")
                
                # Reset for next cycle
                current_readings = {}
                current_device_id = None
                is_sos = False
                print_waiting()

            # Timeout handling
            if time.time() - last_ping_time > 15 and len(current_readings) > 0:
                print(f"\n{Colors.YELLOW}⚠ Timeout - clearing incomplete data{Colors.RESET}")
                current_readings = {}
                current_device_id = None
                is_sos = False
                last_ping_time = time.time()
            
            # Periodic heartbeat (every 60 seconds)
            if time.time() - last_heartbeat_time > 60:
                backend.send_heartbeat(
                    anchor_id="MASTER",
                    stats={
                        "total_positions": total_positions,
                        "successful_sends": successful_sends
                    }
                )
                last_heartbeat_time = time.time()
                
            time.sleep(0.01)
            
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Shutting down...{Colors.RESET}")
    finally:
        if IS_RASPBERRY_PI:
            try:
                import RPi.GPIO as GPIO
                GPIO.cleanup()
            except:
                pass


if __name__ == "__main__":
    run_master()
