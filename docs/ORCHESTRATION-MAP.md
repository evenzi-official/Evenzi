# Evenzi Session Orchestration Map

How a Claude Code session flows from `/start-session` to `/end-session`, where the council gates fire, and how subagents/skills/MCPs are wired together.

**Viewing:** GitHub renders Mermaid natively. In VS Code, install the *Markdown Preview Mermaid Support* extension. In any other markdown viewer with Mermaid support, just open this file.

---

## 1. Session lifecycle (top-level)

```mermaid
flowchart TD
    Start([USER: /start-session]) --> SS["<b>Skill: start-session</b><br/>• reads CLAUDE.md + MEMORY.md<br/>• mcp__clickup__* pulls tasks<br/>• scans ai/agents/, worktree state<br/>• surfaces work paths"]
    SS --> Pick[User picks a task]

    Pick --> PathChoice{Path?}
    PathChoice -->|Feature| Brain["Brainstorm<br/>(superpowers:brainstorming)"]
    PathChoice -->|Bug| BugReport[User reports bug]

    Brain --> Plan["Write plan<br/>(superpowers:writing-plans)<br/>→ docs/superpowers/plans/"]
    Plan --> CouncilPlan{{"⚖️ /council plan<br/>(AUTO)"}}

    CouncilPlan --> NeedDesign{Design<br/>needed?}
    NeedDesign -->|Yes| DesignSpec["Write design spec<br/>→ docs/superpowers/specs/"]
    NeedDesign -->|No| Impl
    DesignSpec --> CouncilDesign{{"⚖️ /council design<br/>(AUTO)"}}
    CouncilDesign --> Impl

    BugReport --> CouncilBug{{"⚖️ /council bug<br/>(AUTO)"}}
    CouncilBug --> Impl

    Impl["<b>Implement</b><br/>subagent-driven-development<br/>• parallel subagents (FE / BE / data)<br/>• Context7 MCP — library docs<br/>• preview_* MCP — live browser check<br/>• Playwright MCP — E2E if needed"]
    Impl --> CouncilCode{{"⚖️ /council code<br/>(AUTO)"}}
    CouncilCode --> Commit[Commit + push]
    Commit --> Loop{More tasks?}
    Loop -->|Yes| Pick
    Loop -->|No| EndCmd([USER: /end-session])
    EndCmd --> ES["<b>Skill: end-session</b><br/>• /session-report (work + tokens)<br/>• clickup-pm — update statuses<br/>• update CLAUDE.md if needed<br/>• commit + push Dev-Vibe<br/>• clear worktree"]
    ES --> Done([Session closed])

    classDef council fill:#fff4d6,stroke:#d4a017,stroke-width:2px,color:#000
    classDef skill fill:#e8f4fd,stroke:#2b7fc4,stroke-width:1px,color:#000
    classDef user fill:#f0f0f0,stroke:#666,stroke-width:1px,color:#000
    class CouncilPlan,CouncilDesign,CouncilBug,CouncilCode council
    class SS,ES skill
    class Start,EndCmd,Done,Pick,BugReport user
```

---

## 2. Council internals (what happens inside any council mode)

```mermaid
flowchart TD
    In([Council invoked<br/>mode: plan / design / code / bug])
    In --> P0{"<b>Phase 0</b><br/>Trivial change?"}
    P0 -->|Yes| Skip["⏭️ Skip<br/>(logged, not silent)"]
    P0 -->|No| P1

    P1["<b>Phase 1: Independent Critique</b><br/>3–5 agents · PARALLEL dispatch<br/>each reads ai/agents/&lt;role&gt;.md<br/>stay-in-lane constraint<br/>output: findings w/ severity + confidence"]
    P1 --> P2["<b>Phase 2: Debate</b><br/>same agents · PARALLEL<br/>each sees full panel transcript<br/>output: Endorse / Refute / Blind-spot"]
    P2 --> P3Q{"Any contested<br/>findings?"}
    P3Q -->|Yes| P3["<b>Phase 3: Arbiter</b><br/>Tech Lead, single dispatch<br/>rules on contested findings only<br/>UPHELD / OVERRULED / UPHELD-MOD"]
    P3Q -->|No| P4
    P3 --> P4
    P4["<b>Phase 4: Consolidate</b> (orchestrator, no dispatch)<br/>🔴 critical &nbsp; 🟡 important<br/>💡 suggestions &nbsp; 🔵 blind-spot additions<br/>⚖️ contested → arbiter rulings<br/><b>Verdict:</b> 🟢 proceed · 🟡 address-then-proceed · 🔴 re-plan"]
    P4 --> P5["<b>Phase 5: User gate</b><br/>approve · revise · discuss<br/>address-critical-then-proceed · override"]

    classDef phase fill:#e8f4fd,stroke:#2b7fc4,stroke-width:1px,color:#000
    classDef skip fill:#f0f0f0,stroke:#999,stroke-width:1px,color:#000
    classDef gate fill:#fff4d6,stroke:#d4a017,stroke-width:2px,color:#000
    class P1,P2,P3,P4 phase
    class Skip skip
    class P5 gate
```

