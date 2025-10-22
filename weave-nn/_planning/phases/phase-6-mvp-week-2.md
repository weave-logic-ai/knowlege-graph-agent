---
# Node Metadata
phase_id: "PHASE-6"
phase_name: "MVP Completion - Week 2 (Automation & Deployment)"
type: planning
status: "pending"
priority: "critical"
created_date: "2025-10-21"
start_date: "TBD"
end_date: "TBD"
duration: "5-7 days"

# Scope
scope:
  current_phase: "mvp"
  obsidian_only: true
  web_version_needed: false

# Dependencies
dependencies:
  requires: ["PHASE-5"]
  enables: []
  blocks: []

# Tags
tags:
  - scope/mvp
  - type/planning
  - status/pending
  - priority/critical
  - phase-6
  - week-2
  - automation
  - deployment

# Visual
visual:
  icon: "rocket"
  cssclasses:
    - type-planning
    - scope-mvp
    - status-pending
    - priority-critical
---

# Phase 6: MVP Completion - Week 2 (Automation & Deployment)

**Status**: ⏳ **PENDING**
**Priority**: 🔴 **CRITICAL**
**Duration**: 5-7 days (Monday-Sunday, Week 2)
**Depends On**: [[phase-5-mvp-week-1|Phase 5]] ⏳

---

## 🎯 Objectives

### Primary Goals
1. **Install & Configure N8N** - Workflow automation platform
2. **Build Core N8N Workflows** - Client onboarding, weekly reports, knowledge extraction
3. **Implement Task Management** - Obsidian Tasks integration with MCP
4. **Apply Obsidian Properties** - Tags, icons, CSS classes to all nodes
5. **Deploy to Real Client Project** - Test with actual client work
6. **Documentation & Polish** - User guides, video walkthrough

### Target Deliverables
- ✅ N8N installed with 5+ production workflows
- ✅ Task management fully operational
- ✅ All vault nodes tagged and categorized
- ✅ Mehrmaid visualizations generated
- ✅ 1 real client project running in Weave-NN
- ✅ Complete user documentation

---

## 📋 Day-by-Day Breakdown

### Day 8 (Monday): N8N Installation + Basic Workflows

**Morning (4 hours): Install N8N**

- [ ] **Install N8N via Docker**:
  ```bash
  # On GCP VM or local machine
  docker run -d \
    --name n8n \
    -p 5678:5678 \
    -v ~/.n8n:/home/node/.n8n \
    -e N8N_BASIC_AUTH_USER=admin \
    -e N8N_BASIC_AUTH_PASSWORD=<secure-password> \
    n8nio/n8n
  ```

- [ ] **Access N8N**: http://localhost:5678 (or VM IP)
  - Login with credentials
  - Complete initial setup wizard

- [ ] **Configure N8N Credentials**:
  - Obsidian API (REST API key)
  - GitHub (personal access token)
  - Slack (webhook URL or OAuth)
  - Claude API (API key)
  - RabbitMQ (connection URL)

- [ ] **Test N8N**: Create simple workflow (Hello World)

**Afternoon (4 hours): Client Onboarding Workflow**

- [ ] **Create Workflow: Client Onboarding**
  - **Trigger**: Webhook (POST /webhook/onboard-client)
  - **Input**: `{"client_name": "Acme Corp", "contact": "john@acme.com"}`
  - **Steps**:
    1. Create project folder: `_projects/{{client_name}}/`
    2. Create README.md (from template)
    3. Create requirements.md (from template)
    4. Create tasks.md (from template)
    5. Create decisions.md (from template)
    6. Replace placeholders: `{{client_name}}`, `{{contact}}`
    7. Create initial tasks:
       - "[ ] Schedule kickoff meeting 📅 {{next_monday}}"
       - "[ ] Review requirements document"
       - "[ ] Set up GitHub repository"
    8. Create GitHub repo (optional)
    9. Git commit: "feat: Initialize project for {{client_name}}"
    10. Send Slack notification

- [ ] **Test Workflow**:
  ```bash
  curl -X POST http://localhost:5678/webhook/onboard-client \
    -H "Content-Type: application/json" \
    -d '{"client_name": "Test Client", "contact": "test@example.com"}'
  ```

- [ ] **Verify**:
  - Project folder created in Obsidian
  - Files populated with correct data
  - Git commit exists
  - Slack notification sent (if configured)

**Success Criteria**: N8N operational, client onboarding workflow functional

**Reference**: [[../../features/n8n-workflow-automation|N8N Workflows]]

---

### Day 9 (Tuesday): Advanced N8N Workflows

**Morning (4 hours): Weekly Report Generator**

