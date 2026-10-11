# 🍅 Pomodoro Timer

สวัสดีคับ ผมเป็น head project ของ project นี้ ผลสรุปของ project นี้คือ เกรด C คับ ทุกท่านฟังไม่ผิดเกรด C คับ จากสาขาวิศวกรรมคอมพิวเตอร์และระบบไอโอที เนื่องจากอาจารย์สาขาผมเป็นอาจารย์ที่โยกมาจากสาขาอิเล็กทรอนิกส์ ทำให้ webapp ที่ผมทำนั้น ดู 'ไร้ประโยชน์' ในสาขานี้ เนื่องจากอาจารย์ต้องการอะไรที่เป็นรูปเป็นร่าง (Hard Ware Project) หรือ web app ที่มีประโยชน์ต่อการทำงานจริงๆ เช่น แจ้งเหตุนั้นคือเหตุแจ้งเตือนอุทุกภัย เป็นต้น และแน่นอนคับ อาจารย์ไม่ได้เล็งเห็นความสำคัญของคนที่มีภาวะสมาธิสั้น นั้นคือเหตุผลที่ Project นี้ ได้เกรด C ครับ 555+ 

Result of project is : Grade C

เว็บแอป Pomodoro แบบ Static ล้วน (ไม่มี backend / ไม่มี bundler) มี 2 โหมดการใช้งาน — **General** และ **ADHD-friendly** — พร้อมจัดการ Task, เพลงประกอบ, เสียงเตือน, PWA (ติดตั้ง/ออฟไลน์/แจ้งเตือน) และระบบให้คะแนนความพึงพอใจที่บันทึกลง Firebase Firestore พร้อมหน้าสถิติ

🌐 **Live:** https://pomodoro-webapp-870c6.web.app

---

## 📁 Project Structure

```
.
├── firebase.json           # Firebase Hosting config (public = public/) + security headers + CSP
├── package.json            # dependency: firebase (อยู่ใน .gitignore แต่ถูก track ไว้แล้ว)
├── workflow.md             # (อยู่ใน .gitignore แต่ถูก track ไว้แล้ว) เอกสารรายงานปริญญานิพนธ์ บทที่ 3
├── README.md
└── public/
    ├── index.html          # หน้า General
    ├── adhd.html           # หน้า ADHD (body.page-adhd, hourglass, movement, reward, toast)
    ├── stats.html          # หน้าสถิติคะแนน (Pie chart + star breakdown จาก Firestore)
    ├── firebase-config.js  # Firebase app + App Check (reCAPTCHA Enterprise) + Analytics + Firestore + Auth
    ├── styles.css          # สไตล์ทั้งหมด (light + dark mode)
    ├── manifest.json       # PWA manifest (มี shortcut ไป ADHD Mode)
    ├── service-worker.js   # Service Worker (cache, push, notificationclick)
    ├── Oh.zip              # ไฟล์ archive สำรองของ stats.html/styles.css/js (ไม่ได้ใช้ใน runtime)
    │
    ├── js/
    │   ├── main.js         # Entry point — ต่อสาย module ทั้งหมด + event listeners
    │   ├── config.js       # presets, รายการเพลง, queryEls(), โหลด custom preset จาก localStorage
    │   ├── state.js        # state กลาง + localStorage/sessionStorage persistence
    │   ├── timer.js        # tick, setMode, toggleTimer, completeSession, preset/custom sliders
    │   ├── render.js       # repaint ส่วน timer (ไม่แตะ task DOM) + hourglass progress
    │   ├── tasks.js        # Task CRUD + inline edit + renderTasks()
    │   ├── audio.js        # BGM (loop, playlist แบบโฟลเดอร์) + Alarm
    │   ├── darkmode.js     # สลับ Dark/Light
    │   ├── ui.js           # dropdown, customizer panel, fullscreen, mobile menu
    │   ├── rating.js       # FAB, ดาว, modal flow, Anonymous Auth, บันทึก Firestore
    │   ├── movement.js     # Pomodoro Movement popup (ADHD)
    │   ├── reward.js       # Reward Pomodoro popup + edit (ADHD)
    │   ├── milestone.js    # Micro-reward toast (ADHD)
    │   ├── pwa.js          # ลงทะเบียน SW + Web Notifications
    │   ├── utils.js        # formatTime, escapeHtml, getFolderName, durationFor
    │   └── chart.umd.js    # Chart.js (แนบในโปรเจกต์ ไม่พึ่ง CDN) ใช้ใน stats.html
    │
    ├── assets/
    │   ├── BGM/{Lofi,Ambient,Jazz}/   # เพลงประกอบ 9 แทร็ก
    │   └── Alarm/                     # เสียงเตือน 5 ไฟล์
    └── icons/
        ├── PWA192.png
        ├── PWA512.png
        └── favicon.png
```

