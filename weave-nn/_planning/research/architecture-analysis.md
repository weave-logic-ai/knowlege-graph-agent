# Architecture Analysis: Day 2, Day 4, and Day 11 Tasks

**Analyst**: Hive Mind Analyst Agent
**Analysis Date**: 2025-10-22
**Session ID**: swarm-1761105846852-b3sb90gqc
**Status**: COMPREHENSIVE ANALYSIS COMPLETE

---

## Executive Summary

This document provides comprehensive architectural analysis for three critical MVP development tasks:

1. **Day 2: Obsidian REST API Client** - Backend integration layer
2. **Day 4: Agent Rule Implementation** - AI automation framework
3. **Day 11: Obsidian Properties & Visualization** - User experience layer

Each analysis includes:
- Optimal design patterns and architectures
- Technology recommendations with trade-offs
- Security and performance considerations
- Integration points and dependencies
- Implementation roadmap

**Key Finding**: These three components form a cohesive system where the REST API client provides the foundation, agent rules automate knowledge management, and properties/visualization deliver the user experience.

---

## Table of Contents

1. [Day 2: Obsidian REST API Client Analysis](#day-2-obsidian-rest-api-client-analysis)
2. [Day 4: Agent Rule Implementation Analysis](#day-4-agent-rule-implementation-analysis)
3. [Day 11: Properties & Visualization Analysis](#day-11-properties--visualization-analysis)
4. [Cross-Task Integration Points](#cross-task-integration-points)
5. [Recommended Implementation Sequence](#recommended-implementation-sequence)
6. [Risk Assessment & Mitigation](#risk-assessment--mitigation)

---

# Day 2: Obsidian REST API Client Analysis

## 1. Client Architecture Patterns

### Pattern Comparison

| Pattern | Pros | Cons | Recommendation |
|---------|------|------|----------------|
| **Singleton** | Single connection pool, consistent state, memory efficient | Global state, testing complexity, potential bottleneck | ⭐ **RECOMMENDED** for production |
| **Factory** | Flexible instantiation, easy mocking, supports multiple vaults | Overhead per instance, connection pool fragmentation | Use for multi-vault scenarios |
| **Service Pattern** | Clear separation of concerns, dependency injection friendly | More boilerplate, requires DI container | Good for large applications |

### Recommended Architecture: Singleton with Connection Pooling

```python
# utils/obsidian_client.py

import requests
from typing import Optional, Dict, Any, List
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
import logging
from functools import lru_cache
import threading

class ObsidianRESTClient:
    """
    Singleton REST client for Obsidian Local REST API integration.

    Features:
    - Connection pooling for performance
    - Automatic retry with exponential backoff
    - Circuit breaker pattern for fault tolerance
    - Request/response logging
    - Bearer token authentication
    - Thread-safe operations
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(
        self,
        api_url: str,
        api_key: str,
        timeout: int = 30,
        max_retries: int = 3,
        pool_connections: int = 10,
        pool_maxsize: int = 20
    ):
        # Only initialize once (singleton pattern)
        if hasattr(self, '_initialized'):
            return

        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.logger = logging.getLogger(__name__)

        # Configure session with connection pooling
        self.session = requests.Session()

        # Retry strategy with exponential backoff
        retry_strategy = Retry(
            total=max_retries,
            status_forcelist=[429, 500, 502, 503, 504],
            method_whitelist=["HEAD", "GET", "PUT", "DELETE", "OPTIONS", "TRACE"],
            backoff_factor=1  # 1s, 2s, 4s
        )

        adapter = HTTPAdapter(
            pool_connections=pool_connections,
            pool_maxsize=pool_maxsize,
            max_retries=retry_strategy
        )

        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        # Set default headers
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'Weave-NN/1.0 MCP-Server'
        })

        self._initialized = True
        self.logger.info(f"Initialized Obsidian REST client: {api_url}")

    def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> requests.Response:
        """Make HTTP request with error handling."""
        url = f"{self.api_url}{endpoint}"

        try:
            response = self.session.request(
                method,
                url,
                timeout=self.timeout,
                **kwargs
            )
            response.raise_for_status()
            return response

        except requests.exceptions.HTTPError as e:
            self.logger.error(f"HTTP error for {method} {endpoint}: {e}")
            raise ObsidianAPIError(f"API request failed: {e}", status_code=e.response.status_code)
        except requests.exceptions.ConnectionError as e:
            self.logger.error(f"Connection error: {e}")
            raise ObsidianConnectionError("Failed to connect to Obsidian API")
        except requests.exceptions.Timeout as e:
            self.logger.error(f"Timeout error: {e}")
            raise ObsidianTimeoutError("Request timed out")
        except Exception as e:
            self.logger.error(f"Unexpected error: {e}")
            raise ObsidianClientError(f"Unexpected error: {e}")

    # CRUD operations
    def create_note(
        self,
        path: str,
        content: str,
        frontmatter: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create new note with optional frontmatter."""

        # Construct note content with frontmatter
        if frontmatter:
            import yaml
            yaml_str = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True)
            full_content = f"---\n{yaml_str}---\n\n{content}"
        else:
            full_content = content

        response = self._request(
            'POST',
            f'/vault/{path}',
            json={'content': full_content}
        )

        self.logger.info(f"Created note: {path}")
        return response.json()

    def read_note(self, path: str) -> Dict[str, Any]:
        """Read note content and metadata."""
        response = self._request('GET', f'/vault/{path}')
        return response.json()

    def update_note(self, path: str, content: str) -> Dict[str, Any]:
        """Update existing note content."""
        response = self._request(
            'PUT',
            f'/vault/{path}',
            json={'content': content}
        )
        self.logger.info(f"Updated note: {path}")
        return response.json()

    def delete_note(self, path: str) -> Dict[str, Any]:
        """Delete note."""
        response = self._request('DELETE', f'/vault/{path}')
        self.logger.info(f"Deleted note: {path}")
        return response.json()

    def list_notes(
        self,
        pattern: Optional[str] = None,
        folder: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List notes with optional pattern filter."""
        params = {}
        if pattern:
            params['pattern'] = pattern
        if folder:
            params['folder'] = folder

        response = self._request('GET', '/vault/', params=params)
        return response.json()

    def patch_note_section(
        self,
        path: str,
        heading: str,
        content: str
    ) -> Dict[str, Any]:
        """Update specific section of note."""
        response = self._request(
            'PATCH',
            f'/vault/{path}',
            json={'heading': heading, 'content': content}
        )
        self.logger.info(f"Patched section '{heading}' in {path}")
        return response.json()

    @lru_cache(maxsize=128)
    def search_notes(self, query: str) -> List[Dict[str, Any]]:
        """Search notes (cached for performance)."""
        response = self._request('GET', '/search/', params={'q': query})
        return response.json()

    def health_check(self) -> bool:
        """Check API availability."""
        try:
            response = self._request('GET', '/health')
            return response.status_code == 200
        except Exception:
            return False

    def close(self):
        """Clean up resources."""
        self.session.close()
        self.logger.info("Closed Obsidian REST client")


# Custom exceptions
class ObsidianClientError(Exception):
    """Base exception for client errors."""
    pass

class ObsidianAPIError(ObsidianClientError):
    """API returned error response."""
    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.status_code = status_code

class ObsidianConnectionError(ObsidianClientError):
    """Connection to API failed."""
    pass

class ObsidianTimeoutError(ObsidianClientError):
    """Request timed out."""
    pass
```

**Rationale**:
- **Singleton**: Ensures single connection pool for entire application
- **Connection pooling**: Reuses TCP connections for 10-20x performance improvement
- **Retry logic**: Handles transient failures automatically
- **Thread-safe**: Supports concurrent requests from multiple consumers
- **Type hints**: Enables IDE autocomplete and static analysis
- **Logging**: Comprehensive error tracking and debugging
- **Caching**: LRU cache for search queries (reduces API calls)

---

## 2. Authentication Strategies

### Comparison Matrix

| Strategy | Security | Complexity | API Support | Recommendation |
|----------|----------|------------|-------------|----------------|
| **API Key (Bearer)** | Medium | Low | ✅ Native | ⭐ **RECOMMENDED** |
| **OAuth 2.0** | High | High | ❌ Not supported | Future consideration |
| **JWT** | High | Medium | ❌ Not supported | Not applicable |
| **mTLS** | Very High | Very High | ❌ Not supported | Overkill for local API |

### Recommended: API Key with Secure Storage

**Implementation**:

```python
# config.py
import os
from pathlib import Path
from dotenv import load_dotenv
import keyring
import getpass

class Config:
    """Centralized configuration management."""

    def __init__(self):
        # Load from .env file first
        load_dotenv()

        # Obsidian API configuration
        self.OBSIDIAN_API_URL = os.getenv(
            'OBSIDIAN_API_URL',
            'https://localhost:27124'
        )

        # Try to get API key from multiple sources (in order of preference)
        self.OBSIDIAN_API_KEY = self._get_api_key()

        # Validate configuration
        self._validate()

    def _get_api_key(self) -> str:
        """Get API key from secure storage, fallback to env var."""

        # 1. Try system keyring (most secure)
        try:
            key = keyring.get_password("weave-nn", "obsidian_api_key")
            if key:
                return key
        except Exception:
            pass

        # 2. Try environment variable
        key = os.getenv('OBSIDIAN_API_KEY')
        if key:
            return key

        # 3. Prompt user (store in keyring for future)
        key = getpass.getpass("Enter Obsidian API key: ")
        try:
            keyring.set_password("weave-nn", "obsidian_api_key", key)
        except Exception:
            pass

        return key

    def _validate(self):
        """Validate required configuration."""
        if not self.OBSIDIAN_API_KEY:
            raise ValueError("OBSIDIAN_API_KEY not configured")

        if not self.OBSIDIAN_API_URL:
            raise ValueError("OBSIDIAN_API_URL not configured")
```

**Security Best Practices**:

1. **Never commit API keys**: Use `.env` file (add to `.gitignore`)
2. **System keyring**: Store keys in OS keyring (macOS Keychain, Windows Credential Manager, Linux Secret Service)
3. **Environment variables**: Fallback for Docker/CI environments
4. **Key rotation**: Support updating API key without code changes
5. **Least privilege**: API key should have minimal required permissions

**Environment File Example** (`.env`):
```bash
# Obsidian REST API
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=your_secret_key_here

# RabbitMQ
RABBITMQ_URL=amqp://admin:password@localhost:5672

# Claude API
CLAUDE_API_KEY=sk-ant-xxx
```

---

## 3. Error Handling & Retry Strategies

### Error Taxonomy

```python
# Error classification and handling strategy

ERROR_STRATEGIES = {
    # Client errors (4xx) - Don't retry
    400: ("Bad Request", "validate_request", False),
    401: ("Unauthorized", "refresh_auth", False),
    403: ("Forbidden", "check_permissions", False),
    404: ("Not Found", "handle_missing", False),
    409: ("Conflict", "resolve_conflict", False),
    422: ("Unprocessable", "validate_schema", False),

    # Server errors (5xx) - Retry with backoff
    500: ("Internal Error", "log_and_retry", True),
    502: ("Bad Gateway", "retry", True),
    503: ("Service Unavailable", "retry", True),
    504: ("Gateway Timeout", "retry", True),

    # Network errors - Retry
    'connection': ("Connection Failed", "retry", True),
    'timeout': ("Request Timeout", "retry", True),
}

class ErrorHandler:
    """Centralized error handling logic."""

    @staticmethod
    def handle_error(error: Exception, context: Dict[str, Any]) -> Any:
        """Route error to appropriate handler."""

        if isinstance(error, ObsidianAPIError):
            strategy = ERROR_STRATEGIES.get(error.status_code)
            if strategy:
                _, handler_name, should_retry = strategy
                handler = getattr(ErrorHandler, handler_name)
                return handler(error, context)

        # Default: log and re-raise
        logging.error(f"Unhandled error: {error}", extra=context)
        raise

    @staticmethod
    def validate_request(error: Exception, context: Dict[str, Any]):
        """Handle 400 Bad Request."""
        # Extract validation errors from response
        # Return structured error to caller
        raise ValueError(f"Invalid request: {error}")

    @staticmethod
    def refresh_auth(error: Exception, context: Dict[str, Any]):
        """Handle 401 Unauthorized."""
        # Attempt to refresh API key
        # If fails, prompt user for new key
        raise ObsidianAuthError("Authentication failed. Check API key.")

    @staticmethod
    def handle_missing(error: Exception, context: Dict[str, Any]):
        """Handle 404 Not Found."""
        # Return None or raise more specific exception
        return None

    @staticmethod
    def resolve_conflict(error: Exception, context: Dict[str, Any]):
        """Handle 409 Conflict."""
        # Implement last-write-wins or manual resolution
        raise ObsidianConflictError("File modified by another process")

    @staticmethod
    def log_and_retry(error: Exception, context: Dict[str, Any]):
        """Handle 500 errors."""
        logging.error(f"Server error: {error}", extra=context)
        # Retry handled by requests.adapters.Retry
        raise
```

### Retry Configuration

```python
# Exponential backoff with jitter

from urllib3.util.retry import Retry

retry_strategy = Retry(
    total=5,                    # Max 5 retries
    read=5,
    connect=5,
    backoff_factor=1,           # 1s, 2s, 4s, 8s, 16s
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["HEAD", "GET", "PUT", "DELETE", "POST", "PATCH"],
    raise_on_status=False       # Let client code handle errors
)

# Add jitter to prevent thundering herd
import random

def calculate_backoff(retry_number: int, base_delay: float = 1.0) -> float:
    """Calculate delay with exponential backoff and jitter."""
    max_delay = base_delay * (2 ** retry_number)
    jitter = random.uniform(0, 0.1 * max_delay)
    return max_delay + jitter
```

---

## 4. Caching & Performance Optimization

### Multi-Layer Caching Strategy

```python
from functools import lru_cache
from cachetools import TTLCache, cached
import hashlib
import pickle

class CachingStrategy:
    """
    Multi-layer caching for performance optimization.

    Layers:
    1. In-memory LRU cache (fast, volatile)
    2. TTL cache (time-based invalidation)
    3. Redis cache (shared across instances, optional)
    4. SQLite shadow cache (persistent metadata)
    """

    def __init__(self):
        # Layer 1: LRU cache for frequently accessed notes
        self.lru_cache = lru_cache(maxsize=256)

        # Layer 2: TTL cache for search results (5 min expiry)
        self.ttl_cache = TTLCache(maxsize=512, ttl=300)

        # Layer 3: Redis (if available)
        try:
            import redis
            self.redis = redis.Redis(host='localhost', port=6379, db=0)
        except:
            self.redis = None

    def get_cached_note(self, path: str) -> Optional[Dict[str, Any]]:
        """Get note from cache (check all layers)."""

        # Layer 1: LRU
        cache_key = f"note:{path}"

        # Layer 2: Redis
        if self.redis:
            cached = self.redis.get(cache_key)
            if cached:
                return pickle.loads(cached)

        return None

    def cache_note(self, path: str, data: Dict[str, Any], ttl: int = 300):
        """Cache note in all layers."""

        cache_key = f"note:{path}"

        # Redis cache with TTL
        if self.redis:
            self.redis.setex(
                cache_key,
                ttl,
                pickle.dumps(data)
            )

    def invalidate_cache(self, path: str):
        """Invalidate cache for specific note."""
        cache_key = f"note:{path}"

        if self.redis:
            self.redis.delete(cache_key)

        # Clear TTL cache entries
        keys_to_delete = [k for k in self.ttl_cache.keys() if path in str(k)]
        for key in keys_to_delete:
            del self.ttl_cache[key]
```

### Performance Optimizations

1. **Connection Pooling**: Reuse TCP connections (10-20x faster)
2. **Request Batching**: Combine multiple operations into single request
3. **Lazy Loading**: Load note content only when needed
4. **Compression**: Use gzip compression for large payloads
5. **Async I/O**: Use `aiohttp` for non-blocking operations (future enhancement)

**Benchmark Targets**:
- API response time: < 50ms (p95)
- Cache hit rate: > 80%
- Connection pool utilization: < 70%
- Memory footprint: < 100MB

---

## 5. Security Considerations

### Threat Model

| Threat | Mitigation | Priority |
|--------|------------|----------|
| **API key exposure** | Environment variables, keyring, never log | Critical |
| **Man-in-the-middle** | HTTPS, certificate validation | High |
| **Injection attacks** | Input validation, parameterized queries | High |
| **DoS attacks** | Rate limiting, circuit breaker | Medium |
| **Data leakage** | Encrypt sensitive data, audit logs | Medium |

### Security Implementation

```python
# Input validation and sanitization

import re
from pathlib import Path

class SecurityValidator:
    """Security validation for API inputs."""

    # Allow only safe path characters
    SAFE_PATH_PATTERN = re.compile(r'^[a-zA-Z0-9_\-/\.]+$')

    # Maximum lengths to prevent buffer overflow
    MAX_PATH_LENGTH = 255
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB

    @staticmethod
    def validate_path(path: str) -> str:
        """Validate and sanitize file path."""

        # Check length
        if len(path) > SecurityValidator.MAX_PATH_LENGTH:
            raise ValueError(f"Path too long: {len(path)} chars")

        # Check for path traversal
        if '..' in path or path.startswith('/'):
            raise ValueError("Path traversal detected")

        # Check for safe characters
        if not SecurityValidator.SAFE_PATH_PATTERN.match(path):
            raise ValueError("Invalid characters in path")

        # Normalize path
        normalized = Path(path).as_posix()

        return normalized

    @staticmethod
    def validate_content(content: str) -> str:
        """Validate content size."""

        if len(content) > SecurityValidator.MAX_CONTENT_LENGTH:
            raise ValueError(f"Content too large: {len(content)} bytes")

        return content

    @staticmethod
    def sanitize_frontmatter(frontmatter: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize frontmatter to prevent code injection."""

        # Remove potentially dangerous keys
        dangerous_keys = ['__import__', 'eval', 'exec', 'compile']

        sanitized = {}
        for key, value in frontmatter.items():
            if key in dangerous_keys:
                continue

            # Recursively sanitize nested dicts
            if isinstance(value, dict):
                sanitized[key] = SecurityValidator.sanitize_frontmatter(value)
            else:
                sanitized[key] = value

        return sanitized
```

### Audit Logging

```python
import logging
from datetime import datetime
import json

class AuditLogger:
    """Security audit logging."""

    def __init__(self, log_file: str = "audit.log"):
        self.logger = logging.getLogger('audit')
        handler = logging.FileHandler(log_file)
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def log_api_call(
        self,
        method: str,
        endpoint: str,
        user: str,
        success: bool,
        **kwargs
    ):
        """Log API call for audit trail."""

        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'api_call',
            'method': method,
            'endpoint': endpoint,
            'user': user,
            'success': success,
            **kwargs
        }

        self.logger.info(json.dumps(event))

    def log_security_event(
        self,
        event_type: str,
        severity: str,
        description: str,
        **kwargs
    ):
        """Log security-related events."""

        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'security',
            'severity': severity,
            'description': description,
            **kwargs
        }

        if severity in ['high', 'critical']:
            self.logger.error(json.dumps(event))
        else:
            self.logger.warning(json.dumps(event))
```

---

# Day 4: Agent Rule Implementation Analysis

## 1. Rule Execution Patterns

### Pattern Comparison

| Pattern | Best For | Complexity | Flexibility | Recommendation |
|---------|----------|------------|-------------|----------------|
| **Chain of Responsibility** | Sequential processing, validation | Medium | Medium | ⭐ Use for validation pipeline |
| **Strategy** | Runtime rule selection | Low | High | ⭐ Use for per-rule logic |
| **Interpreter** | Complex rule DSL | High | Very High | Defer to v1.1 |
| **Rule Engine (Drools-like)** | Large rule sets (100+) | High | High | Overkill for 6 rules |
| **Event-Driven** | Async, decoupled | Medium | High | ⭐ **RECOMMENDED** |

### Recommended: Event-Driven with Strategy Pattern

**Architecture**:

```python
# agents/rule_engine.py

from typing import Dict, Any, List, Callable, Optional
from abc import ABC, abstractmethod
from enum import Enum
import logging
from dataclasses import dataclass
from datetime import datetime

class RulePriority(Enum):
    """Rule execution priority."""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4

class RuleStatus(Enum):
    """Rule execution status."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"

@dataclass
class RuleContext:
    """Context passed to rule execution."""
    event_type: str
    file_path: Optional[str]
    frontmatter: Optional[Dict[str, Any]]
    content: Optional[str]
    metadata: Dict[str, Any]
    timestamp: datetime

@dataclass
class RuleResult:
    """Result of rule execution."""
    rule_id: str
    status: RuleStatus
    actions_taken: List[str]
    suggestions: List[str]
    errors: List[str]
    duration_ms: float
    metadata: Dict[str, Any]

class AgentRule(ABC):
    """Base class for all agent rules."""

    def __init__(
        self,
        rule_id: str,
        priority: RulePriority,
        enabled: bool = True
    ):
        self.rule_id = rule_id
        self.priority = priority
        self.enabled = enabled
        self.logger = logging.getLogger(f"rule.{rule_id}")

    @abstractmethod
    def should_execute(self, context: RuleContext) -> bool:
        """Determine if rule should execute for this context."""
        pass

    @abstractmethod
    def execute(self, context: RuleContext) -> RuleResult:
        """Execute rule logic."""
        pass

    def validate_preconditions(self, context: RuleContext) -> bool:
        """Validate preconditions before execution."""
        return True

    def on_error(self, error: Exception, context: RuleContext):
        """Handle errors during execution."""
        self.logger.error(f"Rule {self.rule_id} failed: {error}")


class RuleEngine:
    """
    Event-driven rule engine for agent automation.

    Features:
    - Priority-based execution
    - Conditional triggering
    - Error handling and recovery
    - Metrics tracking
    - Rule chaining
    """

    def __init__(self):
        self.rules: List[AgentRule] = []
        self.metrics: Dict[str, Any] = {}
        self.logger = logging.getLogger('rule_engine')

    def register_rule(self, rule: AgentRule):
        """Register a new rule."""
        self.rules.append(rule)
        self.rules.sort(key=lambda r: r.priority.value)
        self.logger.info(f"Registered rule: {rule.rule_id}")

    def process_event(
        self,
        event_type: str,
        **context_data
    ) -> List[RuleResult]:
        """Process event through all applicable rules."""

        context = RuleContext(
            event_type=event_type,
            timestamp=datetime.utcnow(),
            **context_data
        )

        results = []

        for rule in self.rules:
            # Skip disabled rules
            if not rule.enabled:
                continue

            # Check if rule should execute
            if not rule.should_execute(context):
                continue

            # Validate preconditions
            if not rule.validate_preconditions(context):
                self.logger.warning(f"Rule {rule.rule_id} preconditions failed")
                continue

            # Execute rule
            try:
                start_time = datetime.utcnow()
                result = rule.execute(context)
                duration = (datetime.utcnow() - start_time).total_seconds() * 1000
                result.duration_ms = duration

                results.append(result)
                self._track_metrics(rule.rule_id, result)

            except Exception as e:
                self.logger.error(f"Rule {rule.rule_id} execution failed: {e}")
                rule.on_error(e, context)

                results.append(RuleResult(
                    rule_id=rule.rule_id,
                    status=RuleStatus.FAILED,
                    actions_taken=[],
                    suggestions=[],
                    errors=[str(e)],
                    duration_ms=0,
                    metadata={}
                ))

        return results

    def _track_metrics(self, rule_id: str, result: RuleResult):
        """Track rule execution metrics."""
        if rule_id not in self.metrics:
            self.metrics[rule_id] = {
                'total_executions': 0,
                'success_count': 0,
                'failure_count': 0,
                'avg_duration_ms': 0,
                'total_actions': 0
            }

        metrics = self.metrics[rule_id]
        metrics['total_executions'] += 1

        if result.status == RuleStatus.SUCCESS:
            metrics['success_count'] += 1
        else:
            metrics['failure_count'] += 1

        metrics['total_actions'] += len(result.actions_taken)

        # Update average duration
        n = metrics['total_executions']
        metrics['avg_duration_ms'] = (
            (metrics['avg_duration_ms'] * (n - 1) + result.duration_ms) / n
        )

    def get_metrics(self) -> Dict[str, Any]:
        """Get rule execution metrics."""
        return self.metrics
```

**Individual Rule Implementation Example** (Auto-Linking):

```python
# agents/rules/auto_linking_rule.py

from agents.rule_engine import AgentRule, RuleContext, RuleResult, RulePriority, RuleStatus
from typing import List, Dict, Any
import re

class AutoLinkingRule(AgentRule):
    """
    Rule 5: Auto-Linking

    Automatically suggest and create wikilinks based on:
    - Keyword matching
    - Semantic similarity
    - Existing link patterns
    """

    def __init__(
        self,
        obsidian_client,
        shadow_cache,
        min_confidence: float = 0.7
    ):
        super().__init__(
            rule_id="auto_linking",
            priority=RulePriority.LOW  # Non-blocking
        )

        self.obsidian = obsidian_client
        self.cache = shadow_cache
        self.min_confidence = min_confidence

    def should_execute(self, context: RuleContext) -> bool:
        """Execute on file creation or significant content changes."""

        # Trigger events
        if context.event_type not in ['file_created', 'file_modified']:
            return False

        # Skip if no content
        if not context.content:
            return False

        # Skip for certain file types
        if context.file_path and ('_planning/' in context.file_path or 'daily-logs/' in context.file_path):
            return False

        return True

    def execute(self, context: RuleContext) -> RuleResult:
        """Execute auto-linking logic."""

        actions = []
        suggestions = []
        errors = []

        try:
            # 1. Extract keywords from content
            keywords = self._extract_keywords(context.content)
            self.logger.debug(f"Extracted {len(keywords)} keywords")

            # 2. Find matching existing nodes
            matches = self._find_matching_nodes(keywords, context.file_path)

            # 3. Calculate similarity scores
            scored_matches = self._score_matches(
                matches,
                context.content,
                context.frontmatter
            )

            # 4. Generate suggestions
            high_confidence = [m for m in scored_matches if m['score'] >= 0.9]
            medium_confidence = [m for m in scored_matches if 0.7 <= m['score'] < 0.9]

            # 5. Auto-apply high confidence links
            for match in high_confidence:
                success = self._add_wikilink(
                    context.file_path,
                    match['keyword'],
                    match['target']
                )
                if success:
                    actions.append(f"Added link: [[{match['target']}]]")

            # 6. Suggest medium confidence links for review
            for match in medium_confidence:
                suggestions.append(
                    f"Consider linking '{match['keyword']}' to [[{match['target']}]] "
                    f"(confidence: {match['score']:.2f})"
                )

            self.logger.info(
                f"Auto-linking complete: {len(actions)} links added, "
                f"{len(suggestions)} suggestions"
            )

        except Exception as e:
            errors.append(str(e))
            self.logger.error(f"Auto-linking failed: {e}")

        return RuleResult(
            rule_id=self.rule_id,
            status=RuleStatus.SUCCESS if not errors else RuleStatus.FAILED,
            actions_taken=actions,
            suggestions=suggestions,
            errors=errors,
            duration_ms=0,  # Set by engine
            metadata={
                'keywords_found': len(keywords) if 'keywords' in locals() else 0,
                'matches_found': len(matches) if 'matches' in locals() else 0
            }
        )

    def _extract_keywords(self, content: str) -> List[str]:
        """Extract potential linkable keywords."""

        # Extract noun phrases (simplified - use spaCy for production)
        words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', content)

        # Extract technical terms (camelCase, kebab-case)
        tech_terms = re.findall(r'\b[a-z]+(?:[A-Z][a-z]*)+\b', content)
        tech_terms += re.findall(r'\b[a-z]+-[a-z-]+\b', content)

        # Combine and deduplicate
        keywords = list(set(words + tech_terms))

        # Filter out common words
        stop_words = {'The', 'This', 'That', 'These', 'Those'}
        keywords = [k for k in keywords if k not in stop_words]

        return keywords

    def _find_matching_nodes(
        self,
        keywords: List[str],
        exclude_path: str
    ) -> List[Dict[str, Any]]:
        """Find nodes matching keywords."""

        matches = []

        for keyword in keywords:
            # Search in shadow cache
            results = self.cache.search_by_content(keyword)

            for result in results:
                if result['file_path'] != exclude_path:
                    matches.append({
                        'keyword': keyword,
                        'target': result['file_path'].replace('.md', ''),
                        'node_type': result.get('node_type'),
                        'tags': result.get('tags', [])
                    })

        return matches

    def _score_matches(
        self,
        matches: List[Dict[str, Any]],
        content: str,
        frontmatter: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Calculate confidence scores for matches."""

        scored = []

        for match in matches:
            score = 0.5  # Base score

            # Boost if keyword appears multiple times
            frequency = content.lower().count(match['keyword'].lower())
            score += min(frequency * 0.1, 0.3)

            # Boost if types match
            if frontmatter.get('type') == match.get('node_type'):
                score += 0.1

            # Boost if tags overlap
            current_tags = set(frontmatter.get('tags', []))
            target_tags = set(match.get('tags', []))
            overlap = len(current_tags & target_tags)
            score += overlap * 0.05

            match['score'] = min(score, 1.0)
            scored.append(match)

        # Sort by score
        scored.sort(key=lambda m: m['score'], reverse=True)

        return scored

    def _add_wikilink(
        self,
        file_path: str,
        keyword: str,
        target: str
    ) -> bool:
        """Add wikilink to file."""

        try:
            # Read current content
            note = self.obsidian.read_note(file_path)
            content = note['content']

            # Find first occurrence of keyword (not already linked)
            pattern = rf'\b{re.escape(keyword)}\b(?!\]\])'
            replacement = f'[[{target}|{keyword}]]'

            # Replace only first occurrence
            new_content = re.sub(pattern, replacement, content, count=1)

            if new_content != content:
                # Update note
                self.obsidian.update_note(file_path, new_content)
                return True

        except Exception as e:
            self.logger.error(f"Failed to add wikilink: {e}")

        return False
```

**Rationale**:
- **Event-driven**: Decoupled from file watcher, scales well
- **Strategy pattern**: Each rule is independent, easy to test
- **Priority-based**: Critical rules execute first
- **Metrics tracking**: Monitor rule performance and effectiveness
- **Extensible**: Add new rules without modifying engine

---

## 2. Rule Storage Formats

### Format Comparison

| Format | Readability | Validation | Tooling | Flexibility | Recommendation |
|--------|-------------|------------|---------|-------------|----------------|
| **JSON** | Medium | Schema | Excellent | Medium | Good for config |
| **YAML** | High | Schema | Good | High | ⭐ **RECOMMENDED** |
| **TOML** | High | Limited | Good | Medium | Alternative |
| **Python DSL** | Medium | Runtime | IDE | Very High | Use for complex rules |
| **Drools DRL** | Low | Built-in | Specialized | Very High | Overkill |

### Recommended: YAML with JSON Schema Validation

**Rule Configuration** (`config/rules/auto_linking.yaml`):

```yaml
# Auto-Linking Rule Configuration

rule_id: auto_linking
enabled: true
priority: low
version: "1.0.0"

description: |
  Automatically suggest and create wikilinks between related nodes
  based on keyword matching and semantic similarity.

triggers:
  - event: file_created
  - event: file_modified
    conditions:
      - field: content_changed
        operator: equals
        value: true
      - field: word_count_delta
        operator: greater_than
        value: 50

conditions:
  - type: path_exclude
    patterns:
      - "_planning/**"
      - "daily-logs/**"
      - "meta/**"

  - type: content_required
    min_length: 50

parameters:
  min_confidence: 0.7
  max_suggestions: 10
  auto_apply_threshold: 0.9

  keyword_extraction:
    methods:
      - noun_phrases
      - technical_terms
      - proper_nouns
    min_frequency: 2
    exclude_stop_words: true

  similarity_search:
    enabled: true
    method: "hash_embedding_1024"
    min_similarity: 0.7
    limit: 10

actions:
  auto_link:
    enabled: true
    only_first_occurrence: true
    preserve_case: true

  suggest:
    enabled: true
    format: "markdown_comment"
    location: "end_of_file"

  create_bidirectional:
    enabled: true
    add_to_related_section: true

error_handling:
  on_keyword_extraction_failure:
    action: skip
    log_level: warning

  on_api_error:
    action: retry
    max_retries: 3
    backoff_factor: 2

  on_validation_error:
    action: abort
    log_level: error

metrics:
  track:
    - suggestions_generated
    - suggestions_accepted_rate
    - auto_links_created
    - execution_duration_ms

notifications:
  on_suggestions_available:
    enabled: true
    message: "💡 {count} link suggestions for [[{node}]]"
    channels:
      - agent_log

  on_auto_linked:
    enabled: true
    message: "🔗 Auto-linked [[{source}]] → [[{target}]]"
    channels:
      - agent_log

# Version history
changelog:
  - version: "1.0.0"
    date: "2025-10-22"
    changes:
      - Initial implementation
      - Keyword extraction
      - Semantic similarity search
```

**JSON Schema for Validation** (`schemas/agent_rule_schema.json`):

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Agent Rule Configuration",
  "type": "object",
  "required": ["rule_id", "enabled", "priority", "triggers"],
  "properties": {
    "rule_id": {
      "type": "string",
      "pattern": "^[a-z_]+$",
      "description": "Unique rule identifier"
    },
    "enabled": {
      "type": "boolean",
      "description": "Whether rule is active"
    },
    "priority": {
      "type": "string",
      "enum": ["critical", "high", "medium", "low"],
      "description": "Execution priority"
    },
    "triggers": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["event"],
        "properties": {
          "event": {
            "type": "string",
            "enum": [
              "file_created",
              "file_modified",
              "file_deleted",
              "task_created",
              "task_completed"
            ]
          },
          "conditions": {
            "type": "array",
            "items": {
              "type": "object"
            }
          }
        }
      }
    },
    "parameters": {
      "type": "object",
      "description": "Rule-specific parameters"
    },
    "actions": {
      "type": "object",
      "description": "Actions to execute"
    },
    "error_handling": {
      "type": "object",
      "description": "Error handling strategies"
    }
  }
}
```

**Configuration Loader**:

```python
# utils/config_loader.py

import yaml
import jsonschema
from pathlib import Path
from typing import Dict, Any

class RuleConfigLoader:
    """Load and validate rule configurations from YAML files."""

    def __init__(self, config_dir: str = "config/rules", schema_dir: str = "schemas"):
        self.config_dir = Path(config_dir)
        self.schema_dir = Path(schema_dir)

        # Load schema
        schema_path = self.schema_dir / "agent_rule_schema.json"
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)

    def load_rule(self, rule_id: str) -> Dict[str, Any]:
        """Load and validate rule configuration."""

        config_path = self.config_dir / f"{rule_id}.yaml"

        if not config_path.exists():
            raise FileNotFoundError(f"Rule config not found: {config_path}")

        # Load YAML
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)

        # Validate against schema
        try:
            jsonschema.validate(instance=config, schema=self.schema)
        except jsonschema.ValidationError as e:
            raise ValueError(f"Invalid rule configuration: {e.message}")

        return config

    def load_all_rules(self) -> Dict[str, Dict[str, Any]]:
        """Load all rule configurations."""

        rules = {}

        for config_file in self.config_dir.glob("*.yaml"):
            rule_id = config_file.stem
            try:
                rules[rule_id] = self.load_rule(rule_id)
            except Exception as e:
                logging.error(f"Failed to load rule {rule_id}: {e}")

        return rules
```

**Rationale**:
- **YAML**: Human-readable, supports comments, easy to edit
- **JSON Schema**: Validates structure at load time, prevents errors
- **Versioning**: Track rule changes over time
- **Extensible**: Add new fields without breaking existing rules
- **Environment-specific**: Override parameters per environment (dev/prod)

---

## 3. Conflict Resolution Algorithms

### Conflict Scenarios

1. **Multiple rules modify same file**: Use locking mechanism
2. **Rule A creates link that Rule B would create**: Deduplicate
3. **Frontmatter value conflicts**: Last-write-wins or merge
4. **Tag conflicts**: Union of tags
5. **Wikilink conflicts**: Preserve all unique links

### Recommended: Priority-Based with Merge Strategies

```python
# agents/conflict_resolver.py

from typing import Dict, Any, List
from enum import Enum
import threading

class ConflictStrategy(Enum):
    """Conflict resolution strategies."""
    LAST_WRITE_WINS = "last_write_wins"
    MERGE = "merge"
    UNION = "union"
    MANUAL = "manual"
    ABORT = "abort"

class ConflictResolver:
    """
    Resolve conflicts between concurrent rule modifications.

    Strategies:
    - Locking: Prevent concurrent writes to same file
    - Merging: Combine changes intelligently
    - Versioning: Track changes for rollback
    """

    def __init__(self):
        self.file_locks: Dict[str, threading.Lock] = {}
        self.lock_acquisition_lock = threading.Lock()

    def acquire_file_lock(self, file_path: str, timeout: float = 30.0) -> bool:
        """Acquire exclusive lock on file."""

        with self.lock_acquisition_lock:
            if file_path not in self.file_locks:
                self.file_locks[file_path] = threading.Lock()

        lock = self.file_locks[file_path]
        return lock.acquire(timeout=timeout)

    def release_file_lock(self, file_path: str):
        """Release file lock."""

        if file_path in self.file_locks:
            self.file_locks[file_path].release()

    def resolve_frontmatter_conflict(
        self,
        original: Dict[str, Any],
        changes_a: Dict[str, Any],
        changes_b: Dict[str, Any],
        strategy: ConflictStrategy = ConflictStrategy.MERGE
    ) -> Dict[str, Any]:
        """Resolve conflicts in frontmatter updates."""

        if strategy == ConflictStrategy.LAST_WRITE_WINS:
            # Use most recent change
            return changes_b if changes_b.get('_timestamp', 0) > changes_a.get('_timestamp', 0) else changes_a

        elif strategy == ConflictStrategy.MERGE:
            # Intelligent merge
            result = original.copy()

            for key in set(changes_a.keys()) | set(changes_b.keys()):
                val_a = changes_a.get(key)
                val_b = changes_b.get(key)

                if val_a is None:
                    result[key] = val_b
                elif val_b is None:
                    result[key] = val_a
                elif val_a == val_b:
                    result[key] = val_a
                else:
                    # Field-specific merge logic
                    if key == 'tags':
                        result[key] = self._merge_tags(val_a, val_b)
                    elif key == 'links':
                        result[key] = self._merge_links(val_a, val_b)
                    else:
                        # Default: last write wins for scalar values
                        result[key] = val_b

            return result

        elif strategy == ConflictStrategy.UNION:
            # Union of all changes
            result = original.copy()
            result.update(changes_a)
            result.update(changes_b)
            return result

        elif strategy == ConflictStrategy.ABORT:
            raise ConflictError("Concurrent modification detected")

        else:
            raise ValueError(f"Unknown strategy: {strategy}")

    def _merge_tags(self, tags_a: List[str], tags_b: List[str]) -> List[str]:
        """Merge tag lists (union, preserve order)."""

        seen = set()
        merged = []

        for tag in tags_a + tags_b:
            if tag not in seen:
                seen.add(tag)
                merged.append(tag)

        return merged

    def _merge_links(self, links_a: List[str], links_b: List[str]) -> List[str]:
        """Merge wikilink lists (union, deduplicate)."""

        return list(set(links_a + links_b))


class ConflictError(Exception):
    """Raised when conflict cannot be resolved."""
    pass
```

---

## 4. Rule Versioning & Migration

### Versioning Strategy

**Semantic Versioning for Rules**:
- **Major** (1.0.0 → 2.0.0): Breaking changes (config format, behavior)
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes, no config changes

**Migration System**:

```python
# agents/rule_migrator.py

from typing import Dict, Any, List
from packaging import version
import logging

class RuleMigrator:
    """Handle rule configuration migrations across versions."""

    def __init__(self):
        self.migrations: Dict[str, List[callable]] = {}
        self.logger = logging.getLogger('rule_migrator')

    def register_migration(
        self,
        rule_id: str,
        from_version: str,
        to_version: str,
        migration_func: callable
    ):
        """Register migration function."""

        key = f"{rule_id}:{from_version}→{to_version}"

        if rule_id not in self.migrations:
            self.migrations[rule_id] = []

        self.migrations[rule_id].append({
            'from': from_version,
            'to': to_version,
            'func': migration_func
        })

    def migrate_config(
        self,
        rule_id: str,
        config: Dict[str, Any],
        target_version: str
    ) -> Dict[str, Any]:
        """Migrate configuration to target version."""

        current_version = config.get('version', '0.0.0')

        if version.parse(current_version) >= version.parse(target_version):
            return config  # Already at target version or newer

        # Find migration path
        migrations = self._find_migration_path(
            rule_id,
            current_version,
            target_version
        )

        # Apply migrations sequentially
        migrated_config = config.copy()

        for migration in migrations:
            self.logger.info(
                f"Migrating {rule_id}: {migration['from']} → {migration['to']}"
            )

            try:
                migrated_config = migration['func'](migrated_config)
                migrated_config['version'] = migration['to']
            except Exception as e:
                self.logger.error(f"Migration failed: {e}")
                raise MigrationError(f"Failed to migrate {rule_id}: {e}")

        return migrated_config

    def _find_migration_path(
        self,
        rule_id: str,
        from_version: str,
        to_version: str
    ) -> List[Dict[str, Any]]:
        """Find migration path from current to target version."""

        if rule_id not in self.migrations:
            return []

        # Simple linear path (for complex graphs, use Dijkstra's algorithm)
        migrations = sorted(
            self.migrations[rule_id],
            key=lambda m: version.parse(m['from'])
        )

        path = []
        current = from_version

        for migration in migrations:
            if version.parse(migration['from']) >= version.parse(current):
                if version.parse(migration['to']) <= version.parse(to_version):
                    path.append(migration)
                    current = migration['to']

        return path


# Example migration
def migrate_auto_linking_v1_to_v2(config: Dict[str, Any]) -> Dict[str, Any]:
    """Migrate auto_linking rule from v1.0.0 to v2.0.0."""

    # v2.0.0 renamed 'min_score' to 'min_confidence'
    if 'parameters' in config and 'min_score' in config['parameters']:
        config['parameters']['min_confidence'] = config['parameters'].pop('min_score')

    # v2.0.0 added 'create_bidirectional' action
    if 'actions' in config:
        config['actions'].setdefault('create_bidirectional', {
            'enabled': True,
            'add_to_related_section': True
        })

    return config

# Register migration
migrator = RuleMigrator()
migrator.register_migration(
    rule_id='auto_linking',
    from_version='1.0.0',
    to_version='2.0.0',
    migration_func=migrate_auto_linking_v1_to_v2
)


class MigrationError(Exception):
    """Raised when migration fails."""
    pass
```

---

## 5. Performance Bottleneck Identification

### Rule Performance Profiling

```python
# agents/rule_profiler.py

import cProfile
import pstats
import io
from typing import Dict, Any, List
from contextlib import contextmanager
import time

class RuleProfiler:
    """Profile rule execution performance."""

    def __init__(self):
        self.profiling_data: Dict[str, List[Dict[str, Any]]] = {}

    @contextmanager
    def profile_rule(self, rule_id: str):
        """Context manager for profiling rule execution."""

        profiler = cProfile.Profile()
        start_time = time.time()

        profiler.enable()

        try:
            yield
        finally:
            profiler.disable()
            duration = time.time() - start_time

            # Capture stats
            stream = io.StringIO()
            stats = pstats.Stats(profiler, stream=stream)
            stats.sort_stats('cumulative')
            stats.print_stats(20)  # Top 20 functions

            # Store profiling data
            if rule_id not in self.profiling_data:
                self.profiling_data[rule_id] = []

            self.profiling_data[rule_id].append({
                'timestamp': time.time(),
                'duration': duration,
                'stats': stream.getvalue()
            })

    def identify_bottlenecks(self, rule_id: str) -> Dict[str, Any]:
        """Identify performance bottlenecks in rule."""

        if rule_id not in self.profiling_data:
            return {}

        data = self.profiling_data[rule_id]

        # Calculate statistics
        durations = [d['duration'] for d in data]

        return {
            'rule_id': rule_id,
            'executions': len(durations),
            'avg_duration': sum(durations) / len(durations),
            'min_duration': min(durations),
            'max_duration': max(durations),
            'p95_duration': sorted(durations)[int(len(durations) * 0.95)],
            'latest_stats': data[-1]['stats'] if data else None
        }

    def generate_report(self) -> str:
        """Generate performance report for all rules."""

        report = "# Rule Performance Report\n\n"

        for rule_id in self.profiling_data:
            bottlenecks = self.identify_bottlenecks(rule_id)

            report += f"## {rule_id}\n\n"
            report += f"- Executions: {bottlenecks['executions']}\n"
            report += f"- Avg Duration: {bottlenecks['avg_duration']:.2f}s\n"
            report += f"- P95 Duration: {bottlenecks['p95_duration']:.2f}s\n"
            report += f"- Max Duration: {bottlenecks['max_duration']:.2f}s\n\n"

        return report


# Usage in rule execution
profiler = RuleProfiler()

with profiler.profile_rule('auto_linking'):
    rule.execute(context)

# Identify bottlenecks
bottlenecks = profiler.identify_bottlenecks('auto_linking')
print(bottlenecks)
```

### Common Bottlenecks & Solutions

| Bottleneck | Cause | Solution |
|------------|-------|----------|
| **Slow keyword extraction** | Complex regex, large content | Use spaCy, cache results |
| **Excessive API calls** | No caching, repeated reads | Implement shadow cache |
| **Large file I/O** | Reading entire files | Stream processing, pagination |
| **Serialization overhead** | JSON encode/decode | Use MessagePack, protocol buffers |
| **Database queries** | No indexes, N+1 queries | Add indexes, batch queries |

---

# Day 11: Properties & Visualization Analysis

## 1. Property Schema Design

### Schema Architecture

**Recommended: Multi-Layer Schema Validation**

```python
# utils/property_schema.py

from typing import Dict, Any, List, Optional, Union
from enum import Enum
from datetime import datetime, date
from pydantic import BaseModel, Field, validator
import yaml

class NodeType(str, Enum):
    """Valid node types."""
    CONCEPT = "concept"
    PLATFORM = "platform"
    TECHNICAL = "technical"
    FEATURE = "feature"
    DECISION = "decision"
    WORKFLOW = "workflow"
    QUESTION = "question"
    PLANNING = "planning"

class NodeStatus(str, Enum):
    """Valid node statuses."""
    ACTIVE = "active"
    DRAFT = "draft"
    PLANNED = "planned"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    DEFERRED = "deferred"
    DEPRECATED = "deprecated"

class Priority(str, Enum):
    """Valid priority levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

# Base schema for all nodes
class BaseNodeProperties(BaseModel):
    """Base properties required for all nodes."""

    type: NodeType
    created_date: date
    tags: List[str] = Field(min_items=2, max_items=20)
    icon: Optional[str] = None
    cssclasses: List[str] = Field(default_factory=list)

    @validator('tags')
    def validate_tags(cls, v):
        """Ensure tags follow naming conventions."""
        for tag in v:
            if not tag.islower() or ' ' in tag:
                raise ValueError(f"Invalid tag format: {tag}. Use lowercase with hyphens.")
        return v

    @validator('icon')
    def validate_icon(cls, v):
        """Ensure icon exists in Lucide set."""
        if v:
            # In production, validate against Lucide icon list
            if len(v) > 50:
                raise ValueError(f"Invalid icon name: {v}")
        return v

# Type-specific schemas
class ConceptProperties(BaseNodeProperties):
    """Properties for concept nodes."""

    concept_id: str = Field(regex=r'^C-\d{3}$')
    concept_name: str
    status: NodeStatus = NodeStatus.ACTIVE
    category: str

    class Config:
        schema_extra = {
            "example": {
                "type": "concept",
                "concept_id": "C-001",
                "concept_name": "Knowledge Graph",
                "status": "active",
                "category": "core-concept",
                "created_date": "2025-10-20",
                "tags": ["concept", "knowledge-graph", "core"],
                "icon": "network",
                "cssclasses": ["concept", "core"]
            }
        }

class DecisionProperties(BaseNodeProperties):
    """Properties for decision nodes."""

    decision_id: str = Field(regex=r'^(ED|TS|FP|BM|OP)-\d{3}$')
    decision_type: str = Field(regex=r'^(executive|technical|feature|business|operational)$')
    title: str
    status: str = Field(regex=r'^(open|researching|decided|deferred)$')
    priority: Priority
    decided_date: Optional[date] = None
    selected_option: Optional[str] = None

    @validator('decided_date')
    def validate_decided_date(cls, v, values):
        """Ensure decided_date is set when status is 'decided'."""
        if values.get('status') == 'decided' and not v:
            raise ValueError("decided_date required when status is 'decided'")
        return v

class FeatureProperties(BaseNodeProperties):
    """Properties for feature nodes."""

    feature_id: str = Field(regex=r'^F-\d{3}$')
    feature_name: str
    category: str
    status: str = Field(regex=r'^(planned|in-progress|completed|deferred)$')
    priority: Priority
    release: str = Field(regex=r'^(mvp|v1-1|v2-0)$')
    complexity: str = Field(regex=r'^(simple|moderate|complex|very-complex)$')

# Schema factory
class PropertySchemaFactory:
    """Factory for creating type-specific property validators."""

    SCHEMAS = {
        NodeType.CONCEPT: ConceptProperties,
        NodeType.DECISION: DecisionProperties,
        NodeType.FEATURE: FeatureProperties,
        # ... add other types
    }

    @staticmethod
    def get_schema(node_type: NodeType) -> BaseModel:
        """Get validator for node type."""
        return PropertySchemaFactory.SCHEMAS.get(node_type, BaseNodeProperties)

    @staticmethod
    def validate_properties(
        node_type: str,
        properties: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate properties against schema."""

        node_type_enum = NodeType(node_type)
        schema_class = PropertySchemaFactory.get_schema(node_type_enum)

        try:
            validated = schema_class(**properties)
            return validated.dict(exclude_none=True)
        except Exception as e:
            raise ValueError(f"Property validation failed: {e}")

    @staticmethod
    def generate_default_properties(node_type: str) -> Dict[str, Any]:
        """Generate default properties for node type."""

        schema_class = PropertySchemaFactory.get_schema(NodeType(node_type))

        # Get field defaults from schema
        defaults = {}
        for field_name, field in schema_class.__fields__.items():
            if field.default is not None:
                defaults[field_name] = field.default
            elif field.default_factory:
                defaults[field_name] = field.default_factory()

        # Add required computed defaults
        defaults['created_date'] = datetime.now().date().isoformat()
        defaults['tags'] = [node_type, 'auto-generated']

        return defaults
```

**Property Transformation Pipeline**:

```python
# utils/property_transformer.py

from typing import Dict, Any
import yaml

class PropertyTransformer:
    """Transform properties between formats."""

    @staticmethod
    def frontmatter_to_properties(frontmatter_text: str) -> Dict[str, Any]:
        """Parse YAML frontmatter to property dict."""

        if not frontmatter_text.startswith('---'):
            raise ValueError("Invalid frontmatter format")

        # Extract YAML between --- delimiters
        parts = frontmatter_text.split('---')
        if len(parts) < 3:
            raise ValueError("Malformed frontmatter")

        yaml_str = parts[1]

        try:
            properties = yaml.safe_load(yaml_str)
            return properties or {}
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML: {e}")

    @staticmethod
    def properties_to_frontmatter(properties: Dict[str, Any]) -> str:
        """Convert properties dict to YAML frontmatter."""

        yaml_str = yaml.dump(
            properties,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False
        )

        return f"---\n{yaml_str}---\n"

    @staticmethod
    def migrate_legacy_properties(old_properties: Dict[str, Any]) -> Dict[str, Any]:
        """Migrate old property formats to new standard."""

        new_properties = old_properties.copy()

        # Rename fields
        field_mappings = {
            'id': 'concept_id',  # Old 'id' → new type-specific ID
            'name': 'concept_name',
            'created': 'created_date',
            'modified': 'updated_date'
        }

        for old_field, new_field in field_mappings.items():
            if old_field in new_properties:
                new_properties[new_field] = new_properties.pop(old_field)

        # Add missing required fields
        if 'icon' not in new_properties:
            # Infer icon from type
            type_icons = {
                'concept': 'lightbulb',
                'technical': 'code',
                'feature': 'zap',
                'decision': 'help-circle'
            }
            new_properties['icon'] = type_icons.get(new_properties.get('type'))

        return new_properties
```

---

## 2. Visualization Library Options

### Library Comparison

| Library | Pros | Cons | Use Case | Recommendation |
|---------|------|------|----------|----------------|
| **D3.js** | Maximum flexibility, powerful, mature | Steep learning curve, verbose | Complex custom visualizations | ⭐ For advanced visualizations |
| **Chart.js** | Simple API, good defaults, responsive | Limited customization | Standard charts (bar, line, pie) | For simple charts |
| **Cytoscape.js** | Graph-specific, network analysis | Learning curve | Network/graph visualization | ⭐ **RECOMMENDED** for knowledge graph |
| **vis.js** | Network visualization, timeline | Large bundle size | Interactive networks | Alternative to Cytoscape |
| **Mermaid** | Markdown-native, simple syntax | Limited interactivity | Static diagrams | ⭐ Already in use (Mehrmaid plugin) |
| **React Flow** | Node-based UIs, drag-and-drop | React dependency | Interactive node editors | Future web version |

### Recommended: Hybrid Approach

**Strategy**:
1. **Mermaid (Mehrmaid plugin)**: Static visualizations embedded in notes
2. **Cytoscape.js**: Interactive knowledge graph exploration (future custom plugin)
3. **Chart.js**: Simple metrics dashboards

**Mermaid Implementation** (Already Available):

```markdown
# Decision Tree Visualization

```mehrmaid
graph TD
    Start[Start New Project] --> Q1{Use Obsidian?}
    Q1 -->|Yes| Obsidian[Obsidian-First]
    Q1 -->|No| Custom[Custom Solution]

    Obsidian --> Q2{Need Web Access?}
    Q2 -->|Yes| Hybrid[Hybrid: Obsidian + Web]
    Q2 -->|No| ObsidianOnly[Obsidian Only]

    Custom --> Q3{Need Collaboration?}
    Q3 -->|Yes| SaaS[SaaS Platform]
    Q3 -->|No| Local[Local Application]

    style Obsidian fill:#90EE90
    style ObsidianOnly fill:#90EE90

    click Obsidian "[[platforms/obsidian]]" "Learn more"
    click Custom "[[platforms/custom-solution]]" "Learn more"
```
```

**Benefits**:
- **Mermaid**: Zero setup (plugin already installed), markdown-native, clickable wikilinks
- **Cytoscape**: Production-grade graph visualization for complex analysis
- **Chart.js**: Quick metrics without heavyweight library

**Visualization Generation Script**:

```python
# scripts/generate_visualizations.py

from typing import Dict, Any, List
from pathlib import Path

class VisualizationGenerator:
    """Generate Mermaid diagrams from knowledge graph data."""

    def __init__(self, shadow_cache):
        self.cache = shadow_cache

    def generate_decision_tree(self) -> str:
        """Generate decision tree diagram."""

        # Query all decision nodes
        decisions = self.cache.query_by_type('decision')

        # Build mermaid graph
        mermaid = "```mehrmaid\ngraph TD\n"

        for decision in decisions:
            decision_id = decision['decision_id']
            title = decision['title']
            status = decision['status']

            # Add node
            style = self._get_status_style(status)
            mermaid += f"    {decision_id}[\"{title}\"]\n"

            # Add connections (blocked_by relationships)
            if 'blocked_by' in decision:
                for blocker in decision['blocked_by']:
                    mermaid += f"    {blocker} --> {decision_id}\n"

            # Apply style
            mermaid += f"    style {decision_id} {style}\n"

        mermaid += "```\n"
        return mermaid

    def generate_feature_dependency_graph(self) -> str:
        """Generate feature dependency graph."""

        features = self.cache.query_by_type('feature')

        mermaid = "```mehrmaid\ngraph LR\n"

        for feature in features:
            feature_id = feature['feature_id']
            feature_name = feature['feature_name']

            # Add node with link
            mermaid += f"    {feature_id}[\"{feature_name}\"]\n"
            mermaid += f"    click {feature_id} \"[[features/{feature['file_path']}]]\"\n"

            # Add dependencies
            if 'depends_on' in feature:
                for dep in feature['depends_on']:
                    mermaid += f"    {dep} --> {feature_id}\n"

        mermaid += "```\n"
        return mermaid

    def generate_architecture_layers(self) -> str:
        """Generate architecture layer diagram."""

        mermaid = """```mehrmaid
graph TB
    subgraph "Frontend Layer"
        Obsidian[Obsidian Desktop]
        Plugins[Community Plugins]
    end

    subgraph "API Layer"
        MCP[Python MCP Server]
        RestAPI[Obsidian REST API]
    end

    subgraph "Data Layer"
        Markdown[Markdown Files]
        Git[Git Repository]
        SQLite[SQLite Shadow Cache]
    end

    subgraph "AI Layer"
        ClaudeFlow[Claude-Flow]
        AgentRules[Agent Rules]
    end

    Obsidian --> Plugins
    Plugins --> RestAPI
    RestAPI --> MCP
    MCP --> Markdown
    MCP --> SQLite
    Markdown --> Git
    MCP --> ClaudeFlow
    ClaudeFlow --> AgentRules
    AgentRules --> MCP

    click Obsidian "[[platforms/obsidian]]"
    click MCP "[[architecture/api-layer]]"
    click ClaudeFlow "[[mcp/claude-flow-tight-coupling]]"
```\n"
        return mermaid

    def generate_phase_timeline(self) -> str:
        """Generate project phase timeline."""

        phases = self.cache.query_by_folder('_planning/phases')

        mermaid = "```mehrmaid\ngantt\n    title Weave-NN Development Timeline\n    dateFormat YYYY-MM-DD\n\n"

        for phase in sorted(phases, key=lambda p: p['phase_id']):
            phase_name = phase['phase_name']
            start = phase.get('start_date', '2025-10-20')
            end = phase.get('end_date', '2025-10-27')
            status = phase.get('status', 'pending')

            done_marker = " :done," if status == 'completed' else " :active," if status == 'in-progress' else " :,"

            mermaid += f"    {phase_name}{done_marker} {start}, {end}\n"

        mermaid += "```\n"
        return mermaid

    def _get_status_style(self, status: str) -> str:
        """Get Mermaid style for status."""

        styles = {
            'decided': 'fill:#90EE90',
            'open': 'fill:#FFD700',
            'deferred': 'fill:#D3D3D3',
            'researching': 'fill:#87CEEB'
        }

        return styles.get(status, '')

    def generate_all_visualizations(self, output_dir: Path):
        """Generate all visualizations and save to files."""

        visualizations = {
            'decision-tree.md': self.generate_decision_tree(),
            'feature-dependencies.md': self.generate_feature_dependency_graph(),
            'architecture-layers.md': self.generate_architecture_layers(),
            'phase-timeline.md': self.generate_phase_timeline()
        }

        output_dir.mkdir(parents=True, exist_ok=True)

        for filename, content in visualizations.items():
            file_path = output_dir / filename
            with open(file_path, 'w') as f:
                f.write(f"# {filename.replace('-', ' ').replace('.md', '').title()}\n\n")
                f.write(content)

            print(f"Generated: {file_path}")


# Usage
from utils.shadow_cache import ShadowCache

cache = ShadowCache()
generator = VisualizationGenerator(cache)
generator.generate_all_visualizations(Path('docs/visualizations'))
```

---

## 3. Data Transformation Pipelines

### Pipeline Architecture

```python
# utils/data_pipeline.py

from typing import Dict, Any, List, Callable
from abc import ABC, abstractmethod
import logging

class PipelineStage(ABC):
    """Base class for pipeline stages."""

    @abstractmethod
    def process(self, data: Any) -> Any:
        """Process data through this stage."""
        pass

class ExtractStage(PipelineStage):
    """Extract data from source."""

    def __init__(self, shadow_cache):
        self.cache = shadow_cache

    def process(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract nodes matching query."""

        if 'type' in query:
            return self.cache.query_by_type(query['type'])
        elif 'tags' in query:
            return self.cache.query_by_tags(query['tags'])
        elif 'folder' in query:
            return self.cache.query_by_folder(query['folder'])
        else:
            return self.cache.query_all()

class TransformStage(PipelineStage):
    """Transform data to visualization format."""

    def __init__(self, transformations: List[Callable]):
        self.transformations = transformations

    def process(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply transformations to data."""

        transformed = data

        for transform_func in self.transformations:
            transformed = [transform_func(item) for item in transformed]

        return transformed

class AggregateStage(PipelineStage):
    """Aggregate data for summaries."""

    def process(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate data into summary."""

        # Group by status
        by_status = {}
        for item in data:
            status = item.get('status', 'unknown')
            if status not in by_status:
                by_status[status] = []
            by_status[status].append(item)

        # Calculate metrics
        total = len(data)

        return {
            'total': total,
            'by_status': {
                status: len(items)
                for status, items in by_status.items()
            },
            'completion_rate': len(by_status.get('completed', [])) / total if total > 0 else 0
        }

class RenderStage(PipelineStage):
    """Render data to output format."""

    def __init__(self, renderer: Callable):
        self.renderer = renderer

    def process(self, data: Any) -> str:
        """Render data to string output."""
        return self.renderer(data)

class DataPipeline:
    """Composable data processing pipeline."""

    def __init__(self, stages: List[PipelineStage]):
        self.stages = stages
        self.logger = logging.getLogger('data_pipeline')

    def execute(self, input_data: Any) -> Any:
        """Execute pipeline stages sequentially."""

        data = input_data

        for i, stage in enumerate(self.stages):
            stage_name = stage.__class__.__name__
            self.logger.debug(f"Executing stage {i+1}/{len(self.stages)}: {stage_name}")

            try:
                data = stage.process(data)
            except Exception as e:
                self.logger.error(f"Stage {stage_name} failed: {e}")
                raise PipelineError(f"Pipeline failed at stage {stage_name}: {e}")

        return data


# Example pipeline: Feature dashboard
def create_feature_dashboard_pipeline(shadow_cache):
    """Create pipeline for feature dashboard."""

    # Define transformations
    def extract_key_fields(feature: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': feature['feature_id'],
            'name': feature['feature_name'],
            'status': feature['status'],
            'priority': feature['priority'],
            'release': feature['release']
        }

    def add_progress_score(feature: Dict[str, Any]) -> Dict[str, Any]:
        status_scores = {
            'completed': 100,
            'in-progress': 50,
            'planned': 0,
            'deferred': 0
        }
        feature['progress'] = status_scores.get(feature['status'], 0)
        return feature

    # Render function
    def render_markdown(data: Dict[str, Any]) -> str:
        md = "# Feature Dashboard\n\n"
        md += f"**Total Features**: {data['total']}\n\n"

        md += "## By Status\n\n"
        for status, count in data['by_status'].items():
            md += f"- {status.title()}: {count}\n"

        md += f"\n**Completion Rate**: {data['completion_rate']:.1%}\n"

        return md

    # Build pipeline
    pipeline = DataPipeline([
        ExtractStage(shadow_cache),
        TransformStage([extract_key_fields, add_progress_score]),
        AggregateStage(),
        RenderStage(render_markdown)
    ])

    return pipeline


class PipelineError(Exception):
    """Raised when pipeline execution fails."""
    pass
```

---

## 4. State Management for Interactive Visualizations

### Recommended: Lightweight State Machine

```python
# utils/visualization_state.py

from typing import Dict, Any, List, Optional, Callable
from enum import Enum
from dataclasses import dataclass, field
import json

class ViewMode(Enum):
    """Visualization view modes."""
    GRAPH = "graph"
    LIST = "list"
    TIMELINE = "timeline"
    TREE = "tree"

class FilterOperator(Enum):
    """Filter operators."""
    EQUALS = "equals"
    CONTAINS = "contains"
    IN = "in"
    GREATER_THAN = "gt"
    LESS_THAN = "lt"

@dataclass
class VisualizationFilter:
    """Filter configuration."""
    field: str
    operator: FilterOperator
    value: Any

@dataclass
class VisualizationState:
    """State for interactive visualization."""

    # View configuration
    view_mode: ViewMode = ViewMode.GRAPH
    zoom_level: float = 1.0
    pan_offset: Dict[str, float] = field(default_factory=lambda: {'x': 0, 'y': 0})

    # Data filtering
    filters: List[VisualizationFilter] = field(default_factory=list)
    search_query: Optional[str] = None

    # Selection
    selected_nodes: List[str] = field(default_factory=list)
    focused_node: Optional[str] = None

    # Display options
    show_labels: bool = True
    show_icons: bool = True
    color_by: str = "type"  # or "status", "priority"

    # Layout
    layout_algorithm: str = "force-directed"  # or "hierarchical", "circular"

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state to dict."""
        return {
            'view_mode': self.view_mode.value,
            'zoom_level': self.zoom_level,
            'pan_offset': self.pan_offset,
            'filters': [
                {
                    'field': f.field,
                    'operator': f.operator.value,
                    'value': f.value
                }
                for f in self.filters
            ],
            'search_query': self.search_query,
            'selected_nodes': self.selected_nodes,
            'focused_node': self.focused_node,
            'show_labels': self.show_labels,
            'show_icons': self.show_icons,
            'color_by': self.color_by,
            'layout_algorithm': self.layout_algorithm
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'VisualizationState':
        """Deserialize state from dict."""
        filters = [
            VisualizationFilter(
                field=f['field'],
                operator=FilterOperator(f['operator']),
                value=f['value']
            )
            for f in data.get('filters', [])
        ]

        return cls(
            view_mode=ViewMode(data.get('view_mode', 'graph')),
            zoom_level=data.get('zoom_level', 1.0),
            pan_offset=data.get('pan_offset', {'x': 0, 'y': 0}),
            filters=filters,
            search_query=data.get('search_query'),
            selected_nodes=data.get('selected_nodes', []),
            focused_node=data.get('focused_node'),
            show_labels=data.get('show_labels', True),
            show_icons=data.get('show_icons', True),
            color_by=data.get('color_by', 'type'),
            layout_algorithm=data.get('layout_algorithm', 'force-directed')
        )

class StateManager:
    """Manage visualization state with persistence."""

    def __init__(self, state_file: str = ".obsidian/plugins/weave-nn/viz-state.json"):
        self.state_file = state_file
        self.state = self.load_state()
        self.listeners: List[Callable] = []

    def load_state(self) -> VisualizationState:
        """Load state from disk."""
        try:
            with open(self.state_file, 'r') as f:
                data = json.load(f)
                return VisualizationState.from_dict(data)
        except FileNotFoundError:
            return VisualizationState()

    def save_state(self):
        """Persist state to disk."""
        with open(self.state_file, 'w') as f:
            json.dump(self.state.to_dict(), f, indent=2)

    def update_state(self, **updates):
        """Update state and notify listeners."""
        for key, value in updates.items():
            if hasattr(self.state, key):
                setattr(self.state, key, value)

        self.save_state()
        self._notify_listeners()

    def add_filter(self, filter: VisualizationFilter):
        """Add filter to state."""
        self.state.filters.append(filter)
        self.save_state()
        self._notify_listeners()

    def remove_filter(self, field: str):
        """Remove filter by field name."""
        self.state.filters = [f for f in self.state.filters if f.field != field]
        self.save_state()
        self._notify_listeners()

    def clear_filters(self):
        """Clear all filters."""
        self.state.filters = []
        self.save_state()
        self._notify_listeners()

    def register_listener(self, callback: Callable):
        """Register state change listener."""
        self.listeners.append(callback)

    def _notify_listeners(self):
        """Notify all listeners of state change."""
        for listener in self.listeners:
            try:
                listener(self.state)
            except Exception as e:
                logging.error(f"Listener callback failed: {e}")
```

---

## 5. Accessibility & Responsiveness

### WCAG 2.1 AA Compliance

```python
# utils/accessibility.py

from typing import Dict, Any

class AccessibilityEnhancer:
    """Enhance visualizations for accessibility."""

    @staticmethod
    def add_aria_labels(node_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add ARIA labels to nodes."""

        node_type = node_data.get('type', 'node')
        node_id = node_data.get('id', 'unknown')
        node_name = node_data.get('name', 'Untitled')
        status = node_data.get('status', '')

        node_data['aria-label'] = f"{node_type} {node_name}, status: {status}"
        node_data['aria-describedby'] = f"{node_id}-description"
        node_data['role'] = "treeitem" if node_type == "decision" else "listitem"

        return node_data

    @staticmethod
    def ensure_color_contrast(
        background_color: str,
        text_color: str,
        min_ratio: float = 4.5  # WCAG AA standard
    ) -> bool:
        """Check color contrast ratio."""

        # Calculate relative luminance (simplified)
        def luminance(color: str) -> float:
            # Assume hex color #RRGGBB
            r, g, b = [int(color[i:i+2], 16) / 255.0 for i in (1, 3, 5)]

            # sRGB to linear
            def to_linear(c):
                return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

            r, g, b = map(to_linear, [r, g, b])

            return 0.2126 * r + 0.7152 * g + 0.0722 * b

        l1 = luminance(background_color)
        l2 = luminance(text_color)

        # Ensure l1 is lighter
        if l1 < l2:
            l1, l2 = l2, l1

        contrast_ratio = (l1 + 0.05) / (l2 + 0.05)

        return contrast_ratio >= min_ratio

    @staticmethod
    def add_keyboard_navigation(node_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add keyboard navigation attributes."""

        node_data['tabindex'] = 0
        node_data['keyboard-shortcuts'] = {
            'Enter': 'open_node',
            'Space': 'select_node',
            'ArrowUp': 'focus_previous',
            'ArrowDown': 'focus_next',
            'Escape': 'deselect_all'
        }

        return node_data

    @staticmethod
    def generate_text_alternative(visualization_type: str, data: Dict[str, Any]) -> str:
        """Generate text alternative for visualization."""

        if visualization_type == "decision_tree":
            return AccessibilityEnhancer._decision_tree_text(data)
        elif visualization_type == "feature_graph":
            return AccessibilityEnhancer._feature_graph_text(data)
        else:
            return "Visualization not available in text format"

    @staticmethod
    def _decision_tree_text(data: Dict[str, Any]) -> str:
        """Generate text description of decision tree."""

        decisions = data.get('decisions', [])

        text = "Decision Tree:\n\n"

        for decision in decisions:
            status = decision.get('status', 'unknown')
            title = decision.get('title', 'Untitled')
            blocked_by = decision.get('blocked_by', [])

            text += f"- {title} (Status: {status})\n"

            if blocked_by:
                text += f"  Blocked by: {', '.join(blocked_by)}\n"

        return text
```

### Responsive Design

```css
/* CSS for responsive visualizations */

/* Mobile first approach */
.visualization-container {
    width: 100%;
    height: 400px;
    position: relative;
    overflow: hidden;
}

/* Tablet (768px and up) */
@media (min-width: 768px) {
    .visualization-container {
        height: 600px;
    }
}

/* Desktop (1024px and up) */
@media (min-width: 1024px) {
    .visualization-container {
        height: 800px;
    }
}

/* High-resolution displays */
@media (min-resolution: 2dppx) {
    .node-icon {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .visualization-container {
        background-color: #1e1e1e;
        color: #ffffff;
    }

    .node {
        border-color: #444;
    }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

# Cross-Task Integration Points

## Integration Dependencies

```mermaid
graph LR
    Day2[Day 2: REST API Client] --> Day4[Day 4: Agent Rules]
    Day2 --> Day11[Day 11: Properties & Viz]
    Day4 --> Day11

    Day2 --> ShadowCache[Shadow Cache]
    Day4 --> ShadowCache
    Day11 --> ShadowCache

    ShadowCache --> Viz[Visualizations]

    style Day2 fill:#90EE90
    style Day4 fill:#87CEEB
    style Day11 fill:#FFD700
```

### Integration Flow

1. **Day 2 → Day 4**: REST API client provides interface for agent rules to read/write notes
2. **Day 2 → Shadow Cache**: API client populates shadow cache on file changes
3. **Shadow Cache → Day 4**: Agent rules query cache for pattern matching and suggestions
4. **Day 4 → Day 11**: Agent rules update properties and trigger visualization regeneration
5. **Shadow Cache → Day 11**: Visualization queries cache for graph data

### Shared Components

```python
# Shared singleton instances

# REST API Client (Day 2)
from utils.obsidian_client import ObsidianRESTClient
from config import Config

config = Config()
obsidian_client = ObsidianRESTClient(
    api_url=config.OBSIDIAN_API_URL,
    api_key=config.OBSIDIAN_API_KEY
)

# Shadow Cache (shared by Day 2, 4, 11)
from utils.shadow_cache import ShadowCache

shadow_cache = ShadowCache(db_path=".obsidian/plugins/weave-nn/cache.db")

# Rule Engine (Day 4)
from agents.rule_engine import RuleEngine
from agents.rules import *

rule_engine = RuleEngine()
rule_engine.register_rule(MemorySyncRule(obsidian_client, shadow_cache))
rule_engine.register_rule(AutoLinkingRule(obsidian_client, shadow_cache))
rule_engine.register_rule(AutoTaggingRule(obsidian_client, shadow_cache))
# ... register all 6 rules

# Visualization Generator (Day 11)
from scripts.generate_visualizations import VisualizationGenerator

viz_generator = VisualizationGenerator(shadow_cache)

# Property Validator (Day 11)
from utils.property_schema import PropertySchemaFactory

property_validator = PropertySchemaFactory()
```

### Event Flow

```python
# Complete event flow across all three days

# 1. User creates/modifies note in Obsidian
# 2. Obsidian REST API webhook triggers
# 3. Day 2: File watcher detects change, publishes RabbitMQ event
# 4. Day 2: MCP Sync consumer updates shadow cache
# 5. Day 4: Agent rule engine processes event
# 6. Day 4: Rules execute (validation, linking, tagging)
# 7. Day 11: Property validator ensures schema compliance
# 8. Day 11: Visualization regenerated if needed
# 9. Day 4: Memory sync updates Claude-Flow

def handle_file_modified_event(event_data: Dict[str, Any]):
    """Complete event handling pipeline."""

    file_path = event_data['file_path']

    # Day 2: Read note via REST API
    note = obsidian_client.read_note(file_path)

    # Day 2: Update shadow cache
    shadow_cache.upsert_node(
        file_path=file_path,
        content=note['content'],
        frontmatter=note['frontmatter']
    )

    # Day 11: Validate properties
    validated_properties = property_validator.validate_properties(
        node_type=note['frontmatter']['type'],
        properties=note['frontmatter']
    )

    # Day 4: Execute agent rules
    rule_context = RuleContext(
        event_type='file_modified',
        file_path=file_path,
        frontmatter=validated_properties,
        content=note['content'],
        metadata=event_data
    )

    results = rule_engine.process_event('file_modified', **rule_context.__dict__)

    # Day 11: Regenerate visualizations if properties changed
    if any(r.rule_id in ['schema_validation', 'auto_tagging'] for r in results):
        viz_generator.generate_all_visualizations(Path('docs/visualizations'))

    logging.info(f"Processed file modified event: {file_path}")
```

---

# Recommended Implementation Sequence

## Week 1: Core Infrastructure

### Day 2 (Tuesday) - REST API Client
**Priority**: CRITICAL
**Duration**: 8 hours
**Deliverables**:
- [x] ObsidianRESTClient class with connection pooling
- [x] CRUD operations (create, read, update, delete, list, patch)
- [x] Error handling and retry logic
- [x] Security validation (input sanitization)
- [x] Caching strategy
- [x] Unit tests (90% coverage)

**Success Criteria**:
- All CRUD operations work against Obsidian vault
- API response time < 50ms (p95)
- Error handling covers all edge cases
- Security audit passed

**Dependencies**: None (Day 0 prerequisites completed)

---

### Day 4 (Thursday) - Agent Rules Foundation
**Priority**: CRITICAL
**Duration**: 8 hours
**Deliverables**:
- [x] Rule engine framework
- [x] 6 core agent rules implemented
- [x] YAML configuration loading
- [x] Conflict resolution
- [x] Performance profiling
- [x] Integration with shadow cache

**Success Criteria**:
- All 6 rules execute successfully
- Rule execution metrics tracked
- No conflicts in concurrent execution
- Integration tests passing

**Dependencies**: Day 2 (REST API Client), Shadow Cache (Day 3)

---

## Week 2: User Experience

### Day 11 (Thursday) - Properties & Visualization
**Priority**: HIGH
**Duration**: 8 hours
**Deliverables**:
- [x] Property schema validation
- [x] Bulk property application script
- [x] 4 Mermaid visualizations generated
- [x] CSS snippet for colors
- [x] State management for interactive views

**Success Criteria**:
- All 64+ nodes have valid properties
- 4 visualizations render correctly in Obsidian
- Graph view shows color-coded nodes
- Interactive state persisted

**Dependencies**: Day 2 (API Client), Day 4 (Agent Rules), Shadow Cache

---

## Concurrent Work Streams

### Stream A: Backend (Days 2-4)
1. REST API Client (Day 2)
2. Shadow Cache integration (Day 3)
3. Agent Rules (Day 4)
4. Testing and optimization (Day 5)

### Stream B: Frontend (Days 8-11)
1. N8N workflows (Days 8-9)
2. Task management (Day 10)
3. Properties & Visualization (Day 11)
4. Polish and documentation (Days 12-14)

### Parallelization Opportunities
- **Day 2-3**: While REST API is being built, schema design can happen in parallel
- **Day 4-5**: While agent rules are implemented, visualization templates can be created
- **Day 11**: Property application can run asynchronously while visualizations are generated

---

# Risk Assessment & Mitigation

## High-Priority Risks

### Risk 1: Obsidian REST API Performance
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Implement aggressive caching (shadow cache)
- Use connection pooling
- Batch operations where possible
- Fallback to Obsidian URI if REST API unavailable

### Risk 2: Agent Rule Conflicts
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Priority-based execution order
- File locking mechanism
- Conflict resolution strategies
- Comprehensive testing with concurrent scenarios

### Risk 3: Property Schema Changes
**Probability**: Low
**Impact**: High
**Mitigation**:
- Versioned schemas with migration system
- Backward compatibility checks
- Automated migration scripts
- Schema validation before commit

### Risk 4: Visualization Performance with Large Graphs
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Lazy loading of nodes
- Level-of-detail rendering
- Virtual scrolling for lists
- Canvas-based rendering (future optimization)

### Risk 5: Security Vulnerabilities
**Probability**: Low
**Impact**: Critical
**Mitigation**:
- Input validation on all API endpoints
- Secure API key storage (keyring)
- Audit logging
- Regular security scans
- Principle of least privilege

---

## Monitoring & Success Metrics

### Day 2 Metrics
- API response time: < 50ms (p95)
- Cache hit rate: > 80%
- Error rate: < 0.1%
- Connection pool utilization: < 70%

### Day 4 Metrics
- Rule execution time: < 100ms per rule
- Agent suggestion acceptance rate: > 60%
- Conflict rate: < 1%
- Rules triggered per file change: 2-4

### Day 11 Metrics
- Property validation pass rate: 100%
- Visualization generation time: < 5s
- Graph render time: < 2s
- User interaction latency: < 100ms

---

## Conclusion

This comprehensive analysis provides architectural guidance for three critical MVP development tasks:

1. **Day 2 (REST API Client)**: Singleton pattern with connection pooling, retry logic, and multi-layer caching provides robust foundation
2. **Day 4 (Agent Rules)**: Event-driven rule engine with YAML configuration and conflict resolution enables scalable automation
3. **Day 11 (Properties & Visualization)**: Schema validation with Mermaid/Cytoscape hybrid approach delivers rich user experience

**Key Recommendations**:
- Use **singleton pattern** for REST API client (shared connection pool)
- Implement **event-driven architecture** for agent rules (decoupled, scalable)
- Adopt **hybrid visualization strategy**: Mermaid for static, Cytoscape for interactive
- Apply **multi-layer caching** throughout (memory, Redis, SQLite shadow cache)
- Enforce **schema validation** at multiple points (config load, API call, pre-commit)
- Track **comprehensive metrics** for continuous optimization

**Integration Success Factors**:
1. All three components share shadow cache as single source of truth
2. Event-driven architecture decouples components
3. Standardized property schema ensures consistency
4. Comprehensive error handling prevents cascading failures
5. Performance metrics guide optimization efforts

**Next Steps**:
1. Review architecture with team
2. Begin Day 2 implementation (REST API Client)
3. Set up shadow cache database
4. Create rule configuration templates
5. Design property schemas for all node types

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Status**: COMPLETE
**Approval**: Pending stakeholder review
