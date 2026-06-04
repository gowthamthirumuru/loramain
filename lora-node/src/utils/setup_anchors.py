#!/usr/bin/env python3
"""
Anchor GPS Setup Tool
======================
Interactively enter GPS coordinates for all anchors (Master, Anchor 2, Anchor 3).
Updates both anchors.json and settings.py with real-world GPS coordinates.

Run: python3 src/utils/setup_anchors.py
"""

import sys
import os
import json
import math

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

CONFIG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../config'))
ANCHORS_FILE = os.path.join(CONFIG_DIR, 'anchors.json')
SETTINGS_FILE = os.path.join(CONFIG_DIR, 'settings.py')


def haversine_distance(lat1, lng1, lat2, lng2):
    """Calculate distance in meters between two GPS points using Haversine formula."""
    R = 6371000  # Earth's radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def gps_to_local_xy(lat, lng, ref_lat, ref_lng):
    """
    Convert GPS coordinates to local X,Y (meters) relative to reference point.
    Reference point becomes (0, 0).
    """
    # Calculate X (East-West distance)
    x = haversine_distance(ref_lat, ref_lng, ref_lat, lng)
    if lng < ref_lng:
        x = -x
    
    # Calculate Y (North-South distance)
    y = haversine_distance(ref_lat, ref_lng, lat, ref_lng)
    if lat < ref_lat:
        y = -y
    
    return round(x, 2), round(y, 2)


def get_gps_input(anchor_name):
    """Get GPS coordinates from user input."""
    print(f"\n  Enter GPS coordinates for {anchor_name}:")
    print("  (You can copy these from Google Maps)")
    
    while True:
        try:
            lat_str = input(f"    Latitude:  ").strip()
            lat = float(lat_str)
            if not (-90 <= lat <= 90):
                print("    ERROR: Latitude must be between -90 and 90")
                continue
            break
        except ValueError:
            print("    ERROR: Invalid number. Please enter a decimal value.")
    
    while True:
        try:
            lng_str = input(f"    Longitude: ").strip()
            lng = float(lng_str)
            if not (-180 <= lng <= 180):
                print("    ERROR: Longitude must be between -180 and 180")
                continue
            break
        except ValueError:
            print("    ERROR: Invalid number. Please enter a decimal value.")
    
    return lat, lng


def update_settings_gps_reference(lat, lng):
    """Update GPS_REFERENCE in settings.py."""
    with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find and replace GPS_REFERENCE block
    import re
    pattern = r'GPS_REFERENCE\s*=\s*\{[^}]+\}'
    replacement = f'''GPS_REFERENCE = {{
    "lat": {lat},   # Latitude of MASTER anchor
    "lng": {lng}    # Longitude of MASTER anchor
}}'''
    
    new_content = re.sub(pattern, replacement, content)
    
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)


def run_setup():
    """Main setup routine."""
    print("=" * 60)
    print("   Anchor GPS Setup Tool")
    print("=" * 60)
    print()
    print("  This tool will help you configure the GPS coordinates")
    print("  for all anchor nodes in your tourist safety system.")
    print()
    print("  TIP: Open Google Maps, right-click on the anchor location,")
    print("       and copy the coordinates (lat, lng format).")
    print()
    
    # Load current anchors
    try:
        with open(ANCHORS_FILE, 'r') as f:
            anchors = json.load(f)
    except FileNotFoundError:
        print("  ERROR: anchors.json not found!")
        return
    
    # Collect GPS for all anchors
    anchor_gps = {}
    
    # Master first (becomes reference point)
    print("-" * 60)
    print("  STEP 1: MASTER Node (This will be the reference point 0,0)")
    master_lat, master_lng = get_gps_input("MASTER")
    anchor_gps["MASTER"] = {"lat": master_lat, "lng": master_lng}
    
    # Other anchors
    print()
    print("-" * 60)
    print("  STEP 2: ANCHOR_2 (Relay Node 1)")
    a2_lat, a2_lng = get_gps_input("ANCHOR_2")
    anchor_gps["ANCHOR_2"] = {"lat": a2_lat, "lng": a2_lng}
    
    print()
    print("-" * 60)
    print("  STEP 3: ANCHOR_3 (Relay Node 2)")
    a3_lat, a3_lng = get_gps_input("ANCHOR_3")
    anchor_gps["ANCHOR_3"] = {"lat": a3_lat, "lng": a3_lng}
    
    # Calculate local X,Y coordinates relative to Master
    print()
    print("-" * 60)
    print("  Calculating local coordinates...")
    
    for name, gps in anchor_gps.items():
        x, y = gps_to_local_xy(gps["lat"], gps["lng"], master_lat, master_lng)
        anchors[name]["x"] = x
        anchors[name]["y"] = y
        anchors[name]["gps_lat"] = gps["lat"]
        anchors[name]["gps_lng"] = gps["lng"]
        
        dist = haversine_distance(master_lat, master_lng, gps["lat"], gps["lng"])
        print(f"    {name}: ({x}, {y}) m  |  {dist:.1f}m from MASTER")
    
    # Save updated anchors.json
    with open(ANCHORS_FILE, 'w') as f:
        json.dump(anchors, f, indent=4)
    print(f"\n  ✓ Updated: {ANCHORS_FILE}")
    
    # Update GPS_REFERENCE in settings.py
    update_settings_gps_reference(master_lat, master_lng)
    print(f"  ✓ Updated: {SETTINGS_FILE}")
    
    # Summary
    print()
    print("=" * 60)
    print("  SETUP COMPLETE!")
    print("=" * 60)
    print()
    print("  Anchor Positions (local coordinates, meters):")
    print(f"    MASTER:   (0.00, 0.00)")
    print(f"    ANCHOR_2: ({anchors['ANCHOR_2']['x']}, {anchors['ANCHOR_2']['y']})")
    print(f"    ANCHOR_3: ({anchors['ANCHOR_3']['x']}, {anchors['ANCHOR_3']['y']})")
    print()
    print("  GPS Reference Point (MASTER):")
    print(f"    Latitude:  {master_lat}")
    print(f"    Longitude: {master_lng}")
    print()


if __name__ == "__main__":
    try:
        run_setup()
    except KeyboardInterrupt:
        print("\n\n  Setup cancelled.")
        sys.exit(0)
