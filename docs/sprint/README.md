# Sprint Folder

This folder mirrors ClickUp sprint state into the repo so Dheeraj (who has no ClickUp seat) can work from markdown digests.

## Active sprint

**Active sprint:** sprint-1

## Folder layout (per sprint)

```
sprint-N/
├── abhijith.md               Abhijith's queue, regenerated each session by /clickup-pm regenerate-digests
├── dheeraj.md                Dheeraj's queue, regenerated each session by /clickup-pm regenerate-digests
├── dheeraj-progress.md       Dheeraj writes here at session end; Abhijith reads + syncs to ClickUp at session start
├── abhijith-log.md           Timestamped session log (start + end), grouped by date — append-only
└── dheeraj-log.md            Timestamped session log (start + end), grouped by date — append-only
```

## Ownership

| File                   | Written by                              | Read by                                                                  |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `abhijith.md`          | `/clickup-pm` (mode `regenerate-digests`) | Abhijith                                                                 |
| `dheeraj.md`           | `/clickup-pm` (mode `regenerate-digests`) | Dheeraj                                                                  |
| `dheeraj-progress.md`  | Dheeraj (`/end-evenzi-session`)         | Abhijith (`/start-evenzi-session` → `/clickup-pm sync-dheeraj-progress`) |
| `abhijith-log.md`      | `/start-evenzi-session` + `/end-evenzi-session` (Abhijith) | Both                                                                     |
| `dheeraj-log.md`       | `/start-evenzi-session` + `/end-evenzi-session` (Dheeraj)  | Both                                                                     |

## Rules

- All files are append-only except the digest files (`abhijith.md`, `dheeraj.md`), which are derived state and overwritten on regenerate.
- Log files are grouped by `## YYYY-MM-DD` headings. New entries go under today's H2 (or a new H2 if none exists for today).
- `dheeraj-progress.md` synced entries are moved to a `## Synced` section by Abhijith's session start.
