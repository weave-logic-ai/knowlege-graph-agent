---
type: technical-primitive
category: library
status: in-use
first_used_phase: "PHASE-5"
mvp_required: true
future_only: false
maturity: mature

# Integration tracking
used_in_services:
  - event-consumer
  - git-autocommit-worker
deployment: docker-compose

# Relationships
alternatives_considered:
  - "subprocess git commands"
  - "pygit2 (libgit2 bindings)"
  - "dulwich (pure Python)"
replaces: null
replaced_by: null

# Documentation
decision: "[[../decisions/technical/git-automation-library]]"
architecture: "[[../architecture/event-consumer]]"

tags:
  - technical
  - library
  - in-use
  - mvp
  - git
  - automation
---

# GitPython

**Category**: Python Library
**Status**: In Use (MVP)
**First Used**: Phase 5 Day 5 (Week 1)

---

## Overview

GitPython is a Python library that provides a high-level interface to Git repositories. It wraps Git commands in Pythonic objects and methods, enabling programmatic version control operations without subprocess calls.

**Official Site**: https://github.com/gitpython-developers/GitPython
**Documentation**: https://gitpython.readthedocs.io/

---

## Why We Use It

GitPython enables automated Git workflow in Weave-NN, consuming file change events from RabbitMQ and creating commits when vault files are modified, supporting the auto-commit workflow that maintains version history.

**Primary Purpose**: Automate Git commits when Obsidian vault files change, creating a continuous version history without manual intervention.

**Specific Use Cases**:
- Auto-commit workflow: consume RabbitMQ events and create commits in [[../architecture/event-consumer]]
- Pre-commit hooks: validate commits before they're created
- Git status checking: detect uncommitted changes
- Repository introspection: analyze commit history and file changes
- Branch management: create feature branches for bulk operations

---

## Key Capabilities

- **Repository Manipulation**: Create commits, branches, tags programmatically - enables auto-commit workflow without CLI subprocess calls
- **Index Management**: Stage files, check status, handle merge conflicts - ensures atomic commits with proper staging
- **Commit History Access**: Read commits, diffs, blame information - supports future "time travel" feature to view vault state at any commit
- **Remote Operations**: Push, pull, fetch with authentication - enables future cloud sync to GitHub/GitLab
- **Pre-commit Hooks**: Validate changes before committing - prevents committing sensitive data or malformed YAML frontmatter

---

## Integration Points

**Used By**:
- [[../architecture/event-consumer]] - Consumes RabbitMQ file events and creates commits
- [[../features/daily-log-automation]] - Auto-commits daily notes
- [[../features/github-issues-integration]] - Syncs vault changes to GitHub

**Integrates With**:
- [[pika]] - Consumes file change events from RabbitMQ
- [[rabbitmq]] - Source of file change events
- [[python]] - Native Python library integration

**Enables Features**:
- [[../features/auto-commit-workflow]] - Automatic version control
- [[../features/time-travel]] - View vault state at any point in history
- [[../features/collaborative-editing]] - Sync changes via Git remotes

---

## Configuration

### Basic Auto-Commit Setup

```python
import git
import os
from datetime import datetime

def auto_commit_file(repo_path: str, file_path: str, commit_message: str = None):
    """
    Automatically commit a file change to Git repository.

    Args:
        repo_path: Path to Git repository (Obsidian vault)
        file_path: Path to changed file (relative to repo)
        commit_message: Optional commit message (auto-generated if None)
    """
    # Open repository
    repo = git.Repo(repo_path)

    # Stage the file
    repo.index.add([file_path])

    # Generate commit message if not provided
    if commit_message is None:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        commit_message = f"Auto-commit: {file_path} at {timestamp}"

    # Create commit
    repo.index.commit(commit_message)

    print(f"Committed: {commit_message}")


# Example: Auto-commit on file modification event
repo = git.Repo('/vault')
auto_commit_file('/vault', 'daily-notes/2025-10-23.md',
                 'Auto-commit: Daily note updated')
```

### Docker Compose Integration (MVP)

