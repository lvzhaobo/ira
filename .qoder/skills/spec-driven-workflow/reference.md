# Document Skeleton Reference

Minimum required sections for each of the 13 documents in the Spec-Driven Workflow.

## Table of Contents

| Stage | ID | Document | Key Question |
|-------|-----|----------|-------------|
| S0 Meta | [S0a](#s0a-writing-guidelines) | Writing Guidelines | How to write docs? |
| | [S0b](#s0b-numbering) | Directory & Numbering | How to number? |
| S1 Proposal | [S1a](#s1a-proposal) | Project Proposal & Scope | Build or not? |
| | [S1b](#s1b-prd) | Product Requirements | What does business need? |
| S2 Spec | [S2a](#s2a-userstory) | User Stories & AC | How do users use it? |
| | [S2b](#s2b-fsd) | Functional Spec | What does it look like? |
| | [S2c](#s2c-nfr) | Non-Functional Requirements | Perf/Security/Availability? |
| S3 Design | [S3a](#s3a-architecture) | Architecture & Tech Selection | How to build? |
| | [S3b](#s3b-api) | API Contract | How do systems communicate? |
| | [S3c](#s3c-data) | Data Model & Storage | How is data stored? |
| S4 Plan | [S4a](#s4a-plan) | Implementation Plan | Who? When? |
| S5 Test | [S5a](#s5a-test) | Test Strategy & Quality Gates | How to verify? |
| S6 Trace | [S6a](#s6a-trace) | Traceability Matrix | Closed loop? |

**Starter teams** only write ★ marked docs: S2a + S3b + S5a

---

## S0 Meta

### S0a Writing Guidelines

| Section | Description |
|---------|-------------|
| Writing Principles | Clarity-first, audience-aware, version-controlled |
| Glossary / Term Table | Domain-specific terms with definitions, abbreviations |
| Template Conventions | Heading structure, markdown rules, placeholder syntax |
| Review Checklist | Self-check items before document submission |

### S0b Numbering

| Section | Description |
|---------|-------------|
| Directory Structure | Folder layout for all spec documents |
| Numbering Rules | `S{stage}{sub}-{Title}.md` format, stage 0–6 |
| Extension Guidelines | How to add new documents (append letter, never renumber) |
| Version History Format | Changelog entry format for each document |

---

## S1 Proposal — Build or not? What does business need?

### S1a Proposal

| Section | Description |
|---------|-------------|
| Background & Motivation | Why this project/feature exists, business context |
| In Scope / Out Scope | Clear boundaries — what's included and explicitly excluded |
| Success Criteria | Measurable outcomes (KPIs, acceptance metrics) |
| Risks & Assumptions | Known risks, dependencies, assumptions that could change |
| Stakeholders | Decision makers, reviewers, affected teams |

### S1b PRD

| Section | Description |
|---------|-------------|
| Business Objectives | High-level goals tied to business value |
| User Roles / Personas | Who uses this, their goals and pain points |
| Feature List | Prioritized features (P0 = must-have, P1 = should-have, P2 = nice-to-have) |
| Constraints | Budget, timeline, technology, regulatory constraints |
| Success Metrics | Quantitative measures (DAU, conversion rate, response time) |

---

## S2 Spec — How do users interact? What behaviors?

### S2a UserStory ★ Core

| Section | Description |
|---------|-------------|
| User Stories | `As a [role], I want [action], so that [benefit]` format |
| Acceptance Criteria | `Given/When/Then` format, cover: Happy Path, Exception, Boundary, Performance |
| Traceability Fields | `traceFrom` (links to S1b feature), `traceTo` (links to S5a test case) |
| Priority & Effort | Story points or T-shirt sizing, sprint assignment |
| Dependencies | Other stories or systems this depends on |

### S2b FSD

| Section | Description |
|---------|-------------|
| Page / Module Descriptions | What each screen or module does |
| Interaction Flows | Step-by-step user interaction sequences |
| State Machines | States, transitions, and triggers for key entities |
| UI Wireframe References | Links to mockups/prototypes (Figma, etc.) |
| Edge Cases | Unusual scenarios and how the system handles them |

### S2c NFR

| Section | Description |
|---------|-------------|
| Performance Targets | Response time, throughput, concurrent users |
| Security Requirements | Authentication, authorization, data encryption, OWASP compliance |
| Availability Goals | Uptime SLA (e.g., 99.9%), failover strategy |
| Scalability | Expected growth, horizontal/vertical scaling approach |
| Compatibility Constraints | Browser support, mobile OS versions, API backward compatibility |

---

## S3 Design — How to build it technically?

### S3a Architecture

| Section | Description |
|---------|-------------|
| Architecture Diagram | C4 model or layered architecture diagram |
| Tech Selection Rationale | Why each technology/framework was chosen (with alternatives considered) |
| Key Design Decisions | ADR format: Context → Decision → Consequences |
| Component Responsibilities | What each service/module owns |
| Integration Points | External systems, third-party APIs, message queues |

### S3b API ★ Core

| Section | Description |
|---------|-------------|
| Endpoint List | `Method + Path` for every API endpoint |
| Request / Response Schema | JSON Schema or TypeScript interfaces with field descriptions |
| Error Code Definitions | Standardized error codes, messages, and HTTP status mapping |
| Authentication Method | JWT / OAuth / API Key — how to authenticate |
| Rate Limiting | Throttling rules, quota per client |
| Versioning Strategy | URL-based (`/v1/`) or header-based versioning |

### S3c Data

| Section | Description |
|---------|-------------|
| ER Diagram / Data Model | Entity relationships, cardinality |
| Field Definition Table | Field name, type, constraints, default values, description |
| Index Strategy | Which fields are indexed, why, performance impact |
| Data Lifecycle | Creation → Update → Archive → Deletion policies |
| Migration Plan | Schema migration approach, backward compatibility |

---

## S4 Plan

### S4a Plan

| Section | Description |
|---------|-------------|
| Milestones & Deliverables | Key dates and what's delivered at each milestone |
| Task Breakdown (WBS) | Work breakdown structure with estimated effort |
| Dependencies | Task dependencies, critical path |
| Resource Allocation | Team member assignments, skill requirements |
| Risk Mitigation | Identified risks and contingency plans |

---

## S5 Test

### S5a Test ★ Core

| Section | Description |
|---------|-------------|
| Test Scope & Levels | Unit / Integration / E2E / Performance — what's covered |
| Quality Gates | Coverage threshold (e.g., ≥80%), pass rate, performance benchmarks |
| Test Case Outline | Key test scenarios mapped to User Stories (traceFrom S2a) |
| Environment Requirements | Test environment setup, test data, mock services |
| Automation Strategy | Which tests are automated, CI/CD integration |

---

## S6 Trace

### S6a Trace

| Section | Description |
|---------|-------------|
| Traceability Matrix | Requirements ↔ Design ↔ Code ↔ Test mapping table |
| Coverage Statistics | % of requirements with linked design, code, and tests |
| Gap Analysis | Requirements without implementation or test coverage |
| Change Log | History of requirement changes with impact analysis |
| Sign-off Records | Approval status for each traceability link |
