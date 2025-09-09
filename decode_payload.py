#!/usr/bin/env python3
"""
Decode the actual payload from the browser DevTools
"""

import json

# Your actual payload from the screenshot
payload_data = {
    "type": "erasure",
    "startTime": 1.0067942261146494,
    "endTime": 6.006794226114649,
    "region": {
        "x": 0.07839326162857803,
        "y": 0.19196672518827918,
        "width": 0.8667282240689443,
        "height": 0.15789473684210525
    }
}

print("=" * 80)
print("🔍 DECODING ACTUAL FRONTEND PAYLOAD")
print("=" * 80)
print(f"📊 Raw payload: {json.dumps(payload_data, indent=2)}")
print()

# Process like the backend does
effect_type = payload_data.get('type')
region = payload_data.get('region', {})
start_time = payload_data.get('startTime')
end_time = payload_data.get('endTime')

print("📝 EXTRACTED VALUES:")
print(f"  Type: {effect_type}")
print(f"  Start Time: {start_time}s")
print(f"  End Time: {end_time}s")
print(f"  Region: {region}")
print()

# Calculate coordinates like backend
x1, y1 = region['x'], region['y']
x2, y2 = region['x'] + region['width'], region['y'] + region['height']

print("📐 CALCULATED COORDINATES:")
print(f"  Top-left (x1, y1): ({x1}, {y1})")
print(f"  Bottom-right (x2, y2): ({x2}, {y2})")
print()

# Clamp coordinates like backend
x1 = max(0.0, min(1.0, x1))
y1 = max(0.0, min(1.0, y1))
x2 = max(0.0, min(1.0, x2))
y2 = max(0.0, min(1.0, y2))

print("📏 CLAMPED COORDINATES:")
print(f"  Clamped (x1, y1): ({x1}, {y1})")
print(f"  Clamped (x2, y2): ({x2}, {y2})")
print()

# Map effect type
effect_type_mapping = {
    'erasure': 'remove',
    'protection': 'keep',
    'text': 'remove_only_ocr'
}

mapped_type = effect_type_mapping.get(effect_type, effect_type)

# Create final mask entry like backend (current format)
mask_entry_current = {
    "type": mapped_type,
    "start": start_time,
    "end": end_time,
    "region": [
        round(x1, 2),
        round(y1, 2),
        round(x2, 2),
        round(y2, 2)
    ]
}

# Alternative format based on API documentation (coordinate pairs)
mask_entry_pairs = {
    "type": mapped_type,
    "start": start_time,
    "end": end_time,
    "region": [
        [round(x1, 2), round(y1, 2)],  # Top-left
        [round(x2, 2), round(y1, 2)],  # Top-right
        [round(x2, 2), round(y2, 2)],  # Bottom-right
        [round(x1, 2), round(y2, 2)]   # Bottom-left
    ]
}

mask_entry = mask_entry_current  # Use current format for now

print("🎯 FINAL MASK ENTRY OPTIONS:")
print("Current format (x1,y1,x2,y2):")
print(json.dumps(mask_entry_current, indent=2))
print()
print("Alternative format (coordinate pairs):")
print(json.dumps(mask_entry_pairs, indent=2))
print()

# Determine which format to use
mask_entry = mask_entry_current  # Default to current

# Determine needChineseOcclude
mask_types = [mask_entry["type"]]
has_only_keep_masks = all(mask_type == "keep" for mask_type in mask_types)

if has_only_keep_masks:
    need_chinese_occlude = 1
    mode = "Full-screen inpainting with protection"
else:
    need_chinese_occlude = 2
    mode = "Annotation area inpainting"

print("🔧 FINAL API SETTINGS:")
print(f"  needChineseOcclude: {need_chinese_occlude}")
print(f"  Mode: {mode}")
print(f"  videoInpaintMasks: {json.dumps([mask_entry])}")
print()

print("=" * 80)
print("✅ VALIDATION SUMMARY")
print("=" * 80)
print(f"✅ Type mapping: {effect_type} → {mapped_type}")
print(f"✅ Time precision: {start_time:.6f}s to {end_time:.6f}s")
print(f"✅ Region coordinates: [{x1:.2f}, {y1:.2f}, {x2:.2f}, {y2:.2f}]")
print(f"✅ Coordinate validation: All values between 0-1? {0 <= x1 < x2 <= 1 and 0 <= y1 < y2 <= 1}")
print(f"✅ Rectangle area: {(x2-x1) * (y2-y1):.4f} (normalized)")