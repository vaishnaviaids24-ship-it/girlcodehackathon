import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import init_db
from routes import products, cart, activity, messages, admin

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s: %(message)s")

app = FastAPI(
    title="AI Smart Messaging – E-commerce MVP",
    description="Hackathon MVP: AI-powered re-engagement messaging for e-commerce",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(activity.router)
app.include_router(messages.router)
app.include_router(admin.router)


@app.on_event("startup")
def on_startup():
    init_db()
    logging.getLogger(__name__).info("Database initialised and seeded.")


@app.get("/")
def root():
    return {
        "project": "AI-Powered Smart Messaging for E-commerce",
        "status": "running",
        "docs": "/docs",
    }
