# VECTOR // Life Operating System

![Vector Banner](public/vite.svg)

**Vector** is a high-performance, gamified life operating system designed to enforce discipline through RPG mechanics and data visualization. It replaces traditional to-do lists with a "Character Sheet" for your life, featuring attribute tracking, mandatory protocols, and punitive logic.

**Version 2.0.0** - Now with Data Safety, Statistics, and Achievements

---

## Core Systems

### 1. The 6-Point Attribute Matrix
Every action feeds into a specific attribute, leveling up your avatar:
* **STRENGTH:** Physical training, sleep, hydration.
* **INTELLECT:** Reading, studying, learning.
* **CREATE:** Engineering, writing, building.
* **MIND:** Meditation, clarity, environment.
* **WORK:** Deep work sessions.
* **OTHERS:** Logistics and errands.

### 2. The Iron Rules (Daily Protocols)
Mandatory tasks that regenerate **every day at 00:00**. You cannot delete them.
* *Sleep 6hr+*
* *Drink 3L Water*
* *Clean Room*
* *Shower / Groom*

### 3. The Midnight Purge (00:00 Reset)
The system runs a hard reset at midnight:
* **Iron Rules Reset:** All Iron Rules are reset to incomplete (new IDs generated).
* **Regular Tasks Preserved:** Completed and incomplete regular tasks persist across resets.
* **Damage Taken:** Missed "Iron Rules" inflict **-10% System Integrity** damage.
* **Energy Reset:** Energy restores to 100%.
* **Snapshot Saved:** Daily progress is automatically saved to history.

### 4. Native Mobile Architecture
Built with **Capacitor**, Vector runs as a native Android/iOS app with:
* **Fullscreen Immersive Mode:** No browser bars.
* **Haptic Feedback & Sound:** Auditory cues for actions.
* **Safe Area Handling:** Optimized layout for notched devices.

---

## New in v2.0.0

### Statistics & Analytics Dashboard
* **Historical Tracking:** Automatic daily snapshots (last 365 days)
* **Progress Charts:** Visualize integrity, energy, and task completion over time
* **Attribute Growth:** Track level gains across all attributes
* **Key Metrics:** Total days, current/longest streaks, average performance
* **Best Day Tracking:** See your highest performing day

### Achievement System
Unlock 11 achievements as you progress:
* **First Steps** - Complete your first day
* **Week Warrior** - 7-day streak
* **Month Master** - 30-day streak
* **Level Milestones** - Reach levels 10, 25, 50, 100
* **Perfectionist** - Complete all tasks in a day
* **Task Master** - Complete 1000 tasks total
* **Evolution Milestones** - Reach Evolution Stages 5 and 10

### Task Management & Scheduling
* **Scheduled Tasks:** Set tasks for specific dates and times
* **Recurring Tasks:** Daily, weekly, monthly, weekdays, or weekends
* **Task Reminders:** Configurable notifications before scheduled time
* **Priority Levels:** Low, medium, high priority tasks
* **Task Filters:** View all, immediate, scheduled, overdue, today, or completed tasks
* **Persistent Tasks:** Completed tasks remain visible until manually deleted

### Goals & Templates
* **Goal System:** Set daily, weekly, or monthly goals for attributes, tasks, integrity, or evolution
* **Task Templates:** Create reusable task sets for projects or routines
* **Progress Tracking:** Visual progress bars and automatic goal updates

### Data Safety & Management
* **Export/Import:** Backup and restore your data as JSON files
* **GitHub Gist Sync:** Optional cloud sync using GitHub Gists (free)
* **Settings Page:** Centralized data management
* **Data Versioning:** Future-proof data format for migrations
* **Reset Option:** Start fresh with confirmation

### Mobile Enhancements
* **Local Notifications:** Daily reminders for Iron Rules and goals
* **Task Notifications:** Notifications for scheduled and overdue tasks
* **Haptic Feedback:** Tactile feedback for key interactions
* **Optimized UI:** Improved spacing and visual hierarchy

---

## Tech Stack

* **Core:** React, TypeScript, Vite
* **State:** Zustand (Persisted LocalStorage)
* **UI:** Tailwind CSS, Framer Motion, Lucide Icons
* **Data Viz:** Recharts (Radar, Line, Area, Bar Charts)
* **Mobile:** Capacitor (Android/iOS Native Bridge)

---

## Installation & Development

### 1. Web Development
```bash
# Install dependencies
npm install

# Run local server
npm run dev
```

