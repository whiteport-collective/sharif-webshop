# Agent Collaboration Protocol

How agents work together, review each other, and hand off work.

---

## 1. Roles

### Commissioner
The agent (or human) who defines the job. Sets scope, acceptance criteria, and guardrails.
- Usually: Mårten, Ivonne (for ops tasks), or Saga (for strategic tasks)
- Creates the job spec
- Reviews the delivered work
- Merges or requests changes

### Producer
The agent who picks up and executes the job. Works autonomously within the spec.
- Usually: Freya (design), Saga (analysis), or any agent with the right skills
- Creates the working branch
- Delivers via PR
- Responds to review feedback

### Reviewer
The agent (or human) who reviews the delivered work. Can be the commissioner or a different agent.
- Checks work against acceptance criteria
- Leaves comments via Design Space messages or PR comments
- Approves or requests changes

**One agent can hold multiple roles across different jobs, but never commissioner AND producer on the same job.**

---

## 2. Job Lifecycle

```
DRAFT → POSTED → CLAIMED → IN_PROGRESS → DELIVERED → REVIEW → DONE (or REVISION)
```

### States

| State | What happens | Who acts |
|-------|-------------|----------|
| `DRAFT` | Job spec being written | Commissioner |
| `POSTED` | Job available for pickup | — (waiting) |
| `CLAIMED` | Producer accepted the job | Producer |
| `IN_PROGRESS` | Work happening on branch | Producer |
| `DELIVERED` | PR created, ready for review | Producer → Reviewer |
| `REVIEW` | Reviewer checking work | Reviewer |
| `REVISION` | Changes requested, back to producer | Producer |
| `DONE` | Merged and closed | Commissioner |
| `BLOCKED` | Can't proceed, needs input | Anyone → Commissioner |

---

## 3. Job Spec Format

Jobs are posted as Design Space messages with category `agent_message` and type `job`:

```yaml
job:
  id: "job-[date]-[short-name]"           # e.g. job-2026-03-07-whiteport-hero
  title: "Design Whiteport hero section"
  commissioner: "saga"
  producer: null                            # null = open for claiming
  reviewer: "marten"                        # or another agent
  priority: "normal"                        # low, normal, high, urgent
  project: "whiteport"
  repo: "c:/dev/marten-angner/martens-documents"
  branch: null                              # producer creates this

  spec:
    objective: "What needs to be done and why"
    deliverables:
      - "List of concrete outputs"
      - "e.g. page-spec for hero section"
      - "e.g. Excalidraw wireframe"
    acceptance_criteria:
      - "Measurable criteria for done"
      - "e.g. Hero communicates WDS value prop in < 5 seconds"
      - "e.g. Responsive layout specified for mobile + desktop"
    guardrails:
      - "What NOT to do"
      - "e.g. Don't change the navigation structure"
      - "e.g. Stay within existing design system tokens"
    context:
      - "Links to relevant files"
      - "e.g. _bmad/wds/data/brand-guidelines.md"
    estimated_scope: "small | medium | large"

  status: "POSTED"
  created: "2026-03-07T21:00:00"
  updated: "2026-03-07T21:00:00"
  tag: ""                                   # session tag from producer
```

---

## 4. Branch Protocol

### Naming Convention
```
agent/[producer-id]/[job-short-name]
```
Examples:
- `agent/freya/whiteport-hero`
- `agent/saga/sharif-product-brief`
- `agent/ivonne/weekly-planning-template`

### Who Creates the Branch
**Always the producer.** The commissioner defines the job, the producer creates the branch when they claim it.

```bash
# Producer claims the job and creates branch
git checkout -b agent/freya/whiteport-hero
```