```yaml
git-autocommit-worker:
  build: ./services/event-consumer
  container_name: weave-git-worker
  volumes:
    - ./vault:/vault  # Read-write access for Git operations
    - ./git-config:/root/.gitconfig:ro  # Git user config
  environment:
    VAULT_PATH: /vault
    RABBITMQ_HOST: rabbitmq
    RABBITMQ_PORT: 5672
    RABBITMQ_QUEUE: file_events
    # Git configuration
    GIT_AUTHOR_NAME: "Weave-NN Bot"
    GIT_AUTHOR_EMAIL: "bot@weave-nn.local"
    GIT_COMMITTER_NAME: "Weave-NN Bot"
    GIT_COMMITTER_EMAIL: "bot@weave-nn.local"
    # Auto-commit settings
    AUTOCOMMIT_ENABLED: "true"
    AUTOCOMMIT_DEBOUNCE_SECONDS: "5"
    AUTOCOMMIT_BATCH_SIZE: "10"
  depends_on:
    - rabbitmq
  restart: unless-stopped
```

### Environment Variables

- `VAULT_PATH`: Path to Git repository (default: `/vault`)
- `GIT_AUTHOR_NAME`: Git commit author name (required)
- `GIT_AUTHOR_EMAIL`: Git commit author email (required)
- `AUTOCOMMIT_ENABLED`: Enable auto-commit workflow (default: `true`)
- `AUTOCOMMIT_DEBOUNCE_SECONDS`: Wait N seconds before committing (default: `5`)
- `AUTOCOMMIT_BATCH_SIZE`: Max files per commit (default: `10`)

### Key Configuration Files

- `/services/event-consumer/git_worker.py` - GitPython auto-commit implementation
- `/services/event-consumer/config.yaml` - Commit message templates
- `.gitconfig` - Git user configuration (mounted into container)

---

## Deployment

**MVP (Phase 5-6)**: Docker container with volume mount to Obsidian vault Git repository
**v1.0 (Post-MVP)**: Same deployment + remote push to GitHub/GitLab

**Resource Requirements**:
- RAM: 50-100 MB (lightweight Git operations)
- CPU: < 5% (event-driven commits)
- Storage: Depends on vault size + Git history (typically < 500 MB for MVP)

**Health Check**:
```bash
# Check if Git worker container is running
docker ps | grep weave-git-worker

# Check logs for commit activity
docker logs weave-git-worker --tail 50 --follow

# Verify Git repository is accessible
docker exec weave-git-worker git -C /vault status

# Check recent commits
docker exec weave-git-worker git -C /vault log --oneline -10

# Verify Git config
docker exec weave-git-worker git -C /vault config user.name
docker exec weave-git-worker git -C /vault config user.email
```

---

## Code Examples

### Complete Auto-Commit Event Consumer

