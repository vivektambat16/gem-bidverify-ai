"""Runner script for GeM Vendor Portal."""
import os
import sys
from pathlib import Path

# Add current directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

import uvicorn
from app import config

if __name__ == "__main__":
    print("=" * 70)
    print("  🚀 Starting GeM Vendor Portal on http://127.0.0.1:8001")
    print(f"  📁 Shared Database: {config.DB_PATH}")
    print(f"  📂 Uploads Folder:  {config.UPLOAD_DIR}")
    print("=" * 70)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
