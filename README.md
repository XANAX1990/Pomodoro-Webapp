# 🍅 Pomodoro Timer — PROJECTS_SSS

A fully static Pomodoro web app with ADHD-friendly mode, background music, task management, PWA support, and Firebase rating integration.

🌐 **Live:** https://pomodoro-webapp-870c6.web.app

---

## 📁 Project Structure

```
public/
├── index.html              # Main Pomodoro timer page (General)
├── adhd.html               # ADHD-friendly mode (hourglass visual)
├── firebase-config.js      # Firebase app + Firestore + Analytics init
├── styles.css              # All styles (light + dark mode)
├── manifest.json           # PWA manifest
├── service-worker.js       # PWA service worker (offline + caching)
├── package.json
├── package-lock.json
├── .gitignore
├── README.md
│
├── js/
│   ├── main.js             # Entry point — wires all modules + event listeners
│   ├── config.js           # Presets, track list, queryEls()
│   ├── state.js            # Global state + localStorage persistence
│   ├── timer.js            # Timer logic (tick, mode, auto-start, milestone, session complete)
│   ├── render.js           # UI repaint (timer only — not tasks)
│   ├── tasks.js            # Task CRUD + renderTasks()
│   ├── audio.js            # BGM playback + playlist
│   ├── darkmode.js         # Dark/light toggle
│   ├── ui.js               # Dropdowns, fullscreen, mobile menu
│   ├── rating.js           # Star rating, FAB, modal flow, Firestore save
│   ├── movement.js         # Pomodoro Movement popup (ADHD)
│   ├── reward.js           # Reward Pomodoro popup (ADHD)
│   ├── milestone.js        # Micro-reward toast (every 5 min)
│   ├── pwa.js              # Service worker registration + Web Notifications
│   └── utils.js            # formatTime, escapeHtml, getFolderName
│
├── assets/
│   ├── BGM/                # Background music (not in repo — too large)
│   │   ├── Lofi/
│   │   ├── Ambient/
│   │   └── Jazz/
│   └── Alarm/              # Alarm sounds (not in repo — too large)
│
└── icons/
    ├── pwa-192.png         # PWA icon 192×192
    └── pwa-512.png         # PWA icon 512×512
```

---

## ✨ Features

### หน้าบุคคลทั่วไป (`index.html`)
- **Timer modes** — Pomodoro / Short Break / Long Break
- **Focus presets** — Beginner (10 min), Standard (20 min), Medium (40 min), Expert (60 min), Custom
- **Auto-start** — Auto-start Pomodoro and/or breaks after session ends
- **Auto Dark Mode** — Fades to dark mode 5 seconds after timer starts
- **Task list** — Add, complete, delete tasks; persisted in localStorage
- **Background music** — Lofi / Ambient / Jazz; volume control, prev/next, mute
- **Alarm sounds** — 5 options with volume control
- **Star Rating (FAB)** — Rate your session anytime; saves to Firebase Firestore
- **Micro-reward toast** — Encouraging message every 5 minutes during Pomodoro
- **Web Notifications** — Notifies when timer ends even if tab is not active
- **Dark mode** — Full dark/light theme
- **Fullscreen + Mobile** — Responsive with hamburger menu

### หน้า ADHD (`adhd.html`)
รองรับทุกฟีเจอร์จากหน้าบุคคลทั่วไป และเพิ่มเติม:
- **Hourglass Timer** — Visual sand timer แทนตัวเลข
- **Split Buttons** — ปุ่ม Pause / Finish แยกกัน
- **Pomodoro Movement** — Popup แนะนำท่าขยับร่างกาย (7 ท่า) พร้อม ring countdown
- **Reward Pomodoro** — ครบ 4 รอบ → ขึ้นรางวัลที่ตั้งไว้ พร้อม countdown timer
- **Finish → Rate** — กด Finish → Yes/No modal → ให้ดาว → Success animation

### PWA
- **Install** — Add to Home Screen บน mobile หรือ desktop
- **Offline** — ใช้งานได้แม้ไม่มี internet (ยกเว้น BGM/Alarm)
- **Web Push Notifications** — แจ้งเตือนเมื่อ timer จบแม้พลิกหน้าจอ

---

## 🚀 How to Run

```bash
# Option 1: VS Code Live Server (recommended)
# Right-click index.html → Open with Live Server

# Option 2: static server
npx serve .

# Option 3: Python
python3 -m http.server 8000
```

> ⚠️ Must be served over HTTP (not `file://`) — uses ES modules + Service Worker

---

## 🔥 Firebase Setup

| File | Purpose |
|------|---------|
| `firebase-config.js` | Firebase app + Firestore + Analytics init |
| `js/rating.js` | `_saveScore()` writes to `ratings` collection |

**Firestore Security Rules:**
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ratings/{docId} {
      allow read: if false;
      allow create: if request.resource.data.rating is int
                    && request.resource.data.rating >= 1
                    && request.resource.data.rating <= 5
                    && request.resource.data.keys().hasOnly(["rating", "timestamp"]);
      allow update, delete: if false;
    }
  }
}
```

---

## 💾 LocalStorage Keys

| Key | Value |
|-----|-------|
| `pomodoroDarkMode` | `"true"` / `"false"` |
| `pomodoroAutoDarkMode` | `"true"` / `"false"` |
| `pomodoroAutoPomodoro` | `"true"` / `"false"` |
| `pomodoroAutoBreaks` | `"true"` / `"false"` |
| `pomodoroAlarmVolume` | `"0"` – `"100"` (default `"20"`) |
| `pomodoroCloneTasks` | JSON array of task objects |
| `pomodoroReward` | `{ text: string, mins: number }` |

---

## 🧩 Module Architecture

```
main.js
 ├── timer.js       tick, setMode, toggleTimer, switchModeManually
 │                  callbacks: onLongComplete, onPomodoroComplete, onMilestone
 ├── render.js      timer UI only — runs every second, never touches task DOM
 ├── tasks.js       renderTasks called only when task data changes
 ├── audio.js       BGM playback, playlist
 ├── darkmode.js    toggle, auto-dark
 ├── ui.js          dropdowns, fullscreen, mobile
 ├── rating.js      FAB, star interaction, modal flow, Firestore save
 ├── movement.js    Movement popup + ring countdown (ADHD)
 ├── reward.js      Reward popup + edit panel (ADHD)
 ├── milestone.js   Toast every 5 min during Pomodoro
 ├── pwa.js         Service worker registration + Web Notifications
 └── state.js       single source of truth
```

**Key design decisions:**
- `render()` and `renderTasks()` are intentionally **separate** — prevents task DOM from rebuilding every second, preserving CSS animations
- Cross-module callbacks injected via `setTimerRefs()` to avoid circular imports
- Movement → Reward chain: `onPomodoroComplete` triggers movement; movement's `onMovementDone` triggers reward if `pendingReward = true`

---

## 📦 Dependencies

| Package | Version | Usage |
|---------|---------|-------|
| firebase | ^12.14.0 | Firestore + Analytics (CDN via gstatic) |
| Font Awesome | 5.15.3 | Star icons (CDN) |

> No bundler (Webpack/Vite) — native ES modules directly in browser.