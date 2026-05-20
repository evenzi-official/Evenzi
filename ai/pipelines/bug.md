---
name: bug
description: Bug fix pipeline
priority_default: normal
---

## Steps

### 1. system_guard
agent: system_checker
input: env_check
gate: hard
description: Verify environment is ready

### 2. analysis
agent: tech_lead
input: user_request
description: Root cause analysis of the reported bug

### 3. plan
agent: task_planner
input: step.analysis
description: Plan the fix approach

### 4. approve
gate: approval
input: step.plan
description: User reviews fix plan before implementation

### 5. fix
agent: fullstack_engineer
input: step.analysis + step.plan
description: Implement the minimal correct fix

### 6. review
agent: code_reviewer
input: step.fix
description: Review the fix for correctness and regressions

### 7. qa
agent: test_engineer
input: step.fix + step.review
description: Generate regression tests
