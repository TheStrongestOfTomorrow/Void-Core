"""
Void AI Agent Tools — Shell, File, Web
Lightweight tool implementations for Agent mode.
"""
import subprocess, os, json, urllib.request
from typing import Dict, Any

class ToolRegistry:
    def __init__(self):
        self.tools: Dict[str, callable] = {
            "shell": self.shell_exec,
            "read_file": self.read_file,
            "write_file": self.write_file,
            "list_dir": self.list_dir,
            "web_search": self.web_search,
            "web_read": self.web_read,
        }
    
    def shell_exec(self, cmd: str, cwd: str = "/tmp", timeout: int = 30) -> Dict[str, Any]:
        blocked = ["rm -rf /", "mkfs", "dd if=", ":(){ :|:&"]
        for b in blocked:
            if b in cmd: return {"ok": False, "error": "Command blocked"}
        try:
            r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout, cwd=cwd)
            return {"ok": r.returncode == 0, "stdout": r.stdout, "stderr": r.stderr, "code": r.returncode}
        except Exception as e:
            return {"ok": False, "error": str(e)}
    
    def read_file(self, path: str) -> Dict[str, Any]:
        try:
            with open(path) as f: return {"ok": True, "content": f.read()}
        except Exception as e: return {"ok": False, "error": str(e)}
    
    def write_file(self, path: str, content: str) -> Dict[str, Any]:
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w') as f: f.write(content)
            return {"ok": True, "bytes": len(content)}
        except Exception as e: return {"ok": False, "error": str(e)}
    
    def list_dir(self, path: str = ".") -> Dict[str, Any]:
        try:
            entries = os.listdir(path)
            return {"ok": True, "entries": entries, "count": len(entries)}
        except Exception as e: return {"ok": False, "error": str(e)}
    
    def web_search(self, query: str) -> Dict[str, Any]:
        try:
            data = json.dumps({"query": query, "num": 5}).encode()
            req = urllib.request.Request("http://localhost:11434/api/search", data=data,
                headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=10) as r:
                return {"ok": True, "results": json.loads(r.read())}
        except: return {"ok": False, "results": []}
    
    def web_read(self, url: str) -> Dict[str, Any]:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "VoidAI/1.0"})
            with urllib.request.urlopen(req, timeout=10) as r:
                return {"ok": True, "content": r.read().decode()[:5000]}
        except Exception as e: return {"ok": False, "error": str(e)}
