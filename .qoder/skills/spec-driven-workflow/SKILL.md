---
name: spec-driven-workflow
description: "Guides developers through a 6-stage document-first development process (Proposal → Spec → Design → Plan → Test → Trace) before writing any code. Supports 3 team maturity levels with adaptive document generation and change propagation tracking. Use when starting new features, transitioning to spec-first development, or managing document cascade updates. Triggers: 'new requirement', 'Spec Coding', 'document-first', 'spec-driven', '/spec-workflow'."
---

# Spec-Driven Workflow

> Guide developers/PMs through a **6-stage spec-driven workflow** to build a complete document system — from requirements to traceable delivery — **before writing any code**.

---

## When to Use

**Good fit:**

- Starting a new feature/module, unsure which documents to write first
- Transitioning from "code-first" to "spec-first" development
- Need a complete requirements → design → test → traceability loop
- Requirements changed, need to know which documents to cascade update

**Not a fit:**

- Fixing a small bug (just change code directly)
- Already have a mature Spec system the team knows well
- Pure exploratory prototype (Spike) with no traceability need

---

## Instructions

### Step 1: Show Document Overview

**Output this table first** — let users see the full picture: 6 stages, 13 documents.

| Stage | ID | Filename | Title | Key Question | Starter |
|-------|-----|----------|-------|--------------|---------||
| **S0 Meta** | S0a | `S0a-WritingGuide.md` | Writing Guidelines | How to write docs? | — |
| | S0b | `S0b-Numbering.md` | Directory & Numbering | How to number? | — |
| **S1 Proposal** | S1a | `S1a-Proposal.md` | Project Proposal & Scope | Build or not? Boundaries? | — |
| | S1b | `S1b-PRD.md` | Product Requirements | What does business need? | — |
| **S2 Spec** | S2a | `S2a-UserStory.md` | User Stories & AC | How do users use it? | ★ Core |
| | S2b | `S2b-FSD.md` | Functional Spec | What does it look like? | — |
| | S2c | `S2c-NFR.md` | Non-Functional Requirements | Perf/Security/Availability? | — |
| **S3 Design** | S3a | `S3a-Architecture.md` | Architecture & Tech Selection | How to build? What tech? | — |
| | S3b | `S3b-API.md` | API Contract | How do systems communicate? | ★ Core |
| | S3c | `S3c-Data.md` | Data Model & Storage | How is data stored? | — |
| **S4 Plan** | S4a | `S4a-Plan.md` | Implementation Plan | Who? When? | — |
| **S5 Test** | S5a | `S5a-Test.md` | Test Strategy & Quality Gates | How to verify? What gates? | ★ Core |
| **S6 Trace** | S6a | `S6a-Trace.md` | Requirements Traceability Matrix | Closed loop? Change controlled? | — |

**Naming rule:** `S{stage}{sub}-{Title}.md`
- Stage 0–6 maps to Meta → Trace
- Sub-letters (a/b/c...) allow **extension without renumbering** other documents
- Example: Need "I18N Requirements" in Spec stage → name it `S2d-I18N.md`, all others unchanged

### Step 2: Assess Team Maturity

Ask the user:
1. Has the team used AI Coding tools? (e.g., Qoder/Kiro/Copilot/Cursor)
2. Does the team practice "write docs before code"?
3. Team size and project phase?

Match to three levels:

| Level | Profile | Documents | AI Prefill |
|-------|---------|-----------|------------|
| **Starter** | New to AI Coding | 3 core (★ marked) | ~70% |
| **Standard** | Used AI but lacks methodology | All 13 | ~40% |
| **Advanced** | Experienced architect, heavy AI user | Self-designed | ~10% |

### Step 3: Show Stage Flow

```
S0 Meta ─── Writing rules apply throughout ────────────────
                                                           │
S1 Proposal ──→ S2 Spec ──→ S3 Design ──→ S4 Plan         │
  Build? What?    Behavior?     How?         Who/When?     │
                    │             │                        │
                    ├─────────────┼──→ S5 Test ←───────────┘
                    │             │      Verify?
                    └─────────────┴──→ S6 Trace
                                        Close loop
```

### Step 4: Four-Round Writing Sequence

