#!/usr/bin/env python3
import sys
import time
import math
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.drivers.sx126x import sx126x
from config.settings import SERIAL_PORT

def calibrate():
    print("=== LoRa RSSI Calibration Tool ===")
    print("This tool will help you find the correct 'RSSI_AT_1M' and 'ENV_FACTOR_N' values.")
    print("You need: 1 Master Node (attached to this Pi) and 1 Tourist Device (active).")
    
    try:
        # Initialize LoRa
        node = sx126x(serial_num=SERIAL_PORT, frequency=865, crypt=0, address=0, power=22)
    except Exception as e:
        print(f"Error initializing LoRa: {e}")
        return

    # --- Step 1: Measure RSSI at 1 meter ---
    print("\n--- STEP 1: Reference RSSI ---")
    print("1. Place the Tourist Device EXACTLY 1 meter away from this Master Node.")
    print("2. Ensure the Tourist Device is sending PINGs.")
    input("3. Press ENTER when ready...")
    
    rssi_1m = measure_rssi(node, "1 meter")
    print(f"\n✅ Average RSSI at 1m: {rssi_1m:.2f} dBm")
    
    # --- Step 2: Measure RSSI at known distance ---
    print("\n--- STEP 2: Path Loss Exponent ---")
    dist_input = input("1. Move the Tourist Device to a further known distance (e.g., 4 meters).\n   Enter the distance in meters: ")
    try:
        known_dist = float(dist_input)
        if known_dist <= 1:
            print("Distance must be greater than 1m. Using 4m.")
            known_dist = 4.0
    except:
        print("Invalid distance. Using default 4 meters.")
        known_dist = 4.0
        
    print(f"2. Place device at {known_dist} meters.")
    input("3. Press ENTER when ready...")
    
    rssi_far = measure_rssi(node, f"{known_dist} meters")
    print(f"\n✅ Average RSSI at {known_dist}m: {rssi_far:.2f} dBm")
    
    # --- Step 3: Calculate N ---
    # Formula: RSSI = RSSI_1M - 10 * N * log10(d)
    # So: 10 * N * log10(d) = RSSI_1M - RSSI
    # N = (RSSI_1M - RSSI) / (10 * log10(d))
    
    diff = rssi_1m - rssi_far
    log_dist = math.log10(known_dist)
    
    if diff < 0:
        print("\n⚠️ WARNING: Signal at far distance was stronger than at 1m.")
        print("   This is physically impossible in free space and indicates multipath interference.")
        print("   Try running the test again in a more open area.")
        n_factor = 2.0 # Default fallback
    else:
        n_factor = diff / (10 * log_dist)
    
    print("\n" + "="*40)
    print("   CALIBRATION RESULTS")
    print("="*40)
    print(f"Recommended settings for 'config/settings.py':")
    print(f"RSSI_AT_1M = {int(rssi_1m)}")
    print(f"ENV_FACTOR_N = {n_factor:.2f}")
    print("="*40)
    print("Update these values in 'config/settings.py' on all nodes to improve accuracy.")

def measure_rssi(node, label):
    readings = []
    print(f"Collecting 10 samples for {label}...", end="", flush=True)
    
    while len(readings) < 10:
        # Use existing receive logic which returns (msg, rssi)
        params = node.receive()
        
        if params and params[0]:
            msg, rssi = params
            # master.py logic: if msg and "PING" in msg...
            # We accept any message for RSSI calibration
            if rssi is not None:
                readings.append(rssi)
                print(".", end="", flush=True)
        
        time.sleep(0.1)
        
    avg = sum(readings) / len(readings)
    print(" Done!")
    return avg

if __name__ == "__main__":
    calibrate()
