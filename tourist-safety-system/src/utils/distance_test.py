#!/usr/bin/env python3
"""
LoRa Distance Tester - Real-time RSSI to Distance Monitor
==========================================================
Continuously displays the estimated distance between two LoRa devices.
Useful for testing and verifying calibration accuracy.

Run this on a Raspberry Pi with the LoRa HAT connected.
"""

import sys
import os
import time

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

try:
    from src.drivers.sx126x import sx126x
    HARDWARE_AVAILABLE = True
except ImportError:
    HARDWARE_AVAILABLE = False
    print("[WARN] LoRa hardware not available.")

from config.settings import LORA_SETTINGS, SERIAL_PORT, ENV_FACTOR_N, RSSI_AT_1M


def rssi_to_distance(rssi):
    """Convert RSSI to distance in meters using log-distance path loss model."""
    if rssi > -10:
        rssi = -10  # Cap unrealistic values
    exponent = (RSSI_AT_1M - rssi) / (10 * ENV_FACTOR_N)
    return 10 ** exponent


def signal_strength_bar(rssi, min_rssi=-100, max_rssi=-20):
    """Generate a visual bar for signal strength."""
    # Clamp values
    rssi = max(min_rssi, min(max_rssi, rssi))
    # Calculate percentage
    pct = (rssi - min_rssi) / (max_rssi - min_rssi)
    bar_len = int(pct * 20)
    return "█" * bar_len + "░" * (20 - bar_len)


def run_distance_test():
    """Main distance testing loop."""
    print("=" * 60)
    print("   LoRa Distance Tester - Real-time Monitor")
    print("=" * 60)
    print()
    print(f"  Current Calibration:")
    print(f"    RSSI_AT_1M   = {RSSI_AT_1M} dBm")
    print(f"    ENV_FACTOR_N = {ENV_FACTOR_N}")
    print()
    
    if not HARDWARE_AVAILABLE:
        print("  ERROR: LoRa hardware not available!")
        return
    
    print("  Initializing LoRa module...")
    try:
        node = sx126x(
            serial_num=SERIAL_PORT,
            freq=LORA_SETTINGS["FREQUENCY"],
            addr=0,
            power=LORA_SETTINGS["TX_POWER"],
            rssi=True
        )
        print("  LoRa module ready!")
    except Exception as e:
        print(f"  ERROR: {e}")
        return
    
    print()
    print("  Listening for signals... (Ctrl+C to stop)")
    print("-" * 60)
    print()
    
    # Stats tracking
    rssi_history = []
    max_history = 10  # Rolling average window
    
    try:
        while True:
            msg, rssi = node.receive()
            
            if rssi is not None:
                # Calculate distance
                distance = rssi_to_distance(rssi)
                
                # Update rolling average
                rssi_history.append(rssi)
                if len(rssi_history) > max_history:
                    rssi_history.pop(0)
                avg_rssi = sum(rssi_history) / len(rssi_history)
                avg_distance = rssi_to_distance(avg_rssi)
                
                # Signal quality indicator
                bar = signal_strength_bar(rssi)
                
                # Display
                print(f"\r  RSSI: {rssi:4d} dBm  │  Distance: {distance:6.1f} m  │  Avg: {avg_distance:6.1f} m  │  {bar}", end='', flush=True)
                
                # Also print message content if present
                if msg and len(msg.strip()) > 0:
                    print(f"\n  Message: {msg.strip()}")
            
            time.sleep(0.5)
            
    except KeyboardInterrupt:
        print("\n\n  Test stopped.")
        
        # Print summary
        if rssi_history:
            print()
            print("  SESSION SUMMARY:")
            print(f"    Samples:      {len(rssi_history)}")
            print(f"    Avg RSSI:     {sum(rssi_history)/len(rssi_history):.1f} dBm")
            print(f"    Min RSSI:     {min(rssi_history)} dBm")
            print(f"    Max RSSI:     {max(rssi_history)} dBm")
            print(f"    Avg Distance: {rssi_to_distance(sum(rssi_history)/len(rssi_history)):.1f} m")


if __name__ == "__main__":
    run_distance_test()
