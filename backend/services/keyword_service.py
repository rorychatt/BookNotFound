from typing import List, Optional, Tuple
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
        Extract keywords from the text below. Return ONLY a JSON object, nothing else.

        REQUIRED FORMAT:
        {{"keywords": ["keyword1", "keyword2", "keyword3", ...]}}

        NO explanations.
        NO additional text.
        NO formatting.
        ONLY the JSON object.

        Text to analyze:
        {text}
        """
        
        response = await self.llm_service.generate_answer(prompt, "")
        answer = response["answer"].strip()
        
        try:
            # Try to find JSON object if there's additional text
            start_idx = answer.find('{')
            end_idx = answer.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_str = answer[start_idx:end_idx + 1]
            else:
                json_str = answer

            # Parse JSON response
            data = json.loads(json_str)
            keywords = data.get("keywords", [])
            
            # Preprocess keywords
            cleaned_keywords = []
            for keyword in keywords:
                # Convert to lowercase and strip whitespace and punctuation
                cleaned = keyword.lower().strip().strip('"\'[]{}()').strip()
                if cleaned and len(cleaned) > 1:  # Ensure keyword is not empty and has at least 2 chars
                    cleaned_keywords.append(cleaned)
            
            print(f"Extracted keywords: {cleaned_keywords}")  # Debug log
            return cleaned_keywords[:32]  # Limit to 32 keywords
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON response: {answer}")
            print(f"JSON error: {str(e)}")
            
            # Fallback: try to extract keywords from the response if it contains a list-like structure
            if '[' in answer and ']' in answer:
                start = answer.find('[')
                end = answer.rfind(']')
                if start != -1 and end != -1:
                    keywords_str = answer[start+1:end]
                    # Split by commas and clean up
                    keywords = [k.strip().strip('"\'').lower() for k in keywords_str.split(',')]
                    keywords = [k for k in keywords if k and len(k) > 1]
                    print(f"Extracted keywords using fallback: {keywords}")
                    return keywords[:32]
            
            return []

    def save_keywords(self, filename: str, keywords: List[str]):
        """Save keywords for a markdown file."""
        filepath = os.path.join(self.keywords_dir, f"{filename}.json")
        with open(filepath, 'w') as f:
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

    def find_best_match(self, query_keywords: List[str], all_files: List[str]) -> Optional[str]:
        """Find the best matching markdown file based on keyword similarity."""
        best_match = None
        best_score = 0
        min_score_threshold = 0.1  # At least 10% of keywords should match
        min_matches = 1  # At least 1 keyword must match

        for filename in all_files:
            file_keywords = self.load_keywords(filename)
            if not file_keywords:
                continue

            # Calculate similarity score
            matching_keywords = set(query_keywords) & set(file_keywords)
            num_matches = len(matching_keywords)
            
            # Score is the percentage of query keywords that match
            score = num_matches / len(query_keywords) if query_keywords else 0
            
            # Must meet both minimum matches and threshold
            if num_matches >= min_matches and score >= min_score_threshold and score > best_score:
                best_score = score
                best_match = filename

        return best_match 