### Branch Rules
- Branch from `main` (or the project's default branch)
- One branch per job — no shared branches between jobs
- Commit convention: `[agent-id]: [action] — [detail]`
- Producer commits freely during work (no approval needed for commits)
- Never force-push on a branch another agent might be reviewing

---

## 5. Delivery Protocol

### Producer Delivers
When work is complete, the producer:

1. **Final commit** with summary of what was done
2. **Create PR** (or describe the diff if no GitHub):
   ```bash
   gh pr create \
     --title "[agent/freya] Whiteport hero section design" \
     --body "## Job: job-2026-03-07-whiteport-hero

   ### Deliverables
   - [x] Hero section page spec
   - [x] Excalidraw wireframe
   - [x] Mobile responsive layout

   ### Decisions made
   - Chose bottom-aligned CTA over centered (better for mobile)
   - Used existing brand gradient, no new tokens needed

   ### Questions for reviewer
   - Should the hero image be AI-generated or stock?"
   ```
3. **Post delivery message** in Design Space:
   ```yaml
   message:
     from: "freya"
     to: "saga"  # or reviewer
     type: "job_delivery"
     job_id: "job-2026-03-07-whiteport-hero"
     content: "Hero section delivered. PR #12. Two decisions to review."
     branch: "agent/freya/whiteport-hero"
   ```

### Reviewer Reviews
The reviewer:

1. **Reads the PR** — checks deliverables against acceptance criteria
2. **Checks the branch** — reads the actual files, not just the diff
3. **Posts review** in Design Space:
   ```yaml
   message:
     from: "saga"
     to: "freya"
     type: "job_review"
     job_id: "job-2026-03-07-whiteport-hero"
     verdict: "approved" | "changes_requested" | "question"
     content: "Looks good. One thing: the mobile CTA needs more padding."
   ```
4. If approved: **Commissioner merges** (or asks Mårten to merge)
5. If changes requested: **Status → REVISION**, producer fixes and re-delivers

---

## 6. Pair Programming Protocol

For complex work where two agents collaborate in real-time (or near-real-time).

### How It Works

Agents can't literally share a session. Instead, they pair through **rapid message exchange** on the Design Space message board + **working on the same branch**.

**Pattern: Ping-Pong**
```
Agent A: writes code/design → commits → messages "your turn, check X"
Agent B: reads commit → reviews → writes improvements → commits → messages "done, check Y"
Agent A: reads → continues
```

**Pattern: Spec-Then-Build**
```
Saga: writes the spec (product brief, trigger map, acceptance criteria)
Freya: reads the spec → designs → delivers
Saga: reviews against original intent
```

**Pattern: Review Loop**
```
Producer: delivers v1
Reviewer: reviews, requests changes with specific instructions
Producer: applies changes, delivers v2
Reviewer: approves
```

### Message Types for Pair Work

| Type | Purpose | Example |
|------|---------|---------|
| `pair_start` | "I'm starting pair work on [branch]" | "Starting hero design, following your brief" |
| `pair_handoff` | "Your turn — I did X, check Y" | "Layout done, need your copy review" |
| `pair_question` | "Quick question before I continue" | "Should the CTA be primary or secondary?" |
| `pair_blocker` | "I'm stuck, need help" | "Can't decide between two layouts" |
| `pair_done` | "My part is complete" | "All design specs written, ready for dev" |

### When to Pair vs Solo

| Situation | Approach |
|-----------|----------|
| Clear spec, single domain | **Solo** — one producer, reviewer at the end |
| Cross-domain (strategy + design) | **Spec-Then-Build** — Saga specs, Freya builds |
| Ambiguous requirements | **Pair** — work through it together |
| Quality-critical deliverable | **Review Loop** — producer + reviewer iterations |
| Learning/exploration | **Pair** — both agents contribute perspectives |

---

## 7. Design Space Integration

### What Gets Posted to Design Space

| Event | Category | Who Posts |
|-------|----------|-----------|
| Job created | `agent_message` (type: job) | Commissioner |
| Job claimed | `agent_message` (type: job_update) | Producer |
| Delivery | `agent_message` (type: job_delivery) | Producer |
| Review | `agent_message` (type: job_review) | Reviewer |
| Pair messages | `agent_message` (type: pair_*) | Either agent |
| Knowledge captured | `agent_experience` or relevant category | Any agent |
| Status change | `agent_message` (type: job_update) | Whoever changed it |

### What Gets Captured as Knowledge

After every completed job, the producer captures:
- **What worked** → `successful_pattern` or `methodology`
- **What didn't work** → `failed_experiment`
- **What was learned** → `agent_experience`

The reviewer captures:
- **What they noticed in review** → `methodology` or `agent_experience`
- **Quality patterns** → `successful_pattern`

---

## 8. Conflict Resolution

### Disagreement Between Agents
If producer and reviewer disagree on an approach:
1. Both state their position in Design Space messages
2. Reference the job spec — what did the acceptance criteria say?
3. If still unresolved: **escalate to Mårten** (the human always wins)

### Branch Conflicts
If two agents need to work on the same files:
1. One agent works at a time (ping-pong pattern)
2. Always pull before pushing
3. If merge conflict: the last agent to push resolves it

### Stale Jobs
Jobs with no activity for 48 hours:
- Ivonne flags them during fire prevention scan
- Commissioner decides: reassign, cancel, or adjust scope

---

## 9. Quick Reference

### For Commissioners
1. Write job spec (use template above)
2. Post to Design Space
3. Wait for claim or assign directly
4. Review when delivered
5. Merge when approved

### For Producers
1. Claim the job (update status in Design Space)
2. Create branch: `agent/[you]/[job-name]`
3. Work autonomously within guardrails
4. Deliver via PR + Design Space message
5. Address review feedback if needed

### For Reviewers
1. Read the PR and the actual files
2. Check against acceptance criteria
3. Approve or request specific changes
4. Post review to Design Space

### Commit Messages
```
saga: [action] — [detail]
freya: [action] — [detail]
ivonne: [action] — [detail]
```

### Branch Names
```
agent/saga/[job-name]
agent/freya/[job-name]
agent/ivonne/[job-name]
```
