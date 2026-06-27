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
| **Focus Level** | ปรับระดับความยากได้ 5 ระดับ: Beginner (10 นาที), Standard (20 นาที), Medium (40 นาที), Expert (60 นาที), Custom |
| **Task List** | เพิ่ม / ติ๊กสำเร็จ / ลบงาน บันทึกใน localStorage ข้ามเซสชันได้ |
| **Background Music** | เพลงประกอบ 9 แทร็ค แบ่งเป็น 3 หมวด: Lofi, Ambient, Jazz ควบคุมระดับเสียงและ mute ได้ |
| **Alarm** | เสียงแจ้งเตือนเมื่อหมดเวลา 5 แบบ ปรับระดับเสียงได้ |
| **Dark Mode** | สลับ Light/Dark mode ด้วยตนเอง หรือตั้งให้เปิดอัตโนมัติหลังเริ่ม timer 5 วินาที |
| **Auto Start** | ตั้งให้เริ่ม Pomodoro / Break ถัดไปอัตโนมัติ |
| **Star Rating** | ประเมินความพึงพอใจหลังจบ Long Break บันทึกลง Firebase Firestore |
| **Micro-reward Toast** | ขึ้นข้อความกำลังใจสุ่มทุก 5 นาทีระหว่าง Pomodoro เพื่อรักษาแรงจูงใจ |
| **Web Notification** | แจ้งเตือนเมื่อ timer จบ แม้ผู้ใช้พลิกหน้าจอหรือเปิด app อื่น |
| **PWA** | ติดตั้งลงเครื่องได้เหมือน Native App และใช้งาน Offline ได้ |

#### หน้า ADHD (`adhd.html`)

รองรับทุกฟีเจอร์จากหน้าบุคคลทั่วไป และเพิ่มเติม:

| ฟีเจอร์ | รายละเอียด |
|--------|-----------|
| **Visual Hourglass Timer** | แสดงทรายไหลแทนตัวเลข ลดความกดดันจากการจ้องนาฬิกา |
| **Split Control Buttons** | ปุ่ม Pause และ Finish แยกกัน ป้องกันการกดผิด |
| **Pomodoro Movement** | เมื่อจบแต่ละรอบ จะขึ้น popup แนะนำท่าขยับร่างกาย (สุ่มจาก 7 ท่า) พร้อม ring countdown timer อ้างอิงจากงานวิจัย Ratey & Hagerman (2008) ที่พบว่าการเคลื่อนไหวร่างกายช่วยกระตุ้น Dopamine และ Norepinephrine [5] |
| **Reward Pomodoro** | เมื่อทำครบ 4 รอบ ระบบจะแสดงรางวัลที่ผู้ใช้ตั้งไว้ล่วงหน้า พร้อม countdown timer ตั้งและแก้ไขรางวัลได้เอง บันทึกใน localStorage [7] |
| **Finish Modal** | กดปุ่ม Finish → ยืนยัน Yes/No → ให้ดาว → แสดง Success animation |

---

### 3.3 เครื่องมือที่ใช้ในการพัฒนา

| หมวดหมู่ | เทคโนโลยี | รายละเอียด |
|---------|----------|-----------|
| **Frontend Structure** | HTML5 | โครงสร้างหน้าเว็บ 2 หน้าหลัก |
| **Styling** | CSS3 | Responsive Layout, CSS Variables, Dark Mode, Animations |
| **Logic** | JavaScript ES6+ | ES Modules, Async/Await, localStorage API, Service Worker API |
| **Database** | Firebase Firestore | จัดเก็บข้อมูลผลประเมินความพึงพอใจ (Star Rating) |
| **Analytics** | Firebase Analytics | ติดตามการใช้งาน |
| **Hosting** | Firebase Hosting | Deploy และให้บริการ Static Site |
| **PWA** | Web App Manifest + Service Worker | รองรับการติดตั้งและใช้งาน Offline |
| **IDE** | Visual Studio Code | พร้อม Live Server Extension |
| **Version Control** | Git / GitHub | บริหารจัดการ source code |

> **หมายเหตุ:** เว็บแอปนี้เป็น **Pure Static Site** ไม่ต้องการ Backend Server เนื่องจากข้อมูลส่วนใหญ่ (การตั้งค่า, tasks, รางวัล) จัดเก็บที่ฝั่ง Client ผ่าน localStorage โดยตรง มีเพียงข้อมูลผลประเมินความพึงพอใจที่ส่งไปยัง Firebase Firestore

