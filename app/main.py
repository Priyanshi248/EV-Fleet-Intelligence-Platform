from fastapi import FastAPI

from app.api.dashboard import router as dashboard_router
from app.api.fleet import router as fleet_router


app = FastAPI(
    title="EV Fleet Intelligence Platform API",
    version="0.1.0",
)

app.include_router(fleet_router)
app.include_router(dashboard_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "Backend is running",
    }