import platform
import json
import os

# --- 1. Environment Detection ---
# Check if we are running on a Raspberry Pi or a Windows Laptop
IS_RASPBERRY_PI = platform.system() == "Linux" and "aarch" in platform.machine()
# Note: On a real Pi, platform.machine() usually contains 'arm' or 'aarch'.
# If you are on standard Linux desktop, we might need a stricter check, 
# but for Windows vs Pi, this is usually sufficient.

# --- 2. LoRa Hardware Configuration ---
# Standard SX126x Pin Mapping for Raspberry Pi
LORA_PINS = {
    "MISO": 21,
    "MOSI": 19,
    "SCK":  23,
    "CS":   8,   # Chip Select
    "RESET": 22,
    "BUSY": 27,
    "DIO1": 26   # Interrupt pin
}

# LoRa Radio Settings
LORA_SETTINGS = {
    "FREQUENCY": 865,      # 865 MHz for India (850-930 MHz band for E22-900T22S)
    "TX_POWER": 22,        # Max power (dBm)
    "BANDWIDTH": 125.0,    # kHz
    "SPREADING_FACTOR": 9, # Higher = More Range, Slower Speed
    "CODING_RATE": 5       # 4/5
}

# --- 3. Serial Port Configuration ---
# Raspberry Pi serial port (most Pi models use /dev/ttyS0, some use /dev/ttyAMA0)
SERIAL_PORT = "/dev/ttyS0"

# --- 4. Math & Calibration Constants ---
# Path Loss Exponent (N): 
# 2.0 = Open Space (Line of Sight)
# 3.0 = Urban / Trees / Light obstacles
# 4.0 = Indoor / Walls / Heavy obstacles (USE THIS FOR ROOM TESTING!)
ENV_FACTOR_N = 4.0  # ← CHANGED FOR INDOOR TESTING

# Measured RSSI at 1 meter distance 
# TODO: Calibrate this on your first test!
# Steps: 1) Place tourist 1 meter from anchor
#        2) Read the RSSI value from relay output
#        3) Update this value
RSSI_AT_1M = -40  # ← Typical indoor value (may need adjustment) 

# --- 5. Load Anchors ---
def get_anchors():
    """Reads the anchors.json file and returns the dictionary."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, 'config', 'anchors.json')
    
    try:
        with open(json_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("ERROR: anchors.json not found!")
        return {}

# Debug Print (Optional, to verify where we are running)
if __name__ == "__main__":
    print(f"Running on Raspberry Pi? {IS_RASPBERRY_PI}")
    print(f"Loaded Anchors: {list(get_anchors().keys())}")