#!/usr/bin/env python3
"""
LoRa Calibration Tool for Tourist Safety System
================================================
This script helps calibrate the RSSI path loss model parameters:
  - RSSI_AT_1M: The expected RSSI at exactly 1 meter distance.
  - ENV_FACTOR_N: The path loss exponent for your environment.

Run this on a Raspberry Pi with the LoRa HAT connected.
"""

import sys
import os
import time
import math
import statistics

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

try:
    from src.drivers.sx126x import sx126x
    HARDWARE_AVAILABLE = True
except ImportError:
    HARDWARE_AVAILABLE = False
    print("[WARN] LoRa hardware driver not available. Running in simulation mode.")

from config.settings import LORA_SETTINGS, SERIAL_PORT, ENV_FACTOR_N, RSSI_AT_1M

# --- Configuration ---
SAMPLE_COUNT = 20           # Target RSSI samples (Tourist pings every 2s, so 20 = ~40s)
SAMPLE_INTERVAL = 2.5       # Seconds between checks (match tourist ping interval)
CALIBRATION_DISTANCE_2 = 5  # Second distance in meters for N calculation
MIN_SAMPLES = 5             # Minimum samples needed for valid calibration


def collect_rssi_samples(node, count=SAMPLE_COUNT):
    """
    Collects multiple RSSI samples and returns the list.
    Filters out None values.
    """
    samples = []
    max_attempts = count * 5  # More attempts to account for missed packets
    print(f"  Collecting up to {count} RSSI samples (this takes ~{count * 2}s)...")
    print("  Keep the transmitter active and at the correct distance.")
    print()
    
    for i in range(max_attempts):
        if len(samples) >= count:
            break
        
        msg, rssi = node.receive()
        if rssi is not None:
            samples.append(rssi)
            print(f"\r  Samples: {len(samples)}/{count} | Latest RSSI: {rssi} dBm    ", end='', flush=True)
        else:
            print(f"\r  Samples: {len(samples)}/{count} | Waiting for signal...    ", end='', flush=True)
        
        time.sleep(SAMPLE_INTERVAL)
    
    print()  # Newline after progress
    return samples


def calculate_statistics(samples):
    """
    Returns mean, median, and std deviation of RSSI samples.
    """
    if not samples:
        return None, None, None
    
    mean_val = statistics.mean(samples)
    median_val = statistics.median(samples)
    stdev_val = statistics.stdev(samples) if len(samples) > 1 else 0
    
    return mean_val, median_val, stdev_val


def calculate_env_factor(rssi_1m, rssi_d, distance):
    """
    Calculate the path loss exponent N.
    Formula: N = (RSSI_1m - RSSI_d) / (10 * log10(distance))
    """
    if distance <= 1:
        return None
    
    n = (rssi_1m - rssi_d) / (10 * math.log10(distance))
    return round(n, 2)


