"""
Void AI Agent Mode — Autonomous agent with tool execution
Supports multi-step reasoning, shell commands, file I/O, and web access.
"""
import json
import re
from typing import Dict, List, Any, Optional


class VoidAgent:
    """
    Void AI Agent — executes multi-step tasks autonomously.
    Interfaces with Void-1 for planning and tool execution.
    """
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.history: List[Dict[str, str]] = []
        self.max_steps = 20
        self.tools = {
            "shell": self._exec_shell,
            "read_file": self._read_file,
            "write_file": self._write_file,
            "list_dir": self._list_dir,
            "web_search": self._web_search,
        }
    
    def execute(self, task: str, model: str = "void-1") -> Dict[str, Any]:
        """
        Execute a task using the agent loop.
        Returns: {success: bool, result: str, steps: int, history: list}
        """
        self.history = [{"role": "user", "content": f"AGENT MODE: {task}"}]
        
        for step in range(self.max_steps):
            # Get model response
            response = self._call_ollama(model, self._format_history())
            if not response:
                break
            
            self.history.append({"role": "assistant", "content": response})
            
            # Parse tool calls
            tool_calls = self._parse_tool_calls(response)
            if not tool_calls:
                # No more tool calls — task is done
                break
            
            # Execute tools and feed results back
            for call in tool_calls:
                result = self._execute_tool(call)
                self.history.append({"role": "user", "content": f"[RESULT] {result}"})
        
        return {
            "success": True,
            "result": self.history[-1]["content"] if self.history else "No response",
            "steps": len([h for h in self.history if h["role"] == "assistant"]),
            "history": self.history,
        }
    
    def _parse_tool_calls(self, text: str) -> List[Dict[str, Any]]:
        """Parse tool calls from model output."""
        calls = []
        
        # Pattern: [TOOL_NAME] arguments [/TOOL_NAME]
        tool_pattern = r'\[(\w+)\](.*?)\[/\1\]'
        for match in re.finditer(tool_pattern, text, re.DOTALL):
            tool_name = match.group(1)
            args = match.group(2).strip()
            calls.append({"tool": tool_name, "args": args})
        
        return calls
    
    def _execute_tool(self, call: Dict[str, Any]) -> str:
        """Execute a tool call safely."""
        tool_name = call["tool"]
        args = call["args"]
        
        if tool_name not in self.tools:
            return f"Unknown tool: {tool_name}"
        
        try:
            result = self.tools[tool_name](args)
            if isinstance(result, dict):
                if result.get("ok"):
                    return result.get("stdout") or result.get("content") or json.dumps(result)
                return f"Error: {result.get('error', 'Unknown error')}"
            return str(result)
        except Exception as e:
            return f"Tool error: {str(e)}"
    
    def _exec_shell(self, cmd: str) -> Dict[str, Any]:
        """Execute shell command with safety checks."""
        blocked = ["rm -rf /", "mkfs", "dd if=", ":(){ :|:&", "fork bomb"]
        for b in blocked:
            if b in cmd:
                return {"ok": False, "error": f"Command blocked: contains '{b}'"}
        
        import subprocess
        try:
            r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            return {"ok": r.returncode == 0, "stdout": r.stdout, "stderr": r.stderr, "code": r.returncode}
        except subprocess.TimeoutExpired:
            return {"ok": False, "error": "Command timed out (30s)"}
        except Exception as e:
            return {"ok": False, "error": str(e)}
    
    def _read_file(self, path: str) -> Dict[str, Any]:
        """Read a file."""
        try:
            with open(path.strip()) as f:
                content = f.read()
            return {"ok": True, "content": content[:10000]}  # Limit to 10K chars
        except Exception as e:
            return {"ok": False, "error": str(e)}
    
    def _write_file(self, args: str) -> Dict[str, Any]:
        """Write content to a file. Format: [write_file] path\\ncontent [/write_file]"""
        parts = args.split("\n", 1)
        if len(parts) < 2:
            return {"ok": False, "error": "Format: path\\ncontent"}
        path, content = parts[0].strip(), parts[1]
        try:
            import os
            os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
            with open(path, "w") as f:
                f.write(content)
            return {"ok": True, "bytes": len(content)}
        except Exception as e:
            return {"ok": False, "error": str(e)}
    
    def _list_dir(self, path: str) -> Dict[str, Any]:
        """List directory contents."""
        import os
        try:
            entries = os.listdir(path.strip() or ".")
            return {"ok": True, "entries": entries[:100], "count": len(entries)}
        except Exception as e:
            return {"ok": False, "error": str(e)}
    
    def _web_search(self, query: str) -> Dict[str, Any]:
        """Perform web search via Ollama or fallback."""
        try:
            import urllib.request
            data = json.dumps({"model": "void-1", "prompt": f"Search: {query}"}).encode()
            req = urllib.request.Request(
                f"{self.ollama_url}/api/generate",
                data=data, headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read())
                return {"ok": True, "content": result.get("response", "")}
        except Exception as e:
            return {"ok": False, "error": str(e)}
    
    def _call_ollama(self, model: str, prompt: str) -> Optional[str]:
        """Call Ollama API."""
        try:
            import urllib.request
            data = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode()
            req = urllib.request.Request(
                f"{self.ollama_url}/api/generate",
                data=data, headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read())
                return result.get("response", "")
        except Exception:
            return None
    
    def _format_history(self) -> str:
        """Format conversation history for the model."""
        parts = []
        for msg in self.history[-10:]:  # Keep last 10 messages
            role = "User" if msg["role"] == "user" else "Assistant"
            parts.append(f"{role}: {msg['content']}")
        return "\n\n".join(parts)


if __name__ == "__main__":
    agent = VoidAgent()
    result = agent.execute("List files in the current directory")
    print(json.dumps(result, indent=2))
