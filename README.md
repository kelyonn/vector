# VECTOR v1.1 // Life Operating System

> *"We are what we repeatedly do. Excellence, then, is not an act, but a habit."*

**Vector** is not a to-do list. It is a gamified, high-performance operating system for your life. It tracks your physical and mental evolution using RPG mechanics, ruthless punitive logic, and data visualization.

**

## ⚡ Core Systems

### 1. The 6-Point Attribute Matrix

Every action you take feeds into one of six core stats. Your "Nexus" avatar evolves based on your total level.

* **STRENGTH:** Physical exercise, nutrition, sleep.
* **INTELLECT:** Reading, studying, learning.
* **CREATE:** Coding, writing, building, shipping.
* **MIND:** Meditation, mental clarity, cleaning environment.
* **WORK:** Deep work sessions, professional tasks.
* **OTHERS:** Miscellaneous duties.

### 2. The Iron Rules (Daily Protocols)

These are mandatory tasks that regenerate **every day at 00:00**. You cannot delete them.

* **Sleep 6hr+**
* **Drink 3L Water**
* **Clean Room**
* **Shower / Groom**

### 3. The Midnight Purge (00:00 Reset)

At midnight, the system executes a hard reset:

* **Manual Tasks:** Deleted. If you didn't finish them, they are gone. No XP awarded.
* **Iron Rules:** Checked.
* **Success:** Integrity increases.
* **Failure:** **-10% System Integrity** per missed rule.


* **Energy:** Resets to 100%.

### 4. Focus Engine (Strict Mode)

A deep-work timer that tracks "Distractions."

* **Strict Mode:** If enabled, leaving the app (switching tabs) counts as a distraction.
* **Penalty:** Distractions reduce the final XP earned from the session.

### 5. Mobile-First Architecture

* **Desktop:** Split view (Dashboard + Tasks).
* **Mobile:** Bottom navigation bar to switch between **SYSTEM** (Stats/Nexus) and **TASKS** (Checklist).

---

## 🛠 Installation & Setup

Vector is built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**.

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/vector.git
cd vector

```


2. **Install Dependencies**
```bash
npm install

```


3. **Run Development Server**
```bash
npm run dev

```


*Access via `http://localhost:5173*`
4. **Network Access (Mobile Testing)**
To use on your phone while developing:
```bash
npm run dev -- --host

```



---

## 📱 How to Install (PWA)

Vector is designed to be installed as a native-like app on your phone.

1. **Deploy** to Vercel/Netlify (Recommended) OR run locally via network IP.
2. **Open** the link in Safari (iOS) or Chrome (Android).
3. **Tap Share** -> **"Add to Home Screen"**.

---

## 🎮 Usage Guide

* **Adding Tasks:** Select a tag (e.g., WORK) -> Type task -> Enter.
* **Iron Rules:** Click the "IRON RULES" button to edit your mandatory daily protocols.
* **Ledger:** Click "ASSETS" in the top bar to toggle the wealth tracker.
* **Reset:** The system auto-resets at 00:00. You can force a reset via the refresh button (only for testing).

## ⚠️ Data Persistence

Vector uses `localStorage` to save your stats.

* **Clear Data:** If the app crashes or you want a fresh start, clear your browser's Local Storage for the site.
* **Sync:** Currently local-only. (Cloud sync roadmap item).

*System Status: ONLINE*
*Integrity: 100%*