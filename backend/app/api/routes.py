import uuid
import logging
from typing import Dict
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    ChatRequest, ChatResponse, ResumeUploadResponse,
    SessionState, Message, MessageRole
)
from app.services.resume_parser import parse_resume
from app.services.resume_agent import resume_agent

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory session storage (use Redis in production)
sessions: Dict[str, SessionState] = {}


def get_session(session_id: str) -> SessionState:
    """Get or create session."""
    if session_id not in sessions:
        sessions[session_id] = SessionState(session_id=session_id)
    return sessions[session_id]


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    """Upload and analyze a resume."""
    try:
        # Read file content
        content = await file.read()

        # Parse resume
        resume_text = parse_resume(content, file.filename or "resume.txt")

        # Create new session
        session_id = str(uuid.uuid4())
        session = get_session(session_id)
        session.resume_text = resume_text

        # Get initial analysis
        initial_analysis = resume_agent.analyze_resume(resume_text)

        # Store analysis in conversation
        session.conversation_history.append(
            Message(role=MessageRole.ASSISTANT, content=initial_analysis)
        )

        return ResumeUploadResponse(
            session_id=session_id,
            message="Resume uploaded and analyzed successfully",
            resume_text=resume_text[:500] + "..." if len(resume_text) > 500 else resume_text,
            initial_analysis=initial_analysis
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process resume")


def detect_correction(message: str) -> bool:
    """Detect if user message contains a correction."""
    correction_indicators = [
        "i did not", "i didn't", "that's wrong", "that's incorrect", "not correct",
        "actually,", "correction:", "wrong", "incorrect", "i never", "not true",
        "that's not right", "i don't have", "i haven't", "my actual", "the correct",
        "should be", "is actually", "isn't right", "was not", "wasn't",
        "i do not", "not accurate", "mistake", "error", "fix that"
    ]
    message_lower = message.lower()
    return any(indicator in message_lower for indicator in correction_indicators)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Continue conversation with the resume agent."""
    try:
        session = get_session(request.session_id)

        # Detect if this is a correction and store it
        if detect_correction(request.message):
            session.user_corrections.append(request.message)
            logger.info(f"User correction detected: {request.message[:100]}...")

        # Add user message to history
        session.conversation_history.append(
            Message(role=MessageRole.USER, content=request.message)
        )

        # Get agent response with corrections context
        response = resume_agent.chat(
            request.message,
            session.conversation_history[:-1],  # Exclude the message we just added
            session.resume_text,
            session.user_corrections  # Pass user corrections for fact-checking
        )

        # Add assistant response to history
        session.conversation_history.append(
            Message(role=MessageRole.ASSISTANT, content=response)
        )

        return ChatResponse(
            response=response,
            session_id=request.session_id
        )

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get response")


@router.get("/session/{session_id}")
async def get_session_info(session_id: str):
    """Get session information."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]
    return {
        "session_id": session_id,
        "has_resume": session.resume_text is not None,
        "message_count": len(session.conversation_history),
        "created_at": session.created_at.isoformat()
    }


@router.post("/improve")
async def suggest_improvements(session_id: str, target_role: str, target_company: str = None):
    """Get targeted improvement suggestions."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]
    if not session.resume_text:
        raise HTTPException(status_code=400, detail="No resume uploaded for this session")

    suggestions = resume_agent.suggest_improvements(
        session.resume_text,
        target_role,
        target_company
    )

    return {"suggestions": suggestions}


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    if session_id in sessions:
        del sessions[session_id]
    return {"message": "Session deleted"}
