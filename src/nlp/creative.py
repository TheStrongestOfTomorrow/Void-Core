"""
Void AI Creative Writing Engine
Generates stories, essays, poetry, and other creative content.
Routes through Void-2 for linguistic quality.
"""
import json
from typing import Dict, List, Any, Optional


class CreativeEngine:
    """
    Creative Writing Engine — produces high-quality creative content.
    Uses Void-2 for its linguistic mastery.
    """
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.styles = {
            "story": "Write a compelling story",
            "essay": "Write a thoughtful essay",
            "poem": "Write evocative poetry",
            "script": "Write a screenplay excerpt",
            "article": "Write an engaging article",
            "technical": "Write clear technical documentation",
        }
    
    def create(self, prompt: str, style: str = "story", 
               tone: str = None, length: str = "medium") -> Dict[str, Any]:
        """
        Generate creative content.
        
        Args:
            prompt: Creative prompt or topic
            style: One of: story, essay, poem, script, article, technical
            tone: Optional tone override (dramatic, humorous, formal, casual, dark, whimsical)
            length: short (<500 words), medium (500-1500), long (1500+)
        
        Returns:
            {content: str, style: str, word_count: int, model: str}
        """
        style_instruction = self.styles.get(style, self.styles["story"])
        
        system = f"""You are Void-2, Void AI's creative writing engine. 
{style_instruction} based on the user's prompt.

Length: {length}
{f'Tone: {tone}' if tone else ''}
Be vivid, precise, and engaging. Every word should serve a purpose."""

        full_prompt = f"""{prompt}

Write a {style} that is {length} in length.
{f'Maintain a {tone} tone throughout.' if tone else ''}"""

        response = self._call_ollama("void-2", system, full_prompt)
        word_count = len(response.split()) if response else 0
        
        return {
            "content": response or "[No response]",
            "style": style,
            "tone": tone,
            "length": length,
            "word_count": word_count,
            "model": "void-2",
        }
    
    def continue_writing(self, text: str, session_id: str = None) -> Dict[str, Any]:
        """Continue an existing piece of writing."""
        system = """You are Void-2, Void AI's creative engine. 
Continue the following text seamlessly. Match the style, tone, and voice exactly.
Do not repeat what has already been written. Pick up where it left off naturally."""

        response = self._call_ollama("void-2", system, text + "\n\nContinue:")
        
        return {
            "content": response or "",
            "model": "void-2",
        }
    
    def rewrite(self, text: str, style: str = "improve") -> Dict[str, Any]:
        """Rewrite text in a different style or improve it."""
        style_map = {
            "improve": "Improve the writing quality while preserving meaning and voice",
            "formal": "Rewrite in a formal, academic tone",
            "casual": "Rewrite in a casual, conversational tone",
            "concise": "Rewrite to be as concise as possible without losing meaning",
            "dramatic": "Rewrite with dramatic flair and vivid imagery",
            "technical": "Rewrite with technical precision and clarity",
        }
        
        instruction = style_map.get(style, style_map["improve"])
        system = f"""You are Void-2, Void AI's writing engine.
{instruction}. Keep the core meaning intact."""

        response = self._call_ollama("void-2", system, text)
        
        return {
            "content": response or text,
            "style": style,
            "model": "void-2",
        }
    
    def _call_ollama(self, model: str, system: str, prompt: str) -> Optional[str]:
        """Call Ollama with system prompt."""
        try:
            import urllib.request
            full_prompt = f"{system}\n\n{prompt}"
            data = json.dumps({
                "model": model,
                "prompt": full_prompt,
                "stream": False,
                "options": {"temperature": 0.8, "top_p": 0.95},
            }).encode()
            req = urllib.request.Request(
                f"{self.ollama_url}/api/generate",
                data=data,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read())
                return result.get("response", "")
        except Exception:
            return None


if __name__ == "__main__":
    engine = CreativeEngine()
    result = engine.create("A programmer discovers their code has come alive", style="story", tone="dark")
    print(f"Words: {result['word_count']}")
    print(result['content'][:500])