- [ ] **Create Workflow: Weekly Report Generator**
  - **Trigger**: Cron (Every Friday at 5pm)
  - **Steps**:
    1. Query all active projects: List `_projects/*/tasks.md`
    2. Parse completed tasks (last 7 days):
       - Find tasks with `[x]` (completed)
       - Filter by date: >= 7 days ago
    3. Group by project:
       - Project A: 12 tasks completed
       - Project B: 8 tasks completed
    4. Get Git commit stats:
       - `git log --since="7 days ago" --oneline | wc -l`
    5. Generate summary with Claude:
       - Prompt: "Create weekly report from: {{tasks}} {{commits}}"
       - Output: Markdown summary
    6. Create report note:
       - Path: `_planning/weekly-reports/{{YYYY-MM-DD}}.md`
       - Content: Claude summary + task breakdown
    7. Send to Slack:
       - Channel: #weekly-updates
       - Message: Summary + link to report

- [ ] **Test Workflow**:
  - Manually trigger workflow
  - Verify report generated
  - Check Slack message sent

**Afternoon (4 hours): Knowledge Extraction Workflow**

- [ ] **Create Workflow: Knowledge Extraction on Project Close**
  - **Trigger**: RabbitMQ event `{"type": "project.closed", "project_id": "client-a"}`
  - **Steps**:
    1. Read project files:
       - `_projects/{{project_id}}/requirements.md`
       - `_projects/{{project_id}}/decisions.md`
       - `_projects/{{project_id}}/solutions.md`
       - `_projects/{{project_id}}/lessons-learned.md` (if exists)
    2. Analyze with Claude:
       - Prompt: "Extract reusable patterns from: {{files}}"
       - Extract: Domain patterns, technical patterns, components, lessons
    3. Create knowledge base entries:
       - `knowledge-base/patterns/domain/{{pattern}}.md`
       - `knowledge-base/patterns/technical/{{pattern}}.md`
       - `knowledge-base/components/{{component}}.md`
       - `knowledge-base/lessons/{{lesson}}.md`
    4. Update pattern index:
       - Append to `knowledge-base/meta/pattern-index.md`
    5. Generate Mehrmaid visualization:
       - Create knowledge graph diagram
    6. Archive project:
       - `git mv _projects/{{project_id}} _archive/{{project_id}}-{{date}}`
       - `git commit -m "chore: Archive {{project_id}}"`

- [ ] **Test Workflow**:
  - Manually trigger with test project
  - Verify patterns extracted
  - Check archive created

**Success Criteria**: Weekly report + knowledge extraction workflows operational

**Reference**: [[../../architecture/cross-project-knowledge-retention|Knowledge Retention]]

---

### Day 10 (Wednesday): Task Management Integration

**Morning (4 hours): Obsidian Tasks MCP Integration**

- [ ] **Configure obsidian-tasks Plugin**:
  - Set global filter (if needed)
  - Test task queries in Obsidian:
    - `not done`
    - `due before tomorrow`
    - `#project/weave-nn`

- [ ] **Create Task Parser** (`utils/task_parser.py`):
  ```python
  import re

  class TaskParser:
      def parse_tasks_from_file(self, content):
          """Parse obsidian-tasks format"""
          tasks = []
          lines = content.split('\n')

          for i, line in enumerate(lines):
              match = re.match(r'- \[([ x])\] (.+)', line)
              if match:
                  status = match.group(1)
                  text = match.group(2)

                  # Extract metadata
                  due_date = self.extract_due_date(text)
                  priority = self.extract_priority(text)
                  tags = self.extract_tags(text)

                  tasks.append({
                      "line_number": i,
                      "status": "done" if status == "x" else "todo",
                      "text": text,
                      "due_date": due_date,
                      "priority": priority,
                      "tags": tags
                  })

          return tasks

      def extract_due_date(self, text):
          """Extract 📅 YYYY-MM-DD"""
          match = re.search(r'📅 (\d{4}-\d{2}-\d{2})', text)
          return match.group(1) if match else None

      def extract_priority(self, text):
          """Extract ⏫ (high), 🔼 (medium), 🔽 (low)"""
          if '⏫' in text:
              return 'high'
          elif '🔼' in text:
              return 'medium'
          elif '🔽' in text:
              return 'low'
          return 'normal'

      def extract_tags(self, text):
          """Extract #tag"""
          return re.findall(r'#([\w/-]+)', text)
  ```

