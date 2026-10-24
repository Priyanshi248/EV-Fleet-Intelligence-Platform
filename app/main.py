from fastapi import FastAPI

app = FastAPI(
    title="EV Fleet Intelligence Platform API",
    version="0.1.0"
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "Backend is running"
    }