def run_calibration():
    """
    Main calibration routine.
    """
    print("=" * 60)
    print("   LoRa Calibration Tool - Tourist Safety System")
    print("=" * 60)
    print()
    
    # --- Initialize LoRa ---
    if HARDWARE_AVAILABLE:
        print("[1/4] Initializing LoRa module...")
        try:
            node = sx126x(
                serial_num=SERIAL_PORT,
                freq=LORA_SETTINGS["FREQUENCY"],
                addr=0,
                power=LORA_SETTINGS["TX_POWER"],
                rssi=True  # Enable RSSI reporting
            )
            print("  LoRa module initialized successfully!")
        except Exception as e:
            print(f"  ERROR: Failed to initialize LoRa: {e}")
            print("  Please check wiring and serial port configuration.")
            return
    else:
        print("[1/4] SIMULATION MODE - No hardware available")
        node = None
    
    print()
    
    # --- Step 1: Calibrate RSSI at 1 meter ---
    print("[2/4] Calibrating RSSI at 1 meter distance")
    print("-" * 40)
    print("  INSTRUCTIONS:")
    print("  1. Place the TRANSMITTING device (Tourist node) exactly 1 meter away.")
    print("  2. Ensure line-of-sight between devices.")
    print("  3. Keep the transmitting device sending pings.")
    print()
    input("  Press ENTER when ready to start measurement...")
    
    if HARDWARE_AVAILABLE and node:
        samples_1m = collect_rssi_samples(node, SAMPLE_COUNT)
        
        if len(samples_1m) < MIN_SAMPLES:
            print("  ERROR: Not enough samples collected. Check if transmitter is active.")
            return
        
        mean_1m, median_1m, stdev_1m = calculate_statistics(samples_1m)
        print(f"\n  Results at 1 meter:")
        print(f"    Mean RSSI:   {mean_1m:.1f} dBm")
        print(f"    Median RSSI: {median_1m:.1f} dBm")
        print(f"    Std Dev:     {stdev_1m:.2f} dBm")
        
        # Use median as it's more robust to outliers
        rssi_at_1m_calibrated = round(median_1m)
    else:
        # Simulation mode - use default
        print("  [SIM] Using simulated RSSI: -42 dBm")
        rssi_at_1m_calibrated = -42
        median_1m = -42
    
    print()
    
    # --- Step 2: Calibrate Environment Factor (N) ---
    print(f"[3/4] Calibrating Environment Factor (N) at {CALIBRATION_DISTANCE_2} meters")
    print("-" * 40)
    print(f"  INSTRUCTIONS:")
    print(f"  1. Move the TRANSMITTING device to exactly {CALIBRATION_DISTANCE_2} meters away.")
    print("  2. Ensure line-of-sight between devices.")
    print("  3. Keep the transmitting device sending pings.")
    print()
    input("  Press ENTER when ready to start measurement...")
    
    if HARDWARE_AVAILABLE and node:
        samples_d = collect_rssi_samples(node, SAMPLE_COUNT)
        
        if len(samples_d) < MIN_SAMPLES:
            print("  ERROR: Not enough samples collected.")
            return
        
        mean_d, median_d, stdev_d = calculate_statistics(samples_d)
        print(f"\n  Results at {CALIBRATION_DISTANCE_2} meters:")
        print(f"    Mean RSSI:   {mean_d:.1f} dBm")
        print(f"    Median RSSI: {median_d:.1f} dBm")
        print(f"    Std Dev:     {stdev_d:.2f} dBm")
        
        # Calculate N using median values
        env_factor_calibrated = calculate_env_factor(median_1m, median_d, CALIBRATION_DISTANCE_2)
    else:
        # Simulation mode
        print(f"  [SIM] Using simulated RSSI at {CALIBRATION_DISTANCE_2}m: -63 dBm")
        env_factor_calibrated = calculate_env_factor(-42, -63, CALIBRATION_DISTANCE_2)
    
    print()
    
    # --- Results ---
    print("[4/4] Calibration Complete!")
    print("=" * 60)
    print()
    print("  CALIBRATED VALUES:")
    print(f"    RSSI_AT_1M   = {rssi_at_1m_calibrated}    (was: {RSSI_AT_1M})")
    print(f"    ENV_FACTOR_N = {env_factor_calibrated}   (was: {ENV_FACTOR_N})")
    print()
    print("  TO APPLY THESE VALUES:")
    print("  Edit file: config/settings.py")
    print()
    print("  Update the following lines:")
    print(f"    ENV_FACTOR_N = {env_factor_calibrated}")
    print(f"    RSSI_AT_1M = {rssi_at_1m_calibrated}")
    print()
    print("=" * 60)
    
    # --- Optional: Test the new values ---
    print()
    test = input("  Would you like to test accuracy at a known distance? (y/n): ")
    if test.lower() == 'y':
        try:
            test_distance = float(input("  Enter the ACTUAL distance in meters: "))
        except ValueError:
            print("  Invalid input. Skipping test.")
            return
        
        print(f"\n  Collecting samples at {test_distance}m...")
        
        if HARDWARE_AVAILABLE and node:
            test_samples = collect_rssi_samples(node, 30)
            if test_samples:
                _, median_test, _ = calculate_statistics(test_samples)
                
                # Calculate estimated distance using new calibration
                exponent = (rssi_at_1m_calibrated - median_test) / (10 * env_factor_calibrated)
                estimated_distance = 10 ** exponent
                
                error = abs(estimated_distance - test_distance)
                error_pct = (error / test_distance) * 100
                
                print(f"\n  TEST RESULTS:")
                print(f"    Actual Distance:    {test_distance:.1f} m")
                print(f"    Estimated Distance: {estimated_distance:.1f} m")
                print(f"    Error:              {error:.2f} m ({error_pct:.1f}%)")
        else:
            print("  [SIM] Cannot test without hardware.")
    
    print("\n  Calibration complete. Goodbye!")


if __name__ == "__main__":
    try:
        run_calibration()
    except KeyboardInterrupt:
        print("\n\nCalibration cancelled by user.")
        sys.exit(0)
