import sys
import os

# Make the backend package importable from this serverless function
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app  # FastAPI app
from mangum import Mangum

# Vercel invokes this handler for each request
handler = Mangum(app, lifespan="off")
