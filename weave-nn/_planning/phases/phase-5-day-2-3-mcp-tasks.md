---
title: Phase 5 Day 2-3 - MCP Server Implementation Tasks
type: planning
category: task-breakdown
phase_id: "PHASE-5"
days: "Day 2-3"
status: "pending"
priority: "critical"
created_date: "2025-10-21"
start_date: "2025-10-23"
end_date: "2025-10-24"
duration: "2 days"
tags:
  - scope/mvp
  - type/planning
  - priority/critical
  - phase-5
  - mcp
  - fastmcp
  - python
  - development
related:
  - "[[phase-5-mvp-week-1]]"
  - "[[../research/fastmcp-research-findings]]"
  - "[[../../mcp/servers/cyanheads-obsidian-mcp-server]]"
---

# Phase 5 Day 2-3: MCP Server Implementation - Detailed Task Breakdown

**Status**: ⏳ **PENDING**
**Priority**: 🔴 **CRITICAL**
**Duration**: 2 days (Oct 23-24, 2025)
**Based On**: [[../research/fastmcp-research-findings|FastMCP Research Findings]]

---

## Overview

This document provides a comprehensive, task-by-task breakdown for implementing the Weave-NN MCP server using the FastMCP framework. Each task includes:
- Clear acceptance criteria
- Priority level
- Time estimate
- Dependencies
- Code examples
- Testing requirements

**Total Estimated Time**: 16 hours (2 days × 8 hours)

---

## Day 2: MCP Server Foundation (Oct 23, 2025)

**Goal**: Complete FastMCP setup, Obsidian REST API client, and core CRUD tools

**Daily Success Criteria**:
- ✅ FastMCP development environment operational
- ✅ Obsidian REST API client fully implemented and tested
- ✅ `create_note` and `read_note` tools working in Claude Desktop
- ✅ Test suite passing with >80% coverage

---

### Task 2.1: FastMCP Development Environment Setup

**Title**: Set up FastMCP development environment
**Active Form**: Setting up FastMCP development environment
**Due Date**: 2025-10-23 10:00 AM
**Priority**: ⏫ High
**Time Estimate**: 1.5 hours
**Tags**: #fastmcp #setup #python #development #environment

**Dependencies**: None (Day 0 prerequisites complete)

**Description**:
Create isolated Python environment, install FastMCP and dependencies, configure project structure, and validate installation.

**Acceptance Criteria**:
1. ✅ Python 3.10+ virtual environment created
2. ✅ FastMCP installed via UV package manager
3. ✅ All required dependencies installed (httpx, pydantic, pytest, etc.)
4. ✅ Project structure created following FastMCP best practices
5. ✅ `.env` file configured with Obsidian API credentials
6. ✅ `fastmcp --version` command works
7. ✅ Sample "hello world" MCP server runs successfully

**Implementation Steps**:

1. **Create Virtual Environment**:
   ```bash
   cd /path/to/weave-nn-mcp
   python3.11 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install UV Package Manager** (if not installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   # Or: pip install uv
   ```

3. **Create pyproject.toml**:
   ```toml
   [project]
   name = "weave-nn-mcp"
   version = "1.0.0"
   description = "MCP server for Weave-NN Obsidian integration"
   requires-python = ">=3.10"
   dependencies = [
       "fastmcp>=2.0.0",
       "httpx>=0.27.0",
       "pydantic>=2.0.0",
       "python-dotenv>=1.0.0",
       "pyyaml>=6.0.0",
   ]

   [project.optional-dependencies]
   dev = [
       "pytest>=8.0.0",
       "pytest-asyncio>=0.23.0",
       "pytest-cov>=4.1.0",
       "inline-snapshot>=0.10.0",
       "ruff>=0.3.0",
   ]

   [build-system]
   requires = ["hatchling"]
   build-backend = "hatchling.build"

   [tool.pytest.ini_options]
   asyncio_mode = "auto"
   testpaths = ["tests"]
   markers = [
       "integration: Integration tests (slower)",
   ]

   [tool.ruff]
   line-length = 88
   target-version = "py310"
   ```

4. **Install Dependencies**:
   ```bash
   uv pip install -e ".[dev]"
   ```

5. **Create Project Structure**:
   ```bash
   mkdir -p src/{tools,resources,clients,utils} tests/{tools,fixtures} logs
   touch src/__init__.py src/server.py
   touch src/tools/__init__.py src/clients/__init__.py src/utils/__init__.py
   touch tests/__init__.py tests/test_server.py
   ```

6. **Create .env File**:
   ```bash
   cat > .env << 'EOF'
   # Obsidian REST API Configuration
   OBSIDIAN_API_URL=https://localhost:27124
   OBSIDIAN_API_KEY=your-api-key-from-plugin

   # Logging
   LOG_LEVEL=INFO
   LOG_FILE=logs/mcp-server.log

   # Development
   ENV=development
   EOF
   ```

7. **Create Hello World Server** (`src/server.py`):
   ```python
   from fastmcp import FastMCP

   mcp = FastMCP("Weave-NN Test Server")

   @mcp.tool
   def hello(name: str) -> str:
       """Say hello to someone"""
       return f"Hello, {name}! FastMCP is working."

   if __name__ == "__main__":
       mcp.run()
   ```

8. **Test Installation**:
   ```bash
   # Check FastMCP CLI
   fastmcp --version

   # Run test server
   python src/server.py &
   SERVER_PID=$!

   # Kill test server
   kill $SERVER_PID
   ```

**Validation**:
```bash
# Run this checklist
python -c "import fastmcp; print(f'FastMCP {fastmcp.__version__}')"
python -c "import httpx, pydantic, pytest; print('All deps OK')"
ls -la src/ tests/  # Verify structure
cat .env  # Verify config (mask API key)
```

**Success Indicators**:
- No import errors
- Project structure matches FastMCP conventions
- Test server starts without errors
- Environment variables load correctly

---

### Task 2.2: Obsidian REST API Client Implementation

**Title**: Implement Obsidian REST API client
**Active Form**: Implementing Obsidian REST API client
**Due Date**: 2025-10-23 12:00 PM
**Priority**: ⏫ High
**Time Estimate**: 2 hours
**Tags**: #obsidian #rest-api #python #client #http

**Dependencies**: Task 2.1 (Environment Setup)

**Description**:
Create a robust, async HTTP client for the Obsidian Local REST API plugin with full CRUD operations, frontmatter parsing, and error handling.

**Acceptance Criteria**:
1. ✅ `ObsidianRESTClient` class implemented with all methods
2. ✅ Async HTTP client using `httpx` library
3. ✅ YAML frontmatter parsing and serialization
4. ✅ Proper error handling with custom exceptions
5. ✅ SSL verification disabled for local HTTPS
6. ✅ Unit tests for all methods (mocked)
7. ✅ Integration test against live Obsidian instance

**Implementation**:

**File**: `src/clients/obsidian_client.py`
```python
"""
Obsidian Local REST API Client

Interfaces with the obsidian-local-rest-api plugin to perform
vault operations via HTTPS REST endpoints.

Plugin: https://github.com/coddingtonbear/obsidian-local-rest-api
"""

import httpx
import yaml
from typing import Optional, Any
from dataclasses import dataclass


class ObsidianAPIError(Exception):
    """Base exception for Obsidian API errors"""
    pass


class NoteNotFoundError(ObsidianAPIError):
    """Raised when note doesn't exist"""
    pass


class NoteExistsError(ObsidianAPIError):
    """Raised when attempting to create duplicate note"""
    pass


@dataclass
class Note:
    """Represents an Obsidian note"""
    path: str
    content: str
    frontmatter: dict
    raw: str


class ObsidianRESTClient:
    """
    Client for Obsidian Local REST API plugin

    Provides async methods for:
    - Creating, reading, updating, deleting notes
    - Searching and listing notes
    - Parsing and serializing YAML frontmatter

    Args:
        api_url: Base URL of Obsidian REST API (e.g., https://localhost:27124)
        api_key: API key from plugin settings

    Example:
        >>> client = ObsidianRESTClient(
        ...     api_url="https://localhost:27124",
        ...     api_key="your-api-key"
        ... )
        >>> note = await client.create_note(
        ...     path="concepts/ai.md",
        ...     content="# AI\\n\\nDefinition",
        ...     frontmatter={"type": "concept"}
        ... )
    """

    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key

        # Create async HTTP client
        # Note: verify=False for local self-signed cert
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {api_key}"},
            verify=False,  # Local HTTPS with self-signed cert
            timeout=30.0
        )

    async def create_note(
        self,
        path: str,
        content: str,
        frontmatter: Optional[dict] = None
    ) -> dict:
        """
        Create new note in vault

        Args:
            path: Path relative to vault root (e.g., "concepts/ai.md")
            content: Markdown content (without frontmatter)
            frontmatter: Optional YAML frontmatter as dict

        Returns:
            API response dict with note metadata

        Raises:
            NoteExistsError: If note already exists
            ObsidianAPIError: For other API errors

        Example:
            >>> await client.create_note(
            ...     path="daily/2025-10-23.md",
            ...     content="# Daily Note\\n\\nContent here",
            ...     frontmatter={"type": "daily", "date": "2025-10-23"}
            ... )
        """
        full_content = self._build_content(content, frontmatter)

        try:
            response = await self.client.post(
                f"{self.api_url}/vault/{path}",
                json={"content": full_content}
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 409:
                raise NoteExistsError(f"Note already exists: {path}")
            raise ObsidianAPIError(
                f"API error {e.response.status_code}: {e.response.text}"
            )

    async def read_note(self, path: str) -> Note:
        """
        Read note content and metadata

        Args:
            path: Path to note (e.g., "concepts/ai.md")

        Returns:
            Note object with parsed content and frontmatter

        Raises:
            NoteNotFoundError: If note doesn't exist
            ObsidianAPIError: For other API errors

        Example:
            >>> note = await client.read_note("concepts/ai.md")
            >>> print(note.frontmatter["type"])
            'concept'
        """
        try:
            response = await self.client.get(
                f"{self.api_url}/vault/{path}"
            )
            response.raise_for_status()

            raw_content = response.text
            parsed = self._parse_note(raw_content)

            return Note(
                path=path,
                content=parsed["content"],
                frontmatter=parsed["frontmatter"],
                raw=raw_content
            )

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise NoteNotFoundError(f"Note not found: {path}")
            raise ObsidianAPIError(
                f"API error {e.response.status_code}: {e.response.text}"
            )

    async def update_note(
        self,
        path: str,
        content: str,
        frontmatter: Optional[dict] = None
    ) -> dict:
        """
        Update existing note

        Args:
            path: Path to existing note
            content: New markdown content
            frontmatter: Optional frontmatter (replaces existing)

        Returns:
            API response dict

        Raises:
            NoteNotFoundError: If note doesn't exist
            ObsidianAPIError: For other API errors

        Example:
            >>> await client.update_note(
            ...     path="concepts/ai.md",
            ...     content="# Updated Content",
            ...     frontmatter={"updated": "2025-10-23"}
            ... )
        """
        full_content = self._build_content(content, frontmatter)

        try:
            response = await self.client.put(
                f"{self.api_url}/vault/{path}",
                json={"content": full_content}
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise NoteNotFoundError(f"Note not found: {path}")
            raise ObsidianAPIError(
                f"API error {e.response.status_code}: {e.response.text}"
            )

    async def delete_note(self, path: str) -> dict:
        """
        Delete note from vault

        Args:
            path: Path to note to delete

        Returns:
            API response dict

        Raises:
            NoteNotFoundError: If note doesn't exist
            ObsidianAPIError: For other API errors

        Example:
            >>> await client.delete_note("temp/old-note.md")
        """
        try:
            response = await self.client.delete(
                f"{self.api_url}/vault/{path}"
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise NoteNotFoundError(f"Note not found: {path}")
            raise ObsidianAPIError(
                f"API error {e.response.status_code}: {e.response.text}"
            )

    async def list_notes(
        self,
        pattern: Optional[str] = None
    ) -> list[dict]:
        """
        List notes in vault

        Args:
            pattern: Optional glob pattern (e.g., "concepts/*.md")

        Returns:
            List of note metadata dicts

        Example:
            >>> notes = await client.list_notes(pattern="concepts/*.md")
            >>> len(notes)
            42
        """
        try:
            params = {"pattern": pattern} if pattern else {}
            response = await self.client.get(
                f"{self.api_url}/vault/",
                params=params
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            raise ObsidianAPIError(
                f"API error {e.response.status_code}: {e.response.text}"
            )

    async def search_notes(self, query: str) -> list[dict]:
        """
        Full-text search across vault

        Args:
            query: Search query (supports Obsidian search syntax)

        Returns:
            List of matching notes with snippets

        Example:
            >>> results = await client.search_notes("temporal queries")
            >>> for result in results:
            ...     print(result["path"], result["snippet"])
        """
        try:
            response = await self.client.post(
                f"{self.api_url}/search/",
                json={"query": query}
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            raise ObsidianAPIError(
                f"API error {e.response.status_code}: {e.response.text}"
            )

    async def close(self):
        """Close HTTP client (call when done)"""
        await self.client.aclose()

    # Internal helpers

    def _build_content(
        self,
        content: str,
        frontmatter: Optional[dict]
    ) -> str:
        """Build full note content with frontmatter"""
        if frontmatter:
            # Serialize frontmatter as YAML
            fm_yaml = yaml.dump(
                frontmatter,
                sort_keys=False,
                allow_unicode=True,
                default_flow_style=False
            )
            return f"---\n{fm_yaml}---\n\n{content}"
        return content

    def _parse_note(self, raw_content: str) -> dict:
        """Parse note into frontmatter + content"""
        if raw_content.startswith("---\n"):
            # Split on frontmatter delimiters
            parts = raw_content.split("---\n", 2)

            if len(parts) >= 3:
                try:
                    frontmatter = yaml.safe_load(parts[1]) or {}
                    content = parts[2].strip()

                    return {
                        "frontmatter": frontmatter,
                        "content": content
                    }
                except yaml.YAMLError:
                    # Malformed YAML, treat as plain content
                    pass

        # No frontmatter or malformed
        return {
            "frontmatter": {},
            "content": raw_content
        }


# Context manager support
class ObsidianClientContext:
    """Context manager for ObsidianRESTClient"""

    def __init__(self, api_url: str, api_key: str):
        self.client = ObsidianRESTClient(api_url, api_key)

    async def __aenter__(self):
        return self.client

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.close()
```

