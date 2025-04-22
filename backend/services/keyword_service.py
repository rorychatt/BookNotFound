from typing import List
import json
import os
from .llm_service import LLMService

class KeywordService:
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service
        self.keywords_dir = os.path.join(os.path.dirname(__file__), "..", "keyword_storage")
        os.makedirs(self.keywords_dir, exist_ok=True)

    async def extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text using LLM."""
        prompt = f"""
        Your task is to extract exactly 16 relevant keywords from the given text.
        
        STRICT RESPONSE FORMAT:
        You must respond with ONLY keywords separated by commas.
        NO explanatory text, NO introduction, NO JSON.
        ONLY the 16 keywords separated by commas.
        
        BAD response example:
        "Here are the keywords: search, api, context..."
        
        GOOD response example:
        search, api, context, matching, keywords, extraction, configuration, setup, installation, usage, examples, testing, deployment, security, documentation, endpoints
        
        Text to analyze:
        {text}
        """
        
        response = await self.llm_service.generate_answer(prompt, "")
        answer = response["answer"].strip()
        
        # Split by comma and clean each keyword
        keywords = []
        for k in answer.split(','):
            # Clean and validate each keyword
            keyword = k.strip().strip('"\'[]{}()').strip()
            # Skip if it's empty or looks like explanatory text
            if (keyword and 
                not keyword.startswith('Here') and 
                not 'keyword' in keyword.lower() and
                not 'following' in keyword.lower() and
                not 'relevant' in keyword.lower()):
                keywords.append(keyword)
        
        # Ensure we have exactly 16 keywords
        keywords = keywords[:16]
        while len(keywords) < 16:
            keywords.append(f"fallback_keyword_{len(keywords)+1}")
            
        return keywords

    def save_keywords(self, filename: str, keywords: List[str]):
        """Save keywords for a markdown file."""
        filepath = os.path.join(self.keywords_dir, f"{filename}.json")
        with open(filepath, 'w') as f:
            # Save as a simple JSON array with pretty printing
            json.dump(keywords, f, indent=2)

    def load_keywords(self, filename: str) -> List[str]:
        """Load keywords for a markdown file."""
        filepath = os.path.join(self.keywords_dir, f"{filename}.json")
        if not os.path.exists(filepath):
            return []
        with open(filepath, 'r') as f:
            data = json.load(f)
            # Handle both old format (dict with "keywords" field) and new format (direct list)
            if isinstance(data, dict):
                return data.get("keywords", [])
            return data

    def find_best_match(self, query_keywords: List[str], all_files: List[str]) -> str:
        """Find the best matching markdown file based on keyword similarity."""
        best_match = None
        best_score = 0

        for filename in all_files:
            file_keywords = self.load_keywords(filename)
            if not file_keywords:
                continue

            # Calculate similarity score (number of matching keywords)
            score = len(set(query_keywords) & set(file_keywords))
            
            if score > best_score:
                best_score = score
                best_match = filename

        return best_match if best_match else all_files[0] if all_files else None 