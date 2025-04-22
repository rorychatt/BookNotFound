import chromadb
from chromadb.config import Settings
import os
from typing import List, Dict, Any
import uuid
from datetime import datetime
import numpy as np
from sentence_transformers import SentenceTransformer
import torch

class VectorStore:
    def __init__(self):
        # Initialize the embedding model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.model.eval()  # Set to evaluation mode
        
        # Initialize ChromaDB with persistent storage
        self.client = chromadb.PersistentClient(
            path=os.path.join(os.path.dirname(__file__), "..", "vector_store"),
            settings=Settings(allow_reset=True)
        )
        
        # Create or get collections with embedding function
        self.qa_collection = self.client.get_or_create_collection(
            name="qa_pairs",
            metadata={"hnsw:space": "cosine"},
            embedding_function=self._get_embedding_function()
        )
        
        self.feedback_collection = self.client.get_or_create_collection(
            name="feedback",
            metadata={"hnsw:space": "cosine"},
            embedding_function=self._get_embedding_function()
        )

    def _get_embedding_function(self):
        """Get embedding function using Sentence Transformers that matches ChromaDB's interface"""
        class EmbeddingFunction:
            def __init__(self, model):
                self.model = model

            def __call__(self, input: List[str]) -> List[List[float]]:
                # Convert texts to embeddings using the model
                with torch.no_grad():  # Disable gradient calculation for inference
                    embeddings = self.model.encode(
                        input,
                        convert_to_tensor=True,
                        normalize_embeddings=True
                    )
                    # Convert to list of lists for ChromaDB
                    return embeddings.cpu().numpy().tolist()

        return EmbeddingFunction(self.model)

    def search(self, query: str, n_results: int = 3) -> str:
        """Search for relevant context based on the query."""
        results = self.qa_collection.query(
            query_texts=[query],
            n_results=n_results,
            include=["documents", "metadatas"]
        )
        
        # Combine the results into a single context string
        context = ""
        for doc, metadata in zip(results["documents"][0], results["metadatas"][0]):
            context += f"Previous Q&A (Certainty: {metadata.get('certainty', 0.5)}):\n"
            context += f"Q: {metadata.get('question', '')}\n"
            context += f"A: {doc}\n\n"
        
        return context.strip()

    def add_qa_pair(self, question: str, answer: str, certainty: float):
        """Add a new QA pair to the vector store."""
        qa_id = str(uuid.uuid4())
        
        # Add to QA collection
        self.qa_collection.add(
            documents=[answer],
            metadatas=[{
                "question": question,
                "certainty": float(certainty),
                "timestamp": datetime.now().isoformat(),
                "id": qa_id
            }],
            ids=[qa_id]
        )
        
        return qa_id

    def update_feedback(self, question_id: str, feedback: bool, suggested_changes: str = None):
        """Update feedback for a QA pair."""
        # Store feedback
        feedback_id = str(uuid.uuid4())
        self.feedback_collection.add(
            documents=[suggested_changes or ""],
            metadatas=[{
                "question_id": question_id,
                "feedback": bool(feedback),
                "timestamp": datetime.now().isoformat()
            }],
            ids=[feedback_id]
        )

    def get_feedback_stats(self, question_id: str) -> Dict[str, Any]:
        """Get feedback statistics for a QA pair."""
        results = self.feedback_collection.get(
            where={"question_id": question_id}
        )
        
        if not results["ids"]:
            return {"total_feedback": 0, "positive_feedback": 0}
        
        positive_count = sum(1 for meta in results["metadatas"] if meta["feedback"])
        total_count = len(results["ids"])
        
        return {
            "total_feedback": total_count,
            "positive_feedback": positive_count,
            "feedback_ratio": float(positive_count / total_count) if total_count > 0 else 0.0
        } 