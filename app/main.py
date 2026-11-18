
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.dashboard import router as dashboard_router
from app.api.fleet import router as fleet_router
from app.api.maintenance import router as maintenance_router


app = FastAPI(
    title="EV Fleet Intelligence Platform API",
    version="0.1.0",
    description="Backend API for EV Fleet Intelligence Platform",
)


# ---------------------------------------------------------
# 1. CORS Configuration
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# 2. Central Router Registration
# ---------------------------------------------------------

app.include_router(fleet_router)
app.include_router(dashboard_router)
app.include_router(maintenance_router)


# ---------------------------------------------------------
# 3. HTTP Exception Handler
# ---------------------------------------------------------

@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request,
    exc: HTTPException,
):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
        },
        headers=exc.headers,
    )


# ---------------------------------------------------------
# 4. Request Validation Error Handler
# ---------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    errors = [
        {
            "field": ".".join(str(part) for part in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        }
        for error in exc.errors()
    ]

    return JSONResponse(
        status_code=422,
        content={
            "detail": "Request validation failed",
            "errors": errors,
        },
    )


# ---------------------------------------------------------
# 5. Health Check
# ---------------------------------------------------------

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "message": "Backend is running",
    }
