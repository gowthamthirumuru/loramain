#!/bin/bash
# ============================================
# LoRa System - Auto Setup Script
# Run this ONCE on each Raspberry Pi
# ============================================

echo "╔════════════════════════════════════════╗"
echo "║  LoRa Tourist Safety System Setup      ║"
echo "╚════════════════════════════════════════╝"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo bash setup_autostart.sh"
    exit 1
fi

# Get the role
echo ""
echo "Select this Pi's role:"
echo "  1) Master (ANCHOR_1)"
echo "  2) Relay ANCHOR_2"
echo "  3) Relay ANCHOR_3"
echo "  4) Tourist"
read -p "Enter choice (1-4): " choice

case $choice in
    1) ROLE="master"; ARGS="--mode master";;
    2) ROLE="relay_2"; ARGS="--mode relay --id ANCHOR_2";;
    3) ROLE="relay_3"; ARGS="--mode relay --id ANCHOR_3";;
    4) ROLE="tourist"; ARGS="--mode tourist";;
    *) echo "Invalid choice"; exit 1;;
esac

# Get the project path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"

# Get the user who ran sudo
REAL_USER="${SUDO_USER:-$USER}"

echo ""
echo "Setting up as: $ROLE"
echo "Project path: $PROJECT_DIR"
echo "User: $REAL_USER"

# Create the systemd service file
SERVICE_FILE="/etc/systemd/system/lora-$ROLE.service"

cat > $SERVICE_FILE << EOF
[Unit]
Description=LoRa Tourist Safety System - $ROLE
After=network.target

[Service]
Type=simple
User=$REAL_USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/python3 $PROJECT_DIR/main.py $ARGS
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable lora-$ROLE.service
systemctl start lora-$ROLE.service

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  ✓ Setup Complete!                     ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "The LoRa system will now start automatically on boot!"
echo ""
echo "Useful commands:"
echo "  View logs:    journalctl -u lora-$ROLE -f"
echo "  Stop:         sudo systemctl stop lora-$ROLE"
echo "  Start:        sudo systemctl start lora-$ROLE"
echo "  Disable:      sudo systemctl disable lora-$ROLE"
echo "  Status:       sudo systemctl status lora-$ROLE"
echo ""