```
Round 1: S1a(Proposal) + S1b(PRD)                     ← Set direction
Round 2: S2a(UserStory) + S3b(API)                     ← Lock behavior contract
Round 3: S3a(Arch) + S3c(Data) + S2b(FSD) + S2c(NFR)  ← Fill design
Round 4: S4a(Plan) + S5a(Test) + S6a(Trace)            ← Close verification loop
```

**Maturity adaptation:**

| Level | Scope | Notes |
|-------|-------|-------|
| **Starter** | S2a + S3b + S5a (3 core) | AI fills the rest |
| **Standard** | All 13, follow 4-round sequence | ~40% template prefill |
| **Advanced** | Self-designed system | ~10% skeleton only |

### Step 5: Change Propagation

When any document changes, cascade updates in this order:

```
S2a(behavior) → S3b/S3c(contract) → S5a(verification) → S6a(tracing)
```

**MUST**: Change behavior definition first, then contracts, then tests, finally update traceability matrix.

### Step 6: Generate Documents

After user confirms level and path, generate documents round by round.
For each document's **minimum required sections**, see [reference.md](reference.md).

**Generation rules:**
- Each document starts with `# {ID}-{Title}`, first line `version: 0.1`
- Starter: AI prefills ~70%, marks gaps with `<!-- TODO: please fill -->`
- Standard: AI prefills ~40%, provides skeleton + example snippets
- Advanced: AI provides empty skeleton only

### Completion Criteria

- **Starter**: S2a + S3b + S5a generated and user confirmed
- **Standard**: All 4 rounds complete, 13 documents generated
- **Advanced**: All user-selected documents complete
- Change propagation chain communicated to user

---

## Output Format

**Normal output:**

```markdown
## Spec-Driven Workflow Plan

**Team Level**: [Starter/Standard/Advanced]
**Recommended Documents**: [3/13/self-designed]

### Writing Path
| Round | Documents | Goal |
|-------|-----------|------|
| Round 1 | S1a + S1b | Set direction |
| Round 2 | S2a + S3b | Lock behavior contract |
| Round 3 | S3a + S3c + S2b + S2c | Fill design |
| Round 4 | S4a + S5a + S6a | Close loop |

### Change Propagation Reminder
If S2a(UserStory) changes later, remember to update: S3b/S3c → S5a → S6a
```

**Decline (not a fit):**

```markdown
## Suggestion: Skip Spec Process

Current scenario (bug fix / exploratory prototype) doesn't need the full Spec process.
Suggest modifying code directly with a comment explaining the reason.
```

---

## Constraints

- Do NOT skip S1 Proposal to jump directly to S2 Spec (unless Starter simplified flow)
- Changes MUST follow propagation chain `S2a→S3b/S3c→S5a→S6a`; never change code without updating docs
- Stage numbers S0–S6 are fixed; extend within stages using letters (a/b/c...) only

**Decision rules:**
1. When unsure about team level, default to **Standard**
2. When time is tight, prioritize the "Big Three": S2a(UserStory) + S3b(API) + S5a(Test)

---

## Companion Skills

These skills are optional. If installed, they are automatically invoked at the corresponding step:

- `write-user-story`: Called when generating S2a, produces UserStory + Acceptance Criteria
- `scan-api-contract`: Called after S3b is complete, verifies API contract consistency
- `scan-compliance`: Called after full workflow, scans for compliance risks

---

## Common Mistakes

**Mistake 1: Skipping Proposal, jumping straight to UserStory**
- Symptom: Unclear scope, halfway through realize it's not what customer wanted
- Fix: Write S1a-Proposal first to define In/Out Scope, then enter S2 Spec stage

**Mistake 2: Changed code but didn't update documents**
- Symptom: Code and Spec diverge, misleading future maintainers
- Fix: Follow change propagation chain `S2a→S3b/S3c→S5a→S6a`

**Mistake 3: Forcing all 13 documents on a Starter team**
- Symptom: Team overwhelmed by document volume, resistance builds
- Fix: Starter teams write only 3 core documents (S2a+S3b+S5a), AI fills the rest

**Mistake 4: Adding a document causes global renumbering**
- Symptom: Inserting one document in Spec stage forces renumbering all subsequent docs
- Fix: Use `S{stage}{sub}` format — new docs just append a letter (e.g., S2d), others unchanged
