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
    matching_file: Optional[str]
    needs_new_doc: bool
    suggested_keywords: Optional[List[str]]

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
        # Extract keywords from the question
        question_keywords = await markdown_service.keyword_service.extract_keywords(question.question)
        
        # Find best context using keywords
        context = await markdown_service.find_best_context(question.question)
        
        if not context:
            # No good match found, don't return any matching file
            return {
                "answer": "Based on the provided context, I was unable to find any relevant information about this topic. Please provide more context or rephrase the question to improve my ability to assist you.",
                "certainty": 0.0,
                "model": markdown_service.llm_service.llm.model_path.split('/')[-1],
                "matching_file": None,
                "needs_new_doc": True,
                "suggested_keywords": question_keywords
            }
        
        # If we have a context, get the matching file
        matching_file = markdown_service.get_current_matching_file()
        
        # Generate answer using the matched context
        response = await markdown_service.llm_service.generate_answer(question.question, context)
        
        # Add matching file and certainty to response
        return {
            "answer": response["answer"],
            "certainty": response["certainty"],
            "model": markdown_service.llm_service.llm.model_path.split('/')[-1],
            "matching_file": matching_file,
            "needs_new_doc": False,
            "suggested_keywords": question_keywords
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback")
async def submit_feedback(feedback: Dict[str, Any]):
    try:
        file_name = feedback["file_name"]
        is_positive = feedback["is_positive"]
        feedback_text = feedback["feedback_text"]
        suggested_changes = feedback.get("suggested_changes")
        
        if suggested_changes:
            # If there are suggested changes, create a new suggestion
            suggestion_id = markdown_service.add_suggestion(
                filename=file_name,
                original_content=markdown_service.get_markdown(file_name),
                suggested_content=suggested_changes,
                feedback_context=feedback_text
            )
            return {"status": "success", "suggestion_id": suggestion_id}
        else:
            # Just store the feedback
            vector_store.update_feedback(
                file_name=file_name,
                feedback=is_positive,
                feedback_text=feedback_text
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