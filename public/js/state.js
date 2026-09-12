import { presets } from "./config.js";

function loadTasks() {
  try {
    const raw = JSON.parse(localStorage.getItem("pomodoroCloneTasks") || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map((t) => ({
      id: t && t.id ? String(t.id) : String(Date.now()) + Math.random().toString(36).slice(2),
      title: t && typeof t.title !== "undefined" ? String(t.title) : "",
      done: !!(t && t.done)
    }));
  } catch (e) {
    return [];
  }
}



const SESSION_KEY = "pomodoroSharedTimerState";

// โหลด timer state ที่ค้างไว้ (ถ้ามี) — ใช้ตอนสลับระหว่าง index.html <-> adhd.html
// ในแท็บเดียวกัน จะได้ไม่รีเซ็ต timer ทุกครั้งที่สลับโหมด
function loadSharedTimerState() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

const shared = loadSharedTimerState();

// ถ้า timer กำลังรันอยู่ตอนสลับหน้า ให้คำนวณเวลาที่เหลือจริงตาม wall-clock
// (ไม่ใช่ freeze ไว้ที่ค่าตอนออกจากหน้าเดิม)
let restoredRemaining = shared?.remaining;
let restoredRunning = shared?.running ?? false;
if (shared?.running && shared?.startedAt) {
  const elapsedSince = Math.floor((Date.now() - shared.startedAt) / 1000);
  restoredRemaining = Math.max(0, (shared.remainingAtStart ?? shared.remaining) - elapsedSince);
  if (restoredRemaining <= 0) restoredRunning = false; // หมดเวลาไปแล้วระหว่างสลับหน้า
}

// true เฉพาะตอนที่ timer "กำลังรันอยู่ตอนออกจากหน้าเดิม" แต่หมดเวลาไปแล้วระหว่างที่ห่างหายไป
// (ไม่ใช่แค่ remaining=0 เฉยๆ ตอนเปิดแอปครั้งแรก) ใช้บอก main.js ให้เรียก complete session ย้อนหลัง
// ไม่งั้นจะโชว์ 00:00 ค้างเฉยๆ ไม่นับรอบ ไม่เล่นเสียง ไม่เปลี่ยนโหมดให้

export const state = {
  mode: shared?.mode || "pomodoro",
  preset: shared?.preset || "popular",
  remaining: restoredRemaining ?? presets.popular.pomodoro * 60,
  running: restoredRunning,
  expiredWhileAway: !!(shared?.running && shared?.startedAt && !restoredRunning),
  timerId: null,
  startedAt: shared?.startedAt ?? null,
  remainingAtStart: shared?.remainingAtStart ?? 0,
  counts: shared?.counts || { pomodoro: 0, rest: 0, long: 0 },
  nextMilestoneAt: shared?.nextMilestoneAt ?? null,
  tasks: loadTasks(),

  autoPomodoro: localStorage.getItem("pomodoroAutoPomodoro") === "true",
  autoBreaks: localStorage.getItem("pomodoroAutoBreaks") === "true",

  darkMode: localStorage.getItem("pomodoroDarkMode") === "true",
  autoDarkMode: localStorage.getItem("pomodoroAutoDarkMode") === "true",
  autoDarkTimeoutId: null,

  alarmVolume: Number(localStorage.getItem("pomodoroAlarmVolume") || "20"),

  // selectedTrack/musicPlaying/muted/volume ต้อง persist ผ่าน sessionStorage เหมือน timer
  // ไม่งั้นสลับหน้า index.html <-> adhd.html แล้วเพลงที่กำลังฟังอยู่จะรีเซ็ตกลับเป็นค่า default ทุกครั้ง
  selectedTrack: shared?.selectedTrack ?? 0,
  musicPlaying: shared?.musicPlaying ?? false,
  muted: shared?.muted ?? false,
  volume: shared?.volume ?? 70,
  playlistExpandedFolders: {}
};

export function saveTasks() {
  localStorage.setItem("pomodoroCloneTasks", JSON.stringify(state.tasks));
}

// เรียกทุกครั้งที่ mode/remaining/running/counts เปลี่ยน เพื่อให้สลับหน้า
// index.html <-> adhd.html แล้ว timer ไม่รีเซ็ต (ใช้ sessionStorage เฉพาะแท็บนี้)
export function saveSharedTimerState() {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      mode: state.mode,
      preset: state.preset,
      remaining: state.remaining,
      running: state.running,
      startedAt: state.startedAt,
      remainingAtStart: state.remainingAtStart,
      counts: state.counts,
      nextMilestoneAt: state.nextMilestoneAt,
      selectedTrack: state.selectedTrack,
      musicPlaying: state.musicPlaying,
      muted: state.muted,
      volume: state.volume,
    }));
  } catch (e) {
    // sessionStorage เต็ม/ถูกบล็อก — ไม่ใช่เรื่องคอขาดบาดตาย ข้ามไป
  }
}