#!/usr/bin/env python3
"""
Void AI Server — Lightweight Python API server
Runs on 2GB RAM. No heavy frameworks.
"""
import json
import subprocess
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

VOID_CONFIG = {
    "port": int(os.environ.get("PORT", 3000)),
    "host": os.environ.get("HOST", "0.0.0.0"),
    "ollama_url": os.environ.get("OLLAMA_HOST", "http://localhost:11434"),
    "ram_limit": int(os.environ.get("VOID_RAM_LIMIT", 2147483648)),  # 2GB
}

class VoidAIHandler(SimpleHTTPRequestHandler):
    """Ultra-lightweight HTTP handler — no Flask/Django needed."""
    
    def do_POST(self):
        path = urlparse(self.path).path
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length)) if content_length else {}
        
        routes = {
            "/api/chat": self.handle_chat,
            "/api/deepthink": self.handle_deepthink,
            "/api/agent": self.handle_agent,
            "/api/voidcode": self.handle_voidcode,
            "/api/models": self.handle_models,
            "/api/router": self.handle_router,
        }
        
        handler = routes.get(path)
        if handler:
            handler(body)
        else:
            self.send_json({"error": "Not found"}, 404)
    
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/status":
            self.send_json({
                "status": "running",
                "version": "1.0.0",
                "ram_limit": VOID_CONFIG["ram_limit"],
                "models": ["void-1", "void-2", "void-moa"],
                "ollama": VOID_CONFIG["ollama_url"],
            })
        elif path == "/":
            self.send_json({"name": "Void AI", "version": "1.0.0"})
        else:
            self.send_json({"error": "Not found"}, 404)
    
    def handle_chat(self, body):
        model = body.get("model", "void-moa")
        messages = body.get("messages", [])
        prompt = self._messages_to_prompt(messages)
        
        result = self._call_ollama(model, prompt, body.get("stream", False))
        self.send_json({"message": result})
    
    def handle_deepthink(self, body):
        query = body.get("query", "")
        # Route to void-1 for research
        research_prompt = f"""Research the following topic thoroughly:
{query}

Steps:
1. Identify key aspects to investigate
2. For each aspect, provide facts and data
3. Synthesize findings into a comprehensive answer
4. List key sources and references"""
        
        result = self._call_ollama("void-1", research_prompt)
        self.send_json({"answer": result, "sources": [], "queries": [query]})
    
    def handle_agent(self, body):
        command = body.get("command", "")
        # Safety check
        blocked = ["rm -rf /", "mkfs", "dd if=", "fork"]
        if any(b in command for b in blocked):
            self.send_json({"output": "Command blocked for safety.", "exitCode": 1})
            return
        
        try:
            result = subprocess.run(
                command, shell=True, capture_output=True, text=True,
                timeout=30, cwd=body.get("cwd", "/tmp")
            )
            self.send_json({"output": result.stdout or result.stderr, "exitCode": result.returncode})
        except Exception as e:
            self.send_json({"output": str(e), "exitCode": 1})
    
    def handle_voidcode(self, body):
        code = body.get("code", "")
        # Route to void-1 for Void Code execution
        result = self._call_ollama("void-1", f"Execute this Void Code and show output:\n{code}")
        self.send_json({"output": result, "exitCode": 0})
    
    def handle_models(self, body):
        try:
            result = subprocess.run(
                ["ollama", "list"], capture_output=True, text=True, timeout=10
            )
            models = [line.split()[0] for line in result.stdout.strip().split("\n")[1:] if line.strip()]
            self.send_json({"models": models})
        except Exception:
            self.send_json({"models": ["void-1", "void-2", "void-moa"]})
    
    def handle_router(self, body):
        query = body.get("query", "")
        # Simple keyword-based routing
        code_words = ["code", "function", "bug", "debug", "api", "script", "algorithm",
                      "python", "javascript", "terminal", "shell", "command", "install"]
        lang_words = ["write", "story", "essay", "explain", "analyze", "describe",
                      "tell me", "what is", "opinion", "creative"]
        
        q = query.lower()
        code_score = sum(1 for w in code_words if w in q)
        lang_score = sum(1 for w in lang_words if w in q)
        
        if code_score > lang_score:
            model = "void-1"
        elif lang_score > code_score:
            model = "void-2"
        else:
            model = "void-moa"
        
        self.send_json({"model": model, "confidence": 0.5 + abs(code_score - lang_score) * 0.1})
    
    def _call_ollama(self, model, prompt, stream=False):
        try:
            import urllib.request
            data = json.dumps({"model": model, "prompt": prompt, "stream": stream}).encode()
            req = urllib.request.Request(
                f"{VOID_CONFIG['ollama_url']}/api/generate",
                data=data,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read())
                return result.get("response", "")
        except Exception as e:
            return f"[Void AI Error: {str(e)}]"
    
    def _messages_to_prompt(self, messages):
        parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                parts.append(f"System: {content}")
            elif role == "user":
                parts.append(f"User: {content}")
            elif role == "assistant":
                parts.append(f"Assistant: {content}")
        return "\n".join(parts)
    
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

if __name__ == "__main__":
    server = HTTPServer((VOID_CONFIG["host"], VOID_CONFIG["port"]), VoidAIHandler)
    print(f"\n  Void AI Server v1.0")
    print(f"  Listening on {VOID_CONFIG['host']}:{VOID_CONFIG['port']}")
    print(f"  Ollama: {VOID_CONFIG['ollama_url']}")
    print(f"  RAM Limit: {VOID_CONFIG['ram_limit'] // (1024*1024)}MB")
    print(f"  Models: void-1, void-2, void-moa\n")
    server.serve_forever()
