# Phase 6 MVP Week 2 - Task Breakdown (Days 8-14)

**Total Tasks**: 44
**Duration**: October 28 - November 3, 2025 (7 days)
**Depends On**: Phase 5 completion

---

## Day 8 (2025-10-28): N8N Installation + Client Onboarding

### Morning: N8N Installation (4 hours)

#### Task 1: Install N8N via Docker
- [ ] Install N8N via Docker ⏫ 📅 2025-10-28 #n8n #installation #docker
**Active Form**: Installing N8N via Docker
**Priority**: ⏫ High
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #installation #docker #automation #infrastructure
**Dependencies**:
  - Docker installed on target system (GCP VM or local)
  - Network access to Docker Hub
**Acceptance Criteria**:
  - Docker container `n8n` running on port 5678
  - Container auto-restarts on failure (restart policy configured)
  - Data persisted to `~/.n8n` volume
  - Environment variables set for basic auth
  - Container logs accessible via `docker logs n8n`
**Test Scenarios**:
  - Run `docker ps | grep n8n` shows container status as "Up"
  - Access http://localhost:5678 shows N8N login page
  - Stop container and verify auto-restart
  - Verify volume persistence: create workflow, restart container, workflow still exists

---

#### Task 2: Complete N8N initial setup
- [ ] Complete N8N initial setup ⏫ 📅 2025-10-28 #n8n #configuration
**Active Form**: Completing N8N initial setup
**Priority**: ⏫ High
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #configuration #setup #authentication
**Dependencies**:
  - Task 1: N8N Docker container running
**Acceptance Criteria**:
  - Successfully login with configured credentials
  - Initial setup wizard completed
  - N8N dashboard accessible
  - Timezone configured correctly
  - Workflow execution history visible
**Test Scenarios**:
  - Login with credentials from environment variables
  - Navigate to "Workflows" tab without errors
  - Check Settings → General shows correct timezone
  - Verify webhook base URL is configured

---

#### Task 3: Configure N8N credentials for Obsidian API
- [ ] Configure N8N credentials for Obsidian API 🔼 📅 2025-10-28 #n8n #credentials #obsidian
**Active Form**: Configuring N8N credentials for Obsidian API
**Priority**: 🔼 Medium
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #credentials #obsidian #api #integration
**Dependencies**:
  - Task 2: N8N setup completed
  - Obsidian REST API plugin installed with API key
