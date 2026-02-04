
import math
import sys
import os

# Add project root to path to import settings
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from config.settings import GPS_REFERENCE

def get_meters_from_gps(target_lat, target_lng):
    """
    Calculates the relative (x, y) in meters from the Master Anchor (Origin).
    """
    ref_lat = GPS_REFERENCE['lat']
    ref_lng = GPS_REFERENCE['lng']

    print(f"Reference (Master): {ref_lat}, {ref_lng}")
    print(f"Target (Anchor):    {target_lat}, {target_lng}")

    # Approximate conversion (valid for small distances < 10km)
    # 1 deg lat = 111,000 meters
    meters_per_deg_lat = 111000
    
    # 1 deg lng = 111,000 * cos(lat)
    meters_per_deg_lng = 111000 * math.cos(math.radians(ref_lat))

    # Calculate differences
    delta_lat = target_lat - ref_lat
    delta_lng = target_lng - ref_lng

    # Convert to meters
    y = delta_lat * meters_per_deg_lat
    x = delta_lng * meters_per_deg_lng

    return round(x, 2), round(y, 2)

if __name__ == "__main__":
    print("--- Anchor GPS to Local (X,Y) Calculator ---")
    print(f"Using Master Reference from settings.py: {GPS_REFERENCE}")
    print("-" * 50)
    
    try:
        lat_input = input("Enter Anchor Latitude: ")
        lng_input = input("Enter Anchor Longitude: ")
        
        lat = float(lat_input)
        lng = float(lng_input)
        
        x, y = get_meters_from_gps(lat, lng)
        
        print("\n" + "="*40)
        print(f"  CALCULATED VALUES FOR anchors.json:")
        print(f"  x: {x}")
        print(f"  y: {y}")
        print("="*40)
        print("\nCopy these values into 'config/anchors.json' for this anchor.")
        
    except ValueError:
        print("Invalid input. Please enter valid coordinate numbers.")