**File**: `src/utils/config.py`
```python
"""Configuration loader from environment"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration"""

    OBSIDIAN_API_URL = os.getenv(
        "OBSIDIAN_API_URL",
        "https://localhost:27124"
    )
    OBSIDIAN_API_KEY = os.getenv("OBSIDIAN_API_KEY")

    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "logs/mcp-server.log")

    @classmethod
    def validate(cls):
        """Validate required config"""
        if not cls.OBSIDIAN_API_KEY:
            raise ValueError(
                "OBSIDIAN_API_KEY must be set in .env file"
            )
```

**File**: `tests/clients/test_obsidian_client.py`
```python
"""Unit tests for ObsidianRESTClient"""

import pytest
from unittest.mock import AsyncMock, patch
from httpx import Response, HTTPStatusError, Request
from src.clients.obsidian_client import (
    ObsidianRESTClient,
    NoteNotFoundError,
    NoteExistsError,
    Note
)


@pytest.fixture
def client():
    """Create test client"""
    return ObsidianRESTClient(
        api_url="https://localhost:27124",
        api_key="test-key"
    )


@pytest.mark.asyncio
async def test_create_note_success(client):
    """Test successful note creation"""
    with patch.object(client.client, 'post', new_callable=AsyncMock) as mock_post:
        mock_response = AsyncMock()
        mock_response.status_code = 201
        mock_response.json.return_value = {"success": True}
        mock_response.raise_for_status = AsyncMock()
        mock_post.return_value = mock_response

        result = await client.create_note(
            path="test.md",
            content="# Test",
            frontmatter={"type": "test"}
        )

        assert result["success"] is True
        mock_post.assert_called_once()
        # Verify frontmatter was serialized
        call_args = mock_post.call_args
        assert "---" in call_args.kwargs["json"]["content"]
        assert "type: test" in call_args.kwargs["json"]["content"]


@pytest.mark.asyncio
async def test_create_note_duplicate_error(client):
    """Test error when creating duplicate note"""
    with patch.object(client.client, 'post', new_callable=AsyncMock) as mock_post:
        # Mock 409 Conflict response
        mock_request = Request("POST", "https://localhost:27124/vault/test.md")
        mock_response = Response(status_code=409, request=mock_request)

        mock_post.return_value = mock_response

        with pytest.raises(NoteExistsError):
            await client.create_note("test.md", "Content")


@pytest.mark.asyncio
async def test_read_note_success(client):
    """Test successful note reading"""
    with patch.object(client.client, 'get', new_callable=AsyncMock) as mock_get:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.text = "---\ntype: test\n---\n\n# Content"
        mock_response.raise_for_status = AsyncMock()
        mock_get.return_value = mock_response

        note = await client.read_note("test.md")

        assert isinstance(note, Note)
        assert note.frontmatter["type"] == "test"
        assert "# Content" in note.content


@pytest.mark.asyncio
async def test_read_note_not_found(client):
    """Test error when reading non-existent note"""
    with patch.object(client.client, 'get', new_callable=AsyncMock) as mock_get:
        mock_request = Request("GET", "https://localhost:27124/vault/missing.md")
        mock_response = Response(status_code=404, request=mock_request)
        mock_get.return_value = mock_response

        with pytest.raises(NoteNotFoundError):
            await client.read_note("missing.md")


@pytest.mark.asyncio
async def test_parse_note_with_frontmatter(client):
    """Test frontmatter parsing"""
    raw = "---\ntitle: Test\ntags:\n  - test\n  - sample\n---\n\n# Content"

    parsed = client._parse_note(raw)

    assert parsed["frontmatter"]["title"] == "Test"
    assert "test" in parsed["frontmatter"]["tags"]
    assert parsed["content"] == "# Content"


@pytest.mark.asyncio
async def test_parse_note_without_frontmatter(client):
    """Test parsing note without frontmatter"""
    raw = "# Just Content"

    parsed = client._parse_note(raw)

    assert parsed["frontmatter"] == {}
    assert parsed["content"] == "# Just Content"
```

**Integration Test** (requires running Obsidian):
```python
# tests/integration/test_obsidian_integration.py
import pytest
from src.clients.obsidian_client import ObsidianClientContext
from src.utils.config import Config


@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_crud_cycle():
    """Integration test: Create, read, update, delete note"""

    async with ObsidianClientContext(
        Config.OBSIDIAN_API_URL,
        Config.OBSIDIAN_API_KEY
    ) as client:
        # Create
        await client.create_note(
            path="test/integration-test.md",
            content="# Integration Test",
            frontmatter={"type": "test", "status": "active"}
        )

        # Read
        note = await client.read_note("test/integration-test.md")
        assert note.frontmatter["type"] == "test"
        assert "# Integration Test" in note.content

        # Update
        await client.update_note(
            path="test/integration-test.md",
            content="# Updated Content",
            frontmatter={"type": "test", "status": "updated"}
        )

        # Verify update
        updated_note = await client.read_note("test/integration-test.md")
        assert updated_note.frontmatter["status"] == "updated"
        assert "# Updated Content" in updated_note.content

        # Delete
        await client.delete_note("test/integration-test.md")

        # Verify deletion
        with pytest.raises(NoteNotFoundError):
            await client.read_note("test/integration-test.md")
```

**Validation Commands**:
```bash
# Run unit tests
pytest tests/clients/test_obsidian_client.py -v

# Run integration test (requires Obsidian running)
pytest tests/integration/test_obsidian_integration.py -v -m integration

# Check coverage
pytest tests/clients/test_obsidian_client.py --cov=src/clients --cov-report=term
```

**Success Indicators**:
- All unit tests passing
- Integration test passes against live Obsidian
- Coverage >85% for client code
- No SSL/TLS warnings in logs
- Frontmatter correctly parsed and serialized

---

### Task 2.3: Implement `create_note` MCP Tool

**Title**: Implement create_note MCP tool
**Active Form**: Implementing create_note MCP tool
**Due Date**: 2025-10-23 2:00 PM
**Priority**: ⏫ High
**Time Estimate**: 1.5 hours
**Tags**: #mcp #fastmcp #tool #create #obsidian

**Dependencies**: Task 2.2 (Obsidian Client)

**Description**:
Create FastMCP tool for note creation with validation, error handling, and comprehensive testing.

**Acceptance Criteria**:
1. ✅ `create_note` tool registered with FastMCP
2. ✅ Automatic schema generation from type hints
3. ✅ Comprehensive docstring for Claude
4. ✅ Path validation (prevent directory traversal)
5. ✅ Frontmatter validation using Pydantic
6. ✅ Proper error messages for duplicate notes
7. ✅ Unit tests covering success and error cases
8. ✅ Tool visible in Claude Desktop

**Implementation**:

