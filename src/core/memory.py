"""
Void AI Memory Manager — Targets 2GB RAM allocation
Lightweight memory tracking and pool management.
"""
import os
import gc
import resource
from typing import Dict, List, Optional
from dataclasses import dataclass, field

@dataclass
class MemoryPool:
    """Represents an allocated memory pool."""
    name: str
    size_bytes: int
    used_bytes: int = 0
    items: int = 0

class MemoryManager:
    """
    Lightweight memory manager for Void AI.
    Tracks allocations and enforces RAM limits.
    """
    
    def __init__(self, limit_mb: int = 2048):
        self.limit_bytes = limit_mb * 1024 * 1024
        self.pools: Dict[str, MemoryPool] = {}
        self.total_allocated = 0
        
        # Pre-allocate pools for common subsystems
        self._create_pool("model_weights", self.limit_bytes * 0.50)   # 50% for model
        self._create_pool("kv_cache", self.limit_bytes * 0.20)       # 20% for KV cache
        self._create_pool("runtime", self.limit_bytes * 0.15)        # 15% for runtime
        self._create_pool("agent_tools", self.limit_bytes * 0.05)    # 5% for tools
        self._create_pool("scratch", self.limit_bytes * 0.10)        # 10% scratch
    
    def _create_pool(self, name: str, size: int):
        self.pools[name] = MemoryPool(name=name, size_bytes=int(size))
    
    def allocate(self, pool_name: str, size_bytes: int) -> bool:
        """Try to allocate memory in a specific pool."""
        if pool_name not in self.pools:
            return False
        
        pool = self.pools[pool_name]
        if pool.used_bytes + size_bytes > pool.size_bytes:
            # Try garbage collection first
            gc.collect()
            if pool.used_bytes + size_bytes > pool.size_bytes:
                return False
        
        pool.used_bytes += size_bytes
        pool.items += 1
        self.total_allocated += size_bytes
        return True
    
    def release(self, pool_name: str, size_bytes: int):
        """Release memory from a pool."""
        if pool_name in self.pools:
            pool = self.pools[pool_name]
            pool.used_bytes = max(0, pool.used_bytes - size_bytes)
            pool.items = max(0, pool.items - 1)
            self.total_allocated = max(0, self.total_allocated - size_bytes)
    
    def stats(self) -> Dict:
        """Get current memory statistics."""
        try:
            rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
            # On Linux, ru_maxrss is in KB; on macOS, in bytes
            if os.uname().sysname == 'Linux':
                rss *= 1024
        except:
            rss = 0
        
        return {
            "limit_mb": self.limit_bytes // (1024 * 1024),
            "total_allocated_mb": self.total_allocated // (1024 * 1024),
            "rss_mb": rss // (1024 * 1024),
            "utilization": round(self.total_allocated / self.limit_bytes * 100, 1),
            "pools": {
                name: {
                    "size_mb": pool.size_bytes // (1024 * 1024),
                    "used_mb": pool.used_bytes // (1024 * 1024),
                    "items": pool.items,
                }
                for name, pool in self.pools.items()
            }
        }
    
    def compact(self):
        """Force garbage collection and compact memory."""
        gc.collect()
    
    def is_under_limit(self) -> bool:
        return self.total_allocated < self.limit_bytes

if __name__ == "__main__":
    mm = MemoryManager(limit_mb=2048)
    print("Void AI Memory Manager — 2GB Target")
    print(mm.stats())
