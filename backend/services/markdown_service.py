import os
from typing import Dict, List, Any
import markdown
from datetime import datetime
import json

class MarkdownService:
    def __init__(self):
        self.storage_dir = os.path.join(os.path.dirname(__file__), "..", "markdown_storage")
        self.suggestions_dir = os.path.join(self.storage_dir, "suggestions")
        
        # Create directories if they don't exist
        os.makedirs(self.storage_dir, exist_ok=True)
        os.makedirs(self.suggestions_dir, exist_ok=True)

    def get_markdown(self, filename: str) -> str:
        """Get the content of a markdown file."""
        filepath = os.path.join(self.storage_dir, f"{filename}.md")
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Markdown file {filename} not found")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()

    def save_markdown(self, filename: str, content: str):
        """Save content to a markdown file."""
        filepath = os.path.join(self.storage_dir, f"{filename}.md")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

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