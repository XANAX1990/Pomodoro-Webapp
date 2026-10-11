# รายงานปริญญานิพนธ์: เว็บไซต์บริหารจัดการเวลาด้วยเทคนิคโพโมโดโร่

---

## บทที่ 3 — วิธีดำเนินงาน

### 3.1 ภาพรวมของโปรเจกต์

เว็บแอปพลิเคชันบริหารจัดการเวลาด้วยเทคนิคโพโมโดโร่ (Pomodoro Timer) พัฒนาขึ้นเพื่อช่วยให้ผู้ใช้งานสามารถจัดสรรเวลาในการทำงานและการพักได้อย่างมีประสิทธิภาพ โดยอ้างอิงหลักการของ Pomodoro Technique ที่แบ่งการทำงานออกเป็นช่วงๆ สลับกับการพัก

ระบบถูกออกแบบให้รองรับผู้ใช้ 2 กลุ่มหลัก:

- **ผู้ใช้ทั่วไป** (`index.html`) — ต้องการเครื่องมือจับเวลาที่เรียบง่าย ใช้งานได้ทันที
- **ผู้ใช้ที่มีภาวะสมาธิสั้น (ADHD)** (`adhd.html`) — ได้รับการออกแบบ UI พิเศษที่ลดสิ่งเร้า และมีฟีเจอร์เสริมเพื่อรักษาแรงจูงใจ

---

### 3.2 คุณสมบัติหลักของระบบ

#### หน้าบุคคลทั่วไป (`index.html`)

| ฟีเจอร์ | รายละเอียด |
|--------|-----------|
| **Pomodoro Timer** | นับถอยหลังพร้อมสลับโหมด Pomodoro / Short Break / Long Break อัตโนมัติ |
| **Focus Level** | ปรับระดับความยากได้ 5 ระดับ: Beginner (10 นาที), Standard (25 นาที), Medium (40 นาที), Expert (60 นาที), Custom |
| **Task List** | เพิ่ม / ติ๊กสำเร็จ / ลบงาน บันทึกใน localStorage ข้ามเซสชันได้ |
| **Background Music** | เพลงประกอบ 9 แทร็ค แบ่งเป็น 3 หมวด: Lofi, Ambient, Jazz ควบคุมระดับเสียงและ mute ได้ |
| **Alarm** | เสียงแจ้งเตือนเมื่อหมดเวลา 5 แบบ ปรับระดับเสียงได้ |
| **Dark Mode** | สลับ Light/Dark mode ด้วยตนเอง หรือตั้งให้เปิดอัตโนมัติหลังเริ่ม timer 5 วินาที |
| **Auto Start** | ตั้งให้เริ่ม Pomodoro / Break ถัดไปอัตโนมัติ |
| **Star Rating** | แสดงอัตโนมัติหลังจบ Long Break หรือเมื่อกด Finish → Yes/No → ให้ดาว; เปิดเพิ่มเติมได้ผ่านปุ่ม FAB มุมล่างซ้าย บันทึกลง Firebase Firestore |
| **Web Notification** | แจ้งเตือนเมื่อ Pomodoro / Short Break / Long Break จบ ผ่าน Service Worker (ถามสิทธิ์ครั้งเดียวต่อเครื่อง) |
| **Timer แม่นยำ** | คำนวณเวลาที่เหลือจาก wall-clock (`Date.now()`) จึงไม่คลาดเมื่อล็อกจอ/สลับแอป และสลับหน้า General ↔ ADHD โดย timer/เพลงไม่รีเซ็ต (เก็บใน sessionStorage) |
| **PWA** | ติดตั้งลงเครื่องได้เหมือน Native App และใช้งาน Offline ได้ |

#### หน้า ADHD (`adhd.html`)

รองรับทุกฟีเจอร์จากหน้าบุคคลทั่วไป และเพิ่มเติม:

