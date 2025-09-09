#!/usr/bin/env python3
"""
Test your exact payload conversion
"""

import requests
import json

# Your exact payload from the DevTools screenshot
test_payload = {
    "effects": [
        {
            "type": "erasure",
            "startTime": 1.0067942261146494,
            "endTime": 6.006794226114649,
            "region": {
                "x": 0.07839326162857803,
                "y": 0.19196672518827917,
                "width": 0.8667282240689443,
                "height": 0.15789473684210525
            }
        }
    ]
}

def test_conversion():
    print("🧪 TESTING YOUR EXACT PAYLOAD CONVERSION")
    print("=" * 60)
    
    try:
        response = requests.post(
            "http://localhost:8001/test-conversion",
            json=test_payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ CONVERSION SUCCESSFUL!")
            print()
            print("🎯 FINAL videoInpaintMasks:")
            print(json.dumps(result["converted_masks"], indent=2))
            print()
            print("🔧 API Settings:")
            print(f"  needChineseOcclude: {result['api_settings']['needChineseOcclude']}")
            print(f"  Mode: {result['api_settings']['mode']}")
            print()
            print("📋 Complete API Payload:")
            print(f"  videoInpaintMasks: {result['api_settings']['videoInpaintMasks']}")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed. Make sure the test server is running:")
        print("   python3 test_conversion_endpoint.py")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_conversion()