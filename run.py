#!/usr/bin/env python3
"""
Simple startup script for the Companion App
"""

import os
import sys

def main():
    print("🌿 Starting Companion App...")
    print("📱 A simple AI companion and meditation app")
    print("=" * 50)
    
    # Check if required packages are installed
    try:
        import flask
        import firebase_admin
        import werkzeug
        print("✅ All required packages are installed")
    except ImportError as e:
        print(f"❌ Missing package: {e}")
        print("Please run: pip install -r requirements.txt")
        sys.exit(1)
    
    # Start the application
    print("🚀 Starting Flask server...")
    print("🌐 Open your browser to: http://localhost:5001")
    print("⏹️  Press Ctrl+C to stop the server")
    print("=" * 50)
    
    # Import and run the app
    from app import app
    app.run(debug=True, host='0.0.0.0', port=5001)

if __name__ == '__main__':
    main()
