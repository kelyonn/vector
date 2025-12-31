# VECTOR // Life Operating System

![Vector Banner](public/vite.svg)

**Vector** is a high-performance, gamified life operating system designed to enforce discipline through RPG mechanics and data visualization. It replaces traditional to-do lists with a "Character Sheet" for your life, featuring attribute tracking, mandatory protocols, and punitive logic.

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
* **Tasks Wiped:** Any unfinished manual task is deleted (Zero XP).
* **Damage Taken:** Missed "Iron Rules" inflict **-10% System Integrity** damage.
* **Energy Reset:** Energy restores to 100%.

### 4. Native Mobile Architecture
Built with **Capacitor**, Vector runs as a native Android/iOS app with:
* **Fullscreen Immersive Mode:** No browser bars.
* **Haptic Feedback & Sound:** Auditory cues for actions.
* **Safe Area Handling:** Optimized layout for notched devices.

---

## Tech Stack

* **Core:** React, TypeScript, Vite
* **State:** Zustand (Persisted LocalStorage)
* **UI:** Tailwind CSS, Framer Motion, Lucide Icons
* **Data Viz:** Recharts (Radar Charts)
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

Vector uses Capacitor to build a native APK.

**Prerequisites:** Android Studio installed.

```bash
# 1. Build the React web assets
npm run build

# 2. Sync web assets to Native Android project
npx cap sync

# 3. Open Android Studio to build APK
npx cap open android

```

*Inside Android Studio: Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.*

---

## Usage Guide

1. **Dashboard (System):** View your Metric Radar, Attribute Levels, and Ledger.
2. **Tasks (Operations):** Manage daily tasks. Toggle **"IRON RULES"** to edit mandatory protocols.
3. **Focus Mode:** Use the timer for deep work. Enabling **"STRICT"** mode penalizes you for switching apps.
4. **Ledger:** Tap "ASSETS" in the header to track liquid wealth.

---

*System Status: ONLINE*