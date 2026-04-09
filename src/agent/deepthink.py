"""
Void AI DeepThink — Research Engine
Multi-step research with query generation, source synthesis, and citation management.
"""
import json
import re
from typing import Dict, List, Any, Optional


class DeepThinkEngine:
    """
    DeepThink Research Engine — performs multi-step research.
    Generates search queries, analyzes findings, and synthesizes comprehensive answers.
    """
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.max_iterations = 5
        self.max_queries_per_iteration = 3
    
    def research(self, query: str, model: str = "void-1") -> Dict[str, Any]:
        """
        Perform deep research on a topic.
        
        Returns:
            {
                answer: str,
                sources: list,
                queries: list,
                iterations: int,
                confidence: float
            }
        """
        all_findings: List[str] = []
        all_queries: List[str] = []
        
        current_query = query
        
        for iteration in range(self.max_iterations):
            # Step 1: Generate sub-queries for this iteration
            sub_queries = self._generate_queries(current_query, model)
            all_queries.extend(sub_queries)
            
            # Step 2: "Search" — use model knowledge to find information
            new_findings = []
            for sq in sub_queries:
                finding = self._simulate_search(sq, model)
                if finding and finding.strip():
                    new_findings.append(f"Query: {sq}\nFinding: {finding}")
            
            if not new_findings:
                break
            
            all_findings.extend(new_findings)
            
            # Step 3: Determine if we need more research
            if iteration < self.max_iterations - 1:
                next_query = self._determine_next_step(
                    query, "\n\n".join(all_findings[-9:]), model
                )
                if "COMPLETE" in next_query or not next_query.strip():
                    break
                current_query = next_query
        
        # Step 4: Synthesize all findings
        answer = self._synthesize(query, all_findings, model)
        
        return {
            "answer": answer,
            "sources": [{"query": q, "type": "research"} for q in all_queries],
            "queries": all_queries,
            "iterations": len(all_queries),
            "findings_count": len(all_findings),
            "confidence": 0.7,  # Base confidence
        }
    
    def _generate_queries(self, topic: str, model: str) -> List[str]:
        """Generate targeted search queries for a topic."""
        prompt = f"""Given this research topic: "{topic}"

Generate {self.max_queries_per_iteration} specific, targeted search queries 
that would help research this topic thoroughly. Return ONLY the queries, 
one per line. No numbering or extra text."""
        
        response = self._call_ollama(model, prompt)
        if not response:
            return [topic]
        
        queries = [line.strip() for line in response.strip().split("\n")]
        return [q for q in queries if q and len(q) > 5][:self.max_queries_per_iteration]
    
    def _simulate_search(self, query: str, model: str) -> Optional[str]:
        """Use the model's knowledge as a search result."""
        prompt = f"""Provide a comprehensive, factual answer to this question:
{query}

Include specific facts, data points, and details. Be precise and concise."""
        
        return self._call_ollama(model, prompt)
    
    def _determine_next_step(self, original: str, findings: str, model: str) -> str:
        """Determine the next research step based on findings so far."""
        prompt = f"""Research topic: {original}

Findings so far:
{findings}

What specific aspect needs more investigation? 
Return a focused follow-up question, or "COMPLETE" if the research is thorough enough."""
        
        return self._call_ollama(model, prompt) or "COMPLETE"
    
    def _synthesize(self, query: str, findings: List[str], model: str) -> str:
        """Synthesize all research findings into a comprehensive answer."""
        findings_text = "\n\n---\n\n".join(findings[-15:])  # Last 15 findings
        
        prompt = f"""Based on the following research findings, provide a comprehensive 
answer to the original question.

Original Question: {query}

Research Findings:
{findings_text}

Synthesize a thorough, well-structured answer. Include:
1. Direct answer to the question
2. Key points with supporting evidence
3. Nuances and caveats
4. Summary conclusion

Use clear headings and structured format."""
        
        return self._call_ollama(model, prompt) or "Unable to synthesize research findings."
    
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


if __name__ == "__main__":
    engine = DeepThinkEngine()
    result = engine.research("What are the latest developments in quantum computing?")
    print(json.dumps(result, indent=2))
