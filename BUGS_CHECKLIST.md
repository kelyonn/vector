# Vector Bug Fix Checklist (v2.0.0)

All items from the code audit have been addressed. Use this list for regression testing.

## Critical — data loss & broken core flows

- [x] **BUG-001:** Recurring tasks respawn when completed via `toggleTask`
- [x] **BUG-002:** Gist pull on startup respects `exportedAt` vs local last export
- [x] **BUG-003:** Multi-day absence runs midnight logic in a loop (capped at 365 days)
- [x] **BUG-004:** Task notifications use `notificationIds` and cancel both reminder + scheduled

## High — game logic, goals & stats

- [x] **BUG-005:** Focus timer abort calls `processFocusSession(..., false, ...)`
- [x] **BUG-006:** Un-completing a task reverses XP/energy via `reverseCompletionRewards`
- [x] **BUG-007:** Weekly/monthly task goals filter snapshots by date range
- [x] **BUG-008:** Streak calculation walks consecutive calendar days backward
- [x] **BUG-009:** `first_day` achievement uses earliest snapshot date when sorted
- [x] **BUG-010:** Daily snapshots use `completedAt` for per-day completion counts

## High — notifications & scheduling

- [x] **BUG-011:** Overdue notifications deduplicated via `vector-overdue-notified-ids`
- [x] **BUG-012:** `remindGoals` schedules daily goal check-in (id 3)
- [x] **BUG-013:** Disabling notifications cancels known daily IDs `[1,2,3]`
- [x] **BUG-014:** Task scheduler requires date and time before submit
- [x] **BUG-015:** `deleteTask` cancels scheduled notifications
- [x] **BUG-016:** `importData` reschedules future task notifications

## Medium — UX, filters & templates

- [x] **BUG-017:** Immediate filter excludes past-due tasks (matches `getTasksByStatus`)
- [x] **BUG-018:** Scheduled filter includes today’s not-yet-upcoming tasks
- [x] **BUG-019:** `applyTemplate` strips schedule/notification metadata
- [x] **BUG-020:** Default Iron Rules cannot be removed from editor
- [x] **BUG-021:** Focus session awards configured minutes on success
- [x] **BUG-022:** Focus completion uses in-app banner instead of `alert()`

## Medium — sync, storage & config

- [x] **BUG-023:** Android `applicationId` aligned to `com.vector.app`
- [x] **BUG-024:** README documents PAT requirement for Gist sync
- [x] **BUG-025:** `pushToGistDebounced` prevents export/sync races
- [x] **BUG-026:** Persist rehydrate error logged; README notes localStorage limit (IndexedDB deferred)
- [x] **BUG-027:** `migrateExportData` normalizes imports including `notificationIds`

## Low — code quality & CI

- [x] **BUG-028:** ESLint passes on source
- [x] **BUG-029:** ESLint ignores `android/**` and `ios/**`
- [x] **BUG-030:** Templates save explicit fields (no unused destructuring)
- [x] **BUG-031:** Hook dependency warnings resolved or documented
- [x] **BUG-032:** Statistics/Achievements lazy-loaded (smaller main chunk)

## Platform / mobile

- [x] **BUG-033:** Haptics no-op on web via `Capacitor.isNativePlatform()`
- [x] **BUG-034:** Docs note notifications require native build
- [x] **BUG-035:** Task scheduler uses local `Date(y,m,d,h,min)` constructor

## Documentation

- [x] **BUG-036:** README matches Iron Rule delete behavior
- [x] **BUG-037:** IMPROVEMENTS_ROADMAP limitations updated

## Post-audit limitations (resolved)

- [x] **LIM-001:** Full XP reversal via `CompletionLedger` on tasks
- [x] **LIM-002:** Legacy `completedAt` backfill on persist migrate / rehydrate
- [x] **LIM-003:** Multi-day catch-up uses `synthetic` snapshots (honest task counts)
- [x] **LIM-004:** IndexedDB persistence with localStorage auto-migrate
- [x] **LIM-005:** Bundle split — main chunk ~256KB (recharts/motion/capacitor chunks)
- [x] **LIM-006:** Android `com.vector.app` migration documented
