from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os

from services.llm_service import LLMService
from services.vector_store import VectorStore
from services.markdown_service import MarkdownService

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
vector_store = VectorStore()
markdown_service = MarkdownService()

class QuestionRequest(BaseModel):
    question: str
    context: Optional[str] = None

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
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ask")
async def ask_question(request: QuestionRequest):
    try:
        # Get relevant context from vector store
        context = vector_store.search(request.question)
        
        # Generate answer using LLM
        answer = await llm_service.generate_answer(
            question=request.question,
            context=context
        )
        
        # Store in vector database
        vector_store.add_qa_pair(
            question=request.question,
            answer=answer["answer"],
            certainty=answer["certainty"]
        )
        
        return answer
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
        return {"content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Markdown file not found")
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