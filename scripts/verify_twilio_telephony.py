"""
Launcher for Twilio Programmable Voice & Media Streams verification suite.
"""
import sys
import os
import asyncio

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from tests.verify_twilio_telephony import main

if __name__ == "__main__":
    asyncio.run(main())
