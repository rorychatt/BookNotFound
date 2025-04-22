# BookNotFound Backend

This is the backend service for the BookNotFound application. It provides a FastAPI-based REST API that handles:
- Question answering using a local Llama 2 model
- Markdown file management
- Vector storage of QA pairs and feedback
- Suggestion management for documentation updates

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Ensure the Llama 2 model is in the `models` directory:
- The model should be named `llama-2-7b-chat.Q4_K_M.gguf`
- Place it in the `backend/models` directory

## Running the Service

To run the backend service:

```bash
PYTHONPATH=$PYTHONPATH:. uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The service will be available at `http://localhost:8000`

## API Documentation

Once the service is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Directory Structure

- `main.py`: Main FastAPI application
- `services/`: Core service implementations
  - `llm_service.py`: Handles the local Llama model
  - `vector_store.py`: Manages vector storage of QA pairs
  - `markdown_service.py`: Handles markdown file operations
- `models/`: Contains the Llama 2 model file
- `markdown_storage/`: Stores markdown files and suggestions
- `vector_store/`: Persistent storage for ChromaDB

## Environment Variables

No environment variables are required for basic operation. The service is configured to run locally by default.

## Development

To run tests:
```bash
pytest
```

## Notes

- The service uses ChromaDB for vector storage, which stores data persistently in the `vector_store` directory
- Markdown files are stored in the `markdown_storage` directory
- Suggestions for documentation updates are stored as JSON files in `markdown_storage/suggestions` 