### 2. Building for Android

Vector uses Capacitor to build a native Android app.

**Prerequisites:** 
- Android Studio installed ([Download](https://developer.android.com/studio))
- Android SDK (API 33+)
- JDK 17+

**Quick Start:**
```bash
# Build and sync in one command
npm run sync:android

# Open Android Studio
npm run open:android
```

**Detailed Steps:**
```bash
# 1. Build the React web assets
npm run build

# 2. Sync web assets to Native Android project
npx cap sync android

# 3. Open Android Studio
npx cap open android
```

**In Android Studio:**
1. Wait for Gradle sync to complete
2. Select device/emulator from dropdown
3. Click **Run** button (▶️) or press `Shift + F10`
4. App will install and launch

**For detailed Android Studio setup, see [ANDROID_STUDIO_GUIDE.md](./ANDROID_STUDIO_GUIDE.md)**

---

## Usage Guide

### Main Views

1. **Dashboard (System):** View your Metric Radar, Attribute Levels, Focus Timer, and Nexus.
2. **Tasks (Operations):** Manage daily tasks. Toggle **"IRON RULES"** to edit mandatory protocols.
3. **Statistics:** View your progress charts, streaks, and analytics (New in v2.0.0).
4. **Ledger:** Tap "ASSETS" in the header to track liquid wealth.
5. **Settings:** Tap the gear icon to export/import data or reset your progress.

### Key Features

* **Focus Mode:** Use the timer for deep work. Enabling **"STRICT"** mode penalizes you for switching apps.
* **Task Scheduling:** Schedule tasks with dates, times, recurrence, and reminders.
* **Task Persistence:** Completed tasks stay visible until you manually delete them.
* **Daily Snapshots:** Your progress is automatically saved each day at midnight reset.
* **Export/Import:** Regularly backup your data using the Settings page.
* **Cloud Sync:** Optional GitHub Gist sync for multi-device access.
* **Achievements:** Track your milestones and unlock achievements as you progress.
* **Goals & Templates:** Set goals and create reusable task templates.

### Mobile Navigation

* **SYSTEM:** Dashboard view with Nexus, Radar, and Attributes
* **TASKS:** Task management and Iron Rules
* **STATS:** Statistics and Achievements (New in v2.0.0)

---

## Data Management

### Exporting Data
1. Open Settings (gear icon in top bar)
2. Click "Export Backup"
3. A JSON file will download with all your data, including historical snapshots

### Importing Data
1. Open Settings
2. Click "Import Backup"
3. Select your previously exported JSON file
4. All data will be restored, including snapshots and achievements

### Data Format
Exported data includes:
* Current state (attributes, tasks, protocols, stats)
* Historical snapshots (last 365 days)
* Version information for future compatibility

---

## Project Structure

```
src/
├── components/     # React components
│   ├── Achievements.tsx
│   ├── Settings.tsx
│   ├── Statistics.tsx
│   └── ...
├── constants/      # App constants
├── lib/           # Utility functions
│   └── statistics.ts
├── store/         # Zustand state management
├── types/         # TypeScript type definitions
└── ...
```

---

## Android Studio Guide

For complete setup instructions, troubleshooting, and build guide, see:
**[ANDROID_STUDIO_GUIDE.md](./ANDROID_STUDIO_GUIDE.md)**

Quick commands:
- `npm run sync:android` - Build and sync to Android
- `npm run open:android` - Open in Android Studio

## Roadmap

See [IMPROVEMENTS_ROADMAP.md](./IMPROVEMENTS_ROADMAP.md) for future enhancements.

---

## Version History

**v2.0.0** - Current Release
- ✅ Statistics & Analytics Dashboard
- ✅ Achievement System (11 unlockable achievements)
- ✅ Data Safety & Management (Export/Import)
- ✅ Goals/Targets System (daily, weekly, monthly)
- ✅ Task Templates (reusable task sets)
- ✅ Local Notifications (daily reminders, task notifications)
- ✅ Haptic Feedback (tactile responses)
- ✅ GitHub Gist Sync (optional cloud backup)
- ✅ Scheduled Tasks (dates, times, recurrence, reminders)
- ✅ Task Persistence (completed tasks remain visible)
- ✅ Improved UI/UX (better spacing, visual hierarchy)
- ✅ Task Filters (all, immediate, scheduled, overdue, today, completed)

---

*System Status: ONLINE*
*Version: 2.0.0*
