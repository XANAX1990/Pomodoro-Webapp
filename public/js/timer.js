import { presets } from "./config.js";
import { state, saveSharedTimerState } from "./state.js";
import { formatTime, durationFor } from "./utils.js";

let els;
let onTickRender; // callback into render.js, injected to avoid circular import

export function initTimer(elements, renderCallback) {
  els = elements;
  onTickRender = renderCallback;
}

export { durationFor };

export function setMode(mode, reset = true) {
  state.mode = mode;
  if (reset) state.remaining = durationFor(mode);
  els.modeTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  saveSharedTimerState();
  onTickRender();
}

export function toggleTimer(force, toggleDarkMode) {
  const shouldRun = typeof force === "boolean" ? force : !state.running;
  state.running = shouldRun;
  clearInterval(state.timerId);

  if (state.autoDarkTimeoutId) {
    clearTimeout(state.autoDarkTimeoutId);
    state.autoDarkTimeoutId = null;
  }

  if (state.running) {
    // บันทึกเวลาจริงที่เริ่ม
    state.startedAt = Date.now();
    state.remainingAtStart = state.remaining;

    // เก็บ milestone (นาทีที่ 5, 10, 15, ...) ที่แจ้งไปแล้ว กันยิงซ้ำตอน poll ทับกัน
    const firedMilestones = new Set();

    state.timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      state.remaining = Math.max(0, state.remainingAtStart - elapsed);

      // Milestone: ทุก 5 นาที ระหว่าง Pomodoro ที่กำลังวิ่งอยู่
      if (state.mode === "pomodoro") {
        const totalElapsed = durationFor("pomodoro") - state.remainingAtStart + elapsed;
        const milestoneMinute = Math.floor(totalElapsed / 300) * 5;
        if (milestoneMinute > 0 && !firedMilestones.has(milestoneMinute)) {
          firedMilestones.add(milestoneMinute);
          onMilestoneRef?.(milestoneMinute);
        }
      }

      if (state.remaining <= 0) {
        completeSession();
        return;
      }
      saveSharedTimerState();
      onTickRender();
    }, 500); // poll ทุก 500ms เพื่อให้แม่นขึ้น

    // Auto dark mode — re-check ก่อน fire จริง
    if (state.autoDarkMode && !state.darkMode) {
      state.autoDarkTimeoutId = setTimeout(() => {
        if (state.running && state.autoDarkMode && !state.darkMode) {
          toggleDarkMode(true);
        }
        state.autoDarkTimeoutId = null;
      }, 5000);
    }
  }
  saveSharedTimerState();
  onTickRender();
}

function completeSession() {
  clearInterval(state.timerId);
  state.running = false;
  state.counts[state.mode] += 1;
  saveSharedTimerState();
  playAlarmRef?.();

  if (state.mode === "pomodoro") {
    const nextMode = state.counts.pomodoro % 4 === 0 ? "long" : "rest";
    onPomodoroCompleteRef?.(state.counts.pomodoro);
    setMode(nextMode);
    // หมายเหตุ: ไม่ auto-start break ตรงนี้ เพราะต้องรอ Movement popup ปิดก่อน
    // (ดู onMovementDone ใน main.js) ไม่งั้น break จะเริ่มนับตอน popup ยังเปิดอยู่
  } else {
    if (state.mode === "long") {
      onLongCompleteRef?.();
    }
    setMode("pomodoro");
    if (state.autoPomodoro) toggleTimer(true, toggleDarkModeRef);
  }
}

// References injected from main.js to avoid circular imports with audio/darkmode modules
let playAlarmRef = null;
let toggleDarkModeRef = null;
let onLongCompleteRef = null;
let onPomodoroCompleteRef = null;
let onMilestoneRef = null;
export function setTimerRefs({ playAlarm, toggleDarkMode, onLongComplete, onPomodoroComplete, onMilestone }) {
  playAlarmRef = playAlarm;
  toggleDarkModeRef = toggleDarkMode;
  onLongCompleteRef = onLongComplete;
  onPomodoroCompleteRef = onPomodoroComplete;
  onMilestoneRef = onMilestone;
}

// Stops the timer then switches mode — used by mode tabs and skip buttons
export function switchModeManually(mode) {
  toggleTimer(false, toggleDarkModeRef);
  setMode(mode);
}

export function resetSession() {
  clearInterval(state.timerId);
  state.running = false;
  if (state.autoDarkTimeoutId) {
    clearTimeout(state.autoDarkTimeoutId);
    state.autoDarkTimeoutId = null;
  }
  state.counts = { pomodoro: 0, rest: 0, long: 0 };
  setMode("pomodoro"); // setMode จะเรียก saveSharedTimerState() ให้อยู่แล้ว
}

export function buildPresetList() {
  els.presetList.innerHTML = "";
  Object.entries(presets).forEach(([key, preset]) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="radio" name="preset" value="${key}" ${state.preset === key ? "checked" : ""}>
      <span><strong>${preset.label}</strong><small>${preset.pomodoro} min &bull; ${preset.rest} min &bull; ${preset.long} min</small></span>
    `;
    els.presetList.append(label);
  });
  updateCustomSliders();
}

export function updatePreset(key) {
  // หยุด timer ก่อนถ้ากำลังเดิน
  if (state.running) {
    toggleTimer(false, toggleDarkModeRef);
  }
  state.preset = key;
  const custom = key === "custom";
  [els.customPomodoro, els.customRest, els.customLong].forEach((slider) => {
    slider.disabled = !custom;
  });
  state.remaining = durationFor();
  buildPresetList();
  onTickRender();
}

export function updateCustomSliders() {
  els.customPomodoro.value = presets.custom.pomodoro;
  els.customRest.value = presets.custom.rest;
  els.customLong.value = presets.custom.long;
  els.customPomodoro.disabled = state.preset !== "custom";
  els.customRest.disabled = state.preset !== "custom";
  els.customLong.disabled = state.preset !== "custom";
  els.customPomodoroLabel.textContent = `${presets.custom.pomodoro} min`;
  els.customRestLabel.textContent = `${presets.custom.rest} min`;
  els.customLongLabel.textContent = `${presets.custom.long} min`;
}

export function updateCustomValue(name, value) {
  presets.custom[name] = Number(value);
  localStorage.setItem("pomodoroCustomPreset", JSON.stringify(presets.custom)); // persist
  updateCustomSliders();
  if (state.preset === "custom") {
    state.remaining = durationFor();
    buildPresetList();
    onTickRender();
  }
}

export { formatTime };