**File**: `src/tools/note_tools.py`
```python
"""MCP tools for note manipulation"""

from fastmcp import FastMCP, Context
from fastmcp.exceptions import ToolError
from typing import Optional, Annotated
from pydantic import Field, validator
import re
import os
from ..clients.obsidian_client import (
    ObsidianRESTClient,
    NoteExistsError,
    NoteNotFoundError,
    ObsidianAPIError
)


def validate_path(path: str) -> str:
    """
    Validate and sanitize note path

    Security checks:
    - Prevent directory traversal (..)
    - Prevent absolute paths
    - Ensure .md extension
    - Block system paths (.obsidian, _system)

    Args:
        path: Requested note path

    Returns:
        Validated path

    Raises:
        ToolError: If path is invalid
    """
    # Remove leading/trailing slashes
    path = path.strip("/")

    # Block directory traversal
    if ".." in path or path.startswith("/"):
        raise ToolError(
            code="INVALID_PATH",
            message="Path cannot contain '..' or start with '/'",
            data={"path": path}
        )

    # Block system paths
    if path.startswith(".obsidian") or path.startswith("_system"):
        raise ToolError(
            code="PROTECTED_PATH",
            message="Cannot access system paths",
            data={"path": path}
        )

    # Ensure .md extension
    if not path.endswith(".md"):
        path += ".md"

    # Validate characters (alphanumeric, dash, underscore, slash, dot)
    if not re.match(r'^[\w\-/\.]+$', path):
        raise ToolError(
            code="INVALID_CHARACTERS",
            message="Path contains invalid characters",
            data={"path": path, "allowed": "a-z, A-Z, 0-9, -, _, /, ."}
        )

    return path


def register_note_tools(mcp: FastMCP, client: ObsidianRESTClient):
    """Register all note manipulation tools with MCP server"""

    @mcp.tool
    async def create_note(
        path: Annotated[str, Field(
            description="Path relative to vault root (e.g., 'concepts/ai.md')",
            min_length=1,
            max_length=500
        )],
        content: Annotated[str, Field(
            description="Markdown content of the note (without frontmatter)",
            min_length=1
        )],
        frontmatter: Optional[dict] = Field(
            default=None,
            description="Optional YAML frontmatter as key-value pairs"
        ),
        ctx: Context = None
    ) -> dict:
        """
        Create a new note in the Obsidian vault

        This tool creates a new markdown note at the specified path with
        optional YAML frontmatter. The note will be immediately visible
        in Obsidian.

        Args:
            path: Path relative to vault root (e.g., "concepts/machine-learning.md")
                  Auto-adds .md extension if missing
            content: Markdown content (frontmatter added separately)
            frontmatter: Optional metadata as dict (e.g., {"type": "concept", "tags": ["ai"]})

        Returns:
            Success dict with note path and creation timestamp

        Raises:
            ToolError: If note already exists or path is invalid

        Examples:
            Create simple note:
            >>> create_note(
            ...     path="daily/2025-10-23.md",
            ...     content="# Daily Note\\n\\nToday's tasks..."
            ... )

            Create note with frontmatter:
            >>> create_note(
            ...     path="concepts/neural-networks.md",
            ...     content="# Neural Networks\\n\\nDefinition and examples",
            ...     frontmatter={
            ...         "type": "concept",
            ...         "tags": ["ai", "ml"],
            ...         "status": "draft"
            ...     }
            ... )

        Security:
            - Path is validated to prevent directory traversal
            - System paths (.obsidian, _system) are blocked
            - Maximum path length enforced

        Related Tools:
            - read_note: Read existing note
            - update_note: Modify existing note
            - delete_note: Remove note
        """
        # Log request (if context available)
        if ctx:
            ctx.logger.info(f"Creating note: {path}")

        # Validate and sanitize path
        safe_path = validate_path(path)

        try:
            # Call Obsidian API
            result = await client.create_note(
                path=safe_path,
                content=content,
                frontmatter=frontmatter
            )

            return {
                "success": True,
                "path": safe_path,
                "message": f"Note created successfully: {safe_path}",
                "frontmatter": frontmatter or {}
            }

        except NoteExistsError as e:
            # Note already exists
            raise ToolError(
                code="NOTE_EXISTS",
                message=f"A note already exists at '{safe_path}'",
                data={
                    "path": safe_path,
                    "suggestion": "Use update_note to modify existing note, or choose a different path"
                }
            )

        except ObsidianAPIError as e:
            # API communication error
            raise ToolError(
                code="API_ERROR",
                message=f"Failed to communicate with Obsidian: {str(e)}",
                data={"path": safe_path, "error": str(e)}
            )

        except Exception as e:
            # Unexpected error
            if ctx:
                ctx.logger.error(f"Unexpected error creating note: {e}", exc_info=True)

            raise ToolError(
                code="INTERNAL_ERROR",
                message="An unexpected error occurred while creating the note",
                data={"path": safe_path}
            )
```

**File**: `tests/tools/test_note_tools.py`
```python
"""Tests for note manipulation tools"""

import pytest
from unittest.mock import AsyncMock, Mock
from fastmcp import FastMCP, Client
from fastmcp.exceptions import ToolError
from src.clients.obsidian_client import (
    ObsidianRESTClient,
    NoteExistsError
)
from src.tools.note_tools import register_note_tools, validate_path


# Fixtures

@pytest.fixture
def mock_client():
    """Create mock Obsidian client"""
    return AsyncMock(spec=ObsidianRESTClient)


@pytest.fixture
def mcp_server(mock_client):
    """Create FastMCP server with note tools"""
    mcp = FastMCP("Test Server")
    register_note_tools(mcp, mock_client)
    return mcp


# Path Validation Tests

def test_validate_path_adds_extension():
    """Test .md extension auto-added"""
    assert validate_path("test") == "test.md"
    assert validate_path("test.md") == "test.md"


def test_validate_path_blocks_traversal():
    """Test directory traversal blocked"""
    with pytest.raises(ToolError) as exc:
        validate_path("../secrets.md")
    assert exc.value.code == "INVALID_PATH"


def test_validate_path_blocks_absolute():
    """Test absolute paths blocked"""
    with pytest.raises(ToolError):
        validate_path("/etc/passwd.md")


def test_validate_path_blocks_system():
    """Test system paths blocked"""
    with pytest.raises(ToolError) as exc:
        validate_path(".obsidian/config.md")
    assert exc.value.code == "PROTECTED_PATH"

    with pytest.raises(ToolError):
        validate_path("_system/internal.md")


def test_validate_path_allows_subdirs():
    """Test nested paths allowed"""
    assert validate_path("concepts/ai/ml.md") == "concepts/ai/ml.md"


# Tool Tests

@pytest.mark.asyncio
async def test_create_note_success(mcp_server, mock_client):
    """Test successful note creation"""
    # Mock successful API response
    mock_client.create_note.return_value = {"success": True}

    # Call tool via MCP
    async with Client(mcp_server) as client:
        result = await client.call_tool(
            "create_note",
            {
                "path": "test.md",
                "content": "# Test Note",
                "frontmatter": {"type": "test"}
            }
        )

    # Verify result
    assert result.data["success"] is True
    assert result.data["path"] == "test.md"
    assert "created successfully" in result.data["message"].lower()

    # Verify client called correctly
    mock_client.create_note.assert_called_once_with(
        path="test.md",
        content="# Test Note",
        frontmatter={"type": "test"}
    )


@pytest.mark.asyncio
async def test_create_note_auto_adds_extension(mcp_server, mock_client):
    """Test .md extension auto-added"""
    mock_client.create_note.return_value = {"success": True}

    async with Client(mcp_server) as client:
        result = await client.call_tool(
            "create_note",
            {"path": "test", "content": "Content"}
        )

    # Verify .md was added
    assert result.data["path"] == "test.md"
    mock_client.create_note.assert_called_once()
    assert mock_client.create_note.call_args.kwargs["path"] == "test.md"


@pytest.mark.asyncio
async def test_create_note_duplicate_error(mcp_server, mock_client):
    """Test error when creating duplicate note"""
    # Mock duplicate error
    mock_client.create_note.side_effect = NoteExistsError("Exists")

    async with Client(mcp_server) as client:
        with pytest.raises(Exception) as exc:
            await client.call_tool(
                "create_note",
                {"path": "duplicate.md", "content": "Content"}
            )

    # Verify error contains useful info
    error_str = str(exc.value).lower()
    assert "exists" in error_str or "duplicate" in error_str


@pytest.mark.asyncio
async def test_create_note_invalid_path(mcp_server, mock_client):
    """Test error with invalid path"""
    async with Client(mcp_server) as client:
        with pytest.raises(Exception) as exc:
            await client.call_tool(
                "create_note",
                {"path": "../etc/passwd", "content": "Malicious"}
            )

    # Path validation should fail
    error_str = str(exc.value)
    assert "invalid" in error_str.lower() or "path" in error_str.lower()


@pytest.mark.asyncio
async def test_create_note_without_frontmatter(mcp_server, mock_client):
    """Test creating note without frontmatter"""
    mock_client.create_note.return_value = {"success": True}

    async with Client(mcp_server) as client:
        result = await client.call_tool(
            "create_note",
            {"path": "simple.md", "content": "# Simple Note"}
        )

    # Verify frontmatter is None or empty dict
    call_kwargs = mock_client.create_note.call_args.kwargs
    assert call_kwargs["frontmatter"] is None

    # Verify result includes empty frontmatter
    assert result.data["frontmatter"] == {}
```

**Update Main Server**:

**File**: `src/server.py`
```python
"""Weave-NN MCP Server - Main Entry Point"""

import os
import sys
from fastmcp import FastMCP
from dotenv import load_dotenv

from .clients.obsidian_client import ObsidianRESTClient
from .tools.note_tools import register_note_tools
from .utils.config import Config

# Load environment
load_dotenv()

# Validate configuration
try:
    Config.validate()
except ValueError as e:
    print(f"Configuration error: {e}", file=sys.stderr)
    sys.exit(1)

# Create MCP server
mcp = FastMCP(
    name="Weave-NN Obsidian Server",
    version="1.0.0",
    description="MCP server for Obsidian vault operations in Weave-NN knowledge graph"
)

# Initialize Obsidian client
obsidian_client = ObsidianRESTClient(
    api_url=Config.OBSIDIAN_API_URL,
    api_key=Config.OBSIDIAN_API_KEY
)

# Register tools
register_note_tools(mcp, obsidian_client)

# Health check resource
@mcp.resource("health://status")
def health_check() -> dict:
    """Server health status"""
    return {
        "status": "healthy",
        "server": "Weave-NN Obsidian Server",
        "version": "1.0.0",
        "vault_url": Config.OBSIDIAN_API_URL
    }

# Run server
if __name__ == "__main__":
    mcp.run()
```