```python
import os
import json
import time
import git
import pika
from datetime import datetime
from typing import Dict, List, Optional
from collections import defaultdict

class GitAutoCommitWorker:
    """
    Consumes file change events from RabbitMQ and creates Git commits.

    Features:
    - Debouncing: batches multiple changes into single commit
    - Pre-commit validation: checks for sensitive data
    - Error handling: continues on Git errors
    - Commit message generation: creates meaningful messages
    """

    def __init__(
        self,
        repo_path: str,
        rabbitmq_host: str,
        queue_name: str,
        debounce_seconds: int = 5,
        batch_size: int = 10
    ):
        self.repo = git.Repo(repo_path)
        self.debounce_seconds = debounce_seconds
        self.batch_size = batch_size

        # Track pending commits
        self.pending_files: Dict[str, str] = {}  # file_path -> event_type
        self.last_commit_time = time.time()

        # Connect to RabbitMQ
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=rabbitmq_host)
        )
        self.channel = connection.channel()
        self.channel.queue_declare(queue=queue_name, durable=True)
        self.queue_name = queue_name

    def _should_commit(self) -> bool:
        """Check if we should commit pending files (debounce logic)."""
        if not self.pending_files:
            return False

        # Commit if debounce time elapsed
        time_since_last = time.time() - self.last_commit_time
        if time_since_last >= self.debounce_seconds:
            return True

        # Commit if batch size reached
        if len(self.pending_files) >= self.batch_size:
            return True

        return False

    def _generate_commit_message(self, files: Dict[str, str]) -> str:
        """Generate meaningful commit message from file changes."""
        event_counts = defaultdict(int)
        for event_type in files.values():
            event_counts[event_type] += 1

        # Build message
        parts = []
        if event_counts['file.created']:
            parts.append(f"Created {event_counts['file.created']} file(s)")
        if event_counts['file.modified']:
            parts.append(f"Modified {event_counts['file.modified']} file(s)")
        if event_counts['file.deleted']:
            parts.append(f"Deleted {event_counts['file.deleted']} file(s)")

        message = "Auto-commit: " + ", ".join(parts)

        # Add file list if < 5 files
        if len(files) <= 5:
            message += "\n\nFiles:\n"
            for file_path in files.keys():
                message += f"- {file_path}\n"

        # Add timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        message += f"\nTimestamp: {timestamp}"

        return message

    def _validate_files(self, files: List[str]) -> List[str]:
        """
        Pre-commit validation: filter out files that shouldn't be committed.

        Returns: List of valid files to commit
        """
        valid_files = []

        for file_path in files:
            # Skip if file doesn't exist (deleted)
            full_path = os.path.join(self.repo.working_dir, file_path)
            if not os.path.exists(full_path):
                continue

            # Skip files with sensitive patterns
            if any(pattern in file_path for pattern in ['.env', 'secret', 'password', 'token']):
                print(f"SKIPPED (sensitive): {file_path}")
                continue

            # Skip large files (> 10 MB)
            if os.path.getsize(full_path) > 10 * 1024 * 1024:
                print(f"SKIPPED (too large): {file_path}")
                continue

            valid_files.append(file_path)

        return valid_files

    def _commit_pending_files(self):
        """Create Git commit for all pending files."""
        if not self.pending_files:
            return

        try:
            # Validate files
            files_to_commit = self._validate_files(list(self.pending_files.keys()))

            if not files_to_commit:
                print("No valid files to commit")
                self.pending_files.clear()
                return

            # Stage files
            self.repo.index.add(files_to_commit)

            # Check if there are actual changes
            if not self.repo.index.diff("HEAD"):
                print("No changes to commit (files unchanged)")
                self.pending_files.clear()
                return

            # Generate commit message
            commit_message = self._generate_commit_message(self.pending_files)

            # Create commit
            commit = self.repo.index.commit(commit_message)
            print(f"Created commit: {commit.hexsha[:7]} - {commit_message.split(':')[1].strip()}")

            # Clear pending files
            self.pending_files.clear()
            self.last_commit_time = time.time()

        except git.GitCommandError as e:
            print(f"Git error during commit: {e}")
            # Don't clear pending files - retry on next iteration
        except Exception as e:
            print(f"Unexpected error during commit: {e}")
            self.pending_files.clear()

    def _handle_message(self, ch, method, properties, body):
        """Handle incoming RabbitMQ message (file event)."""
        try:
            event = json.loads(body)
            event_type = event['event_type']
            file_path = event['file_path']

            # Normalize file path (remove /vault prefix if present)
            if file_path.startswith('/vault/'):
                file_path = file_path[7:]

            print(f"Received: {event_type} - {file_path}")

            # Add to pending files
            self.pending_files[file_path] = event_type

            # Check if we should commit
            if self._should_commit():
                self._commit_pending_files()

            # Acknowledge message
            ch.basic_ack(delivery_tag=method.delivery_tag)

        except Exception as e:
            print(f"Error handling message: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def start(self):
        """Start consuming messages from RabbitMQ."""
        print(f"Starting Git auto-commit worker...")
        print(f"Repository: {self.repo.working_dir}")
        print(f"Queue: {self.queue_name}")
        print(f"Debounce: {self.debounce_seconds}s, Batch size: {self.batch_size}")

        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(
            queue=self.queue_name,
            on_message_callback=self._handle_message
        )

        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            print("Stopping Git auto-commit worker...")
            self._commit_pending_files()  # Commit any pending changes
            self.channel.stop_consuming()


def main():
    """Start Git auto-commit worker."""
    worker = GitAutoCommitWorker(
        repo_path=os.getenv('VAULT_PATH', '/vault'),
        rabbitmq_host=os.getenv('RABBITMQ_HOST', 'localhost'),
        queue_name=os.getenv('RABBITMQ_QUEUE', 'file_events'),
        debounce_seconds=int(os.getenv('AUTOCOMMIT_DEBOUNCE_SECONDS', '5')),
        batch_size=int(os.getenv('AUTOCOMMIT_BATCH_SIZE', '10'))
    )
    worker.start()


if __name__ == '__main__':
    main()
```

### Pre-Commit Hook for Validation