**Acceptance Criteria**:
  - Credential named "Obsidian API" created in N8N
  - Contains REST API base URL (http://localhost:27124)
  - Contains API key from Obsidian plugin
  - Test connection successful
**Test Scenarios**:
  - Create HTTP Request node in test workflow
  - Use Obsidian API credential
  - Make GET request to `/vault/` endpoint
  - Verify response contains vault metadata

---

#### Task 4: Configure N8N credentials for GitHub
- [ ] Configure N8N credentials for GitHub 🔼 📅 2025-10-28 #n8n #credentials #github
**Active Form**: Configuring N8N credentials for GitHub
**Priority**: 🔼 Medium
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #credentials #github #api #integration
**Dependencies**:
  - Task 2: N8N setup completed
  - GitHub personal access token with repo permissions
**Acceptance Criteria**:
  - Credential named "GitHub PAT" created
  - Personal access token configured
  - Test connection successful (can access repositories)
**Test Scenarios**:
  - Create GitHub node in test workflow
  - List repositories for authenticated user
  - Verify response contains repository list

---

#### Task 5: Configure N8N credentials for Slack
- [ ] Configure N8N credentials for Slack 🔼 📅 2025-10-28 #n8n #credentials #slack
**Active Form**: Configuring N8N credentials for Slack
**Priority**: 🔼 Medium
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #credentials #slack #webhook #notifications
**Dependencies**:
  - Task 2: N8N setup completed
  - Slack webhook URL or OAuth app configured
**Acceptance Criteria**:
  - Credential named "Slack Webhook" created
  - Webhook URL configured
  - Test message sent successfully to target channel
**Test Scenarios**:
  - Create Slack node in test workflow
  - Send test message "N8N setup complete"
  - Verify message appears in Slack channel

---

#### Task 6: Configure N8N credentials for Claude API
- [ ] Configure N8N credentials for Claude API 🔼 📅 2025-10-28 #n8n #credentials #claude
**Active Form**: Configuring N8N credentials for Claude API
**Priority**: 🔼 Medium
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #credentials #claude #ai #anthropic
**Dependencies**:
  - Task 2: N8N setup completed
  - Claude API key from Anthropic Console
**Acceptance Criteria**:
  - Credential named "Claude API" created
  - API key configured
  - Test API call successful
**Test Scenarios**:
  - Create HTTP Request node
  - Make POST to https://api.anthropic.com/v1/messages
  - Send simple prompt "Say hello"
  - Verify response contains Claude's message

---

#### Task 7: Configure N8N credentials for RabbitMQ
- [ ] Configure N8N credentials for RabbitMQ 🔼 📅 2025-10-28 #n8n #credentials #rabbitmq
**Active Form**: Configuring N8N credentials for RabbitMQ
**Priority**: 🔼 Medium
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #credentials #rabbitmq #messaging #events
**Dependencies**:
  - Task 2: N8N setup completed
  - Phase 5: RabbitMQ running from Phase 5
**Acceptance Criteria**:
  - Credential named "RabbitMQ" created
  - Connection URL configured (amqp://localhost:5672)
  - Test connection successful
**Test Scenarios**:
  - Create RabbitMQ node
  - Connect to exchange
  - Publish test message
  - Verify message received in queue

---

#### Task 8: Create and test N8N Hello World workflow
- [ ] Create and test N8N Hello World workflow 🔽 📅 2025-10-28 #n8n #testing #validation
**Active Form**: Creating and testing N8N Hello World workflow
**Priority**: 🔽 Low
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #testing #validation #workflow
**Dependencies**:
  - Task 2: N8N setup completed
  - At least one credential configured
**Acceptance Criteria**:
  - Simple workflow created with 2+ nodes
  - Workflow executes successfully
  - Execution history shows success
  - Can manually trigger workflow
**Test Scenarios**:
  - Create workflow: Manual Trigger → Set node (data) → Webhook Response
  - Execute workflow manually
  - Verify execution completes without errors
  - Check execution data contains expected output

---

### Afternoon: Client Onboarding Workflow (4 hours)

#### Task 9: Create client onboarding workflow structure
- [ ] Create client onboarding workflow structure ⏫ 📅 2025-10-28 #n8n #workflow #client-onboarding
**Active Form**: Creating client onboarding workflow structure
**Priority**: ⏫ High
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #workflow #client-onboarding #automation
**Dependencies**:
  - Task 2: N8N setup completed
  - Task 3: Obsidian API credentials configured
**Acceptance Criteria**:
  - Workflow named "Client Onboarding" created
  - Webhook trigger configured at `/webhook/onboard-client`
  - Accepts POST with JSON: `{"client_name": "...", "contact": "..."}`
  - All 10 steps from plan implemented as nodes
**Test Scenarios**:
  - Webhook URL accessible
  - Send test payload with curl
  - Workflow executes all nodes in sequence
  - No execution errors

---

#### Task 10: Implement project folder creation in workflow
- [ ] Implement project folder creation in workflow 🔼 📅 2025-10-28 #n8n #workflow #filesystem
**Active Form**: Implementing project folder creation in workflow
**Priority**: 🔼 Medium
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #workflow #filesystem #obsidian
**Dependencies**:
  - Task 9: Client onboarding workflow structure created
**Acceptance Criteria**:
  - Node creates folder `_projects/{{client_name}}/`
  - Uses Obsidian REST API `/vault/{{path}}`
  - Folder created in Obsidian vault
  - Handles existing folder gracefully (no error)
**Test Scenarios**:
  - Trigger workflow with client_name "TestClient"
  - Verify folder `_projects/TestClient/` exists in vault
  - Trigger again with same name, no duplicate error
  - Check Obsidian file explorer shows folder

---

#### Task 11: Implement template file creation (4 files)
- [ ] Implement template file creation (4 files) 🔼 📅 2025-10-28 #n8n #workflow #templates
**Active Form**: Implementing template file creation
**Priority**: 🔼 Medium
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #workflow #templates #obsidian #files
**Dependencies**:
  - Task 10: Project folder creation working
  - Templates exist: README.md, requirements.md, tasks.md, decisions.md
**Acceptance Criteria**:
  - 4 files created: README.md, requirements.md, tasks.md, decisions.md
  - Template content loaded from `_templates/` folder
  - Placeholders replaced: `{{client_name}}`, `{{contact}}`
  - Files contain frontmatter with correct metadata
**Test Scenarios**:
  - Trigger workflow with client_name "Acme Corp", contact "john@acme.com"
  - Verify 4 files exist in `_projects/Acme Corp/`
  - Open README.md, verify "Acme Corp" appears in title
  - Verify contact email "john@acme.com" in metadata

---

#### Task 12: Implement initial task creation
- [ ] Implement initial task creation 🔼 📅 2025-10-28 #n8n #workflow #tasks
**Active Form**: Implementing initial task creation
**Priority**: 🔼 Medium
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #workflow #tasks #automation
**Dependencies**:
  - Task 11: Template files created
**Acceptance Criteria**:
  - 3 initial tasks appended to tasks.md
  - Tasks use obsidian-tasks format: `- [ ] Task 📅 YYYY-MM-DD`
  - Due dates calculated dynamically (next Monday, etc.)
  - Tasks tagged with #onboarding
**Test Scenarios**:
  - Trigger workflow on Thursday
  - Verify "Schedule kickoff meeting" has due date = next Monday
  - Open tasks.md, verify 3 tasks present
  - Tasks are unchecked `- [ ]`

---

#### Task 13: Implement Git commit step
- [ ] Implement Git commit step 🔼 📅 2025-10-28 #n8n #workflow #git
**Active Form**: Implementing Git commit step
**Priority**: 🔼 Medium
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #workflow #git #version-control
**Dependencies**:
  - Task 11: Files created
  - Git repository initialized in vault
**Acceptance Criteria**:
  - Execute shell command node with git commands
  - Commit message: "feat: Initialize project for {{client_name}}"
  - All new files staged and committed
  - Commit appears in git log
**Test Scenarios**:
  - Trigger workflow
  - Run `git log -1` in vault directory
  - Verify commit message contains client name
  - Run `git show` to see committed files

---

#### Task 14: Implement Slack notification
- [ ] Implement Slack notification 🔽 📅 2025-10-28 #n8n #workflow #slack
**Active Form**: Implementing Slack notification
**Priority**: 🔽 Low
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #workflow #slack #notifications
**Dependencies**:
  - Task 5: Slack credentials configured
  - Task 13: Git commit successful
**Acceptance Criteria**:
  - Slack message sent on workflow completion
  - Message includes client name and project link
  - Message formatted with markdown
  - Sent to correct channel (#new-projects or similar)
**Test Scenarios**:
  - Trigger workflow
  - Check Slack channel for notification
  - Verify message contains client name
  - Click link (if included) navigates to project

---

#### Task 15: Test complete client onboarding workflow
- [ ] Test complete client onboarding workflow ⏫ 📅 2025-10-28 #n8n #testing #integration
**Active Form**: Testing complete client onboarding workflow
**Priority**: ⏫ High
**Due Date**: 2025-10-28
**Tags**: #phase-6 #n8n #testing #integration #validation
**Dependencies**:
  - All tasks 9-14 completed
**Acceptance Criteria**:
  - End-to-end test with real client data passes
  - All files created correctly
  - Git commit exists
  - Slack notification sent (if configured)
  - No execution errors
  - Execution time < 30 seconds
**Test Scenarios**:
  1. **Test 1 - New Client**:
     - Trigger with `{"client_name": "Test Corp", "contact": "test@test.com"}`
     - Verify folder exists: `_projects/Test Corp/`
     - Verify 4 files created with correct content
     - Verify 3 tasks in tasks.md
     - Verify git commit with message "feat: Initialize project for Test Corp"
     - Verify Slack notification received
  2. **Test 2 - Special Characters**:
     - Trigger with `{"client_name": "A&B Solutions", "contact": "info@ab.com"}`
     - Verify folder handles special characters
  3. **Test 3 - Duplicate Client**:
     - Trigger with existing client name
     - Verify no errors (graceful handling)

---

## Day 9 (2025-10-29): N8N Advanced Workflows

### Morning: Weekly Report Generator (4 hours)

#### Task 16: Create weekly report workflow structure
- [ ] Create weekly report workflow structure ⏫ 📅 2025-10-29 #n8n #workflow #reporting
**Active Form**: Creating weekly report workflow structure
**Priority**: ⏫ High
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #reporting #automation #cron
**Dependencies**:
  - Task 2: N8N setup completed
  - Task 3: Obsidian API credentials configured
**Acceptance Criteria**:
  - Workflow named "Weekly Report Generator" created
  - Cron trigger configured (Every Friday at 5pm)
  - Workflow has all 7 steps from plan
  - Can be manually triggered for testing
**Test Scenarios**:
  - Manual trigger executes workflow
  - Cron expression validated: `0 17 * * 5` (5pm Friday)
  - All nodes connected in correct order

---

#### Task 17: Implement task completion query
- [ ] Implement task completion query 🔼 📅 2025-10-29 #n8n #workflow #tasks
**Active Form**: Implementing task completion query
**Priority**: 🔼 Medium
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #tasks #parsing #data
**Dependencies**:
  - Task 16: Workflow structure created
**Acceptance Criteria**:
  - Query all `_projects/*/tasks.md` files
  - Parse tasks with status `[x]` (completed)
  - Filter tasks completed in last 7 days (by date)
  - Group tasks by project
  - Return structured data: `[{project: "...", tasks: [...]}]`
**Test Scenarios**:
  - Create test project with 5 completed tasks
  - 3 tasks completed this week, 2 completed last month
  - Trigger workflow, verify only 3 tasks included
  - Verify tasks grouped by project name

---

#### Task 18: Implement Git commit statistics
- [ ] Implement Git commit statistics 🔼 📅 2025-10-29 #n8n #workflow #git
**Active Form**: Implementing Git commit statistics
**Priority**: 🔼 Medium
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #git #statistics #metrics
**Dependencies**:
  - Task 16: Workflow structure created
**Acceptance Criteria**:
  - Execute git command: `git log --since="7 days ago" --oneline`
  - Parse output to count commits
  - Extract commit messages
  - Group by author (if multi-user)
**Test Scenarios**:
  - Create 5 test commits in past week
  - Create 2 test commits older than 7 days
  - Trigger workflow, verify count = 5
  - Verify commit messages extracted correctly

---

#### Task 19: Implement Claude summary generation
- [ ] Implement Claude summary generation 🔼 📅 2025-10-29 #n8n #workflow #claude
**Active Form**: Implementing Claude summary generation
**Priority**: 🔼 Medium
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #claude #ai #llm
**Dependencies**:
  - Task 6: Claude API credentials configured
  - Task 17: Task data available
  - Task 18: Git stats available
**Acceptance Criteria**:
  - Send prompt to Claude API with tasks + commits data
  - Prompt: "Create weekly report from: {{tasks}} {{commits}}"
  - Response formatted as markdown
  - Includes sections: Summary, Highlights, Metrics
**Test Scenarios**:
  - Trigger workflow with sample data
  - Verify Claude API called
  - Verify response is valid markdown
  - Verify response includes task count and commit count

---

#### Task 20: Implement report file creation
- [ ] Implement report file creation 🔼 📅 2025-10-29 #n8n #workflow #obsidian
**Active Form**: Implementing report file creation
**Priority**: 🔼 Medium
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #obsidian #files #reports
**Dependencies**:
  - Task 19: Claude summary generated
**Acceptance Criteria**:
  - Create file: `_planning/weekly-reports/YYYY-MM-DD.md`
  - File contains Claude summary + task breakdown
  - Frontmatter includes: date, total_tasks, total_commits
  - File created via Obsidian REST API
**Test Scenarios**:
  - Trigger workflow on 2025-10-29
  - Verify file created: `_planning/weekly-reports/2025-10-29.md`
  - Open file, verify contains summary and task list
  - Verify frontmatter has correct metadata

---

#### Task 21: Implement Slack report notification
- [ ] Implement Slack report notification 🔽 📅 2025-10-29 #n8n #workflow #slack
**Active Form**: Implementing Slack report notification
**Priority**: 🔽 Low
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #slack #notifications #reporting
**Dependencies**:
  - Task 5: Slack credentials configured
  - Task 20: Report file created
**Acceptance Criteria**:
  - Slack message sent to #weekly-updates channel
  - Message includes summary text (first 500 chars)
  - Message includes link to full report (if vault is web-accessible)
  - Message formatted with markdown
**Test Scenarios**:
  - Trigger workflow
  - Check Slack channel for message
  - Verify summary text matches report
  - Verify no errors if Slack fails (graceful degradation)

---

#### Task 22: Test weekly report workflow end-to-end
- [ ] Test weekly report workflow end-to-end ⏫ 📅 2025-10-29 #n8n #testing #integration
**Active Form**: Testing weekly report workflow end-to-end
**Priority**: ⏫ High
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #testing #integration #validation #reporting
**Dependencies**:
  - All tasks 16-21 completed
**Acceptance Criteria**:
  - Full workflow execution successful
  - Report generated with accurate data
  - Execution time < 30 seconds
  - No errors in execution log
**Test Scenarios**:
  1. **Scenario 1 - Real Data**:
     - Set up 2 projects with completed tasks
     - Create 5 git commits this week
     - Manually trigger workflow
     - Verify report shows 2 projects
     - Verify task count matches actual
     - Verify commit count = 5
     - Verify Claude summary is coherent
  2. **Scenario 2 - No Activity**:
     - Trigger workflow with no tasks/commits this week
     - Verify report generated with "No activity" message
  3. **Scenario 3 - Cron Trigger**:
     - Wait for Friday 5pm OR modify cron to trigger in 1 minute
     - Verify automatic execution

---

### Afternoon: Knowledge Extraction Workflow (4 hours)

#### Task 23: Create knowledge extraction workflow structure
- [ ] Create knowledge extraction workflow structure ⏫ 📅 2025-10-29 #n8n #workflow #knowledge
**Active Form**: Creating knowledge extraction workflow structure
**Priority**: ⏫ High
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #knowledge #patterns #automation
**Dependencies**:
  - Task 2: N8N setup completed
  - Task 7: RabbitMQ credentials configured
**Acceptance Criteria**:
  - Workflow named "Knowledge Extraction" created
  - RabbitMQ trigger listening to `project.closed` events
  - Workflow has all 6 steps from plan
  - Can be manually triggered with project_id parameter
**Test Scenarios**:
  - Publish test event to RabbitMQ: `{"type": "project.closed", "project_id": "test-project"}`
  - Verify workflow triggers automatically
  - Manual trigger with project_id works

---

#### Task 24: Implement project file reading
- [ ] Implement project file reading 🔼 📅 2025-10-29 #n8n #workflow #obsidian
**Active Form**: Implementing project file reading
**Priority**: 🔼 Medium
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #obsidian #files #data
**Dependencies**:
  - Task 23: Workflow structure created
  - Task 3: Obsidian API credentials configured
**Acceptance Criteria**:
  - Read 4 project files: requirements.md, decisions.md, solutions.md, lessons-learned.md
  - Handle missing files gracefully (skip if not exists)
  - Concatenate file contents
  - Pass to next node
**Test Scenarios**:
  - Create test project with all 4 files
  - Trigger workflow, verify all 4 files read
  - Create project with only 2 files, verify no error

---

#### Task 25: Implement Claude pattern extraction
- [ ] Implement Claude pattern extraction 🔼 📅 2025-10-29 #n8n #workflow #claude
**Active Form**: Implementing Claude pattern extraction
**Priority**: 🔼 Medium
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #claude #ai #patterns #extraction
**Dependencies**:
  - Task 6: Claude API credentials configured
  - Task 24: Project files read
**Acceptance Criteria**:
  - Send prompt to Claude: "Extract reusable patterns from: {{files}}"
  - Claude returns structured JSON with categories:
    - domain_patterns: [...]
    - technical_patterns: [...]
    - components: [...]
    - lessons: [...]
  - Parse Claude response
**Test Scenarios**:
  - Send sample project files to Claude
  - Verify response is valid JSON
  - Verify response contains at least 1 pattern in each category
  - Handle edge case: Claude returns empty arrays

---

#### Task 26: Implement knowledge base file creation
- [ ] Implement knowledge base file creation 🔼 📅 2025-10-29 #n8n #workflow #knowledge-base
**Active Form**: Implementing knowledge base file creation
**Priority**: 🔼 Medium
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #knowledge-base #obsidian #files
**Dependencies**:
  - Task 25: Patterns extracted from Claude
**Acceptance Criteria**:
  - Create files in knowledge-base folders:
    - `knowledge-base/patterns/domain/{{pattern}}.md`
    - `knowledge-base/patterns/technical/{{pattern}}.md`
    - `knowledge-base/components/{{component}}.md`
    - `knowledge-base/lessons/{{lesson}}.md`
  - Each file has frontmatter with metadata
  - Files contain pattern description from Claude
**Test Scenarios**:
  - Trigger workflow with project containing 2 domain patterns
  - Verify 2 files created in knowledge-base/patterns/domain/
  - Open files, verify content matches Claude output
  - Verify frontmatter includes source_project

---

#### Task 27: Implement pattern index update
- [ ] Implement pattern index update 🔼 📅 2025-10-29 #n8n #workflow #indexing
**Active Form**: Implementing pattern index update
**Priority**: 🔼 Medium
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #indexing #knowledge-base #metadata
**Dependencies**:
  - Task 26: Knowledge base files created
**Acceptance Criteria**:
  - Append new patterns to `knowledge-base/meta/pattern-index.md`
  - Index entry format: `- [[pattern-name]] - {{category}} - Source: [[project]]`
  - Index sorted alphabetically
  - No duplicate entries
**Test Scenarios**:
  - Trigger workflow with 3 new patterns
  - Open pattern-index.md
  - Verify 3 new entries appended
  - Trigger again with same project, verify no duplicates

---

#### Task 28: Implement project archival
- [ ] Implement project archival 🔼 📅 2025-10-29 #n8n #workflow #git
**Active Form**: Implementing project archival
**Priority**: 🔼 Medium
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #workflow #git #archival #cleanup
**Dependencies**:
  - Task 26: Knowledge extracted
**Acceptance Criteria**:
  - Execute git mv: `_projects/{{project_id}}` → `_archive/{{project_id}}-{{date}}`
  - Git commit with message: "chore: Archive {{project_id}}"
  - Original project folder removed from _projects/
  - Archived folder exists in _archive/
**Test Scenarios**:
  - Trigger workflow with test project
  - Verify project moved to _archive/
  - Run `git log -1`, verify commit message
  - Verify original folder no longer in _projects/

---

#### Task 29: Test knowledge extraction workflow end-to-end
- [ ] Test knowledge extraction workflow end-to-end ⏫ 📅 2025-10-29 #n8n #testing #integration
**Active Form**: Testing knowledge extraction workflow end-to-end
**Priority**: ⏫ High
**Due Date**: 2025-10-29
**Tags**: #phase-6 #n8n #testing #integration #validation #knowledge
**Dependencies**:
  - All tasks 23-28 completed
**Acceptance Criteria**:
  - Full workflow execution successful
  - Patterns extracted and saved
  - Project archived
  - Execution time < 60 seconds
  - No errors in execution log
**Test Scenarios**:
  1. **Scenario 1 - Complete Project**:
     - Create test project with all 4 files (requirements, decisions, solutions, lessons)
     - Populate with realistic content
     - Publish RabbitMQ event: `{"type": "project.closed", "project_id": "test-project"}`
     - Verify workflow triggers
     - Verify 4+ knowledge base files created
     - Verify pattern index updated
     - Verify project archived to _archive/test-project-2025-10-29/
  2. **Scenario 2 - Minimal Project**:
     - Create project with only requirements.md
     - Trigger workflow
     - Verify handles missing files gracefully
     - Verify at least 1 pattern extracted

---

## Day 10 (2025-10-30): Task Management Integration

### Morning: Obsidian Tasks MCP Integration (4 hours)

#### Task 30: Configure obsidian-tasks plugin
- [ ] Configure obsidian-tasks plugin 🔼 📅 2025-10-30 #obsidian #tasks #configuration
**Active Form**: Configuring obsidian-tasks plugin
**Priority**: 🔼 Medium
**Due Date**: 2025-10-30
**Tags**: #phase-6 #obsidian #tasks #configuration #plugin
**Dependencies**:
  - obsidian-tasks plugin installed in Obsidian
**Acceptance Criteria**:
  - Plugin enabled in Obsidian settings
  - Global filter configured (if needed)
  - Task query syntax tested in Obsidian
  - Can query: `not done`, `due before tomorrow`, `#project/weave-nn`
**Test Scenarios**:
  - Create test note with task queries
  - Verify queries return expected results
  - Verify task emojis render correctly (📅, ⏫, 🔼)

---

#### Task 31: Create task parser utility
- [ ] Create task parser utility 🔼 📅 2025-10-30 #python #tasks #parsing
**Active Form**: Creating task parser utility
**Priority**: 🔼 Medium
**Due Date**: 2025-10-30
**Tags**: #phase-6 #python #tasks #parsing #utility #backend
**Dependencies**:
  - None (standalone utility)
**Acceptance Criteria**:
  - File created: `/mnt/d/weavelogic/weavelogic-nn/weave-nn/utils/task_parser.py`
  - Class `TaskParser` with methods:
    - `parse_tasks_from_file(content)` → returns list of task dicts
    - `extract_due_date(text)` → returns date string or None
    - `extract_priority(text)` → returns 'high'|'medium'|'low'|'normal'
    - `extract_tags(text)` → returns list of tag strings
  - Supports obsidian-tasks format
  - Unit tests pass
**Test Scenarios**:
  - Test task: `- [ ] Test task 📅 2025-10-30 ⏫ #test`
  - Parse and verify:
    - status = 'todo'
    - due_date = '2025-10-30'
    - priority = 'high'
    - tags = ['test']
  - Test completed task: `- [x] Done task`
  - Verify status = 'done'

---

#### Task 32: Implement MCP list_tasks tool
- [ ] Implement MCP list_tasks tool 🔼 📅 2025-10-30 #mcp #api #tasks
**Active Form**: Implementing MCP list_tasks tool
**Priority**: 🔼 Medium
**Due Date**: 2025-10-30
**Tags**: #phase-6 #mcp #api #tasks #backend #tools
**Dependencies**:
  - Task 31: Task parser created
  - Phase 5: MCP server running
**Acceptance Criteria**:
  - Endpoint: `GET /mcp/list_tasks`
  - Query parameters: `project` (optional), `status` (optional)
  - Returns JSON array of tasks with all metadata
  - Filters work correctly
**Test Scenarios**:
  - `GET /mcp/list_tasks` → returns all tasks
  - `GET /mcp/list_tasks?status=todo` → returns only uncompleted
  - `GET /mcp/list_tasks?project=weave-nn` → returns only weave-nn tasks
  - Create 10 tasks across 3 projects, verify filtering

---

#### Task 33: Implement MCP create_task tool
- [ ] Implement MCP create_task tool 🔼 📅 2025-10-30 #mcp #api #tasks
**Active Form**: Implementing MCP create_task tool
**Priority**: 🔼 Medium
**Due Date**: 2025-10-30
**Tags**: #phase-6 #mcp #api #tasks #backend #tools
**Dependencies**:
  - Task 31: Task parser created
  - Phase 5: MCP server running
  - Task 3: Obsidian API credentials configured
**Acceptance Criteria**:
  - Endpoint: `POST /mcp/create_task`
  - Body: `{"title": "...", "file_path": "...", "due_date": "...", "priority": "..."}`
  - Creates task in specified file via Obsidian REST API
  - Returns task object with line number
**Test Scenarios**:
  - Create task with all fields
  - Verify task appears in Obsidian file
  - Verify format: `- [ ] {{title}} 📅 {{due_date}} {{priority_emoji}}`
  - Create task without optional fields, verify defaults

---

#### Task 34: Implement MCP complete_task tool
- [ ] Implement MCP complete_task tool 🔼 📅 2025-10-30 #mcp #api #tasks
**Active Form**: Implementing MCP complete_task tool
**Priority**: 🔼 Medium
**Due Date**: 2025-10-30
**Tags**: #phase-6 #mcp #api #tasks #backend #tools
**Dependencies**:
  - Task 32: list_tasks tool working
  - Phase 5: MCP server running
**Acceptance Criteria**:
  - Endpoint: `PUT /mcp/complete_task`
  - Body: `{"file_path": "...", "line_number": 123}`
  - Updates task: `- [ ]` → `- [x]`
  - Updates file via Obsidian REST API
**Test Scenarios**:
  - Create test task via create_task
  - Get task via list_tasks, note line_number
  - Call complete_task with file_path + line_number
  - Verify task now marked as done in Obsidian

---

#### Task 35: Test all MCP task tools
- [ ] Test all MCP task tools ⏫ 📅 2025-10-30 #mcp #testing #integration
**Active Form**: Testing all MCP task tools
**Priority**: ⏫ High
**Due Date**: 2025-10-30
**Tags**: #phase-6 #mcp #testing #integration #validation #tasks
**Dependencies**:
  - Tasks 32-34: All MCP task tools implemented
**Acceptance Criteria**:
  - All 3 tools (list, create, complete) work correctly
  - Integration test passes
  - Response times < 2 seconds
  - No errors in logs
**Test Scenarios**:
  1. **Test 1 - Full Lifecycle**:
     - Call list_tasks → verify returns existing tasks
     - Call create_task with new task
     - Call list_tasks again → verify new task appears
     - Call complete_task with new task
     - Call list_tasks with status=done → verify completed task appears
  2. **Test 2 - Error Handling**:
     - Call create_task with invalid file_path → verify error response
     - Call complete_task with invalid line_number → verify error response

---

### Afternoon: Agent-Powered Task Workflows (4 hours)

#### Task 36: Create N8N daily task summary workflow
- [ ] Create N8N daily task summary workflow 🔼 📅 2025-10-30 #n8n #workflow #tasks
**Active Form**: Creating N8N daily task summary workflow
**Priority**: 🔼 Medium
**Due Date**: 2025-10-30
**Tags**: #phase-6 #n8n #workflow #tasks #automation #daily
**Dependencies**:
  - Task 32: MCP list_tasks tool working
  - Task 6: Claude API configured
**Acceptance Criteria**:
  - Workflow named "Daily Task Summary" created
  - Cron trigger: Every day at 9am
  - Queries tasks due today + overdue via MCP API
  - Generates summary with Claude
  - Posts to Slack or creates daily note
**Test Scenarios**:
  - Create 5 tasks: 2 due today, 1 overdue, 2 due next week
  - Manually trigger workflow
  - Verify summary includes 3 tasks (today + overdue)
  - Verify Slack message or daily note created

---

#### Task 37: Create N8N meeting notes to tasks workflow
- [ ] Create N8N meeting notes to tasks workflow 🔼 📅 2025-10-30 #n8n #workflow #meetings
**Active Form**: Creating N8N meeting notes to tasks workflow
**Priority**: 🔼 Medium
**Due Date**: 2025-10-30
**Tags**: #phase-6 #n8n #workflow #meetings #automation #tasks
**Dependencies**:
  - Task 33: MCP create_task tool working
  - Task 6: Claude API configured
  - Phase 5: RabbitMQ events working
**Acceptance Criteria**:
  - Workflow triggered by RabbitMQ event: `{"type": "file.created", "path": "meetings/*.md"}`
  - Reads meeting notes file
  - Sends to Claude with prompt: "Extract action items from meeting notes"
  - Creates tasks in appropriate project files via MCP create_task
**Test Scenarios**:
  - Create meeting note with 3 action items
  - Publish file.created event
  - Verify workflow triggers
  - Verify 3 tasks created in project tasks.md
  - Verify tasks have correct metadata (due dates, assignees if mentioned)

---

#### Task 38: Test agent task workflows end-to-end
- [ ] Test agent task workflows end-to-end ⏫ 📅 2025-10-30 #n8n #testing #integration
**Active Form**: Testing agent task workflows end-to-end
**Priority**: ⏫ High
**Due Date**: 2025-10-30
**Tags**: #phase-6 #n8n #testing #integration #validation #agent
**Dependencies**:
  - Tasks 36-37: Both agent workflows created
**Acceptance Criteria**:
  - Both workflows execute successfully
  - Daily summary accurate
  - Meeting notes extraction accurate
  - Execution times < 30 seconds each
**Test Scenarios**:
  1. **Daily Summary Test**:
     - Set up 10 tasks with various due dates
     - Trigger daily summary at 9am (or manually)
     - Verify summary email/note contains correct tasks
     - Verify overdue tasks highlighted
  2. **Meeting Notes Test**:
     - Create meeting note: "Action items: 1) Review PR, 2) Deploy to staging, 3) Update docs"
     - Trigger workflow
     - Verify 3 tasks created
     - Verify tasks in correct project file

---

## Day 11 (2025-10-31): Obsidian Properties & Visualization

**NOTE**: This day's tasks should wait for Obsidian properties research to complete before starting.

### Morning: Apply Properties to All Nodes (4 hours)

#### Task 39: Update all 8 template files with properties
- [ ] Update all 8 template files with properties 🔼 📅 2025-10-31 #obsidian #templates #properties
**Active Form**: Updating all 8 template files with properties
**Priority**: 🔼 Medium
**Due Date**: 2025-10-31
**Tags**: #phase-6 #obsidian #templates #properties #metadata #frontmatter
**Dependencies**:
  - Obsidian properties research completed
  - Tag taxonomy defined
**Acceptance Criteria**:
  - All 8 templates updated: feature, decision, architecture, planning, component, pattern, lesson, project
  - Each has `icon` property (Lucide icon name)
  - Each has `cssclasses` array
  - Each has complete tag structure from plan
  - Templates/README.md documented
**Test Scenarios**:
  - Open each template in Obsidian
  - Verify frontmatter renders correctly
  - Create new note from template
  - Verify properties propagate to new note

---

#### Task 40: Create bulk property application script
- [ ] Create bulk property application script 🔼 📅 2025-10-31 #python #automation #properties
**Active Form**: Creating bulk property application script
**Priority**: 🔼 Medium
**Due Date**: 2025-10-31
**Tags**: #phase-6 #python #automation #properties #bulk-operations #scripts
**Dependencies**:
  - Task 39: Templates updated with property structure
  - Phase 5: Obsidian REST API working
**Acceptance Criteria**:
  - Script: `/mnt/d/weavelogic/weavelogic-nn/weave-nn/scripts/apply_tags.py`
  - Reads all markdown files in vault
  - Parses frontmatter
  - Infers tags from folder path and type
  - Updates files via Obsidian REST API
  - Dry-run mode available (preview changes)
  - Progress logging
**Test Scenarios**:
  - Run in dry-run mode on 64+ existing nodes
  - Verify inferred tags correct
  - Run actual update
  - Spot-check 5 files, verify frontmatter updated
  - Verify no files corrupted

---

#### Task 41: Apply properties to all 64+ existing nodes
- [ ] Apply properties to all 64+ existing nodes ⏫ 📅 2025-10-31 #obsidian #bulk-update #properties
**Active Form**: Applying properties to all 64+ existing nodes
**Priority**: ⏫ High
**Due Date**: 2025-10-31
**Tags**: #phase-6 #obsidian #bulk-update #properties #metadata
**Dependencies**:
  - Task 40: Bulk application script created
**Acceptance Criteria**:
  - Script executed on all vault nodes
  - 64+ nodes updated with tags, icons, cssclasses
  - No nodes corrupted or missing content
  - Git commit with changes
**Test Scenarios**:
  - Before: Count nodes without tags
  - Run script
  - After: Count nodes with tags (should be 64+)
  - Open graph view, verify nodes have CSS classes
  - Open 10 random files, verify frontmatter correct

---

#### Task 42: Create and enable CSS snippet for node colors
- [ ] Create and enable CSS snippet for node colors 🔼 📅 2025-10-31 #obsidian #css #styling
**Active Form**: Creating and enabling CSS snippet for node colors
**Priority**: 🔼 Medium
**Due Date**: 2025-10-31
**Tags**: #phase-6 #obsidian #css #styling #visualization #graph
**Dependencies**:
  - Task 41: Nodes have cssclasses applied
**Acceptance Criteria**:
  - File created: `.obsidian/snippets/weave-nn-colors.css`
  - CSS rules for scope-based colors (mvp, future-web)
  - CSS rules for type-based colors (feature, decision, architecture, planning)
  - CSS rules for priority-based colors (critical, high, medium, low)
  - Snippet enabled in Obsidian Settings → Appearance → CSS snippets
**Test Scenarios**:
  - Open graph view in Obsidian
  - Verify scope/mvp nodes are green (#51CF66)
  - Verify type/feature nodes are red (#FF6B6B)
  - Verify priority/critical nodes have red border
  - Toggle CSS snippet off/on, verify colors change

---

### Afternoon: Generate Mehrmaid Visualizations (4 hours)

#### Task 43: Create Mehrmaid visualization generator script
- [ ] Create Mehrmaid visualization generator script 🔼 📅 2025-10-31 #python #visualization #mehrmaid
**Active Form**: Creating Mehrmaid visualization generator script
**Priority**: 🔼 Medium
**Due Date**: 2025-10-31
**Tags**: #phase-6 #python #visualization #mehrmaid #mermaid #graphs
**Dependencies**:
  - Task 41: All nodes have metadata
  - Phase 5: Obsidian REST API working
**Acceptance Criteria**:
  - Script: `/mnt/d/weavelogic/weavelogic-nn/weave-nn/scripts/generate_visualizations.py`
  - Functions for:
    - `generate_decision_tree()` → creates decision tree diagram
    - `generate_feature_graph()` → creates feature dependency graph
    - `generate_architecture_diagram()` → creates architecture layers
    - `generate_phase_timeline()` → creates phase timeline
  - Creates visualization notes in `visualizations/` folder
  - Uses Mehrmaid (Mermaid + Obsidian wikilinks) syntax
**Test Scenarios**:
  - Run script
  - Verify 4 visualization files created
  - Open each in Obsidian
  - Verify Mermaid diagrams render
  - Click wikilinks in diagrams, verify navigation works

---

#### Task 44: Generate and test all 4 visualizations
- [ ] Generate and test all 4 visualizations ⏫ 📅 2025-10-31 #visualization #testing #validation
**Active Form**: Generating and testing all 4 visualizations
**Priority**: ⏫ High
**Due Date**: 2025-10-31
**Tags**: #phase-6 #visualization #testing #validation #mehrmaid
**Dependencies**:
  - Task 43: Visualization generator script created
**Acceptance Criteria**:
  - All 4 visualizations generated:
    - visualizations/decision-tree.md
    - visualizations/feature-graph.md
    - visualizations/architecture-diagram.md
    - visualizations/phase-timeline.md
  - All render correctly in Obsidian
  - Wikilinks clickable and navigate correctly
  - Visual layout readable (not overlapping nodes)
**Test Scenarios**:
  - Open decision-tree.md
    - Verify all decisions shown with status emoji
    - Click decision node → navigate to decision file
    - Verify dependency arrows correct
  - Open feature-graph.md
    - Verify features color-coded by status
    - Verify dependencies shown
  - Open architecture-diagram.md
    - Verify layers shown (presentation, application, domain, infrastructure)
    - Verify components in correct layers
  - Open phase-timeline.md
    - Verify phases in chronological order
    - Verify current phase highlighted

---

## Day 12 (2025-11-01): Client Project Deployment

### Morning: Real Client Project Setup (4 hours)

**No additional granular tasks needed - covered by Day 12 plan**
(Tasks would be manual workflow execution and data import)

### Afternoon: End-to-End Workflow Testing (4 hours)

**Test Scenarios Covered in Plan**:
1. Create note test
2. Create task test
3. Generate report test
4. Knowledge extraction test

---

## Day 13 (2025-11-02): Documentation

**No additional granular tasks needed - covered by Day 13 plan**
(Documentation writing is single-task work)

---

## Day 14 (2025-11-03): Polish & Video

**No additional granular tasks needed - covered by Day 14 plan**
(Performance optimization and video recording are single tasks)

---

## Summary Statistics

**Total Tasks**: 44 tasks (Days 8-11)
**High Priority (⏫)**: 11 tasks
**Medium Priority (🔼)**: 28 tasks
**Low Priority (🔽)**: 5 tasks

**Day Breakdown**:
- Day 8 (Oct 28): 15 tasks (N8N installation + client onboarding)
- Day 9 (Oct 29): 14 tasks (Advanced N8N workflows)
- Day 10 (Oct 30): 9 tasks (Task management)
- Day 11 (Oct 31): 6 tasks (Properties + visualization)
- Day 12 (Nov 1): Manual testing (no discrete tasks)
- Day 13 (Nov 2): Documentation (no discrete tasks)
- Day 14 (Nov 3): Polish + video (no discrete tasks)

**Technology Tags Used**:
- #n8n (18 tasks)
- #workflow (17 tasks)
- #testing (9 tasks)
- #obsidian (15 tasks)
- #claude (5 tasks)
- #mcp (6 tasks)
- #git (4 tasks)
- #slack (4 tasks)
- #tasks (10 tasks)
- #properties (5 tasks)
- #visualization (4 tasks)

---

## Notes on Task Format

Each task includes:
1. **Title**: Imperative form (e.g., "Install N8N via Docker")
2. **Active Form**: Present continuous (e.g., "Installing N8N via Docker")
3. **Priority**: ⏫ High / 🔼 Medium / 🔽 Low
4. **Due Date**: Exact date (2025-10-28 format)
5. **Tags**: Minimum 3, specific to task context
6. **Dependencies**: References to prerequisite tasks or Phase 5 items
7. **Acceptance Criteria**: Specific, testable conditions for completion
8. **Test Scenarios**: Concrete steps to validate task completion

This format enables:
- TodoWrite tool integration
- Obsidian-tasks plugin compatibility
- Clear progress tracking
- Automated validation
- Dependency management