---

## ✨ Features

### หน้า General (`index.html`)
- **Timer 3 โหมด** — Pomodoro / Short Break / Long Break (สลับด้วยแท็บ หรือปุ่ม Skip)
- **Focus presets** (Pomodoro / Short / Long)

  | Preset | Pomodoro | Short Break | Long Break |
  |--------|---------:|------------:|-----------:|
  | Beginner | 10 | 5 | 10 |
  | **Standard** (default หน้า General) | 25 | 5 | 15 |
  | Medium | 40 | 8 | 20 |
  | Expert | 60 | 10 | 25 |
  | Custom (slider, จำค่าใน localStorage) | 15 | 8 | 10 |

- **ครบ 4 Pomodoro → Long Break** (นอกนั้นเป็น Short Break)
- **Auto-start** — เริ่ม Pomodoro / Break อัตโนมัติ (ตั้งแยกกัน)
  - Break: รอ Movement/Reward popup ปิดก่อนค่อยเริ่ม
  - Pomodoro หลัง Long Break: รอปิดหน้าให้คะแนนก่อนค่อยเริ่ม
- **Auto Dark Mode** — เปลี่ยนเป็น Dark 5 วินาทีหลังกด Start
- **Task list** — เพิ่ม / ติ๊กเสร็จ / แก้ไข (dblclick หรือปุ่ม, Enter = save, Esc = cancel) / ลบ / Clear done / Clear all; พับแผง Tasks ได้
- **Background music** — 9 แทร็ก (Lofi 3, Ambient 3, Jazz 3), play/pause, prev/next (วนในโฟลเดอร์เดียวกัน), mute, volume, playlist แบบโฟลเดอร์, พับแถบเสียงบนมือถือ
- **Alarm** — 5 เสียง (Hassium, Chilled, Radial, Morning glory, Whale calls) ปรับ volume + ปุ่มทดสอบ (เสียงทดสอบจะถูกดับเมื่อปิด/สลับแผง Customize)
- **Star Rating** — เด้งอัตโนมัติเมื่อ Long Break จบ หรือกด Finish → Yes/No → ให้ดาว 1–5; ปุ่ม FAB มุมซ้ายล่างเปิดได้ตลอด; บันทึกลง Firestore
- **Web Notifications** — แจ้งเตือนเมื่อ Pomodoro / Short Break / Long Break จบ (ยิงผ่าน Service Worker; ถามสิทธิ์ครั้งเดียวต่อเครื่องด้วย confirm อธิบายก่อน)
- **Accessibility** — focus trap ใน modal, คืน focus เมื่อปิด, aria-label
- **Dark mode / Fullscreen / Responsive** (hamburger menu บนมือถือ)

