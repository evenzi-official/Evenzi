---
name: system_guard
description: Standalone environment check
priority_default: normal
---

## Steps

### 1. check
agent: system_checker
input: env_check
gate: hard
description: Verify environment is ready for pipeline execution