```python
import git
import re
from typing import List, Tuple

def validate_commit(repo: git.Repo) -> Tuple[bool, List[str]]:
    """
    Pre-commit hook: validate staged changes before commit.

    Returns: (is_valid, error_messages)
    """
    errors = []

    # Get staged files
    staged_files = [item.a_path for item in repo.index.diff("HEAD")]

    for file_path in staged_files:
        full_path = os.path.join(repo.working_dir, file_path)

        # Skip if file doesn't exist (deleted)
        if not os.path.exists(full_path):
            continue

        # Only validate markdown files
        if not file_path.endswith('.md'):
            continue

        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check for sensitive data patterns
        sensitive_patterns = [
            r'password\s*=\s*["\'][^"\']+["\']',
            r'api[_-]?key\s*=\s*["\'][^"\']+["\']',
            r'secret\s*=\s*["\'][^"\']+["\']',
            r'token\s*=\s*["\'][^"\']+["\']'
        ]

        for pattern in sensitive_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                errors.append(f"{file_path}: Contains sensitive data pattern: {pattern}")

        # Validate YAML frontmatter (if present)
        if content.startswith('---'):
            try:
                import yaml
                frontmatter_end = content.find('---', 3)
                if frontmatter_end > 0:
                    frontmatter = content[3:frontmatter_end]
                    yaml.safe_load(frontmatter)  # Validate YAML syntax
            except yaml.YAMLError as e:
                errors.append(f"{file_path}: Invalid YAML frontmatter: {e}")

    return (len(errors) == 0, errors)


# Usage in auto-commit worker
if validate_commit(repo)[0]:
    repo.index.commit(commit_message)
else:
    print("Pre-commit validation failed:", validate_commit(repo)[1])
```

### Git Status Check

```python
import git

def check_git_status(repo_path: str):
    """Check Git repository status."""
    repo = git.Repo(repo_path)

    # Check if repo is dirty (has uncommitted changes)
    if repo.is_dirty():
        print("Repository has uncommitted changes:")

        # Show modified files
        modified = [item.a_path for item in repo.index.diff(None)]
        if modified:
            print("\nModified files:")
            for file_path in modified:
                print(f"  - {file_path}")

        # Show untracked files
        untracked = repo.untracked_files
        if untracked:
            print("\nUntracked files:")
            for file_path in untracked:
                print(f"  - {file_path}")
    else:
        print("Repository is clean (no uncommitted changes)")

    # Show recent commits
    print("\nRecent commits:")
    for commit in repo.iter_commits(max_count=5):
        print(f"  {commit.hexsha[:7]} - {commit.message.strip()}")


# Usage
check_git_status('/vault')
```

---

## Trade-offs

**Pros** (Why we chose it):
- ✅ **Pythonic API**: Object-oriented interface to Git - cleaner than subprocess calls
- ✅ **Full Git Support**: All Git operations available (commit, branch, merge, rebase)
- ✅ **Error Handling**: Exceptions for Git errors - better than parsing CLI output
- ✅ **Cross-Platform**: Works on Linux, macOS, Windows without changes
- ✅ **Mature & Stable**: 15+ years of production use, extensive community

**Cons** (What we accepted):
- ⚠️ **Requires Git Binary**: Wraps Git CLI (not pure Python) - mitigated by including Git in Docker image
- ⚠️ **Performance Overhead**: Slower than raw Git commands for bulk operations - acceptable for MVP event-driven workflow (< 1 commit/second)
- ⚠️ **Learning Curve**: Different API than Git CLI - mitigated by comprehensive documentation

---

## Alternatives Considered

**Compared With**:

### subprocess git commands
- **Pros**: Direct control over Git CLI, no library dependencies, most flexible
- **Cons**: Complex error handling (parse stderr), platform-specific paths, brittle string parsing
- **Decision**: Rejected because GitPython's object API is more maintainable and robust

### pygit2 (libgit2 bindings)
- **Pros**: Pure C library (fast), no Git binary required, low-level control
- **Cons**: Complex installation (needs libgit2), incomplete API coverage, harder to debug
- **Decision**: Rejected because GitPython's simplicity outweighs performance gains for MVP

### dulwich (pure Python)
- **Pros**: Pure Python (no Git binary), portable, easier to debug
- **Cons**: Incomplete Git protocol support, slower than native Git, less mature
- **Decision**: Rejected because GitPython's maturity and full Git support are critical for production

---

## Decision History

**Decision Record**: [[../decisions/technical/git-automation-library]]

**Key Reasoning**:
> "GitPython strikes the best balance between developer experience and reliability. The Pythonic API makes auto-commit logic readable and maintainable, while the mature library ensures robust Git operations. Wrapping the native Git binary gives us full Git feature support without reinventing version control. For Weave-NN's MVP, developer productivity and code clarity are more important than the minimal performance overhead."

**Date Decided**: 2025-10-15 (Phase 5 Day 5)
**Decided By**: System Architect

---

## Phase Usage

