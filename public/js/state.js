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



export const state = {
  mode: "pomodoro",
  preset: "popular",
  remaining: presets.popular.pomodoro * 60,
  running: false,
  timerId: null,
  startedAt: null,
  remainingAtStart: 0,
  counts: { pomodoro: 0, rest: 0, long: 0 },
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