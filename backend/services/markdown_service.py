import os
from typing import Dict, List, Any, Optional
import markdown
from datetime import datetime
import json
from .keyword_service import KeywordService
from .llm_service import LLMService

class MarkdownService:
    def __init__(self, llm_service: LLMService = None):
        self.storage_dir = os.path.join(os.path.dirname(__file__), "..", "markdown_storage")
        self.suggestions_dir = os.path.join(self.storage_dir, "suggestions")
        
        # Create directories if they don't exist
        os.makedirs(self.storage_dir, exist_ok=True)
        os.makedirs(self.suggestions_dir, exist_ok=True)

        # Initialize services
        self.llm_service = llm_service or LLMService()
        self.keyword_service = KeywordService(self.llm_service)
        
        # Track current matching file
        self._current_matching_file = None

    @classmethod
    async def create(cls, llm_service: LLMService = None) -> 'MarkdownService':
        """Async factory method to create and initialize MarkdownService."""
        service = cls(llm_service)
        await service._clear_and_init_keywords()
        return service

    async def _clear_and_init_keywords(self):
        """Clear all existing keywords and regenerate them for all markdown files."""
        try:
            # Clear the keyword storage directory
            keyword_storage = os.path.join(os.path.dirname(__file__), "..", "keyword_storage")
            os.makedirs(keyword_storage, exist_ok=True)
            for file in os.listdir(keyword_storage):
                if file.endswith('.json'):
                    os.remove(os.path.join(keyword_storage, file))

            # Generate fresh keywords for all markdown files
            files = self.list_files()
            print(f"Generating keywords for files: {files}")  # Debug log
            for filename in files:
                try:
                    content = self.get_markdown(filename)
                    print(f"Extracting keywords for {filename}")  # Debug log
                    keywords = await self.keyword_service.extract_keywords(content)
                    print(f"Got keywords for {filename}: {keywords}")  # Debug log
                    self.keyword_service.save_keywords(filename, keywords)
                except Exception as e:
                    print(f"Error processing file {filename}: {str(e)}")
        except Exception as e:
            print(f"Warning: Error during keyword regeneration: {str(e)}")

    def list_files(self) -> List[str]:
        """List all markdown files in the storage directory."""
        files = []
        for filename in os.listdir(self.storage_dir):
            if filename.endswith('.md'):
                # Remove the .md extension
                base_name = filename[:-3]
                # Skip hidden files and system files
                if not base_name.startswith('.') and not base_name.startswith('_'):
                    files.append(base_name)
        return files

    def get_markdown(self, filename: str) -> str:
        """Get the content of a markdown file."""
        filepath = os.path.join(self.storage_dir, f"{filename}.md")
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Markdown file {filename} not found")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()

    async def save_markdown(self, filename: str, content: str):
        """Save content to a markdown file and generate keywords."""
        # Remove .md extension if present
        filename = filename[:-3] if filename.endswith('.md') else filename
        
        print(f"Saving markdown file: {filename}")
        filepath = os.path.join(self.storage_dir, f"{filename}.md")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Markdown file saved successfully")

        # Generate and save keywords
        print(f"Extracting keywords for {filename}")
        try:
            keywords = await self.keyword_service.extract_keywords(content)
            print(f"Extracted keywords: {keywords}")
            self.keyword_service.save_keywords(filename, keywords)
            print(f"Keywords saved successfully")
        except Exception as e:
            print(f"Error extracting keywords: {str(e)}")
            # Save empty keywords rather than failing
            self.keyword_service.save_keywords(filename, [])

    def get_keywords(self, filename: str) -> List[str]:
        """Get keywords for a markdown file."""
        return self.keyword_service.load_keywords(filename)

    async def find_best_context(self, question: str) -> str:
        """Find the best matching markdown file for a question."""
        # Extract keywords from the question
        question_keywords = await self.keyword_service.extract_keywords(question)
        print(f"Extracted keywords from question: {question_keywords}")
        
        # Find best matching file
        all_files = self.list_files()
        print(f"Available files: {all_files}")
        best_match = self.keyword_service.find_best_match(question_keywords, all_files)
        print(f"Best matching file: {best_match}")
        
        # Store the matching file
        self._current_matching_file = best_match
        
        if best_match:
            content = self.get_markdown(best_match)
            print(f"Found matching content from {best_match}: {content[:100]}...")  # Print first 100 chars
            return content
        return ""

    def get_current_matching_file(self) -> Optional[str]:
        """Get the filename of the current matching markdown file."""
        return self._current_matching_file

    def get_suggested_changes(self) -> List[Dict[str, Any]]:
        """Get all suggested changes for markdown files."""
        suggestions = []
        for filename in os.listdir(self.suggestions_dir):
            if filename.endswith('.json'):
                with open(os.path.join(self.suggestions_dir, filename), 'r', encoding='utf-8') as f:
                    suggestion = json.load(f)
                    suggestions.append(suggestion)
        return suggestions

    def add_suggestion(self, filename: str, original_content: str, suggested_content: str, feedback_context: str):
        """Add a new suggestion for changes to a markdown file."""
        suggestion_id = f"{filename}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        suggestion_path = os.path.join(self.suggestions_dir, f"{suggestion_id}.json")
        
        suggestion = {
            "id": suggestion_id,
            "filename": filename,
            "original_content": original_content,
            "suggested_content": suggested_content,
            "feedback_context": feedback_context,
            "created_at": datetime.now().isoformat(),
            "status": "pending"
        }
        
        with open(suggestion_path, 'w', encoding='utf-8') as f:
            json.dump(suggestion, f, indent=2)
        
        return suggestion_id

    def apply_suggestion(self, suggestion_id: str):
        """Apply a suggested change to a markdown file."""
        suggestion_path = os.path.join(self.suggestions_dir, f"{suggestion_id}.json")
        
        if not os.path.exists(suggestion_path):
            raise FileNotFoundError(f"Suggestion {suggestion_id} not found")
        
        with open(suggestion_path, 'r', encoding='utf-8') as f:
            suggestion = json.load(f)
        
        # Save the new content
        self.save_markdown(suggestion["filename"], suggestion["suggested_content"])
        
        # Update suggestion status
        suggestion["status"] = "applied"
        suggestion["applied_at"] = datetime.now().isoformat()
        
        with open(suggestion_path, 'w', encoding='utf-8') as f:
            json.dump(suggestion, f, indent=2)
        
        return suggestion

    def reject_suggestion(self, suggestion_id: str, reason: str = None):
        """Reject a suggested change."""
        suggestion_path = os.path.join(self.suggestions_dir, f"{suggestion_id}.json")
        
        if not os.path.exists(suggestion_path):
            raise FileNotFoundError(f"Suggestion {suggestion_id} not found")
        
        with open(suggestion_path, 'r', encoding='utf-8') as f:
            suggestion = json.load(f)
        
        # Update suggestion status
        suggestion["status"] = "rejected"
        suggestion["rejected_at"] = datetime.now().isoformat()
        if reason:
            suggestion["rejection_reason"] = reason
        
        with open(suggestion_path, 'w', encoding='utf-8') as f:
            json.dump(suggestion, f, indent=2)
        
        return suggestion 