**Testing in Claude Desktop**:

1. **Install to Claude Desktop**:
   ```bash
   fastmcp install claude-desktop src/server.py \
     --requirements requirements.txt \
     --env OBSIDIAN_API_URL=https://localhost:27124 \
     --env OBSIDIAN_API_KEY=your-api-key
   ```

2. **Restart Claude Desktop**

3. **Test with Prompt**:
   ```
   Create a test note in my Obsidian vault at path "test/fastmcp-test.md"
   with content:

   # FastMCP Integration Test

   This note was created by Claude using the FastMCP server!

   ## Features Tested
   - Note creation via MCP
   - Frontmatter support
   - Path validation

   Add frontmatter with type: "test" and status: "success"
   ```

4. **Verify**:
   - Check hammer icon (🔨) visible
   - Note appears in Obsidian
   - Frontmatter correctly set

**Success Indicators**:
- All unit tests passing
- Tool visible in Claude Desktop tools list
- Can create notes from Claude chat
- Notes appear immediately in Obsidian
- Frontmatter correctly formatted
- Error messages are clear and actionable

---

### Task 2.4: Implement `read_note` MCP Tool

**Title**: Implement read_note MCP tool
**Active Form**: Implementing read_note MCP tool
**Due Date**: 2025-10-23 4:00 PM
**Priority**: ⏫ High
**Time Estimate**: 1 hour
**Tags**: #mcp #fastmcp #tool #read #obsidian

**Dependencies**: Task 2.3 (create_note tool)

**Description**:
Create FastMCP tool for reading note content and metadata.

**Acceptance Criteria**:
1. ✅ `read_note` tool registered with FastMCP
2. ✅ Returns frontmatter and content separately
3. ✅ Handles notes without frontmatter
4. ✅ Clear error for non-existent notes
5. ✅ Unit tests for success and error cases
6. ✅ Integration test with Claude Desktop

**Implementation**:

**Add to** `src/tools/note_tools.py`:
```python
    @mcp.tool
    async def read_note(
        path: Annotated[str, Field(
            description="Path to note (e.g., 'concepts/ai.md')",
            min_length=1,
            max_length=500
        )],
        ctx: Context = None
    ) -> dict:
        """
        Read note content and metadata from Obsidian vault

        Retrieves the full content of a note including both the markdown
        content and any YAML frontmatter. The frontmatter is parsed and
        returned as a structured dictionary.

        Args:
            path: Path to note relative to vault root

        Returns:
            Dict containing:
            - path: Note path
            - content: Markdown content (without frontmatter)
            - frontmatter: Parsed YAML frontmatter as dict
            - raw: Full raw content including frontmatter

        Raises:
            ToolError: If note doesn't exist or path is invalid

        Examples:
            Read a simple note:
            >>> read_note(path="daily/2025-10-23.md")
            {
                "path": "daily/2025-10-23.md",
                "content": "# Daily Note\\n\\nContent here",
                "frontmatter": {"type": "daily", "date": "2025-10-23"},
                "raw": "---\\ntype: daily\\n...---\\n\\n# Daily Note..."
            }

            Read note without frontmatter:
            >>> read_note(path="simple.md")
            {
                "path": "simple.md",
                "content": "# Simple Note",
                "frontmatter": {},
                "raw": "# Simple Note"
            }

        Use Cases:
            - Retrieve note for analysis or summarization
            - Extract frontmatter metadata
            - Copy note content
            - Verify note exists

        Related Tools:
            - create_note: Create new note
            - update_note: Modify note
            - search_notes: Find notes by content
        """
        if ctx:
            ctx.logger.info(f"Reading note: {path}")

        # Validate path
        safe_path = validate_path(path)

        try:
            # Read from Obsidian
            note = await client.read_note(safe_path)

            return {
                "success": True,
                "path": note.path,
                "content": note.content,
                "frontmatter": note.frontmatter,
                "raw": note.raw
            }

        except NoteNotFoundError as e:
            raise ToolError(
                code="NOTE_NOT_FOUND",
                message=f"Note not found: '{safe_path}'",
                data={
                    "path": safe_path,
                    "suggestion": "Check the path spelling, or use list_notes to see available notes"
                }
            )

        except ObsidianAPIError as e:
            raise ToolError(
                code="API_ERROR",
                message=f"Failed to read note: {str(e)}",
                data={"path": safe_path}
            )

        except Exception as e:
            if ctx:
                ctx.logger.error(f"Unexpected error reading note: {e}", exc_info=True)

            raise ToolError(
                code="INTERNAL_ERROR",
                message="An unexpected error occurred while reading the note",
                data={"path": safe_path}
            )
```

**Add Tests to** `tests/tools/test_note_tools.py`:
```python
@pytest.mark.asyncio
async def test_read_note_success(mcp_server, mock_client):
    """Test successful note reading"""
    from src.clients.obsidian_client import Note

    # Mock note with frontmatter
    mock_note = Note(
        path="test.md",
        content="# Test Content",
        frontmatter={"type": "test", "tags": ["sample"]},
        raw="---\ntype: test\ntags:\n  - sample\n---\n\n# Test Content"
    )
    mock_client.read_note.return_value = mock_note

    async with Client(mcp_server) as client:
        result = await client.call_tool("read_note", {"path": "test.md"})

    # Verify structure
    assert result.data["success"] is True
    assert result.data["path"] == "test.md"
    assert result.data["content"] == "# Test Content"
    assert result.data["frontmatter"]["type"] == "test"
    assert "sample" in result.data["frontmatter"]["tags"]


@pytest.mark.asyncio
async def test_read_note_not_found(mcp_server, mock_client):
    """Test error when reading non-existent note"""
    mock_client.read_note.side_effect = NoteNotFoundError("Not found")

    async with Client(mcp_server) as client:
        with pytest.raises(Exception) as exc:
            await client.call_tool("read_note", {"path": "missing.md"})

    error_str = str(exc.value).lower()
    assert "not found" in error_str


@pytest.mark.asyncio
async def test_read_note_without_frontmatter(mcp_server, mock_client):
    """Test reading note without frontmatter"""
    from src.clients.obsidian_client import Note

    mock_note = Note(
        path="simple.md",
        content="# Simple Note",
        frontmatter={},  # No frontmatter
        raw="# Simple Note"
    )
    mock_client.read_note.return_value = mock_note

    async with Client(mcp_server) as client:
        result = await client.call_tool("read_note", {"path": "simple.md"})

    assert result.data["frontmatter"] == {}
    assert result.data["content"] == "# Simple Note"
```

**Claude Desktop Test Prompt**:
```
Read the test note we just created at "test/fastmcp-test.md" and
tell me what's in the frontmatter and content.
```

**Success Indicators**:
- Can read notes created via `create_note`
- Frontmatter correctly parsed
- Notes without frontmatter handled gracefully
- Clear error for missing notes

---

### Task 2.5: End-of-Day Testing & Validation

**Title**: Validate Day 2 deliverables and test end-to-end
**Active Form**: Validating Day 2 deliverables and testing end-to-end
**Due Date**: 2025-10-23 5:30 PM
**Priority**: 🔼 Medium
**Time Estimate**: 1.5 hours
**Tags**: #testing #validation #e2e #quality-assurance

**Dependencies**: Tasks 2.1-2.4

**Description**:
Comprehensive validation of all Day 2 work with end-to-end testing in Claude Desktop.

**Acceptance Criteria**:
1. ✅ All unit tests passing (>80% coverage)
2. ✅ Integration tests passing (with live Obsidian)
3. ✅ Claude Desktop sees both tools (create_note, read_note)
4. ✅ Can create and read notes via Claude chat
5. ✅ Error handling works (duplicates, missing notes)
6. ✅ Documentation complete (README, docstrings)

**Testing Checklist**:

**1. Unit Tests**:
```bash
# Run all tests
pytest tests/ -v

# Check coverage
pytest tests/ --cov=src --cov-report=html --cov-report=term

# Coverage should be >80%
```

**2. Integration Tests**:
```bash
# Ensure Obsidian is running with REST API plugin
# Then run integration tests
pytest tests/integration/ -v -m integration
```

**3. Claude Desktop E2E Tests**:

Test these scenarios in Claude chat:

**Scenario 1: Create Note**:
```
Create a note at "test/day2-validation.md" with:

# Day 2 Validation

## Tests Completed
- FastMCP setup ✅
- Obsidian client ✅
- create_note tool ✅
- read_note tool ✅

Frontmatter:
- type: test
- date: 2025-10-23
- status: complete
```

**Scenario 2: Read Note**:
```
Read the note at "test/day2-validation.md" and summarize its content.
```

**Scenario 3: Error Handling - Duplicate**:
```
Try to create another note at "test/day2-validation.md"
(should get clear error about duplicate)
```

**Scenario 4: Error Handling - Not Found**:
```
Read the note at "test/does-not-exist.md"
(should get clear error about not found)
```

**Scenario 5: Nested Path**:
```
Create a note at "concepts/ai/deep-learning.md" with:

# Deep Learning

A subset of machine learning...

Frontmatter: type: concept, tags: [ai, ml, deep-learning]
```

**4. Code Quality**:
```bash
# Linting
ruff check src/ tests/

# Formatting
ruff format src/ tests/ --check
```

**5. Documentation Review**:
- [ ] All tools have comprehensive docstrings
- [ ] README.md updated with setup instructions
- [ ] .env.example created
- [ ] CHANGELOG.md started

**Validation Report Template**:

Create `_planning/day-2-validation-report.md`:
```markdown
# Day 2 Validation Report

**Date**: 2025-10-23
**Tester**: [Your Name]

## Test Results

### Unit Tests
- Total tests: [count]
- Passed: [count]
- Failed: [count]
- Coverage: [percentage]%

### Integration Tests
- Obsidian connection: ✅/❌
- Create note: ✅/❌
- Read note: ✅/❌
- Update note: N/A (Day 3)
- Delete note: N/A (Day 3)

### Claude Desktop E2E
- Tools visible: ✅/❌
- create_note works: ✅/❌
- read_note works: ✅/❌
- Error handling: ✅/❌

## Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Fix: [Description]

## Day 2 Success Criteria
- [x] FastMCP environment setup
- [x] Obsidian REST client implemented
- [x] create_note tool complete
- [x] read_note tool complete
- [x] Tests passing
- [x] Claude Desktop integration working

## Blockers for Day 3
- [List any blockers]

## Notes
[Additional observations]
```

**Success Indicators**:
- All checkboxes checked
- No critical bugs
- Ready to proceed to Day 3
- Team confident in foundation

---

## Day 3: Complete MCP Tool Suite (Oct 24, 2025)

**Goal**: Implement remaining CRUD tools (update, delete) and search tools (list, search)