| ฟีเจอร์ | รายละเอียด |
|--------|-----------|
| **Mini-Pomodoro** | preset เริ่มต้นของหน้า ADHD คือ Beginner (10 นาที) แทนมาตรฐาน 25 นาที ลดความกดดันในการเริ่มลงมือทำงาน (Task Initiation) และช่วยผู้มีภาวะตาบอดทางเวลา (Time Blindness) อ้างอิง Barkley (2014) [4] |
| **Visual Hourglass Timer** | แสดงทรายไหลแทนตัวเลข ลดความกดดันจากการจ้องนาฬิกา |
| **Split Control Buttons** | ปุ่ม Pause และ Finish แยกกัน ป้องกันการกดผิด |
| **Pomodoro Movement** | เมื่อจบแต่ละรอบ จะขึ้น popup แนะนำท่าขยับร่างกาย (7 ท่า แสดงตามลำดับจากเบาไปหนักแล้ววนซ้ำ: พักสายตา → หมุนคอ → Deep Breathing → ยืดแขน → ยืดขา → ยืดหลัง → เดินรอบห้อง) พร้อม ring countdown timer กด Done หรือ Skip ได้ อ้างอิงจากงานวิจัย Ratey & Hagerman (2008) ที่พบว่าการเคลื่อนไหวร่างกายช่วยกระตุ้น Dopamine และ Norepinephrine [5] |
| **Reward Pomodoro** | เมื่อทำครบ 4 รอบ ระบบจะแสดงรางวัลที่ผู้ใช้ตั้งไว้ล่วงหน้า พร้อม countdown timer ตั้งและแก้ไขรางวัลได้เอง (ค่าเริ่มต้น "ดู YouTube 15 นาที") บันทึกใน localStorage [7] |
| **Micro-reward Toast** | ระหว่าง Pomodoro ขึ้นข้อความกำลังใจ (สุ่ม 1 จาก 10 ข้อความ) ที่ช่วงเวลาสุ่ม 3–7 นาที ตามหลัก variable-interval reinforcement หายเองใน 3.5 วินาที หรือกดปิดได้ — มีเฉพาะหน้า ADHD |
| **Finish Modal** | กดปุ่ม Finish → ยืนยัน Yes/No → ให้ดาว → แสดง Success animation |

#### หน้าสถิติ (`stats.html`)

ดึงคะแนนจาก Firestore (Anonymous Auth) แสดง Pie Chart (Chart.js ที่แนบในโปรเจกต์), คะแนนเฉลี่ย, จำนวนรายการ, แถบสัดส่วนต่อดาว กรองได้ทั้งหมด / General / ADHD (จาก field `mode`) และคลิก legend เพื่อซ่อน/แสดงดาว

---

### 3.3 เครื่องมือที่ใช้ในการพัฒนา

| หมวดหมู่ | เทคโนโลยี | รายละเอียด |
|---------|----------|-----------|
| **Frontend Structure** | HTML5 | โครงสร้างหน้าเว็บ 2 หน้าหลัก |
| **Styling** | CSS3 | Responsive Layout, CSS Variables, Dark Mode, Animations |
| **Logic** | JavaScript ES6+ | ES Modules, Async/Await, localStorage API, Service Worker API |
| **Database** | Firebase Firestore | จัดเก็บข้อมูลผลประเมินความพึงพอใจ (Star Rating) |
| **Analytics** | Firebase Analytics | ติดตามการใช้งาน |
| **Charts** | Chart.js (`js/chart.umd.js`) | Pie Chart ในหน้าสถิติ แนบไฟล์ไว้ในโปรเจกต์ ไม่พึ่ง CDN |
| **Hosting** | Firebase Hosting | Deploy และให้บริการ Static Site |
| **PWA** | Web App Manifest + Service Worker | รองรับการติดตั้งและใช้งาน Offline |
| **IDE** | Visual Studio Code | พร้อม Live Server Extension |
| **Version Control** | Git / GitHub | บริหารจัดการ source code | 
| **Security** | Firebase App Check + reCAPTCHA Enterprise + Anonymous Auth + Security Rules + CSP/Security headers (`firebase.json`) | ป้องกันการโจมตี |

> **หมายเหตุ:** เว็บแอปนี้เป็น **Pure Static Site** ไม่ต้องการ Backend Server เนื่องจากข้อมูลส่วนใหญ่ (การตั้งค่า, tasks, รางวัล) จัดเก็บที่ฝั่ง Client ผ่าน localStorage โดยตรง มีเพียงข้อมูลผลประเมินความพึงพอใจที่ส่งไปยัง Firebase Firestore

---

### 3.3.5 กระบวนการทำงานในรูปแบบ Flow Chart

แสดงผังกระบวนการดำเนินงานของการทำงานในหน้าเว็บไซต์ตามขอบเขตของปริญญานิพนธ์ เริ่มต้นจากการกำหนดและเลือกฟังก์ชันการทำงาน โดยมีรายละเอียดขั้นตอนดังนี้:

1. **จุดเริ่มต้น** — ระบบเริ่มทำงานเมื่อผู้ใช้เข้าสู่หน้าเว็บไซต์
2. **การเลือกฟังก์ชันการทำงาน** — ผู้ใช้เลือกโหมดผ่าน Navbar (Pomodoro / Short Break / Long Break)
3. **การประมวลผล** — กดปุ่ม START → JavaScript เริ่มฟังก์ชันนับถอยหลังตามเวลาที่กำหนด
4. **เงื่อนไขเวลา** — ระบบตรวจสอบว่าเวลาหมดหรือไม่ หากหมดจะเล่นไฟล์เสียงแจ้งเตือนเพื่อบอกสถานะแก่ผู้ใช้

---

### 3.4 สถาปัตยกรรมซอฟต์แวร์

```
public/
├── index.html              ← หน้าบุคคลทั่วไป
├── adhd.html               ← หน้า ADHD Mode
├── stats.html              ← หน้าสถิติคะแนนความพึงพอใจ
├── firebase-config.js      ← Firebase init + App Check + Auth + Firestore
├── styles.css              ← Stylesheet ทั้งหมด (Light + Dark Mode)
├── manifest.json           ← PWA Manifest
├── service-worker.js       ← Service Worker (Offline + Cache)
├── assets/
│   ├── BGM/                ← เพลงประกอบ (Lofi, Ambient, Jazz)
│   └── Alarm/              ← เสียงแจ้งเตือน
├── icons/
│   ├── PWA192.png          ← PWA Icon 192×192
│   └── PWA512.png          ← PWA Icon 512×512 (+ favicon.png)
└── js/
    ├── main.js             ← Entry point
    ├── config.js           ← Presets, รายการเพลง, queryEls()
    ├── state.js            ← Global State (single source of truth)
    ├── timer.js            ← Logic จับเวลา, สลับโหมด, Milestone
    ├── render.js           ← อัปเดต UI ส่วน Timer (ทำงานทุก 1 วินาที)
    ├── tasks.js            ← CRUD Tasks
    ├── audio.js            ← ควบคุมเพลง + Playlist
    ├── darkmode.js         ← สลับ Dark/Light Mode
    ├── ui.js               ← Dropdown, Fullscreen, Mobile Menu
    ├── rating.js           ← FAB, Star Rating, Modal Flow, Firestore Save
    ├── movement.js         ← Pomodoro Movement Popup (ADHD)
    ├── reward.js           ← Reward Pomodoro Popup (ADHD)
    ├── milestone.js        ← Micro-reward Toast (สุ่ม 3–7 นาที, ADHD)
    ├── pwa.js              ← Service Worker Registration + Web Notifications
    ├── utils.js            ← Helper functions
    └── chart.umd.js        ← Chart.js (ใช้ใน stats.html)
```

**การออกแบบ Module ที่สำคัญ:**

- `render()` และ `renderTasks()` แยกกันโดยเจตนา เพื่อไม่ให้ DOM ของ Task List ถูกสร้างใหม่ทุกวินาทีขณะ timer ทำงาน ซึ่งจะทำให้ CSS animation ขาดตอน
- การส่งต่อ callback ระหว่าง module (`playAlarm`, `toggleDarkMode`, `onLongComplete`, `onRestComplete`, `onPomodoroComplete`, `onMilestone`) ทำผ่าน `setTimerRefs()` เพื่อหลีกเลี่ยง Circular Import
- Movement → Reward chain: `onPomodoroComplete` เรียก Movement popup เมื่อปิดแล้วจึงแสดง Reward ถ้าครบ 4 รอบ แล้วจึง auto-start Break (ถ้าเปิดไว้); หลัง Long Break จะรอปิดหน้าให้คะแนนก่อนจึง auto-start Pomodoro
- `rating.js` โหลด Firebase แบบ dynamic import เฉพาะตอนใช้งานจริง เพื่อไม่ให้ timer พังเมื่อเครือข่ายบล็อก Firebase/App Check

---

### 3.5 รูปแบบการจัดเก็บข้อมูล

