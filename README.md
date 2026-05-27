# Vector

Vector is a gamified life operating system built with React and Capacitor. It tracks six life attributes, enforces daily protocols (Iron Rules), and surfaces progress through statistics, achievements, and charts.

**Version:** 2.0.0

## Features

- **Attribute matrix** — Strength, Intellect, Create, Mind, Work, and Others; actions grant XP and level-ups.
- **Iron Rules** — Mandatory daily protocols that reset at midnight; default rules cannot be removed.
- **Midnight reset** — Iron Rules reset, energy restores, daily snapshots saved; missed Iron Rules reduce system integrity.
- **Tasks** — Immediate, scheduled, and recurring tasks with priorities, filters, and native reminders.
- **Focus timer** — Deep-work sessions with optional strict mode penalties.
- **Statistics** — Historical snapshots (365 days), streaks, charts, and attribute growth.
- **Achievements** — Milestones for streaks, levels, task volume, and perfect days.
- **Goals and templates** — Daily, weekly, and monthly targets; reusable task sets.
- **Data safety** — JSON export/import, optional GitHub Gist sync, IndexedDB persistence with legacy localStorage migration.

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | React, TypeScript, Tailwind CSS, Framer Motion |
| Build | Vite |
| State | Zustand (persisted via `idb-keyval`) |
| Charts | Recharts |
| Mobile | Capacitor (Android / iOS) |

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (default `http://localhost:5173`).

## Android

**Requirements:** Android Studio, Android SDK (API 33+), JDK 17+.

```bash
npm run sync:android   # build web assets and sync to native project
npm run open:android   # open Android Studio
```

In Android Studio, wait for Gradle sync, select a device or emulator, then Run.

**Package ID:** `com.vector.app`. If you previously installed a build under `com.example.app`, export your data, uninstall the old app, then install the new build. Data does not transfer automatically between package IDs.

**Notifications** (Iron Rules, goals, scheduled tasks) require a native build; they do not run in browser dev mode.

## Data management

1. Open **Settings** from the app header.
2. **Export Backup** — downloads a JSON file (state, snapshots, version metadata).
3. **Import Backup** — restores from a prior export.

Optional **GitHub Gist sync** needs a Personal Access Token with `gist` scope. Newer local exports take precedence on conflict.

## Project layout

```
src/
├── components/   # UI (dashboard, tasks, stats, settings, …)
├── constants/    # App IDs and version
├── lib/          # Persistence, sync, notifications, statistics
├── store/        # Zustand stores
└── types/        # TypeScript definitions
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development server |
| `npm run build` | Production web build |
| `npm run lint` | ESLint |
| `npm run sync:android` | Build and `cap sync android` |
| `npm run open:android` | Open the Android project in Android Studio |

## Release notes (v2.0.0)

- Statistics and analytics dashboard
- Achievement system
- Export/import and Gist sync
- Goals, templates, and scheduled tasks
- IndexedDB persistence with localStorage migration
- Native notifications and haptics
- Code-split bundles and lazy-loaded views
- Android package rename to `com.vector.app`
