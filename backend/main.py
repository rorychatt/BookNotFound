from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os

from services.llm_service import LLMService
from services.markdown_service import MarkdownService
from services.vector_store import VectorStore

app = FastAPI(title="BookNotFound API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
llm_service = LLMService()
markdown_service = None
vector_store = VectorStore()

@app.on_event("startup")
async def startup_event():
    """Initialize async services on startup."""
    global markdown_service
    markdown_service = await MarkdownService.create(llm_service)

class Question(BaseModel):
    question: str
    context: Optional[str] = None

class Answer(BaseModel):
    answer: str
    certainty: float
    model: str

class FeedbackRequest(BaseModel):
    question_id: str
    feedback: bool
    suggested_changes: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Welcome to BookNotFound API"}

@app.get("/api/markdown/files")
async def list_markdown_files():
    try:
        files = markdown_service.list_files()
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/question", response_model=Answer)
async def ask_question(question: Question):
    try:
        # Find best matching context using keywords
        context = await markdown_service.find_best_context(question.question)
        
        # Generate answer using the matched context
        response = await llm_service.generate_answer(question.question, context)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback")
async def submit_feedback(request: FeedbackRequest):
    try:
        # Update vector store with feedback
        vector_store.update_feedback(
            question_id=request.question_id,
            feedback=request.feedback,
            suggested_changes=request.suggested_changes
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/markdown/{filename}")
async def get_markdown(filename: str):
    try:
        content = markdown_service.get_markdown(filename)
        keywords = markdown_service.get_keywords(filename)
        return {"content": content, "keywords": keywords}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/markdown/{filename}")
async def save_markdown(filename: str, content: Dict[str, str]):
    try:
        await markdown_service.save_markdown(filename, content["content"])
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/suggestions")
async def get_suggestions():
    try:
        suggestions = markdown_service.get_suggested_changes()
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/feedback/history/{filename}")
async def get_feedback_history(filename: str):
    try:
        history = vector_store.get_feedback_history(filename)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 