#!/usr/bin/env python3
"""
Test script to verify frontend bounding box parameters
This script simulates the backend endpoint to capture and validate
the parameters sent from the video editor frontend.
"""

import json
from typing import Dict, List, Any

def test_bounding_box_parameters(effects_data: List[Dict[str, Any]]):
    """
    Test function to validate bounding box parameters from frontend
    
    Args:
        effects_data: List of effect objects from frontend
    """
    print("=" * 60)
    print("BOUNDING BOX PARAMETER TEST")
    print("=" * 60)
    
    if not effects_data:
        print("❌ No effects data provided")
        return False
    
    print(f"📊 Total effects received: {len(effects_data)}")
    print()
    
    # Map frontend effect types to GhostCut API types
    effect_type_mapping = {
        'erasure': 'remove',              # Erasure Area → remove
        'protection': 'keep',             # Protection Area → keep  
        'text': 'remove_only_ocr'         # Erase Text → remove_only_ocr
    }
    
    video_inpaint_masks = []
    
    for i, effect in enumerate(effects_data, 1):
        print(f"🔍 Effect {i}:")
        print(f"  Raw data: {json.dumps(effect, indent=2)}")
        
        # Validate effect structure
        effect_type = effect.get('type')
        region = effect.get('region', {})
        start_time_cs = effect.get('startTime')
        end_time_cs = effect.get('endTime')
        
        print(f"  📝 Type: {effect_type}")
        print(f"  📍 Region: {region}")
        print(f"  ⏰ Start Time (cs): {start_time_cs}")
        print(f"  ⏰ End Time (cs): {end_time_cs}")
        
        # Validate effect type
        if effect_type not in effect_type_mapping:
            print(f"  ❌ Invalid effect type: {effect_type}")
            print(f"  ✅ Valid types: {list(effect_type_mapping.keys())}")
            continue
        
        # Validate region structure
        if not region or not all(k in region for k in ['x', 'y', 'width', 'height']):
            print(f"  ❌ Invalid region structure. Expected: x, y, width, height")
            continue
        
        # Extract and validate coordinates
        x1, y1 = region['x'], region['y']
        x2, y2 = region['x'] + region['width'], region['y'] + region['height']
        
        print(f"  📐 Calculated coordinates:")
        print(f"    Top-left (x1, y1): ({x1}, {y1})")
        print(f"    Bottom-right (x2, y2): ({x2}, {y2})")
        
        # Validate coordinate ranges
        if not (0 <= x1 <= 1 and 0 <= y1 <= 1 and 0 <= x2 <= 1 and 0 <= y2 <= 1):
            print(f"  ⚠️  Coordinates outside [0,1] range - will be clamped")
        
        # Clamp coordinates
        x1 = max(0.0, min(1.0, x1))
        y1 = max(0.0, min(1.0, y1))
        x2 = max(0.0, min(1.0, x2))
        y2 = max(0.0, min(1.0, y2))
        
        # Validate rectangle dimensions
        if x2 <= x1 or y2 <= y1:
            print(f"  ❌ Invalid rectangle dimensions (zero or negative area)")
            continue
        
        # Convert time from centiseconds to seconds
        start_time = start_time_cs / 100 if start_time_cs else 0
        end_time = end_time_cs / 100 if end_time_cs else 99999
        
        print(f"  ⏱️  Converted time:")
        print(f"    Start: {start_time}s (from {start_time_cs}cs)")
        print(f"    End: {end_time}s (from {end_time_cs}cs)")
        
        # Create mask entry
        mask_entry = {
            "type": effect_type_mapping[effect_type],
            "start": start_time,
            "end": end_time,
            "region": [
                round(x1, 2),
                round(y1, 2),
                round(x2, 2),
                round(y2, 2)
            ]
        }
        
        video_inpaint_masks.append(mask_entry)
        
        print(f"  ✅ Generated mask:")
        print(f"    Type: {mask_entry['type']}")
        print(f"    Region: {mask_entry['region']}")
        print(f"    Time: {mask_entry['start']}s - {mask_entry['end']}s")
        print()
    
    # Final summary
    print("=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"📊 Effects processed: {len(effects_data)}")
    print(f"✅ Valid masks generated: {len(video_inpaint_masks)}")
    
    if video_inpaint_masks:
        print()
        print("🎯 FINAL VIDEO INPAINT MASKS:")
        print(json.dumps(video_inpaint_masks, indent=2))
        
        # Determine needChineseOcclude value
        mask_types = [mask["type"] for mask in video_inpaint_masks]
        has_only_keep_masks = all(mask_type == "keep" for mask_type in mask_types)
        
        if has_only_keep_masks:
            need_chinese_occlude = 1
            mode = "Full-screen inpainting with protection"
        else:
            need_chinese_occlude = 2
            mode = "Annotation area inpainting"
        
        print()
        print(f"🔧 RECOMMENDED SETTINGS:")
        print(f"  needChineseOcclude: {need_chinese_occlude}")
        print(f"  Mode: {mode}")
        print(f"  Mask types: {mask_types}")
    
    return len(video_inpaint_masks) > 0


# Test cases based on the video editor screenshot
def run_test_cases():
    """Run test cases with sample data"""
    
    print("🧪 RUNNING TEST CASES")
    print()
    
    # Test Case 1: Erasure Area from screenshot (00:03:62 - 00:08:73)
    print("Test Case 1: Erasure Area")
    test_data_1 = [
        {
            "type": "erasure",
            "region": {
                "x": 0.25,      # 25% from left
                "y": 0.40,      # 40% from top  
                "width": 0.50,  # 50% width
                "height": 0.30  # 30% height
            },
            "startTime": 362,   # 00:03:62 in centiseconds
            "endTime": 873      # 00:08:73 in centiseconds
        }
    ]
    test_bounding_box_parameters(test_data_1)
    print()
    
    # Test Case 2: Multiple effects (Protection + Erasure)
    print("Test Case 2: Mixed Effects")
    test_data_2 = [
        {
            "type": "protection",
            "region": {"x": 0.1, "y": 0.1, "width": 0.2, "height": 0.2},
            "startTime": 100,
            "endTime": 500
        },
        {
            "type": "erasure", 
            "region": {"x": 0.6, "y": 0.7, "width": 0.3, "height": 0.2},
            "startTime": 200,
            "endTime": 600
        }
    ]
    test_bounding_box_parameters(test_data_2)
    print()
    
    # Test Case 3: Text removal
    print("Test Case 3: Text Removal")
    test_data_3 = [
        {
            "type": "text",
            "region": {"x": 0.3, "y": 0.8, "width": 0.4, "height": 0.1},
            "startTime": 865,   # 00:08:65 in centiseconds
            "endTime": 1200
        }
    ]
    test_bounding_box_parameters(test_data_3)
    print()
    
    # Test Case 4: Edge cases
    print("Test Case 4: Edge Cases")
    test_data_4 = [
        {
            "type": "erasure",
            "region": {"x": -0.1, "y": 1.1, "width": 1.2, "height": 0.5},  # Out of bounds
            "startTime": 0,
            "endTime": 9999999
        }
    ]
    test_bounding_box_parameters(test_data_4)


if __name__ == "__main__":
    run_test_cases()