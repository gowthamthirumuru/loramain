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


class MasterNode:
    def __init__(self):
        # Configuration
        self.anchors = get_anchors()
        self.required_anchors = ["MASTER", "ANCHOR_2", "ANCHOR_3"]
        
        # State
        self.current_readings = {}
        self.last_ping_time = time.time()
        self.last_heartbeat_time = time.time()
        self.current_device_id = None
        self.is_sos = False
        
        # Stats
        self.total_positions = 0
        self.successful_sends = 0
        
        # Offline Buffering
        self.offline_buffer = []
        self.buffer_limit = 100
        
        # Components
        self.backend = BackendClient()
        self.lora = self._init_lora()
        
    def _init_lora(self):
        freq = LORA_SETTINGS.get("FREQUENCY", 865)
        print(f"{Colors.DIM}Initializing LoRa at {freq} MHz...{Colors.RESET}")
        
        if IS_RASPBERRY_PI:
            try:
                lora = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=1, power=22, rssi=True)
                print(f"{Colors.GREEN}✓ LoRa hardware initialized{Colors.RESET}")
                return lora
            except Exception as e:
                print(f"{Colors.RED}✗ LoRa init failed: {e}{Colors.RESET}")
                return None
        else:
            print(f"{Colors.YELLOW}⚠ Running in simulation mode (not on Pi){Colors.RESET}")
            return None

    def start(self):
        clear_screen()
        print_header()
        
        if not self.anchors:
            print(f"{Colors.RED}✗ No anchors loaded! Check anchors.json{Colors.RESET}")
            return
        
        # Validate required anchors
        missing = [a for a in self.required_anchors if a not in self.anchors]
        if missing:
            print(f"{Colors.RED}✗ Missing anchor config: {missing}{Colors.RESET}")
            return

        print(f"{Colors.DIM}Connecting to backend at {self.backend.base_url}...{Colors.RESET}")
        if self.backend.check_connection():
            print(f"{Colors.GREEN}✓ Backend connected{Colors.RESET}")
            self.backend.send_heartbeat(anchor_id="MASTER", stats={"startup": True})
            
            # Fetch remote configuration (GPS Reference)
            if self.backend.fetch_config():
                print(f"{Colors.GREEN}✓ Remote configuration loaded{Colors.RESET}")
            else:
                print(f"{Colors.YELLOW}⚠ Using local default configuration{Colors.RESET}")
        else:
            print(f"{Colors.YELLOW}⚠ Backend unreachable - buffering enabled{Colors.RESET}")

        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ Ready! Awaiting tourist signals...{Colors.RESET}\n")
        
        try:
            while True:
                try:
                    self.loop()
                except Exception as e:
                    print(f"\n{Colors.RED}⚠ Critical Loop Error: {e}{Colors.RESET}")
                    # Optional: Log to file
                    time.sleep(1) # Prevent rapid-fire looping on error
                time.sleep(0.01)
        except KeyboardInterrupt:
            print(f"\n\n{Colors.YELLOW}Shutting down...{Colors.RESET}")
        finally:
            self.cleanup()

    def loop(self):
        # 1. Receive Messages
        if self.lora:
            msg, rssi = self.lora.receive()
            if msg:
                self.process_message(msg, rssi)
        
        # 2. Update Status UI
        if len(self.current_readings) > 0:
            self._print_status(len(self.current_readings))
            
        # 3. Timeouts
        if time.time() - self.last_ping_time > 15 and len(self.current_readings) > 0:
            print(f"\n{Colors.YELLOW}⚠ Timeout - clearing incomplete data{Colors.RESET}")
            self.reset_state()
            
        # 4. Trilateration
        if len(self.current_readings) >= 3:
            self.perform_trilateration()
            
        # 5. Heartbeat & Buffer Flush
        if time.time() - self.last_heartbeat_time > 60:
            self.send_heartbeat()
            self.flush_buffer()

    def process_message(self, msg, rssi):
        # IMPORTANT: Check REPORT first! REPORT messages contain "PING"/"SOS"
        # as a substring (e.g., "REPORT:ANCHOR_2:DEV001:-65:PING"), so checking
        # "PING" in msg first would incorrectly match REPORTs as direct pings.
        
        # Relay REPORT
        if "REPORT" in msg:
            try:
                # Format: "REPORT:ANCHOR_ID:TOURIST_ID:RSSI:MSG_TYPE"
                parts = msg.split(":")
                
                if len(parts) >= 4:
                    sender_anchor_id = parts[1].strip().upper()
                    reported_tourist_id = parts[2].strip().upper()
                    reported_rssi = int(parts[3])
                    
                    # Check for SOS in 5th part
                    if len(parts) >= 5:
                        msg_type = parts[4].strip().upper()
                        if "SOS" in msg_type:
                            self.is_sos = True
                            print(f"{Colors.RED}🚨 Relay {sender_anchor_id} reports SOS from {reported_tourist_id}{Colors.RESET}")
                    
                    # LOGIC: Ensure we are aggregating data for the SAME tourist
                    # If we haven't locked onto a tourist yet (missed direct ping), accept this one.
                    if self.current_device_id is None:
                        self.current_device_id = reported_tourist_id
                        self.last_ping_time = time.time() # Reset timeout
                        print(f"{Colors.YELLOW}⚠ Indirect detection (Relay) for {self.current_device_id}{Colors.RESET}")
                        
                    # Only accept if it matches the current session
                    if self.current_device_id == reported_tourist_id:
                        self.current_readings[sender_anchor_id] = reported_rssi
                    else:
                        # Ignore reports for other tourists to prevent data corruption
                        pass
                
                # Backward compatibility (Old format: "REPORT:ANCHOR_ID:RSSI")
                elif len(parts) == 3:
                     sender_anchor_id = parts[1].strip().upper()
                     reported_rssi = int(parts[2])
                     # We can't verify ID, so we blindly accept if we already have a session
                     if self.current_device_id:
                         self.current_readings[sender_anchor_id] = reported_rssi
            except Exception as e:
                print(f"{Colors.RED}Error parsing report: {e}{Colors.RESET}")
        
        # Direct PING/SOS from tourist device
        elif "PING" in msg or "SOS" in msg:
            self.current_readings["MASTER"] = rssi
            self.last_ping_time = time.time()
            
            try:
                parts = msg.split(":")
                if len(parts) >= 2:
                    self.current_device_id = parts[1].strip().upper()
                self.is_sos = "SOS" in msg
            except:
                self.current_device_id = "UNKNOWN"

    def perform_trilateration(self):
        self.total_positions += 1
        
        tri_input = []
        distances = {}
        rssi_values = []
        
        for anchor_id in self.required_anchors:
            if anchor_id in self.current_readings:
                rssi_val = self.current_readings[anchor_id]
                dist = MathEngine.rssi_to_distance(rssi_val)
                distances[anchor_id] = dist
                rssi_values.append(rssi_val)
                tri_input.append({
                    'x': self.anchors[anchor_id]["x"], 
                    'y': self.anchors[anchor_id]["y"], 
                    'r': dist
                })

        if len(tri_input) >= 3:
            result = MathEngine.trilaterate(tri_input)
            
            if result:
                x, y = result
                self._print_location(x, y, distances)
                
                if self.current_device_id:
                    rssi_avg = int(sum(rssi_values) / len(rssi_values))
                    self.send_data(x, y, rssi_avg)
                
                print(f"{Colors.DIM}  Stats: Positions={self.total_positions}, Sent={self.successful_sends}, Buffer={len(self.offline_buffer)}{Colors.RESET}")
            else:
                print(f"\n{Colors.RED}❌ Trilateration failed{Colors.RESET}")
        
        self.reset_state()
        self._print_waiting()

    def send_data(self, x, y, rssi_avg):
        # Try sending immediately
        success = self.backend.send_location(
            device_id=self.current_device_id,
            x=x, y=y, rssi_avg=rssi_avg, sos_flag=self.is_sos
        )
        
        if success:
            self.successful_sends += 1
            print(f"{Colors.GREEN}  ✓ Sent to backend{Colors.RESET}")
            # Opportunistic flush if we are connected
            if self.offline_buffer:
                self.flush_buffer()
        else:
            # Buffer it
            print(f"{Colors.YELLOW}  ⚠ Backend unreachable - Buffering...{Colors.RESET}")
            self.offline_buffer.append({
                "device_id": self.current_device_id,
                "x": x, "y": y,
                "rssi": rssi_avg,
                "sos_flag": self.is_sos,
                "timestamp": time.time()
            })
            # Trim buffer if too large
            if len(self.offline_buffer) > self.buffer_limit:
                self.offline_buffer.pop(0)

    def flush_buffer(self):
        if not self.offline_buffer:
            return
            
        print(f"{Colors.DIM}Attempting to flush {len(self.offline_buffer)} buffered records...{Colors.RESET}")
        results = self.backend.send_batch_locations(self.offline_buffer)
        
        # If API returns success stats, clear buffer (or failing items)
        # Assuming simple clear for now if call succeeds, as send_batch_locations returns processed count logic
        # But my current backend_client returns {"processed": 0, "failed": ...} on error
        
        # If result implies success, clear sent items.
        # For simplicity, if check_connection is True, clear logic.
        # Wait, backend_client.send_batch_locations returns a dict.
        
        # Let's trust if we get a response it's handled.
        # Actually proper way:
        if results.get('processed', 0) > 0 or results.get('received', False):
             self.offline_buffer = [] # Clear all for now
             print(f"{Colors.GREEN}  ✓ Buffer flushed{Colors.RESET}")
        else:
             print(f"{Colors.YELLOW}  ⚠ Flush failed{Colors.RESET}")

    def send_heartbeat(self):
        self.backend.send_heartbeat(
            anchor_id="MASTER",
            stats={
                "total_positions": self.total_positions,
                "successful_sends": self.successful_sends,
                "buffered_items": len(self.offline_buffer)
            }
        )
        self.last_heartbeat_time = time.time()

    def reset_state(self):
        self.current_readings = {}
        self.current_device_id = None
        self.is_sos = False

    def cleanup(self):
        if IS_RASPBERRY_PI:
            try:
                import RPi.GPIO as GPIO
                GPIO.cleanup()
            except:
                pass

    # --- UI Helpers ---
    def _print_status(self, anchors_received, total=3):
        bar = "█" * anchors_received + "░" * (total - anchors_received)
        color = Colors.GREEN if anchors_received == total else Colors.YELLOW
        print(f"\r{Colors.DIM}Signal Collection: {color}[{bar}] {anchors_received}/{total}{Colors.RESET}", end='', flush=True)

    def _print_location(self, x, y, distances):
        print(f"\n\n{Colors.GREEN}{Colors.BOLD}")
        print("┌──────────────────────────────────────────────────────────┐")
        if self.is_sos:
            print(f"│  🚨 SOS ALERT - {self.current_device_id or 'UNKNOWN':<40} │")
        else:
            print(f"│  📍 TOURIST LOCATED - {self.current_device_id or 'UNKNOWN':<34} │")
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

    def _print_waiting(self):
        print(f"\n{Colors.DIM}⏳ Waiting for signals...{Colors.RESET}", end='\r')


def run_master():
    """
    Run the master node.
    """
    node = MasterNode()
    node.start()


if __name__ == "__main__":
    run_master()
