# LoRa Troubleshooting Guide

## Quick Diagnosis Commands

```bash
# Run diagnostic tool
python diagnose.py

# Listen mode (see all incoming packets)
python diagnose.py --listen
```

---

## Debug Output Interpretation

### When Tourist Sends:
```
[Tourist] Ping #1 sent: PING:ID100
```
✅ **Good**: Tourist is transmitting

---

### When Relay/Master Receives:

**Case 1: Nothing printed**
```
[ANCHOR_2] Using address: 2, frequency: 865 MHz
# ...silence...
```
❌ **Problem**: No data received
- **Cause A**: Tourist not running or sending
- **Cause B**: Wrong frequency (check all use 865 MHz)
- **Cause C**: LoRa hardware issue
- **Fix**: Run `python diagnose.py` on each Pi

---

**Case 2: Raw bytes but no decoded message**
```
[DEBUG RX] Raw bytes (3): c10009
[DEBUG RX] Packet too short, ignoring
```
❌ **Problem**: Receiving garbage/config responses
- **Cause**: LoRa settings command responses
- **Fix**: This is normal during init, wait for real packets

---

**Case 3: Raw bytes with decoded message**
```
[DEBUG RX] Raw bytes (14): ffff0f50494e473a494431303042
[DEBUG RX] Decoded msg: 'PING:ID100' | RSSI: -66
```
✅ **Good**: LoRa communication working!

---

**Case 4: RSSI value is 0 or positive**
```
RSSI: 0 dBm  or  RSSI: 44 dBm
```
❌ **Problem**: RSSI reading incorrect
- **Cause**: rssi=False in constructor OR wrong byte extraction
- **Fix**: Ensure all nodes use `rssi=True`

---

## Common Issues

| Symptom | Possible Cause | Fix |
|---------|---------------|-----|
| No output at all | Serial port wrong | Try `/dev/ttyAMA0` |
| "setting fail" | LoRa HAT loose | Reseat HAT, check pins |
| Tourist sends but relay silent | Frequency mismatch | All must use same freq |
| RSSI always 0 | rssi not enabled | Check `rssi=True` |
| Only master gets data | Relay unique addr conflict | Use addr 2,3 for relays |

---

## Hardware Checklist

- [ ] LoRa HAT firmly seated on GPIO header
- [ ] Antenna connected to LoRa module
- [ ] All 4 Pis powered on
- [ ] All Pis on same WiFi (for SSH)
- [ ] Serial port enabled (`raspi-config` → Interface → Serial)

---

## Test Procedure

1. **Test individual Pi first:**
   ```bash
   python diagnose.py
   ```

2. **Test in pairs:**
   - Pi A: `python diagnose.py --listen`
   - Pi B: `python main.py --mode tourist`
   - Does Pi A see packets?

3. **Then run full system:**
   - Start master first, then relays, then tourist
