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
    "FREQUENCY": 868,      # Change to 915 for US/Aus or 433 for Asia (check your module)
    "TX_POWER": 22,        # Max power (dBm)
    "BANDWIDTH": 125.0,    # kHz
    "SPREADING_FACTOR": 9, # Higher = More Range, Slower Speed
    "CODING_RATE": 5       # 4/5
}

# --- 3. Math & Calibration Constants ---
# Path Loss Exponent (N): 
# 2.0 = Open Space (Line of Sight)
# 3.0 = Urban / Trees (Likely your case)
ENV_FACTOR_N = 3.0 

# Measured RSSI at 1 meter distance (You must calibrate this later!)
RSSI_AT_1M = -45 

# --- 4. Load Anchors ---
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