---

## 3. Roster selection (which agents the council pulls per mode)

```mermaid
flowchart LR
    subgraph MODES[Council mode]
        M1[plan]
        M2[design]
        M3[code]
        M4[bug]
    end

    subgraph AGENTS[ai/agents/]
        A1[tech_lead]
        A2[frontend_engineer]
        A3[backend_engineer]
        A4[ui_ux_designer]
        A5[security_expert]
        A6[data_modeller]
        A7[qa_engineer]
        A8[code_reviewer]
        A9[test_engineer]
        A10[product_manager]
    end

    M1 --> A1
    M1 -.UI work.-> A2
    M1 -.UI work.-> A4
    M1 -.API.-> A3
    M1 -.auth/PII.-> A5
    M1 -.schema.-> A6
    M1 -.tests.-> A7

    M2 --> A4
    M2 --> A2
    M2 --> A1
    M2 --> A10
    M2 -.sensitive flows.-> A5

    M3 --> A8
    M3 --> A5
    M3 -.FE files.-> A2
    M3 -.BE files.-> A3
    M3 --> A9

    M4 --> A1
    M4 --> A9
    M4 -.domain.-> A2
    M4 -.domain.-> A3
    M4 -.security shape.-> A5

    classDef mode fill:#fff4d6,stroke:#d4a017,stroke-width:2px,color:#000
    classDef agent fill:#e8f4fd,stroke:#2b7fc4,stroke-width:1px,color:#000
    class M1,M2,M3,M4 mode
    class A1,A2,A3,A4,A5,A6,A7,A8,A9,A10 agent
```

Solid arrow = always in roster. Dotted arrow = conditional on the trigger noted on the edge.

---

## 4. Wiring (what's plugged into what)

```mermaid
flowchart TB
    subgraph ME[Orchestrator — main thread]
        Brain[Reasoning + planning]
        Dispatch[Agent dispatch]
        ToolCalls[MCP / built-in tool calls]
    end

    subgraph CTX[Auto-loaded every turn]
        CMD[CLAUDE.md]
        MEM[MEMORY.md + linked memory files]
    end

    subgraph SKILLS[Project skills .claude/skills/]
        S1[start-session]
        S2[end-session]
        S3[council]
        S4[plan-review]
        S5[clickup-pm]
        S6[session-report]
    end

    subgraph SUB[Subagents — Agent tool]
        SA1[claude general]
        SA2[Explore read-only]
        SA3[Plan architect]
        SA4[code-review]
    end

    subgraph MCPS[MCP servers]
        MC1[clickup]
        MC2[supabase]
        MC3[stitch]
        MC4[context7]
        MC5[playwright]
        MC6[sequential-thinking]
        MC7["preview_* (built-in)"]
        MC8["GitHub (gh CLI)"]
    end

    subgraph STATE[External state]
        ST1[(ClickUp tasks)]
        ST2[(Supabase DB)]
        ST3[(Git / Dev-Vibe / worktrees)]
        ST4[(Stitch / Figma)]
    end

    CTX -.loaded into.-> Brain
    Brain --> Dispatch
    Brain --> ToolCalls
    Dispatch --> SUB
    SUB -.each reads.-> CTX
    SUB -.each reads.-> AG[ai/agents/role.md]
    ToolCalls --> SKILLS
    ToolCalls --> MCPS
    SKILLS -.invoke.-> Dispatch
    SKILLS -.invoke.-> MCPS
    MC1 <--> ST1
    MC2 <--> ST2
    MC3 <--> ST4
    MC8 <--> ST3

    classDef me fill:#fce8b2,stroke:#a67c00,color:#000
    classDef ctx fill:#d9ead3,stroke:#3c7e3c,color:#000
    classDef skill fill:#e8f4fd,stroke:#2b7fc4,color:#000
    classDef sub fill:#fff4d6,stroke:#d4a017,color:#000
    classDef mcp fill:#e7d4f5,stroke:#7e3cad,color:#000
    classDef state fill:#f0f0f0,stroke:#666,color:#000
    class Brain,Dispatch,ToolCalls me
    class CMD,MEM,AG ctx
    class S1,S2,S3,S4,S5,S6 skill
    class SA1,SA2,SA3,SA4 sub
    class MC1,MC2,MC3,MC4,MC5,MC6,MC7,MC8 mcp
    class ST1,ST2,ST3,ST4 state
```