### หน้า ADHD (`adhd.html`)
มีทุกอย่างของหน้า General และเพิ่ม:
- **Mini-Pomodoro** — default preset = **Beginner (10 นาที)** ลดแรงต้านในการเริ่มงาน
- **Hourglass Timer** — นาฬิกาทรายแสดงความคืบหน้าแทนวงกลม
- **Split Buttons** — ปุ่ม Pause และ Finish แยกกัน
- **Pomodoro Movement** — เมื่อจบ Pomodoro ขึ้น popup ท่าขยับร่างกาย พร้อม ring countdown (Done / Skip) แสดง **ตามลำดับจากเบาไปหนักแล้ววนซ้ำ** (ไม่สุ่ม):
  พักสายตา (20s) → หมุนคอ (25s) → Deep Breathing (30s) → ยืดแขน (20s) → ยืดขา (30s) → ยืดหลัง (25s) → เดินรอบห้อง (30s)
- **Reward Pomodoro** — ครบ 4 รอบขึ้นรางวัลที่ตั้งเอง (ค่าเริ่มต้น "ดู YouTube 15 นาที") พร้อม countdown; แก้ไขข้อความ/เวลาได้ (หยุดนับระหว่างแก้) บันทึกใน localStorage
- **Micro-reward toast** — ข้อความกำลังใจสุ่ม 1 ใน 10 แบบ ขึ้นที่ช่วงเวลา**สุ่ม 3–7 นาที** (variable-interval reinforcement) ระหว่าง Pomodoro; หายเองใน 3.5 วินาทีหรือคลิกปิด — **แสดงเฉพาะหน้า ADHD**
- **Flow ตอนจบ Pomodoro:** Movement → (ถ้าครบ 4 รอบ) Reward → auto-start Break
- **Dev test panel** — ปุ่ม Test Movement / Reward / Toast (ซ่อนด้วย `hidden` ใน `.dev-test-panel`)

### หน้า Stats (`stats.html`)
- ดึงคอลเลกชัน `ratings` จาก Firestore (Anonymous Auth) → Pie chart (Chart.js), คะแนนเฉลี่ย, จำนวน, bar breakdown ต่อดาว
- กรอง **ทั้งหมด / General / ADHD** (จาก field `mode`), คลิก legend เพื่อซ่อน/แสดงดาว, ปุ่มรีเฟรช, Dark mode
- ⚠️ ต้องมี rule ที่อนุญาตให้ **อ่าน** `ratings` (ดูหัวข้อ Firebase ด้านล่าง)

### PWA
- **ติดตั้งได้** (manifest + shortcut "ADHD Mode") และใช้งาน**ออฟไลน์**ได้ (ยกเว้นเพลง/เสียงเตือน)
- **Timer แม่นยำเมื่อพักหน้าจอ** — คำนวณจาก wall-clock (`startedAt`/`remainingAtStart`) ไม่นับจำนวน tick; sync ทันทีเมื่อ `visibilitychange` / `pageshow` / `focus`
- **สลับหน้า General ↔ ADHD ในแท็บเดียวกันไม่รีเซ็ต** — timer, mode, preset, counts, เพลง, volume, mute ถูกเก็บใน `sessionStorage`; ถ้า timer หมดระหว่างสลับหน้า จะ complete session ย้อนหลังให้ครบ flow
- มี handler `push` / `notificationclick` ใน Service Worker (การส่ง push จริงต้องมี backend แยก — ยังไม่มีในโปรเจกต์นี้)

---

## 🚀 How to Run

```bash
# เสิร์ฟโฟลเดอร์ public/
cd public
npx serve .
# หรือ
python -m http.server 8000
# หรือ VS Code Live Server (Open with Live Server ที่ public/index.html)
```

> ⚠️ ต้องเปิดผ่าน HTTP (ไม่ใช่ `file://`) เพราะใช้ ES Modules + Service Worker
> Deploy: `firebase deploy --only hosting` (public dir = `public`)

---

## 🔥 Firebase

| ไฟล์ | หน้าที่ |
|------|--------|
| `public/firebase-config.js` | init App, **App Check (ReCaptchaEnterpriseProvider)**, Analytics, Firestore, Auth |
| `public/js/rating.js` | `ensureAuth()` (Anonymous sign-in, timeout 8 วิ) + `_saveScore()` เขียนลง `ratings` |
| `public/stats.html` | อ่าน `ratings` ด้วย `getDocs` |
| `firebase.json` | Hosting + headers (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, **CSP**) |