- [ ] **Add Task MCP Tools** (in `server.py`):
  ```python
  @app.get("/mcp/list_tasks")
  def mcp_list_tasks(project: str = None, status: str = None):
      """List tasks with filters"""
      # Get all task files
      files = obsidian.list_notes("**/tasks.md")

      # Parse tasks
      all_tasks = []
      for file in files:
          content = obsidian.read_note(file)
          tasks = task_parser.parse_tasks_from_file(content)
          all_tasks.extend(tasks)

      # Filter
      if status:
          all_tasks = [t for t in all_tasks if t['status'] == status]
      if project:
          all_tasks = [t for t in all_tasks if project in t.get('tags', [])]

      return all_tasks

  @app.post("/mcp/create_task")
  def mcp_create_task(title: str, file_path: str, due_date: str = None, priority: str = None):
      """Create new task"""
      task_line = f"- [ ] {title}"
      if due_date:
          task_line += f" 📅 {due_date}"
      if priority == 'high':
          task_line += " ⏫"

      # Append to file via REST API PATCH
      obsidian.patch_note_section(file_path, "## Tasks", task_line)

  @app.put("/mcp/complete_task")
  def mcp_complete_task(file_path: str, line_number: int):
      """Mark task as done"""
      content = obsidian.read_note(file_path)
      lines = content.split('\n')
      lines[line_number] = lines[line_number].replace('- [ ]', '- [x]')
      obsidian.update_note(file_path, '\n'.join(lines))
  ```

- [ ] **Test Task MCP Tools**:
  ```bash
  # List all tasks
  curl "http://localhost:8000/mcp/list_tasks"

  # Create task
  curl -X POST "http://localhost:8000/mcp/create_task" \
    -d '{"title": "Test task", "file_path": "_projects/test/tasks.md", "due_date": "2025-10-25"}'

  # Complete task
  curl -X PUT "http://localhost:8000/mcp/complete_task" \
    -d '{"file_path": "_projects/test/tasks.md", "line_number": 5}'
  ```

**Afternoon (4 hours): Agent-Powered Task Workflows**

- [ ] **Create Agent Workflow: Daily Task Summary**
  - Runs every morning (9am)
  - Queries tasks due today + overdue
  - Generates summary with Claude
  - Posts to Slack or creates daily note

- [ ] **Create Agent Workflow: Meeting Notes → Tasks**
  - Trigger: New file in `meetings/` folder
  - Reads meeting notes
  - Extracts action items with Claude
  - Creates tasks in appropriate project files

**Success Criteria**: Task management operational, agent workflows functional

**Reference**: [[../../features/obsidian-tasks-integration|Obsidian Tasks]]

---

### Day 11 (Thursday): Obsidian Properties & Visualization

**Morning (4 hours): Apply Properties to All Nodes**

- [ ] **Tag Structure to Apply**:
  ```yaml
  tags:
    - scope/mvp              # or scope/future-web
    - type/feature           # or type/decision, type/architecture, etc.
    - status/planned         # or status/active, status/completed
    - priority/high          # or priority/critical, priority/medium, priority/low
    - tech/obsidian          # technology tags
    - category/backend       # functional category
  ```

- [ ] **Update Template Files** (8 templates):
  - Add `icon` property (Lucide icons)
  - Add `cssclasses` array
  - Add tag structure
  - Document in `templates/README.md`

- [ ] **Bulk Update Existing Nodes**:
  - Create Python script: `scripts/apply_tags.py`
  - Read all nodes, parse frontmatter
  - Infer tags from folder/type
  - Update files via Obsidian REST API
  - Target: 64+ existing nodes

- [ ] **Create CSS Snippet** (`.obsidian/snippets/weave-nn-colors.css`):
  ```css
  /* Scope-based colors */
  .graph-view .scope-mvp { fill: #51CF66; }          /* Green */
  .graph-view .scope-future-web { fill: #ADB5BD; }  /* Gray */

  /* Type-based colors */
  .graph-view .type-feature { fill: #FF6B6B; }      /* Red */
  .graph-view .type-decision { fill: #FFA94D; }     /* Orange */
  .graph-view .type-architecture { fill: #06B6D4; } /* Cyan */
  .graph-view .type-planning { fill: #A78BFA; }     /* Purple */

  /* Priority-based colors */
  .graph-view .priority-critical { stroke: #DC2626; stroke-width: 3px; }
  .graph-view .priority-high { stroke: #F59E0B; stroke-width: 2px; }
  ```

- [ ] **Enable CSS Snippet**: Settings → Appearance → CSS snippets

**Afternoon (4 hours): Generate Mehrmaid Visualizations**

