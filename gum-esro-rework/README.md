# gum-esro-rework

ESRO rework for FiveM as a chat-first LB Phone app.

## Product direction

- Terminal-first social app
- Short-session interaction loops
- Passive expeditions
- Controlled progression
- Server-authoritative state and rewards

## Phase 1 scope

- Terminal with `PUBLIC`, `TRADE`, `HELP`, `LORE`, `UNDERCHAT`, `GAME`
- Profile bootstrap and persistence
- Push notification framework with deeplinks
- Eight-skill progression baseline
- Compact crafting and one standard rolling pool
- Passive expeditions with claim flow
- Basic contracts
- Faction overview, materials, and hub contribution
- Titles, badges, and notification preferences

## Resource structure

```text
gum-esro-rework/
  fxmanifest.lua
  sql/phase1.sql
  shared/
  server/
  client/
  ui/
```

## Install notes

1. Import `sql/phase1.sql`.
2. Start `oxmysql`, `ox_lib`, and `lb-phone` before this resource.
3. Add `ensure gum-esro-rework` after phone dependencies.
4. Use a dedicated LB Phone custom-app bridge or add one later in this resource.

## Current status

This resource is being built in small batches. The bootstrap, schema, and shared event contract are in place first so the runtime modules can be added without changing the core layout.