---

## 5. Agent self-evolution loop

```mermaid
flowchart LR
    Trigger["Trigger:<br/>• user says 'remember…'<br/>• council finding validated<br/>• debug root-cause found<br/>• /end-session batch"]
    Trigger --> Gate{"<b>Quality bar</b><br/>non-obvious ·<br/>validated · role-specific ·<br/>actionable?"}
    Gate -->|No| Drop["Drop (or route to<br/>CLAUDE.md / MEMORY)"]
    Gate -->|Yes| Dedup{"Anti-dup check<br/>+ wrong-home check"}
    Dedup -->|Duplicate| Drop
    Dedup -->|Wrong home| Route["Route to right<br/>destination"]
    Dedup -->|Clean| Draft["Draft entry<br/>(insight + source + confidence)"]
    Draft --> Ask["AskUserQuestion:<br/>Approve / Edit / Reject /<br/>Wrong-home"]
    Ask -->|Approve| Append["Append to<br/>ai/agents/&lt;role&gt;.md<br/>## Learnings section"]
    Append --> Cap{"At 9 entries?"}
    Cap -->|Yes| Prune["Prune oldest/weakest<br/>→ _archived_learnings.md"]
    Cap -->|No| Done([Done])
    Prune --> Done

    classDef trigger fill:#e8f4fd,stroke:#2b7fc4,color:#000
    classDef gate fill:#fff4d6,stroke:#d4a017,color:#000
    classDef drop fill:#f0f0f0,stroke:#999,color:#000
    classDef good fill:#d9ead3,stroke:#3c7e3c,color:#000
    class Trigger trigger
    class Gate,Dedup,Cap,Ask gate
    class Drop,Route drop
    class Draft,Append,Prune,Done good
```

Agents accumulate sharpening over time, but the quality bar + user gate + hard cap of 8 keep the files lean.

## 6. The four auto-trigger gates (memorize this)

```mermaid
flowchart LR
    BS[brainstorm] --> PL[plan]
    PL --> CP{{"⚖️ /council plan"}}
    CP --> DS[design spec]
    DS --> CD{{"⚖️ /council design"}}
    CD --> IM[implement]
    IM --> CC{{"⚖️ /council code"}}
    CC --> CM[commit + push]

    BUG[bug reported] --> CB{{"⚖️ /council bug"}}
    CB --> IM

    classDef gate fill:#fff4d6,stroke:#d4a017,stroke-width:2px,color:#000
    class CP,CD,CC,CB gate
```

---

## Legend

| Shape / color | Meaning |
|---|---|
| 🟦 Rounded blue box | Skill (recipe in `.claude/skills/`) |
| 🟨 Yellow hexagon | Council gate (auto-invoked) |
| 🟩 Green | Auto-loaded context (CLAUDE.md, MEMORY) |
| 🟪 Purple | MCP server |
| ⚪ Grey | User action or external state |
| Solid arrow | Always runs |
| Dotted arrow | Conditional (label explains when) |

---

## Notes

- **"Orchestrator" = me, the main session thread.** Subagents don't talk peer-to-peer — they return to me, and I synthesize or feed their output into the next dispatch. The council pattern is *me running a council*, not agents holding a meeting.
- **Memory rule lives at** `~/.claude/projects/-Users-xcalider-Documents-Projects-Evenzi/memory/feedback_council_default.md` — defines when each council gate fires automatically.
- **Triviality skip is logged, not silent** — if a council is skipped, you'll see "Council skipped — trivial (criteria matched)."
- **Override anytime** with "skip the council" or "just do it" — respected and noted.
