import argparse
import sys

# Import our nodes
from src.nodes.tourist import run_tourist
from src.nodes.relay import run_relay
from src.nodes.master import run_master

def main():
    parser = argparse.ArgumentParser(description="LoRa Tourist Safety System")
    parser.add_argument("--mode", required=True, choices=["tourist", "relay", "master"], help="Role of this device")
    parser.add_argument("--id", help="ID for Relay or Tourist (e.g., ANCHOR_2)", default="ANCHOR_2")
    
    args = parser.parse_args()
    
    try:
        if args.mode == "tourist":
            run_tourist()
        elif args.mode == "relay":
            run_relay(args.id)
        elif args.mode == "master":
            run_master()
    except KeyboardInterrupt:
        print("\n[System] Shutting down...")
        sys.exit(0)

if __name__ == "__main__":
    main()