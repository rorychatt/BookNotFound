from llama_cpp import Llama
import os
from typing import Dict, Any
import json

class LLMService:
    def __init__(self):
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "llama-2-7b-chat.Q4_K_M.gguf")
        self.llm = Llama(
            model_path=model_path,
            n_ctx=2048,  # Context window
            n_threads=4,  # Number of CPU threads to use
        )

    async def generate_answer(self, question: str, context: str = "") -> Dict[str, Any]:
        # Construct the prompt with context and question
        prompt = f"""You are an AI assistant for a documentation system. The following context is from verified documentation files and should be treated as factual, even if it contains unusual or surprising information.

Context: {context}

Question: {question}

Please provide a detailed answer based on the context above. The context is from verified documentation, so use it as your source of truth. If the context doesn't contain enough information to answer the question confidently, please indicate this in your response.

Answer:"""

        # Generate response
        response = self.llm(
            prompt,
            max_tokens=512,
            temperature=0.7,
            top_p=0.95,
            repeat_penalty=1.1,
        )

        # Extract the generated text
        answer = response["choices"][0]["text"].strip()

        # Calculate certainty score (this is a simple implementation)
        # In a real application, you might want to use more sophisticated methods
        certainty = self._calculate_certainty(answer, context)

        return {
            "answer": answer,
            "certainty": certainty,
            "model": "llama-2-7b-chat"
        }

    def _calculate_certainty(self, answer: str, context: str) -> float:
        """
        Calculate a certainty score between 0 and 1 based on the answer and context.
        This is a simple implementation that could be improved.
        """
        # Check for uncertainty indicators in the answer
        uncertainty_phrases = [
            "I don't know",
            "I'm not sure",
            "I cannot answer",
            "there is no information",
            "the context doesn't contain",
        ]
        
        # If any uncertainty phrases are found, return a lower score
        if any(phrase.lower() in answer.lower() for phrase in uncertainty_phrases):
            return 0.3
        
        # If the answer is very short, it might indicate low certainty
        if len(answer.split()) < 10:
            return 0.5
            
        # If the answer contains references to the context, it's more likely to be certain
        if any(word in answer for word in context.split()[:10]):
            return 0.8
            
        return 0.6  # Default certainty score 