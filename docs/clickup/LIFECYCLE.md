# Evenzi — Feature Lifecycle in ClickUp

> How a feature moves from idea to production through ClickUp lists and statuses.

---

## Overview

```
IDEAS → BACKLOG → ACTIVE SPRINT → (subtasks fan out to lists) → DONE
```

---

## Stage-by-Stage Flow

### Stage 0: Idea
**List:** Ideas
**Status:** backlog

A raw feature idea — unrefined, no scope, no components. Anyone can add ideas here.

Example: "I want users to share photos at events"

**Exit criteria:** Idea is refined with scope, components, and dependencies defined.

---

### Stage 1: Backlog
**List:** Backlog
**Status:** backlog

Feature parent task created with full description:
- Summary, user stories, scope (in/out)
- Components breakdown with priorities
- Dependencies mapped
- Complexity estimated

Subtasks created under the parent:
- Structural: Spec & Architecture, Data Modeling, Integration Testing, Documentation, Release
- Components: One subtask per component
- Dev phases: UI/UX, Frontend, Backend, QA under each component

**Exit criteria:** Feature picked for a sprint.

---

### Stage 2: Active Sprint
**List:** Active Sprint (in Development folder)
**Status:** to do → in progress

Feature parent moves from Backlog to Active Sprint when implementation begins.

Dev phase subtasks fan out to their relevant lists:
| Subtask Type | Moves To |
|-------------|----------|
| Spec & Architecture | Architecture & Configuration |
| Data Modeling | Database |
| UI/UX Design | Design |
| Frontend Dev | Frontend |
| Backend Dev | Backend |
| Component QA | QA & Bugs |
| Integration Testing | QA & Bugs |
| Documentation | Documentation |
| Release & Deployment | DevOps |

---

### Stage 3: Planning Phase
**Subtasks:** Spec & Architecture, Data Modeling

```
Spec & Architecture
  backlog → to do → in progress → IN REVIEW → ✅ approved
                                     ↑
                            User validates approach
                            
Data Modeling & Schema
  backlog → to do → in progress → IN REVIEW → ✅ approved
                                     ↑
                            User validates schema & RLS
```

**Rules:**
- Nothing else starts until Spec is approved
- Data Modeling must be approved before any Backend or Frontend dev
- Assignee: Abhijith (Project Owner, DB & Data Modeling)

---

### Stage 4: Component Work (per component)

Components can run **in parallel** with each other. Within each component, phases are **sequential**:

```
Component Parent
  backlog → in progress

  UI/UX Design
    to do → in progress → IN REVIEW → ✅ approved
                             ↑
                    User validates designs
                    
  Frontend Dev (starts after UI/UX approved)
    to do → in progress → IN REVIEW → ✅ approved
                             ↑
                    User validates UI implementation

  Backend Dev (starts after Data Modeling + UI/UX approved)
    to do → in progress → IN REVIEW → ✅ approved
                             ↑
                    User validates API + auth

  Component QA (starts after Frontend + Backend approved)
    to do → in progress → IN REVIEW → ✅ approved
                             ↑
                    User validates test results

Component Parent → done (when all 4 phases approved)
```

**Assignee:** Dheeraj (FE & BE Dev, Co-owner)

---

### Stage 5: Integration & Wrap-up

```
Integration Testing (starts after ALL components done)
  to do → in progress → IN REVIEW → ✅ approved
                           ↑
                  User validates E2E flow

Documentation (can parallel with Integration Testing)
  to do → in progress → IN REVIEW → ✅ approved

Release & Deployment (starts after Integration + Docs approved)
  to do → in progress → IN REVIEW → ✅ approved → done
```

---

### Stage 6: Done
**Feature parent status:** done

All subtasks approved and completed. Feature merged and deployed.

---

## Status Reference

| Status | Meaning |
|--------|---------|
| **backlog** | Defined but not scheduled |
| **to do** | Scheduled for current sprint |
| **in progress** | Actively being worked on |
| **in review** | Approval gate — user validates output |
| **approved** | User approved, ready for next phase |
| **done** | Fully complete |
| **blocked** | Waiting on a dependency |

---

## Revision Flow

If user sends a task back during review:

```
in review → in progress (rework per feedback) → in review
```

Add a comment explaining what revision was requested and what was changed.

---

## Approval Gates

Every phase task has an approval gate. The approval flow:

1. Developer sets task to **in review**
2. Developer adds a comment summarizing what was done
3. **Abhijith (Project Owner)** reviews and either:
   - Sets to **approved** → next phase can begin
   - Sets back to **in progress** with revision feedback
4. No phase proceeds without approval

---

## Team Assignments

| Role | Person | Handles |
|------|--------|---------|
| Project Owner | Abhijith Pramod | Spec & Architecture, Data Modeling, all approval gates |
| FE & BE Dev | Dheeraj P Girish | Frontend Dev, Backend Dev, Integration Testing, Component QA |

---

## Parallel Execution

**Can be parallel:**
- Different components within the same feature
- Different features with no cross-dependencies
- Documentation + Integration Testing (same feature)

**Must be sequential:**
- Spec → Data Model → Component work
- UI/UX → Frontend → Backend → QA (within a component)
- All components done → Integration Testing
- Integration + Docs done → Release

---

## ClickUp Workspace Structure

```
Product (Space)
  ├── Ideas                           ← Stage 0
  ├── Backlog                         ← Stage 1 (feature parents + subtasks)
  ├── Development (Folder)
  │     ├── Active Sprint             ← Stage 2 (feature parents during sprint)
  │     ├── Frontend                  ← Frontend Dev subtasks
  │     ├── Backend                   ← Backend Dev subtasks
  │     ├── Database                  ← Data Modeling subtasks
  │     └── DevOps                    ← Release subtasks
  ├── Design                          ← UI/UX Design subtasks
  ├── QA & Bugs                       ← Component QA + Integration Testing
  ├── Architecture & Configuration    ← Spec & Architecture subtasks
  └── Documentation                   ← Documentation subtasks
```