**Daily Success Criteria**:
- ✅ All 6 MCP tools implemented and tested
- ✅ Comprehensive error handling and validation
- ✅ Integration tests passing
- ✅ Claude Desktop can perform all vault operations
- ✅ Documentation complete

---

### Task 3.1: Implement `update_note` MCP Tool

**Title**: Implement update_note MCP tool
**Active Form**: Implementing update_note MCP tool
**Due Date**: 2025-10-24 10:30 AM
**Priority**: ⏫ High
**Time Estimate**: 1.5 hours
**Tags**: #mcp #fastmcp #tool #update #obsidian

**Dependencies**: Task 2.5 (Day 2 validation complete)

**Description**:
Create FastMCP tool for updating existing notes with frontmatter merge option.

**Acceptance Criteria**:
1. ✅ `update_note` tool registered
2. ✅ Option to merge or replace frontmatter
3. ✅ Validation prevents updating non-existent notes
4. ✅ Preserves existing frontmatter when merging
5. ✅ Unit and integration tests
6. ✅ Works in Claude Desktop

**Implementation**:

**Add to** `src/tools/note_tools.py`:
```python
    @mcp.tool
    async def update_note(
        path: Annotated[str, Field(
            description="Path to existing note",
            min_length=1,
            max_length=500
        )],
        content: Annotated[str, Field(
            description="New markdown content",
            min_length=1
        )],
        frontmatter: Optional[dict] = Field(
            default=None,
            description="Frontmatter to set or merge"
        ),
        merge_frontmatter: bool = Field(
            default=True,
            description="If True, merge with existing frontmatter; if False, replace completely"
        ),
        ctx: Context = None
    ) -> dict:
        """
        Update existing note in Obsidian vault

        Modifies the content and/or frontmatter of an existing note.
        By default, frontmatter is merged with existing values, but can
        be replaced entirely by setting merge_frontmatter=False.

        Args:
            path: Path to existing note
            content: New markdown content (without frontmatter)
            frontmatter: Frontmatter to set/merge (optional)
            merge_frontmatter: Merge with existing (default) or replace

        Returns:
            Success dict with updated note path

        Raises:
            ToolError: If note doesn't exist or update fails

        Examples:
            Update content only:
            >>> update_note(
            ...     path="concepts/ai.md",
            ...     content="# AI (Updated)\\n\\nNew definition..."
            ... )

            Update and merge frontmatter:
            >>> update_note(
            ...     path="concepts/ai.md",
            ...     content="# AI\\n\\nContent",
            ...     frontmatter={"updated": "2025-10-24", "reviewed": true},
            ...     merge_frontmatter=True  # Keeps existing frontmatter, adds new keys
            ... )

            Replace frontmatter completely:
            >>> update_note(
            ...     path="concepts/ai.md",
            ...     content="# AI\\n\\nContent",
            ...     frontmatter={"type": "concept"},
            ...     merge_frontmatter=False  # Removes all old frontmatter
            ... )

        Use Cases:
            - Refine note content after learning more
            - Add metadata (tags, status, dates)
            - Fix typos or formatting
            - Append new sections

        Related Tools:
            - read_note: Read current content before updating
            - create_note: Create new note
        """
        if ctx:
            ctx.logger.info(f"Updating note: {path}")

        safe_path = validate_path(path)

        try:
            # If merging frontmatter, read existing first
            final_frontmatter = frontmatter
            if merge_frontmatter and frontmatter:
                existing_note = await client.read_note(safe_path)
                # Merge: existing values overridden by new values
                final_frontmatter = {
                    **existing_note.frontmatter,
                    **frontmatter
                }

            # Update note
            result = await client.update_note(
                path=safe_path,
                content=content,
                frontmatter=final_frontmatter
            )

            return {
                "success": True,
                "path": safe_path,
                "message": f"Note updated successfully: {safe_path}",
                "frontmatter": final_frontmatter or {},
                "merged": merge_frontmatter and frontmatter is not None
            }

        except NoteNotFoundError as e:
            raise ToolError(
                code="NOTE_NOT_FOUND",
                message=f"Cannot update note that doesn't exist: '{safe_path}'",
                data={
                    "path": safe_path,
                    "suggestion": "Use create_note to create new note, or check the path"
                }
            )

        except ObsidianAPIError as e:
            raise ToolError(
                code="API_ERROR",
                message=f"Failed to update note: {str(e)}",
                data={"path": safe_path}
            )

        except Exception as e:
            if ctx:
                ctx.logger.error(f"Unexpected error updating note: {e}", exc_info=True)

            raise ToolError(
                code="INTERNAL_ERROR",
                message="An unexpected error occurred while updating the note",
                data={"path": safe_path}
            )
```

**Add Tests**:
```python
@pytest.mark.asyncio
async def test_update_note_success(mcp_server, mock_client):
    """Test successful note update"""
    from src.clients.obsidian_client import Note

    # Mock existing note
    existing = Note(
        path="test.md",
        content="Old content",
        frontmatter={"type": "test", "version": 1},
        raw="..."
    )
    mock_client.read_note.return_value = existing
    mock_client.update_note.return_value = {"success": True}

    async with Client(mcp_server) as client:
        result = await client.call_tool(
            "update_note",
            {
                "path": "test.md",
                "content": "New content",
                "frontmatter": {"version": 2, "updated": "2025-10-24"},
                "merge_frontmatter": True
            }
        )

    # Verify merge happened
    assert result.data["success"] is True
    assert result.data["merged"] is True

    # Check update_note was called with merged frontmatter
    call_kwargs = mock_client.update_note.call_args.kwargs
    merged_fm = call_kwargs["frontmatter"]
    assert merged_fm["type"] == "test"  # Preserved from original
    assert merged_fm["version"] == 2  # Updated
    assert merged_fm["updated"] == "2025-10-24"  # Added


@pytest.mark.asyncio
async def test_update_note_replace_frontmatter(mcp_server, mock_client):
    """Test replacing frontmatter completely"""
    mock_client.update_note.return_value = {"success": True}

    async with Client(mcp_server) as client:
        result = await client.call_tool(
            "update_note",
            {
                "path": "test.md",
                "content": "Content",
                "frontmatter": {"type": "new"},
                "merge_frontmatter": False  # Replace, don't merge
            }
        )

    # Should NOT read existing note (no merge)
    mock_client.read_note.assert_not_called()

    # Frontmatter should be exactly what we passed
    call_kwargs = mock_client.update_note.call_args.kwargs
    assert call_kwargs["frontmatter"] == {"type": "new"}


@pytest.mark.asyncio
async def test_update_note_not_found(mcp_server, mock_client):
    """Test error when updating non-existent note"""
    mock_client.update_note.side_effect = NoteNotFoundError("Not found")

    async with Client(mcp_server) as client:
        with pytest.raises(Exception) as exc:
            await client.call_tool(
                "update_note",
                {"path": "missing.md", "content": "Content"}
            )

    assert "not found" in str(exc.value).lower()
```

**Claude Desktop Test**:
```
Update the note at "test/day2-validation.md" and:
1. Change the status to "updated"
2. Add a new field "last_modified" with today's date
3. Append "## Day 3 Progress" section to the content

Keep all existing frontmatter.
```

**Success Indicators**:
- Updates work via Claude
- Frontmatter merging works correctly
- Can replace frontmatter when needed
- Clear error for missing notes

---

### Task 3.2: Implement `delete_note` MCP Tool

**Title**: Implement delete_note MCP tool
**Active Form**: Implementing delete_note MCP tool
**Due Date**: 2025-10-24 12:00 PM
**Priority**: ⏫ High
**Time Estimate**: 1 hour
**Tags**: #mcp #fastmcp #tool #delete #obsidian #safety

**Dependencies**: Task 3.1 (update_note tool)

**Description**:
Create FastMCP tool for deleting notes with safety confirmations.

**Acceptance Criteria**:
1. ✅ `delete_note` tool registered
2. ✅ Requires explicit confirmation flag
3. ✅ Blocks deletion of protected paths
4. ✅ Clear error messages
5. ✅ Unit tests with safety scenarios
6. ✅ Works in Claude Desktop

**Implementation**:

**Add to** `src/tools/note_tools.py`:
```python
    @mcp.tool
    async def delete_note(
        path: Annotated[str, Field(
            description="Path to note to delete",
            min_length=1,
            max_length=500
        )],
        confirm: bool = Field(
            default=False,
            description="Must be True to confirm deletion (safety check)"
        ),
        ctx: Context = None
    ) -> dict:
        """
        Delete note from Obsidian vault

        **⚠️ DESTRUCTIVE OPERATION**

        Permanently deletes a note from the vault. This action cannot be
        undone (unless you have Git history or backups). Requires explicit
        confirmation.

        Args:
            path: Path to note to delete
            confirm: Must be set to True to confirm deletion

        Returns:
            Success dict with deleted note path

        Raises:
            ToolError: If confirmation missing, note not found, or path protected

        Examples:
            Delete with confirmation:
            >>> delete_note(
            ...     path="temp/old-note.md",
            ...     confirm=True
            ... )

            Attempt without confirmation (will fail):
            >>> delete_note(path="note.md", confirm=False)
            # Raises ToolError: "Must set confirm=True"

        Safety Features:
            - Requires explicit confirm=True flag
            - Blocks deletion of system paths (.obsidian/, _system/)
            - Validates path to prevent traversal
            - Logs all deletion attempts

        Protected Paths:
            - .obsidian/* (Obsidian configuration)
            - _system/* (Weave-NN system notes)
            - Any path with ".." (traversal attempt)

        Use Cases:
            - Clean up temporary notes
            - Remove outdated content
            - Delete test notes

        Related Tools:
            - create_note: Create new note
            - read_note: Verify content before deleting
        """
        if ctx:
            ctx.logger.warning(f"Deletion requested for: {path} (confirm={confirm})")

        # Require confirmation
        if not confirm:
            raise ToolError(
                code="CONFIRMATION_REQUIRED",
                message="Deletion requires confirmation. Set confirm=True to proceed.",
                data={
                    "path": path,
                    "hint": "This is a safety check to prevent accidental deletions"
                }
            )

        # Validate path
        safe_path = validate_path(path)

        # Additional safety: block system paths
        # (validate_path already blocks .obsidian and _system,
        # but let's be extra careful)
        protected_prefixes = [".obsidian", "_system", "system"]
        if any(safe_path.startswith(prefix) for prefix in protected_prefixes):
            raise ToolError(
                code="PROTECTED_PATH",
                message=f"Cannot delete protected system path: {safe_path}",
                data={"path": safe_path, "protected_prefixes": protected_prefixes}
            )

        try:
            # Delete note
            result = await client.delete_note(safe_path)

            if ctx:
                ctx.logger.info(f"Note deleted: {safe_path}")

            return {
                "success": True,
                "path": safe_path,
                "message": f"Note deleted successfully: {safe_path}",
                "warning": "This action cannot be undone (check Git history if needed)"
            }

        except NoteNotFoundError as e:
            raise ToolError(
                code="NOTE_NOT_FOUND",
                message=f"Cannot delete note that doesn't exist: '{safe_path}'",
                data={"path": safe_path}
            )

        except ObsidianAPIError as e:
            raise ToolError(
                code="API_ERROR",
                message=f"Failed to delete note: {str(e)}",
                data={"path": safe_path}
            )

        except Exception as e:
            if ctx:
                ctx.logger.error(f"Unexpected error deleting note: {e}", exc_info=True)

            raise ToolError(
                code="INTERNAL_ERROR",
                message="An unexpected error occurred while deleting the note",
                data={"path": safe_path}
            )
```