| ประเภท | วัตถุประสงค์ | ข้อมูลที่เก็บ |
|-------|------------|-------------|
| **localStorage** | บันทึกการตั้งค่าและข้อมูลผู้ใช้ภายในเครื่อง | Dark Mode, Auto Dark Mode, Auto Start, ระดับเสียง Alarm, รายการ Tasks, Custom preset, ข้อมูลรางวัล |
| **sessionStorage** | คงสถานะเมื่อสลับหน้า General ↔ ADHD ในแท็บเดียวกัน | mode, preset, เวลาที่เหลือ, จำนวนรอบ, เพลง/volume/mute |
| **Firebase Firestore** | จัดเก็บผลประเมินความพึงพอใจ | Star Rating (1–5), mode (general/adhd), Timestamp |
| **Service Worker Cache** | จัดเก็บไฟล์โค้ดสำหรับใช้งาน Offline | HTML, CSS, JS, Manifest |

**โครงสร้าง Firestore Collection:**
```
ratings/
  └── {documentId}
        ├── rating: number      (1–5)
        ├── mode: string        ("general" | "adhd")
        └── timestamp: serverTimestamp()
```

**Firestore Security Rules:**
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /ratings/{docId} {
      allow create: if request.auth != null
              && request.resource.data.rating is int
              && request.resource.data.rating >= 1
              && request.resource.data.rating <= 5
              && request.resource.data.keys().hasOnly(["rating", "mode", "timestamp"])
              && request.resource.data.mode in ["general", "adhd"];
      allow read: if request.auth != null;   // สำหรับ stats.html
      allow update, delete: if false;
    }
  }
}
```

> ผู้ใช้ที่ผ่าน Anonymous Auth สร้างข้อมูลได้ (Integer 1–5, mode ที่กำหนด, เฉพาะ field ที่อนุญาต) และอ่านได้เพื่อแสดงหน้าสถิติ แก้ไข/ลบไม่ได้ ป้องกัน spam และข้อมูลที่ไม่ถูกต้อง

---

### 3.6 Progressive Web App (PWA)

ระบบรองรับมาตรฐาน PWA ประกอบด้วย 3 ส่วนหลัก:

**Web App Manifest (`manifest.json`)** — กำหนดชื่อ, ไอคอน, สีธีม, และ shortcut ไปหน้า ADHD Mode ทำให้ browser รู้จักแอปและแสดงปุ่ม "Install" ใน address bar

**Service Worker (`service-worker.js`)** — Cache ไฟล์โค้ดทั้งหมด (HTML/JS/CSS ใช้ network-first, ไอคอนใช้ cache-first) ไว้ใน browser เพื่อให้แอปทำงานได้แม้ไม่มีอินเทอร์เน็ต (ยกเว้นไฟล์เสียงที่มีขนาดใหญ่) และจัดการ cache version เพื่อรับการอัปเดตใหม่อัตโนมัติ

**Web Notifications API (`pwa.js`)** — ขอ permission จากผู้ใช้ และส่ง notification เมื่อ timer จบทุกโหมด แม้ผู้ใช้จะพลิกหน้าจอหรือเปิด application อื่นอยู่

---

### 3.7 ขั้นตอนการดำเนินงาน

```
ขั้นตอนที่ 1  ศึกษาเทคโนโลยี
               └─ Pomodoro Technique, ES6 Modules, Firebase SDK, PWA, Service Worker

ขั้นตอนที่ 2  ออกแบบระบบ
               └─ UI/UX สำหรับบุคคลทั่วไป และ UI ลด Cognitive Load สำหรับ ADHD
               └─ ออกแบบ Module Architecture เพื่อหลีกเลี่ยง Circular Import

ขั้นตอนที่ 3  พัฒนาส่วนติดต่อผู้ใช้งาน
               └─ HTML / CSS / JavaScript: Timer, Tasks, Audio, Dark Mode

ขั้นตอนที่ 4  พัฒนาฟีเจอร์ ADHD Mode
               └─ Hourglass Timer, Pomodoro Movement, Reward Pomodoro, Milestone Toast

ขั้นตอนที่ 5  เชื่อมต่อฐานข้อมูลและ Deploy
               └─ Firebase Firestore: บันทึกผลประเมิน Star Rating
               └─ Firebase Hosting: Deploy Static Site

ขั้นตอนที่ 6  พัฒนา PWA
               └─ Web App Manifest, Service Worker, Web Notifications

ขั้นตอนที่ 7  ทดสอบระบบ
               └─ Functionality Testing, Database Testing, PWA Testing, Cross-browser Testing
```

## Security Layer
 ├── reCAPTCHA
 ├── App Check
 ├── Anonymous Authentication
 └── Security Rules