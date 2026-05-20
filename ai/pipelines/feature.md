---
name: feature
description: Full feature development pipeline
priority_default: normal
---

## Steps

### 1. system_guard
agent: system_checker
input: env_check
gate: hard
description: Verify environment is ready

### 2. spec
agent: product_manager
input: user_request
description: Analyze requirements and produce feature specification

### 3. design
agent: tech_lead
input: user_request + step.spec
description: Convert spec into technical architecture

### 4. plan
agent: task_planner
input: step.spec + step.design
description: Break into concrete implementation tasks

### 5. approve
gate: approval
input: step.plan
description: User reviews plan before code generation

### 6. backend
agent: backend_engineer
input: step.spec + step.design + step.plan
description: Implement API routes and service logic

### 7. frontend
agent: frontend_engineer
input: step.spec + step.design + step.plan
description: Implement UI components and pages

### 8. review
agent: code_reviewer
input: step.backend + step.frontend
description: Review all generated code

### 9. qa
agent: test_engineer
input: step.backend + step.frontend + step.review
description: Generate test cases and validate edge cases