**Add Tests**:
```python
@pytest.mark.asyncio
async def test_delete_note_success(mcp_server, mock_client):
    """Test successful note deletion"""
    mock_client.delete_note.return_value = {"success": True}

    async with Client(mcp_server) as client:
        result = await client.call_tool(
            "delete_note",
            {"path": "temp/old.md", "confirm": True}
        )

    assert result.data["success"] is True
    assert "deleted successfully" in result.data["message"].lower()
    mock_client.delete_note.assert_called_once_with("temp/old.md")


@pytest.mark.asyncio
async def test_delete_note_requires_confirmation(mcp_server, mock_client):
    """Test error when confirmation missing"""
    async with Client(mcp_server) as client:
        with pytest.raises(Exception) as exc:
            await client.call_tool(
                "delete_note",
                {"path": "note.md", "confirm": False}
            )

    # Should fail before calling API
    mock_client.delete_note.assert_not_called()
    assert "confirmation" in str(exc.value).lower()


@pytest.mark.asyncio
async def test_delete_note_blocks_system_paths(mcp_server, mock_client):
    """Test protection of system paths"""
    async with Client(mcp_server) as client:
        # Try to delete .obsidian file
        with pytest.raises(Exception) as exc:
            await client.call_tool(
                "delete_note",
                {"path": ".obsidian/config.md", "confirm": True}
            )

    # Should fail before calling API
    mock_client.delete_note.assert_not_called()
    assert "protected" in str(exc.value).lower()


@pytest.mark.asyncio
async def test_delete_note_not_found(mcp_server, mock_client):
    """Test error when deleting non-existent note"""
    mock_client.delete_note.side_effect = NoteNotFoundError("Not found")

    async with Client(mcp_server) as client:
        with pytest.raises(Exception) as exc:
            await client.call_tool(
                "delete_note",
                {"path": "missing.md", "confirm": True}
            )

    assert "not found" in str(exc.value).lower()
```

**Claude Desktop Test**:
```
Create a test note at "temp/to-delete.md" with content "This will be deleted".

Then delete it (make sure to confirm the deletion).

Verify it's gone by trying to read it.
```

**Success Indicators**:
- Deletion works with confirmation
- Fails without confirmation
- System paths protected
- Clear warnings about permanence

---

### Task 3.3: Implement `list_notes` MCP Tool

**Title**: Implement list_notes MCP tool
**Active Form**: Implementing list_notes MCP tool
**Due Date**: 2025-10-24 2:00 PM
**Priority**: 🔼 Medium
**Time Estimate**: 1 hour
**Tags**: #mcp #fastmcp #tool #list #search #discovery

**Dependencies**: Task 3.2 (delete_note tool)

**Description**:
Create FastMCP tool for listing notes with glob pattern filtering.

**Acceptance Criteria**:
1. ✅ `list_notes` tool registered
2. ✅ Optional glob pattern filter
3. ✅ Result limit with validation (1-1000)
4. ✅ Returns note paths and metadata
5. ✅ Unit tests
6. ✅ Works in Claude Desktop

**Implementation**:

**Create** `src/tools/search_tools.py`:
```python
"""MCP tools for note search and discovery"""

from fastmcp import FastMCP, Context
from fastmcp.exceptions import ToolError
from typing import Optional, Annotated
from pydantic import Field
from ..clients.obsidian_client import ObsidianRESTClient, ObsidianAPIError


def register_search_tools(mcp: FastMCP, client: ObsidianRESTClient):
    """Register search and discovery tools"""

    @mcp.tool
    async def list_notes(
        pattern: Optional[str] = Field(
            default=None,
            description="Optional glob pattern (e.g., 'concepts/*.md', '**/*.md')"
        ),
        limit: Annotated[int, Field(
            ge=1,
            le=1000,
            description="Maximum number of results (1-1000)"
        )] = 100,
        ctx: Context = None
    ) -> dict:
        """
        List notes in Obsidian vault with optional filtering

        Returns a list of notes in the vault, optionally filtered by
        a glob pattern. Useful for discovering what notes exist or
        finding all notes in a specific folder.

        Args:
            pattern: Optional glob pattern to filter notes
                     Examples: "concepts/*.md", "daily/2025-*.md", "**/*.md"
            limit: Maximum results to return (default 100, max 1000)

        Returns:
            Dict with:
            - notes: List of note objects with path and metadata
            - count: Total notes found
            - pattern: Pattern used (if any)
            - limited: Whether results were truncated

        Examples:
            List all notes:
            >>> list_notes()

            List notes in concepts folder:
            >>> list_notes(pattern="concepts/*.md")

            List all daily notes from October 2025:
            >>> list_notes(pattern="daily/2025-10-*.md", limit=31)

            List all notes recursively:
            >>> list_notes(pattern="**/*.md")

        Use Cases:
            - Discover what notes exist in vault
            - Get all notes in a folder
            - Find notes by naming pattern
            - Audit vault structure

        Related Tools:
            - search_notes: Search by content
            - read_note: Read specific note
        """
        if ctx:
            ctx.logger.info(f"Listing notes (pattern={pattern}, limit={limit})")

        try:
            # Get notes from Obsidian
            all_notes = await client.list_notes(pattern)

            # Apply limit
            total_count = len(all_notes)
            limited_notes = all_notes[:limit]
            was_limited = total_count > limit

            return {
                "success": True,
                "notes": limited_notes,
                "count": len(limited_notes),
                "total": total_count,
                "pattern": pattern,
                "limited": was_limited,
                "message": f"Found {total_count} notes" +
                          (f" (showing first {limit})" if was_limited else "")
            }

        except ObsidianAPIError as e:
            raise ToolError(
                code="API_ERROR",
                message=f"Failed to list notes: {str(e)}",
                data={"pattern": pattern}
            )

        except Exception as e:
            if ctx:
                ctx.logger.error(f"Unexpected error listing notes: {e}", exc_info=True)

            raise ToolError(
                code="INTERNAL_ERROR",
                message="An unexpected error occurred while listing notes",
                data={"pattern": pattern}
            )
```

**Update** `src/server.py`:
```python
from .tools.search_tools import register_search_tools

# After registering note tools:
register_search_tools(mcp, obsidian_client)
```

**Add Tests** `tests/tools/test_search_tools.py`:
```python
"""Tests for search and discovery tools"""

import pytest
from unittest.mock import AsyncMock
from fastmcp import FastMCP, Client
from src.clients.obsidian_client import ObsidianRESTClient
from src.tools.search_tools import register_search_tools


@pytest.fixture
def mock_client():
    return AsyncMock(spec=ObsidianRESTClient)


@pytest.fixture
def mcp_server(mock_client):
    mcp = FastMCP("Test Server")
    register_search_tools(mcp, mock_client)
    return mcp


@pytest.mark.asyncio
async def test_list_notes_all(mcp_server, mock_client):
    """Test listing all notes"""
    mock_client.list_notes.return_value = [
        {"path": "concepts/ai.md", "size": 1024},
        {"path": "daily/2025-10-23.md", "size": 512},
        {"path": "features/mcp.md", "size": 2048}
    ]

    async with Client(mcp_server) as client:
        result = await client.call_tool("list_notes", {})

    assert result.data["count"] == 3
    assert result.data["total"] == 3
    assert result.data["limited"] is False
    assert len(result.data["notes"]) == 3


@pytest.mark.asyncio
async def test_list_notes_with_pattern(mcp_server, mock_client):
    """Test listing with glob pattern"""
    mock_client.list_notes.return_value = [
        {"path": "concepts/ai.md"},
        {"path": "concepts/ml.md"}
    ]

    async with Client(mcp_server) as client:
        result = await client.call_tool(
            "list_notes",
            {"pattern": "concepts/*.md"}
        )

    assert result.data["pattern"] == "concepts/*.md"
    mock_client.list_notes.assert_called_once_with("concepts/*.md")


@pytest.mark.asyncio
async def test_list_notes_with_limit(mcp_server, mock_client):
    """Test result limiting"""
    # Return 150 notes
    mock_notes = [{"path": f"note{i}.md"} for i in range(150)]
    mock_client.list_notes.return_value = mock_notes

    async with Client(mcp_server) as client:
        result = await client.call_tool(
            "list_notes",
            {"limit": 50}
        )

    # Should return only 50
    assert result.data["count"] == 50
    assert result.data["total"] == 150
    assert result.data["limited"] is True
    assert len(result.data["notes"]) == 50
```

**Claude Desktop Test**:
```
List all notes in the "test" folder.
How many are there?
```

**Success Indicators**:
- Lists notes correctly
- Pattern filtering works
- Limit works correctly
- Results formatted clearly

---

### Task 3.4: Implement `search_notes` MCP Tool

**Title**: Implement search_notes MCP tool
**Active Form**: Implementing search_notes MCP tool
**Due Date**: 2025-10-24 3:30 PM
**Priority**: 🔼 Medium
**Time Estimate**: 1 hour
**Tags**: #mcp #fastmcp #tool #search #full-text

**Dependencies**: Task 3.3 (list_notes tool)

**Description**:
Create FastMCP tool for full-text search across vault content.

**Acceptance Criteria**:
1. ✅ `search_notes` tool registered
2. ✅ Full-text search via Obsidian API
3. ✅ Returns snippets with matches
4. ✅ Result limit validation
5. ✅ Unit tests
6. ✅ Works in Claude Desktop

**Implementation**:

**Add to** `src/tools/search_tools.py`:
```python
    @mcp.tool
    async def search_notes(
        query: Annotated[str, Field(
            description="Search query (supports Obsidian search syntax)",
            min_length=1
        )],
        limit: Annotated[int, Field(
            ge=1,
            le=100,
            description="Maximum results (1-100)"
        )] = 20,
        ctx: Context = None
    ) -> dict:
        """
        Full-text search across Obsidian vault content

        Searches note content for the given query using Obsidian's
        search engine. Returns matching notes with content snippets
        highlighting where the match occurred.

        Args:
            query: Search query (plain text or Obsidian search syntax)
            limit: Maximum results to return (default 20, max 100)

        Returns:
            Dict with:
            - results: List of matches with snippets
            - count: Number of results returned
            - query: Query that was executed

        Query Syntax (Obsidian):
            - "machine learning" - phrase search
            - tag:#ai - notes with tag
            - path:concepts/ - notes in folder
            - -draft - exclude word
            - AI OR ML - boolean OR
            - AI AND learning - boolean AND

        Examples:
            Simple search:
            >>> search_notes(query="temporal queries")

            Tag search:
            >>> search_notes(query="tag:#concept")

            Folder search:
            >>> search_notes(query="path:concepts/ AI")

            Boolean search:
            >>> search_notes(query="(AI OR ML) AND practical")

        Use Cases:
            - Find notes about specific topic
            - Locate notes with certain tags
            - Search within folder
            - Discovery and research

        Related Tools:
            - list_notes: List notes by pattern
            - read_note: Read full note content
        """
        if ctx:
            ctx.logger.info(f"Searching notes: {query} (limit={limit})")

        try:
            # Search via Obsidian API
            all_results = await client.search_notes(query)

            # Apply limit
            total_count = len(all_results)
            limited_results = all_results[:limit]
            was_limited = total_count > limit

            return {
                "success": True,
                "results": limited_results,
                "count": len(limited_results),
                "total": total_count,
                "query": query,
                "limited": was_limited,
                "message": f"Found {total_count} matches" +
                          (f" (showing first {limit})" if was_limited else "")
            }

        except ObsidianAPIError as e:
            raise ToolError(
                code="API_ERROR",
                message=f"Search failed: {str(e)}",
                data={"query": query}
            )

        except Exception as e:
            if ctx:
                ctx.logger.error(f"Unexpected error searching: {e}", exc_info=True)

            raise ToolError(
                code="INTERNAL_ERROR",
                message="An unexpected error occurred during search",
                data={"query": query}
            )
```

**Add Tests**:
```python
@pytest.mark.asyncio
async def test_search_notes_success(mcp_server, mock_client):
    """Test successful search"""
    mock_client.search_notes.return_value = [
        {
            "path": "concepts/ai.md",
            "snippet": "...about artificial intelligence and machine...",
            "matches": 2
        },
        {
            "path": "features/ai-agent.md",
            "snippet": "...AI agent integration...",
            "matches": 1
        }
    ]

    async with Client(mcp_server) as client:
        result = await client.call_tool(
            "search_notes",
            {"query": "AI"}
        )

    assert result.data["count"] == 2
    assert result.data["query"] == "AI"
    mock_client.search_notes.assert_called_once_with("AI")


@pytest.mark.asyncio
async def test_search_notes_with_limit(mcp_server, mock_client):
    """Test search result limiting"""
    mock_results = [{"path": f"note{i}.md", "snippet": "..."} for i in range(50)]
    mock_client.search_notes.return_value = mock_results

    async with Client(mcp_server) as client:
        result = await client.call_tool(
            "search_notes",
            {"query": "test", "limit": 10}
        )

    assert result.data["count"] == 10
    assert result.data["total"] == 50
    assert result.data["limited"] is True
```

**Claude Desktop Test**:
```
Search for all notes containing "FastMCP" and tell me what you find.
```

**Success Indicators**:
- Search returns relevant results
- Snippets show context
- Limit works correctly

---

### Task 3.5: Comprehensive Error Handling & Validation

**Title**: Enhance error handling and validation across all tools
**Active Form**: Enhancing error handling and validation
**Due Date**: 2025-10-24 5:00 PM
**Priority**: ⏫ High
**Time Estimate**: 1.5 hours
**Tags**: #error-handling #validation #security #robustness

**Dependencies**: Tasks 3.1-3.4 (all tools implemented)

**Description**:
Review and enhance error handling, add comprehensive validation, implement security checks.

**Acceptance Criteria**:
1. ✅ All tools have consistent error responses
2. ✅ Input validation covers edge cases
3. ✅ Security checks prevent malicious inputs
4. ✅ Error messages are clear and actionable
5. ✅ Logging captures all errors with context
6. ✅ Tests cover all error scenarios

**Implementation Checklist**:

**1. Path Validation Enhancement**:

Update `src/tools/note_tools.py`:
```python
def validate_path(path: str) -> str:
    """Enhanced path validation with security checks"""

    # Normalize path
    path = path.strip().strip("/")

    # Check for empty path
    if not path:
        raise ToolError(
            code="EMPTY_PATH",
            message="Path cannot be empty"
        )

    # Block directory traversal
    if ".." in path or path.startswith("/"):
        raise ToolError(
            code="INVALID_PATH",
            message="Path cannot contain '..' or start with '/'",
            data={"path": path, "reason": "Directory traversal attempt"}
        )

    # Block absolute paths (Windows and Unix)
    if path.startswith("\\") or (len(path) > 1 and path[1] == ":"):
        raise ToolError(
            code="INVALID_PATH",
            message="Absolute paths not allowed",
            data={"path": path}
        )

    # Block system paths
    protected = [".obsidian", "_system", "system", ".git"]
    path_lower = path.lower()
    if any(path_lower.startswith(p) for p in protected):
        raise ToolError(
            code="PROTECTED_PATH",
            message=f"Cannot access protected system path",
            data={"path": path, "protected_prefixes": protected}
        )

    # Ensure .md extension
    if not path.endswith(".md"):
        path += ".md"

    # Validate characters (allowlist)
    # Allow: alphanumeric, dash, underscore, slash, dot, space
    if not re.match(r'^[\w\-/\. ]+\.md$', path, re.UNICODE):
        raise ToolError(
            code="INVALID_CHARACTERS",
            message="Path contains invalid characters",
            data={
                "path": path,
                "allowed": "letters, numbers, -, _, /, ., space"
            }
        )

    # Check path length (prevent extremely long paths)
    if len(path) > 500:
        raise ToolError(
            code="PATH_TOO_LONG",
            message=f"Path exceeds maximum length of 500 characters",
            data={"path": path, "length": len(path)}
        )

    return path
```

**2. Frontmatter Validation**:

Add `src/utils/validation.py`:
```python
"""Validation utilities"""

from fastmcp.exceptions import ToolError
from typing import Any


def validate_frontmatter(fm: dict) -> dict:
    """
    Validate and sanitize frontmatter

    Checks:
    - Maximum depth (prevent nested bombs)
    - Maximum keys (prevent huge objects)
    - Value types (basic safety)
    - Reserved keys (prevent conflicts)

    Args:
        fm: Frontmatter dict

    Returns:
        Validated frontmatter

    Raises:
        ToolError: If validation fails
    """
    if not isinstance(fm, dict):
        raise ToolError(
            code="INVALID_FRONTMATTER",
            message="Frontmatter must be a dictionary"
        )

    # Check max keys
    if len(fm) > 100:
        raise ToolError(
            code="FRONTMATTER_TOO_LARGE",
            message=f"Frontmatter has too many keys ({len(fm)} > 100)"
        )

    # Check depth and types
    def check_value(value, depth=0):
        if depth > 5:
            raise ToolError(
                code="FRONTMATTER_TOO_DEEP",
                message="Frontmatter nesting too deep (max 5 levels)"
            )

        if isinstance(value, dict):
            for k, v in value.items():
                check_value(v, depth + 1)
        elif isinstance(value, list):
            for item in value:
                check_value(item, depth + 1)
        elif not isinstance(value, (str, int, float, bool, type(None))):
            raise ToolError(
                code="INVALID_FRONTMATTER_VALUE",
                message=f"Unsupported frontmatter value type: {type(value)}"
            )

    check_value(fm)

    # Reserved keys (system use)
    reserved = ["_internal", "_system", "_cache"]
    for key in fm.keys():
        if key in reserved:
            raise ToolError(
                code="RESERVED_FRONTMATTER_KEY",
                message=f"Frontmatter key '{key}' is reserved for system use",
                data={"reserved_keys": reserved}
            )

    return fm
```

**Update tools to use validation**:
```python
from ..utils.validation import validate_frontmatter

# In create_note, update_note:
if frontmatter:
    frontmatter = validate_frontmatter(frontmatter)
```

**3. Logging Enhancement**:

Add `src/utils/logging_config.py`:
```python
"""Logging configuration"""

import logging
import sys
from pathlib import Path


def setup_logging(log_file: str = None, level: str = "INFO"):
    """Configure logging for MCP server"""

    # Create formatter
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setFormatter(formatter)

    # File handler (if specified)
    handlers = [console_handler]
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        handlers.append(file_handler)

    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        handlers=handlers
    )

    return logging.getLogger(__name__)
```

**Update** `src/server.py`:
```python
from .utils.logging_config import setup_logging
from .utils.config import Config

# Setup logging
logger = setup_logging(
    log_file=Config.LOG_FILE,
    level=Config.LOG_LEVEL
)

logger.info("Weave-NN MCP Server starting...")
```

**4. Add Error Tests**:

**Create** `tests/test_error_handling.py`:
```python
"""Tests for error handling scenarios"""

import pytest
from fastmcp import FastMCP, Client
from src.server import mcp


@pytest.mark.asyncio
async def test_path_traversal_blocked():
    """Test security: path traversal blocked"""
    async with Client(mcp) as client:
        with pytest.raises(Exception) as exc:
            await client.call_tool(
                "create_note",
                {"path": "../../../etc/passwd.md", "content": "Hack"}
            )

        assert "invalid" in str(exc.value).lower()


@pytest.mark.asyncio
async def test_system_path_blocked():
    """Test security: system paths blocked"""
    async with Client(mcp) as client:
        protected_paths = [
            ".obsidian/workspace.md",
            "_system/internal.md",
            ".git/config.md"
        ]

        for path in protected_paths:
            with pytest.raises(Exception):
                await client.call_tool(
                    "create_note",
                    {"path": path, "content": "Should fail"}
                )


@pytest.mark.asyncio
async def test_frontmatter_validation():
    """Test frontmatter validation"""
    async with Client(mcp) as client:
        # Too deep nesting
        deep_fm = {"a": {"b": {"c": {"d": {"e": {"f": {"g": "too deep"}}}}}}}

        with pytest.raises(Exception) as exc:
            await client.call_tool(
                "create_note",
                {
                    "path": "test.md",
                    "content": "Content",
                    "frontmatter": deep_fm
                }
            )

        assert "deep" in str(exc.value).lower()


@pytest.mark.asyncio
async def test_empty_content_rejected():
    """Test that empty content is rejected"""
    async with Client(mcp) as client:
        with pytest.raises(Exception):
            await client.call_tool(
                "create_note",
                {"path": "test.md", "content": ""}
            )
```