### Phase 5 Day 5 (MVP Week 1) - **Active**
- **Implementation**: Auto-commit event consumer with RabbitMQ integration
- **Scope**: Consume file change events and create commits
- **Features**: Debouncing, batch commits, commit message generation
- **Testing**: Unit tests for commit creation and validation

### Phase 6 (MVP Week 2) - **Enhanced**
- **Pre-commit Hooks**: Validate YAML frontmatter and sensitive data
- **Error Handling**: Retry logic for Git errors
- **Monitoring**: Health checks and commit rate metrics

### Phase 7 (v1.0) - **Extended**
- **Remote Push**: Push commits to GitHub/GitLab
- **Branch Strategy**: Feature branches for bulk operations
- **Conflict Resolution**: Handle merge conflicts automatically

---

## Learning Resources

**Official Documentation**:
- [GitPython Documentation](https://gitpython.readthedocs.io/) - Complete API reference
- [GitPython GitHub](https://github.com/gitpython-developers/GitPython) - Source code and examples

**Tutorials**:
- [GitPython Tutorial](https://gitpython.readthedocs.io/en/stable/tutorial.html) - Official quickstart
- [Automating Git with Python](https://realpython.com/python-git-github-intro/) - Real Python guide

**Best Practices**:
- [GitPython Best Practices](https://github.com/gitpython-developers/GitPython/wiki/Best-Practices) - Production patterns
- [Git Automation Patterns](https://www.atlassian.com/git/tutorials/git-hooks) - Hook integration

**Community**:
- [GitPython GitHub Issues](https://github.com/gitpython-developers/GitPython/issues) - Bug reports
- [Stack Overflow: gitpython](https://stackoverflow.com/questions/tagged/gitpython) - Community Q&A

---

## Monitoring & Troubleshooting

**Health Checks**:
```bash
# Check if Git worker container is running
docker ps | grep weave-git-worker

# Check logs for commit activity
docker logs weave-git-worker --tail 50 --follow

# Verify Git repository is accessible
docker exec weave-git-worker git -C /vault status

# Check recent commits
docker exec weave-git-worker git -C /vault log --oneline -10

# Verify Git user config
docker exec weave-git-worker git config user.name
docker exec weave-git-worker git config user.email

# Check for uncommitted changes
docker exec weave-git-worker git -C /vault diff --stat
```

**Common Issues**:

1. **Issue**: Git commits fail with "Please tell me who you are"
   **Solution**:
   - Set `GIT_AUTHOR_NAME` and `GIT_AUTHOR_EMAIL` environment variables
   - Mount `.gitconfig` file into container
   - Run: `git config user.name "Weave-NN Bot"`

2. **Issue**: Repository becomes dirty with uncommitted changes
   **Solution**:
   - Check if debounce timeout is too long
   - Manually trigger commit: `docker exec weave-git-worker python git_worker.py --commit-now`
   - Review logs for commit errors

3. **Issue**: Commits include files they shouldn't (e.g., `.DS_Store`)
   **Solution**:
   - Add patterns to `.gitignore` in vault
   - Update `_validate_files()` to filter unwanted files
   - Clean up with: `git rm --cached <file>`

4. **Issue**: Large Git history slows down operations
   **Solution**:
   - Use shallow clone: `git clone --depth 1`
   - Prune old commits: `git gc --aggressive`
   - Consider Git LFS for large files

---

## Related Nodes

**Architecture**:
- [[../architecture/event-consumer]] - Git auto-commit worker implementation
- [[../architecture/event-driven-architecture]] - How Git commits fit in event flow

**Features**:
- [[../features/auto-commit-workflow]] - Automatic version control feature
- [[../features/time-travel]] - View vault at any commit
- [[../features/collaborative-editing]] - Sync via Git remotes

**Decisions**:
- [[../decisions/technical/git-automation-library]] - Why GitPython over alternatives
- [[../decisions/technical/autocommit-strategy]] - Debouncing and batching decisions

**Other Primitives**:
- [[pika]] - RabbitMQ client that provides file events
- [[rabbitmq]] - Message broker for file change events
- [[python]] - Programming language for Git worker

---

## Revisit Criteria

**Reconsider this technology if**:
- Commit performance degrades below 10 commits/second (currently not an issue)
- Git binary dependencies cause deployment issues
- Pure Python Git implementation (dulwich) matures significantly
- Need for advanced Git features (submodules, worktrees) arises

**Scheduled Review**: 2026-06-01 (6 months after v1.0 launch)

---

**Back to**: [[README|Technical Primitives Index]]