- [ ] **Create Mehrmaid Generator** (`scripts/generate_visualizations.py`):
  ```python
  def generate_decision_tree():
      """Generate decision tree visualization"""
      decisions = obsidian.list_notes("decisions/**/*.md")

      mermaid = "```mehrmaid\ngraph TD\n"

      for decision in decisions:
          content = obsidian.read_note(decision)
          fm = parse_frontmatter(content)

          status_emoji = {"decided": "✅", "open": "❓", "deferred": "⏸️"}[fm['status']]

          label = f'''{fm['decision_id']}["{status_emoji} **{fm['title']}**<br/>
          📅 {fm.get('created_date', 'N/A')}<br/>
          Status: {fm['status']}<br/><br/>
          [[{decision}|View Details]]"]'''

          mermaid += f"    {label}\n"

          # Add dependencies
          for dep in fm.get('dependencies', []):
              mermaid += f"    {fm['decision_id']} --> {dep}\n"

      mermaid += "```\n"

      # Create visualization note
      obsidian.create_note(
          "visualizations/decision-tree.md",
          mermaid,
          {"type": "visualization", "source": "all-decisions"}
      )
  ```

- [ ] **Generate Visualizations**:
  - Decision tree (all decisions)
  - Feature dependency graph
  - Architecture layer diagram
  - Phase timeline

- [ ] **Test Mehrmaid Rendering**:
  - Open visualization notes in Obsidian
  - Verify graphs render correctly
  - Click wikilinks to navigate

**Success Criteria**: All nodes tagged, CSS applied, Mehrmaid visualizations generated

**Reference**: [[../../workflows/obsidian-properties-groups|Obsidian Properties]]

---

### Day 12 (Friday): Client Project Deployment

**Morning (4 hours): Set Up Real Client Project**

- [ ] **Create Client Project Structure**:
  ```bash
  # Via N8N or manually
  curl -X POST http://localhost:5678/webhook/onboard-client \
    -d '{"client_name": "Real Client Name", "contact": "client@example.com"}'
  ```

- [ ] **Import Existing Client Data**:
  - Copy existing requirements docs → `_projects/client/requirements.md`
  - Copy existing notes → `_projects/client/notes/`
  - Create initial tasks based on client requirements

- [ ] **Test Agent Suggestions**:
  - Create `_projects/client/requirements.md`
  - Wait for agent to suggest relevant patterns
  - Verify suggestions in `_projects/client/suggested-patterns.md`

**Afternoon (4 hours): End-to-End Workflow Test**

- [ ] **Complete Workflow Test**:
  1. **Create note** in Obsidian (`_projects/client/notes/test.md`)
  2. **Verify events**:
     - File watcher → RabbitMQ → Event published
     - MCP sync → Shadow cache updated
     - Git auto-commit → Commit created
  3. **Create task** in `_projects/client/tasks.md`
  4. **Verify task workflow**:
     - Task event published
     - Agent receives event
     - Daily summary includes task
  5. **Generate report**:
     - Manually trigger weekly report workflow
     - Verify report created
  6. **Test knowledge extraction**:
     - Mark project as "Completed"
     - Trigger knowledge extraction workflow
     - Verify patterns extracted

**Success Criteria**: Full workflow functional, real client project running

---

### Day 13 (Saturday): Documentation

**Morning (4 hours): User Guide**

- [ ] **Create User Guide** (`docs/user-guide.md`):
  - Getting started (install plugins)
  - Creating a new project
  - Working with tasks
  - Understanding the knowledge base
  - Using N8N workflows (trigger onboarding, reports)
  - Reading visualizations (Mehrmaid graphs)

**Afternoon (4 hours): Developer Guide**

- [ ] **Create Developer Guide** (`docs/developer-guide.md`):
  - Architecture overview
  - Setting up dev environment
  - Running local services (RabbitMQ, N8N, MCP server)
  - Adding new agent rules
  - Creating new N8N workflows
  - Extending MCP tools
  - Troubleshooting guide

---

### Day 14 (Sunday): Polish & Video Walkthrough

**Morning (4 hours): Performance & Bug Fixes**

- [ ] **Performance Optimization**:
  - Profile shadow cache queries
  - Optimize RabbitMQ message throughput
  - Reduce MCP API response times

- [ ] **Bug Fixes**:
  - Review error logs
  - Fix any discovered issues
  - Add error handling where missing

**Afternoon (4 hours): Video Walkthrough**

- [ ] **Record 10-Minute Walkthrough**:
  1. Introduction (What is Weave-NN?)
  2. Demo: Obsidian vault tour
  3. Demo: Create new client project
  4. Demo: Task management
  5. Demo: Knowledge base patterns
  6. Demo: N8N workflow (weekly report)
  7. Demo: Mehrmaid visualization
  8. Conclusion (Next steps)

- [ ] **Upload Video**: YouTube (unlisted or private)
- [ ] **Add Video Link**: README.md

**Success Criteria**: Documentation complete, video recorded, MVP polished

---

## ✅ Week 2 Success Criteria

### N8N Workflows
- [x] N8N installed and operational
- [x] 5 core workflows created:
  - Client onboarding
  - Weekly report generator
  - Knowledge extraction
  - GitHub issue sync
  - Meeting notes → tasks
- [x] All workflows tested and functional

### Task Management
- [x] obsidian-tasks plugin configured
- [x] Task MCP tools implemented
- [x] Agent workflows (daily summary, auto-extraction)
- [x] Task queries working

### Obsidian Properties
- [x] All nodes tagged (64+ nodes)
- [x] CSS snippet applied
- [x] Icons assigned to node types
- [x] Graph view color-coded

### Mehrmaid Visualizations
- [x] 4+ visualizations generated:
  - Decision tree
  - Feature dependency graph
  - Architecture diagram
  - Phase timeline

### Client Deployment
- [x] Real client project running
- [x] Full workflow tested (create → edit → task → commit → report)
- [x] Agent suggestions working
- [x] Knowledge extraction tested

### Documentation
- [x] User guide complete
- [x] Developer guide complete
- [x] Video walkthrough recorded
- [x] README updated

---

## 🎯 MVP Launch Checklist

### Infrastructure
- [ ] RabbitMQ running (Docker container)
- [ ] N8N running (Docker container)
- [ ] MCP server running (Python service)
- [ ] All 3 consumers running (mcp_sync, agent_tasks, git_auto_commit)
- [ ] File watcher running (background service)

### Data
- [ ] Obsidian vault initialized
- [ ] 64+ nodes created and tagged
- [ ] Templates available (8 types)
- [ ] Knowledge base structure created
- [ ] 1 client project active

### Workflows
- [ ] 5 N8N workflows operational
- [ ] Agent rules active (6 rules)
- [ ] Git auto-commit enabled
- [ ] Task management working

### Documentation
- [ ] User guide
- [ ] Developer guide
- [ ] Video walkthrough
- [ ] README.md updated

### Testing
- [ ] End-to-end workflow tested
- [ ] Performance benchmarks met
- [ ] Error handling validated
- [ ] Client feedback collected

---

## 📊 Success Metrics

### Productivity Metrics
- **Client onboarding time**: 30 min → 30 sec (99% reduction)
- **Weekly report time**: 2 hours → automated (100% reduction)
- **Knowledge extraction**: Never done → automatic (∞ improvement)
- **Task management**: Manual → automated summaries (80% time saved)

### Technical Metrics
- **File watcher latency**: < 1 second
- **MCP sync latency**: < 2 seconds
- **Git commit latency**: < 5 seconds
- **Agent response time**: < 10 seconds
- **N8N workflow execution**: < 30 seconds

### Quality Metrics
- **Pattern reuse**: 5+ patterns extracted, ready for next project
- **Code coverage**: 80%+ (tests)
- **Documentation completeness**: 100% (all features documented)

---

## 🔗 Related Documentation

### Features Implemented This Week
- [[../../features/n8n-workflow-automation|N8N Workflow Automation]]
- [[../../features/obsidian-tasks-integration|Obsidian Tasks Integration]]
- [[../../architecture/cross-project-knowledge-retention|Knowledge Retention]]

### Architecture References
- [[../../architecture/obsidian-native-integration-analysis|Obsidian Integration]]
- [[../../architecture/obsidian-first-architecture|Obsidian-First Architecture]]

### Previous Phase
- [[phase-5-mvp-week-1|Phase 5: MVP Week 1]] - Backend infrastructure

---

## 🚀 Post-MVP Next Steps

### Immediate (v1.1 - Weeks 3-4)
- [ ] Add more N8N workflows (10+ total)
- [ ] Enhance agent rules (pattern matching, semantic search)
- [ ] Build custom Obsidian plugin (status display)
- [ ] Add more knowledge base patterns (20+ total)

### Short-Term (v1.2 - Months 2-3)
- [ ] Semantic search (embeddings)
- [ ] Advanced task automation
- [ ] GitHub PR integration
- [ ] Multi-client parallel workflows

### Long-Term (v2.0 - Months 6-12)
- [ ] Web frontend (Next.js)
- [ ] Real-time collaboration (Supabase)
- [ ] Public pattern marketplace
- [ ] SaaS offering

---

**Status**: ⏳ **PENDING**
**Ready to Start**: After Phase 5 completion
**Estimated Effort**: 56 hours (8 hours/day × 7 days)
**Outcome**: Production-ready MVP with real client project