**5. Run Security Audit**:

Create `scripts/security_audit.py`:
```python
#!/usr/bin/env python
"""Security audit script"""

import re
from pathlib import Path


def audit_code():
    """Check for common security issues"""

    issues = []

    # Check for hardcoded secrets
    src_files = Path("src").rglob("*.py")
    for file in src_files:
        content = file.read_text()

        # Check for API keys in code
        if re.search(r'api[_-]?key\s*=\s*["\'][^"\']+["\']', content, re.I):
            issues.append(f"{file}: Possible hardcoded API key")

        # Check for SQL-like operations (we shouldn't have any)
        if re.search(r'(SELECT|INSERT|UPDATE|DELETE)\s+', content, re.I):
            issues.append(f"{file}: SQL-like operation found")

        # Check for eval/exec
        if re.search(r'\b(eval|exec)\s*\(', content):
            issues.append(f"{file}: Dangerous eval/exec usage")

    return issues


if __name__ == "__main__":
    issues = audit_code()

    if issues:
        print("⚠️  Security Issues Found:")
        for issue in issues:
            print(f"  - {issue}")
        exit(1)
    else:
        print("✅ No security issues found")
        exit(0)
```

**Run Audit**:
```bash
python scripts/security_audit.py
```

**Success Indicators**:
- All security tests passing
- No hardcoded secrets
- Path validation bulletproof
- Error messages helpful but not leaky
- Logging captures all issues

---

### Task 3.6: Final Integration Testing & Documentation

**Title**: Complete Day 3 integration testing and documentation
**Active Form**: Completing Day 3 integration testing and documentation
**Due Date**: 2025-10-24 5:30 PM
**Priority**: ⏫ High
**Time Estimate**: 1.5 hours
**Tags**: #testing #documentation #integration #completion

**Dependencies**: Task 3.5 (Error handling complete)

**Description**:
Final validation of all 6 tools, comprehensive testing in Claude Desktop, and documentation completion.

**Acceptance Criteria**:
1. ✅ All 6 tools working in Claude Desktop
2. ✅ End-to-end workflows tested
3. ✅ README.md complete with examples
4. ✅ Code coverage >85%
5. ✅ All tests passing
6. ✅ Ready for production use

**Testing Workflows**:

**Workflow 1: Complete Note Lifecycle**:
```
Claude prompt:

1. Create a note at "test/lifecycle-test.md" with:
   Content: "# Lifecycle Test"
   Frontmatter: {"type": "test", "version": 1}

2. Read the note back and confirm the frontmatter

3. Update the note to add:
   - version: 2 in frontmatter
   - A new section "## Updated" in content

4. Read it again to verify the update

5. Delete the note (with confirmation)

6. Try to read it (should fail with not found error)
```

**Workflow 2: Discovery & Search**:
```
Claude prompt:

1. List all notes in the "concepts" folder

2. Search for notes containing "AI" or "artificial intelligence"

3. From the search results, read the first matching note

4. Summarize what you found
```

**Workflow 3: Error Handling**:
```
Claude prompt:

1. Try to create a note at ".obsidian/hack.md"
   (should fail with protected path error)

2. Try to create a note at "../etc/passwd.md"
   (should fail with invalid path error)

3. Create a note, then try to create it again
   (should fail with duplicate error)

4. Try to delete a note without confirmation
   (should fail with confirmation required error)
```

**Documentation Tasks**:

**1. Update README.md**:
```markdown
# Weave-NN MCP Server

FastMCP-powered server for Obsidian vault operations.

## Features

- ✅ **Full CRUD Operations**: Create, read, update, delete notes
- ✅ **Search & Discovery**: List and search notes across vault
- ✅ **Frontmatter Support**: Parse and serialize YAML frontmatter
- ✅ **Security**: Path validation, protection of system files
- ✅ **Error Handling**: Clear, actionable error messages
- ✅ **Type Safe**: Automatic schema generation from type hints

## Installation

### Prerequisites

- Python 3.10+
- Obsidian with Local REST API plugin installed
- FastMCP framework

### Setup

1. **Clone Repository**:
   ```bash
   git clone <repo-url>
   cd weave-nn-mcp
   ```

2. **Install Dependencies**:
   ```bash
   uv pip install -e ".[dev]"
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Obsidian API key
   ```

4. **Install to Claude Desktop**:
   ```bash
   fastmcp install claude-desktop src/server.py \
     --requirements requirements.txt
   ```

## Usage

### Available Tools

#### create_note
Create new note with optional frontmatter.

```python
create_note(
    path="concepts/machine-learning.md",
    content="# Machine Learning\n\nDefinition...",
    frontmatter={"type": "concept", "tags": ["ai", "ml"]}
)
```

#### read_note
Read note content and metadata.

```python
read_note(path="concepts/machine-learning.md")
# Returns: {content, frontmatter, raw}
```

#### update_note
Update existing note (merge or replace frontmatter).

```python
update_note(
    path="concepts/machine-learning.md",
    content="# ML (Updated)\n\nNew content...",
    frontmatter={"updated": "2025-10-24"},
    merge_frontmatter=True
)
```

#### delete_note
Delete note (requires confirmation).

```python
delete_note(
    path="temp/old-note.md",
    confirm=True
)
```

#### list_notes
List notes with optional glob pattern.

```python
list_notes(pattern="concepts/*.md", limit=50)
```

#### search_notes
Full-text search across vault.

```python
search_notes(query="temporal queries", limit=20)
```

## Testing

```bash
# Run all tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=src --cov-report=html

# Integration tests (requires Obsidian running)
pytest tests/integration/ -m integration
```

## Security

- ✅ Path validation prevents directory traversal
- ✅ System paths (.obsidian, _system, .git) are protected
- ✅ Frontmatter validation prevents malicious inputs
- ✅ Input sanitization on all user-provided data
- ✅ Deletion requires explicit confirmation

## Architecture

```
src/
├── server.py              # Main MCP server
├── clients/
│   └── obsidian_client.py # REST API client
├── tools/
│   ├── note_tools.py      # CRUD tools
│   └── search_tools.py    # Search tools
└── utils/
    ├── config.py          # Configuration
    ├── validation.py      # Input validation
    └── logging_config.py  # Logging setup
```

## Contributing

See CONTRIBUTING.md

## License

MIT License
```

**2. Create .env.example**:
```bash
# Obsidian REST API Configuration
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=your-api-key-here

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/mcp-server.log

# Development
ENV=development
```

**3. Create CHANGELOG.md**:
```markdown
# Changelog

## [1.0.0] - 2025-10-24

### Added
- Initial release
- FastMCP-based MCP server for Obsidian
- 6 core tools: create_note, read_note, update_note, delete_note, list_notes, search_notes
- Obsidian REST API client
- Comprehensive error handling and validation
- Security features (path validation, protected paths)
- Claude Desktop integration
- Full test suite (>85% coverage)

### Security
- Path validation prevents directory traversal
- System paths protected
- Frontmatter validation
- Deletion confirmation required
```

**Final Validation Commands**:
```bash
# 1. Run all tests
pytest tests/ -v --cov=src --cov-report=term

# 2. Check code quality
ruff check src/ tests/
ruff format src/ tests/ --check

# 3. Security audit
python scripts/security_audit.py

# 4. Type checking (optional)
mypy src/

# 5. Generate coverage report
pytest tests/ --cov=src --cov-report=html
open htmlcov/index.html
```

**Success Indicators**:
- All tests passing
- Coverage >85%
- No linting errors
- No security issues
- Documentation complete
- All tools work in Claude Desktop
- Ready for Phase 5 Day 4 (integration with other systems)

---

## Summary: Phase 5 Day 2-3 Task Completion Checklist

### Day 2 Tasks (Oct 23, 2025)
- [x] 2.1: FastMCP Development Environment Setup (1.5h)
- [x] 2.2: Obsidian REST API Client Implementation (2h)
- [x] 2.3: Implement `create_note` MCP Tool (1.5h)
- [x] 2.4: Implement `read_note` MCP Tool (1h)
- [x] 2.5: End-of-Day Testing & Validation (1.5h)

**Day 2 Total**: 7.5 hours

### Day 3 Tasks (Oct 24, 2025)
- [x] 3.1: Implement `update_note` MCP Tool (1.5h)
- [x] 3.2: Implement `delete_note` MCP Tool (1h)
- [x] 3.3: Implement `list_notes` MCP Tool (1h)
- [x] 3.4: Implement `search_notes` MCP Tool (1h)
- [x] 3.5: Comprehensive Error Handling & Validation (1.5h)
- [x] 3.6: Final Integration Testing & Documentation (1.5h)

**Day 3 Total**: 7.5 hours

**Phase 5 Day 2-3 Total**: 15 hours

---

## Key Deliverables

### Code Artifacts
1. ✅ FastMCP server (`src/server.py`)
2. ✅ Obsidian REST client (`src/clients/obsidian_client.py`)
3. ✅ Note tools module (`src/tools/note_tools.py`)
4. ✅ Search tools module (`src/tools/search_tools.py`)
5. ✅ Validation utilities (`src/utils/validation.py`)
6. ✅ Logging configuration (`src/utils/logging_config.py`)
7. ✅ Comprehensive test suite (>85% coverage)

### Documentation
1. ✅ README.md with setup and usage
2. ✅ .env.example for configuration
3. ✅ CHANGELOG.md tracking changes
4. ✅ Comprehensive tool docstrings
5. ✅ Security audit script

### Testing
1. ✅ Unit tests for all modules
2. ✅ Integration tests with live Obsidian
3. ✅ Claude Desktop E2E tests
4. ✅ Security tests (path traversal, etc.)
5. ✅ Error handling tests

---

## Dependencies for Next Phase

**Ready For**:
- Phase 5 Day 4: RabbitMQ integration (MCP server → event bus)
- Phase 5 Day 5: Git automation (auto-commit on changes)
- Phase 6: N8N workflow integration

**Provides**:
- Working MCP server with 6 tools
- Obsidian vault operations via Claude
- Foundation for agent automation
- Tested, secure, production-ready code

---

**Status**: ⏳ **READY TO START**
**Prerequisites**: Day 0-1 complete (Obsidian plugins, RabbitMQ, dev env)
**Estimated Completion**: 2025-10-24 6:00 PM
**Next**: [[phase-5-mvp-week-1#Day 4: Claude-Flow Agent Rules|Phase 5 Day 4]]
