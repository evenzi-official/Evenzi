---
name: enhancement
description: Enhancement pipeline for improving existing features
priority_default: normal
---

## Steps

### 1. system_guard
agent: system_checker
input: env_check
gate: hard
description: Verify environment is ready

### 2. impact
agent: tech_lead
input: user_request
description: Impact analysis — which modules and data are affected

### 3. design
agent: tech_lead
input: user_request + step.impact
description: Design the enhancement with backward compatibility

### 4. plan
agent: task_planner
input: step.impact + step.design
description: Break into implementation tasks

### 5. approve
gate: approval
input: step.plan
description: User reviews plan before implementation

### 6. implement
agent: fullstack_engineer
input: step.design + step.plan
description: Implement the enhancement

### 7. review
agent: code_reviewer
input: step.implement
description: Review for quality and regressions

### 8. qa
agent: test_engineer
input: step.implement + step.review
description: Generate tests for the enhancement
