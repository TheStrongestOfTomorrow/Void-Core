"""
Void AI Chat Interface — Lightweight chat implementation
Supports multi-turn conversation with context management.
"""
import json
from typing import Dict, List, Any, Optional


class ChatInterface:
    """
    Void AI Chat — multi-turn conversational interface.
    Routes to appropriate model via MOA router.
    """
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.conversations: Dict[str, List[Dict[str, str]]] = {}
        self.max_context_messages = 20
        self.system_prompt = {
            "void-1": "You are Void-1, the code intelligence model of Void AI. Be precise and mathematical.",
            "void-2": "You are Void-2, the linguistic intelligence of Void AI. Be eloquent and thoughtful.",
            "void-moa": "You are Void AI, a unified intelligence combining code expertise with linguistic mastery.",
        }
    
    def chat(self, message: str, session_id: str = "default", model: str = None) -> Dict[str, Any]:
        """
        Send a message and receive a response.
        
        Args:
            message: User message
            session_id: Conversation session identifier
            model: Override model selection (auto-detected if None)
        
        Returns:
            {response: str, model: str, session_id: str, context_length: int}
        """
        # Initialize session
        if session_id not in self.conversations:
            self.conversations[session_id] = []
        
        # Auto-route if no model specified
        if model is None:
            model = self._route(message)
        
        # Add user message
        self.conversations[session_id].append({"role": "user", "content": message})
        
        # Build prompt from context
        prompt = self._build_prompt(session_id, model)
        
        # Call Ollama
        response = self._call_ollama(model, prompt)
        
        # Add assistant response
        if response:
            self.conversations[session_id].append({"role": "assistant", "content": response})
        
        return {
            "response": response or "[No response from model]",
            "model": model,
            "session_id": session_id,
            "context_length": len(self.conversations[session_id]),
        }
    
    def _route(self, message: str) -> str:
        """Simple intent-based routing."""
        code_words = [
            "code", "function", "bug", "debug", "api", "script", "algorithm",
            "python", "javascript", "terminal", "shell", "command", "install",
            "compile", "build", "deploy", "sql", "html", "css", "rust", "go",
        ]
        lang_words = [
            "write", "story", "essay", "explain", "analyze", "describe",
            "tell me", "what is", "how does", "opinion", "creative", "poem",
            "feel", "think about", "imagine",
        ]
        
        q = message.lower()
        code_score = sum(1 for w in code_words if w in q)
        lang_score = sum(1 for w in lang_words if w in q)
        
        if code_score > lang_score * 1.5:
            return "void-1"
        elif lang_score > code_score * 1.5:
            return "void-2"
        return "void-moa"
    
    def _build_prompt(self, session_id: str, model: str) -> str:
        """Build prompt from conversation history."""
        parts = [self.system_prompt.get(model, self.system_prompt["void-moa"])]
        
        # Get recent messages (respecting context limit)
        messages = self.conversations[session_id][-self.max_context_messages:]
        
        for msg in messages:
            role = "User" if msg["role"] == "user" else "Assistant"
            parts.append(f"{role}: {msg['content']}")
        
        parts.append("Assistant:")
        return "\n\n".join(parts)
    
    def _call_ollama(self, model: str, prompt: str) -> Optional[str]:
        """Call Ollama generate API."""
        try:
            import urllib.request
            data = json.dumps({
                "model": model,
                "prompt": prompt,
                "stream": False,
            }).encode()
            req = urllib.request.Request(
                f"{self.ollama_url}/api/generate",
                data=data,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read())
                return result.get("response", "")
        except Exception as e:
            return f"[Error connecting to Ollama: {e}]"
    
    def clear_session(self, session_id: str = "default"):
        """Clear conversation history for a session."""
        if session_id in self.conversations:
            del self.conversations[session_id]
    
    def get_sessions(self) -> List[str]:
        """Get all active session IDs."""
        return list(self.conversations.keys())


if __name__ == "__main__":
    chat = ChatInterface()
    
    # Test conversation
    result = chat.chat("Hello, what can you do?")
    print(f"Model: {result['model']}")
    print(f"Response: {result['response'][:200]}")
