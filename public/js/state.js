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

export const state = {
  mode: shared?.mode || "pomodoro",
  preset: shared?.preset || "popular",
  remaining: restoredRemaining ?? presets.popular.pomodoro * 60,
  running: restoredRunning,
  timerId: null,
  startedAt: shared?.startedAt ?? null,
  remainingAtStart: shared?.remainingAtStart ?? 0,
  counts: shared?.counts || { pomodoro: 0, rest: 0, long: 0 },
  tasks: loadTasks(),

  autoPomodoro: localStorage.getItem("pomodoroAutoPomodoro") === "true",
  autoBreaks: localStorage.getItem("pomodoroAutoBreaks") === "true",

  darkMode: localStorage.getItem("pomodoroDarkMode") === "true",
  autoDarkMode: localStorage.getItem("pomodoroAutoDarkMode") === "true",
  autoDarkTimeoutId: null,

  alarmVolume: Number(localStorage.getItem("pomodoroAlarmVolume") || "20"),

  selectedTrack: 0,
  musicPlaying: false,
  muted: false,
  audio: null,
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
    }));
  } catch (e) {
    // sessionStorage เต็ม/ถูกบล็อก — ไม่ใช่เรื่องคอขาดบาดตาย ข้ามไป
  }
}