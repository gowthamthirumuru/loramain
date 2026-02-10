import math
import random

def get_coordinates(prompt):
    try:
        print(prompt)
        x = float(input("x: "))
        y = float(input("y: "))
        return (x, y)
    except ValueError:
        print("Invalid input. Please enter numeric values.")
        return None

def calculate_distance(p1, p2):
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def generate_gps(x, y, ref_lat, ref_lon):
    # Earth radius in meters
    R = 6378137
    
    # Coordinate offsets in radians
    dLat = y / R
    dLon = x / (R * math.cos(math.pi * ref_lat / 180))
    
    # Offset position
    lat = ref_lat + dLat * 180 / math.pi
    lon = ref_lon + dLon * 180 / math.pi
    
    return lat, lon

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6378137  # Earth radius in meters
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def main():
    print("=== Anchor Setup ===")
    master = get_coordinates("Enter coordinates for Master Node (in meters):")
    if master is None: return

    anchor2 = get_coordinates("\nEnter coordinates for Anchor 2 (in meters):")
    if anchor2 is None: return

    anchor3 = get_coordinates("\nEnter coordinates for Anchor 3 (in meters):")
    if anchor3 is None: return

    # Generate random reference point (between -60 and 60 lat to avoid extreme distortion)
    ref_lat = random.uniform(-60, 60)
    ref_lon = random.uniform(-180, 180)

    # Calculate GPS coordinates relative to the random reference point
    # We treat (0,0) in local grid as ref_lat, ref_lon
    
    m_gps = generate_gps(master[0], master[1], ref_lat, ref_lon)
    a2_gps = generate_gps(anchor2[0], anchor2[1], ref_lat, ref_lon)
    a3_gps = generate_gps(anchor3[0], anchor3[1], ref_lat, ref_lon)
    
    print("\n" + "="*40)
    print("       GENERATED GPS COORDINATES       ")
    print("="*40)
    print(f"Random Reference Origin (0,0): {ref_lat:.6f}, {ref_lon:.6f}")
    print("-" * 40)
    print(f"Master:   {m_gps[0]:.8f}, {m_gps[1]:.8f}")
    print(f"Anchor 2: {a2_gps[0]:.8f}, {a2_gps[1]:.8f}")
    print(f"Anchor 3: {a3_gps[0]:.8f}, {a3_gps[1]:.8f}")
    print("="*40)
    
    # Verify the distances
    print("\n--- Distance Verification (Meters) ---")
    dist_m_a2 = calculate_distance(master, anchor2)
    dist_gps_m_a2 = haversine_distance(m_gps[0], m_gps[1], a2_gps[0], a2_gps[1])
    
    dist_m_a3 = calculate_distance(master, anchor3)
    dist_gps_m_a3 = haversine_distance(m_gps[0], m_gps[1], a3_gps[0], a3_gps[1])
    
    dist_a2_a3 = calculate_distance(anchor2, anchor3)
    dist_gps_a2_a3 = haversine_distance(a2_gps[0], a2_gps[1], a3_gps[0], a3_gps[1])

    print(f"Master -> Anchor 2: XY: {dist_m_a2:.2f}m | GPS: {dist_gps_m_a2:.2f}m")
    print(f"Master -> Anchor 3: XY: {dist_m_a3:.2f}m | GPS: {dist_gps_m_a3:.2f}m")
    print(f"Anchor 2 -> Anchor 3: XY: {dist_a2_a3:.2f}m | GPS: {dist_gps_a2_a3:.2f}m")
    print("-" * 40)

    # Target calculation loop
    while True:
        print("\n=== Calculate Target Node GPS ===")
        print("Enter target coordinates (x,y) or type 'q' to quit:")
        
        target_input_x = input("x: ")
        if target_input_x.lower() == 'q':
            break
            
        try:
            target_x = float(target_input_x)
            target_y = float(input("y: "))
            
            # Calculate Target GPS using the SAME reference origin as the anchors
            target_gps = generate_gps(target_x, target_y, ref_lat, ref_lon)
            
            print(f"\nTarget GPS: {target_gps[0]:.8f}, {target_gps[1]:.8f}")
            
            # Optional: Distance from Master
            dist_m_target = calculate_distance(master, (target_x, target_y))
            dist_gps_m_target = haversine_distance(m_gps[0], m_gps[1], target_gps[0], target_gps[1])
            print(f"Distance from Master: XY: {dist_m_target:.2f}m | GPS: {dist_gps_m_target:.2f}m")
            
        except ValueError:
            print("Invalid input. Please enter numbers.")
            continue

if __name__ == "__main__":
    main()