**ข้อสำคัญด้านความทนทาน:** `rating.js` โหลด `firebase-config.js` และ Firebase SDK แบบ **dynamic import** เฉพาะตอนใช้งานจริง (warm-up ตอน idle) เพื่อให้ถ้าเครือข่ายบล็อก gstatic / App Check ล้มเหลว ตัว timer ยังทำงานปกติ

**เอกสารที่บันทึกต่อ 1 คะแนน:**
```
ratings/{autoId}
  ├── rating: number          (1–5)
  ├── mode: "general" | "adhd"
  └── timestamp: serverTimestamp()
```

**Firestore Security Rules** (ตั้งใน Firebase Console — ไม่ได้ deploy ผ่าน CLI; ไม่มี `firestore.rules` / `.firebaserc` ในโปรเจกต์):
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ratings/{docId} {
      allow create: if request.auth != null
                    && request.resource.data.keys().hasOnly(["rating", "mode", "timestamp"])
                    && request.resource.data.rating is int
                    && request.resource.data.rating >= 1
                    && request.resource.data.rating <= 5
                    && request.resource.data.mode in ["general", "adhd"];
      allow read: if request.auth != null;   // จำเป็นสำหรับ stats.html
      allow update, delete: if false;
    }
  }
}
```

> **หมายเหตุ:**
> - `mode` เป็น field ที่เพิ่มทีหลัง ต้องใส่ใน `hasOnly([...])` ไม่งั้นทุกการเขียนจะถูก reject; เอกสารเก่า (ก่อนมี `mode`) ยังอยู่ แต่จะไม่ถูกนับในตัวกรอง General/ADHD ของหน้า Stats (ยังนับใน "ทั้งหมด")
> - rule เดิมใน README ระบุ `allow read: if false` — ถ้าใช้แบบนั้น `stats.html` จะขึ้น `permission-denied` ต้องเปิดอ่านตามด้านบน หรือจำกัดผู้อ่านด้วยวิธีอื่นตามที่ต้องการ
> - `firebaseConfig` และ reCAPTCHA site key ใน `firebase-config.js` เป็นค่า public ตามปกติของ Web SDK; ความปลอดภัยพึ่ง App Check + Auth + Security Rules

### Security Layer
```
reCAPTCHA Enterprise → App Check → Anonymous Authentication → Firestore Security Rules
+ Hosting headers / CSP (firebase.json)
```

---

## 💾 Storage

### localStorage (ถาวรต่อเบราว์เซอร์)
| Key | Value |
|-----|-------|
| `pomodoroDarkMode` | `"true"` / `"false"` |
| `pomodoroAutoDarkMode` | `"true"` / `"false"` |
| `pomodoroAutoPomodoro` | `"true"` / `"false"` |
| `pomodoroAutoBreaks` | `"true"` / `"false"` |
| `pomodoroAlarmVolume` | `"0"`–`"100"` (default `"20"`) |
| `pomodoroCloneTasks` | JSON array ของ `{ id, title, done }` |
| `pomodoroCustomPreset` | `{ pomodoro, rest, long }` (sanitize ตอนโหลด; ถ้าเสียจะลบทิ้ง) |
| `pomodoroReward` | `{ text: string, mins: number }` |
| `pomodoroNotifAsked` | `"1"` เมื่อเคยถามสิทธิ์ Notification แล้ว |

### sessionStorage (เฉพาะแท็บ)
| Key | Value |
|-----|-------|
| `pomodoroSharedTimerState` | `mode, preset, remaining, running, startedAt, remainingAtStart, counts, nextMilestoneAt, selectedTrack, musicPlaying, muted, volume` — ใช้ให้ timer/เพลงต่อเนื่องเมื่อสลับ index ↔ adhd |

### Service Worker cache
`CACHE_NAME` ปัจจุบัน `pomodoro-28-09-2026-notifications` — precache HTML/CSS/JS/ไอคอน และ Firebase SDK 12.14.0 จาก gstatic
- HTML/JS/CSS → **network-first** (fallback เป็น cache เมื่อออฟไลน์)
- ไอคอน/manifest → cache-first
- `/assets/*` (เพลง/เสียง), Firebase live API, googleapis, cdnjs → ไม่ผ่าน cache

---

## 🧩 Module Architecture

```
main.js
 ├── timer.js       tick (wall-clock), setMode, toggleTimer, completeSession, presets
 │                  callbacks: playAlarm, toggleDarkMode, onPomodoroComplete,
 │                             onRestComplete, onLongComplete, onMilestone
 ├── render.js      repaint timer ทุก tick — ไม่แตะ task DOM
 ├── tasks.js       renderTasks() เรียกเฉพาะตอนข้อมูล task เปลี่ยน (diff ตาม id)
 ├── audio.js       BGM + Alarm
 ├── darkmode.js    toggle, auto-dark
 ├── ui.js          dropdown, customizer, fullscreen, mobile menu
 ├── rating.js      FAB, ดาว, modal, Auth, Firestore save
 ├── movement.js    Movement popup + ring countdown (ADHD)
 ├── reward.js      Reward popup + edit panel (ADHD)
 ├── milestone.js   Toast สุ่ม 3–7 นาที (ADHD)
 ├── pwa.js         SW registration + Notifications
 ├── utils.js       helpers / durationFor
 ├── config.js      presets, tracks, queryEls
 └── state.js       single source of truth
```

**Design decisions**
- `render()` กับ `renderTasks()` แยกกันโดยเจตนา — ไม่ให้ task DOM ถูกสร้างใหม่ทุกวินาที (รักษา CSS animation)
- Cross-module callbacks inject ผ่าน `setTimerRefs()` / `setMovementRefs()` / `setRewardRefs()` / `setRatingRefs()` / `setAudioRefs()` / `setUIRefs()` เพื่อเลี่ยง circular import
- Chain หลังจบ Pomodoro: `setMode(next)` → `onPomodoroComplete` → Movement → (ครบ 4 รอบ) Reward → auto-start Break; หน้า General ไม่มี popup จึงถือว่า "เสร็จ" ทันทีแบบ synchronous (ตั้ง `pendingReward` ก่อนเรียก `showMovementPopup()` เสมอ)
- Timer ใช้ `setInterval` 500ms แต่คำนวณเวลาที่เหลือจาก `Date.now()` เสมอ
- Toast / Movement / Reward เป็นฟีเจอร์ ADHD — `onMilestone` gate ด้วย `body.page-adhd`

---

## 📦 Dependencies

| รายการ | เวอร์ชัน | การใช้งาน |
|--------|----------|-----------|
| Firebase JS SDK (app, analytics, firestore, auth, app-check) | 12.14.0 | โหลดจาก `www.gstatic.com` ตรงใน browser (`package.json` มี `firebase ^12.14.0` แต่ไม่ได้ถูกใช้ตอน runtime) |
| Chart.js | แนบ `js/chart.umd.js` | Pie chart ใน `stats.html` |
| Font Awesome | 5.15.3 (cdnjs) | ไอคอนดาว |

> ไม่มี bundler (Webpack/Vite) — ใช้ native ES Modules ตรงใน browser

---

## ⚠️ ข้อสังเกตจากการอ่านโค้ด (ยังไม่ได้แก้)
- `pwa.js` อ้างไอคอน `icons/PWA192.png` ถูกต้อง แต่ comment ใน `service-worker.js` อ้างไฟล์ `BACKGROUND_NOTIFICATION_SETUP.md` ที่ไม่มีอยู่ในรีโป
- `package.json` มี dependency `@dataconnect/generated` (`file:src/dataconnect-generated`) ที่ไม่มีโฟลเดอร์จริงและไม่ได้ใช้
- เพลงใน `assets/` ถูก commit อยู่ในรีโปแล้ว (README เดิมเขียนว่าไม่อยู่)
