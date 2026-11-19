# conftest.py
# Adds the backend directory to the Python path so pytest
# can resolve `from app.services...` imports correctly.

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
