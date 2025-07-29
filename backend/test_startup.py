#!/usr/bin/env python3
"""
Test script to verify the Flask app can start without NSE dependencies
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("🔄 Testing Flask app startup...")
    
    # Test import
    import app
    print("✅ App module imported successfully")
    
    # Test Flask app creation
    flask_app = app.app
    print("✅ Flask app created successfully")
    
    # Test NSE status
    nse_status = "Available" if app.nse is not None else "Not Available"
    print(f"📊 NSE Status: {nse_status}")
    
    # Test health endpoint
    with flask_app.test_client() as client:
        response = client.get('/health')
        if response.status_code == 200:
            print("✅ Health endpoint working")
            print(f"Response: {response.get_json()}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
    
    print("🎉 App startup test completed successfully!")
    
except Exception as e:
    print(f"❌ App startup test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)