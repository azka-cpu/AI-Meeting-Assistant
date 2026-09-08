

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.database import engine, Base
from app.routes import auth, meetings, ai, dashboard, webrtc,profile, voice
from app.websocket import websocket_manager

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting AI Meeting Assistant API...")
    yield
    # Shutdown
    print("Shutting down AI Meeting Assistant API...")


app = FastAPI(
    title="AI Meeting Assistant API",
    description="Real-time meeting transcription and AI analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(meetings.router, prefix="/api/meetings", tags=["meetings"])
app.include_router(ai.router, prefix="/api/meetings", tags=["ai"])  
app.include_router(profile.router, prefix="/api/auth", tags=["profile"])
app.include_router(dashboard.router)
app.include_router(webrtc.router)
app.include_router(voice.router)

@app.get("/")
async def root():
    return {
        "message": "AI Meeting Assistant API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.websocket("/ws/{meeting_id}")
async def websocket_endpoint(websocket, meeting_id: str):
    await websocket_manager.connect(websocket, meeting_id)
    try:
        while True:
            data = await websocket.receive_json()
            await websocket_manager.broadcast(meeting_id, data)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        websocket_manager.disconnect(websocket, meeting_id)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT", "development") == "development",
    )