---

### 3.4 สถาปัตยกรรมซอฟต์แวร์

```
public/
├── index.html              ← หน้าบุคคลทั่วไป
├── adhd.html               ← หน้า ADHD Mode
├── firebase-config.js      ← Firebase init + Firestore
├── styles.css              ← Stylesheet ทั้งหมด (Light + Dark Mode)
├── manifest.json           ← PWA Manifest
├── service-worker.js       ← Service Worker (Offline + Cache)
├── assets/
│   ├── BGM/                ← เพลงประกอบ (Lofi, Ambient, Jazz)
│   └── Alarm/              ← เสียงแจ้งเตือน
├── icons/
│   ├── pwa-192.png         ← PWA Icon 192×192
│   └── pwa-512.png         ← PWA Icon 512×512
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
    ├── milestone.js        ← Micro-reward Toast ทุก 5 นาที
    ├── pwa.js              ← Service Worker Registration + Web Notifications
    └── utils.js            ← Helper functions
```

**การออกแบบ Module ที่สำคัญ:**

- `render()` และ `renderTasks()` แยกกันโดยเจตนา เพื่อไม่ให้ DOM ของ Task List ถูกสร้างใหม่ทุกวินาทีขณะ timer ทำงาน ซึ่งจะทำให้ CSS animation ขาดตอน
- การส่งต่อ callback ระหว่าง module (`playAlarm`, `toggleDarkMode`, `onLongComplete`, `onPomodoroComplete`, `onMilestone`) ทำผ่าน `setTimerRefs()` เพื่อหลีกเลี่ยง Circular Import
- Movement → Reward chain: `onPomodoroComplete` เรียก Movement popup เมื่อปิดแล้วจึงแสดง Reward ถ้าครบ 4 รอบ

---

### 3.5 รูปแบบการจัดเก็บข้อมูล

| ประเภท | วัตถุประสงค์ | ข้อมูลที่เก็บ |
|-------|------------|-------------|
| **localStorage** | บันทึกการตั้งค่าและข้อมูลผู้ใช้ภายในเครื่อง | Dark Mode, Auto Dark Mode, Auto Start, ระดับเสียง Alarm, รายการ Tasks, ข้อมูลรางวัล |
| **Firebase Firestore** | จัดเก็บผลประเมินความพึงพอใจ | Star Rating (1–5), Timestamp |
| **Service Worker Cache** | จัดเก็บไฟล์โค้ดสำหรับใช้งาน Offline | HTML, CSS, JS, Manifest |

**โครงสร้าง Firestore Collection:**
```
ratings/
  └── {documentId}
        ├── rating: number      (1–5)
        └── timestamp: Date
```

**Firestore Security Rules:**
```js
match /ratings/{docId} {
  allow read: if false;
  allow create: if request.resource.data.rating is int
                && request.resource.data.rating >= 1
                && request.resource.data.rating <= 5
                && request.resource.data.keys().hasOnly(["rating", "timestamp"]);
  allow update, delete: if false;
}
```

> ผู้ใช้ส่งข้อมูลได้เพียงอย่างเดียว (create) ตรวจสอบว่าเป็น Integer 1–5 และมีเฉพาะ field ที่กำหนดเท่านั้น ป้องกัน spam และข้อมูลที่ไม่ถูกต้อง

---

### 3.6 Progressive Web App (PWA)

ระบบรองรับมาตรฐาน PWA ประกอบด้วย 3 ส่วนหลัก:

**Web App Manifest (`manifest.json`)** — กำหนดชื่อ, ไอคอน, สีธีม, และ shortcut ไปหน้า ADHD Mode ทำให้ browser รู้จักแอปและแสดงปุ่ม "Install" ใน address bar

**Service Worker (`service-worker.js`)** — Cache ไฟล์โค้ดทั้งหมดไว้ใน browser เพื่อให้แอปทำงานได้แม้ไม่มีอินเทอร์เน็ต (ยกเว้นไฟล์เสียงที่มีขนาดใหญ่) และจัดการ cache version เพื่อรับการอัปเดตใหม่อัตโนมัติ

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