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

// Skinner's intermittent (variable-interval) reinforcement — สุ่มช่วงเวลาก่อน toast ครั้งถัดไป
// ระหว่าง 3-7 นาที (เฉลี่ย ~5 นาที) แทนที่จะ fix ทุก 5 นาทีเป๊ะ ตามที่เอกสารข้อ 2.7 อ้างถึง
function randomMilestoneGap() {
  return 180 + Math.random() * 240; // 180-420 วินาที
}

export function setMode(mode, reset = true) {
  state.mode = mode;
  if (reset) {
    state.remaining = durationFor(mode);
    // เริ่มรอบ pomodoro ใหม่ — สุ่มช่วงเวลา milestone ใหม่ (เก็บใน state จึงรอดตอนสลับหน้าได้เอง)
    if (mode === "pomodoro") state.nextMilestoneAt = randomMilestoneGap();
  }
  els.modeTabs.forEach((tab) => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
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

    // state.nextMilestoneAt เก็บใน sessionStorage อยู่แล้ว (saveSharedTimerState) จึงรอดตอนสลับ
    // หน้า index.html <-> adhd.html เอง — เผื่อกรณี fresh state ที่ยังไม่เคยสุ่มไว้เท่านั้น
    if (state.mode === "pomodoro" && state.nextMilestoneAt == null) {
      state.nextMilestoneAt = randomMilestoneGap();
    }

    state.timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      state.remaining = Math.max(0, state.remainingAtStart - elapsed);

      // Milestone: สุ่มช่วงเวลา (intermittent) ระหว่าง Pomodoro ที่กำลังวิ่งอยู่
      if (state.mode === "pomodoro" && state.nextMilestoneAt != null) {
        const totalElapsed = durationFor("pomodoro") - state.remainingAtStart + elapsed;
        if (totalElapsed >= state.nextMilestoneAt) {
          const minuteMark = Math.round(totalElapsed / 60);
          onMilestoneRef?.(minuteMark);
          state.nextMilestoneAt = totalElapsed + randomMilestoneGap();
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

export function completeSession() {
  clearInterval(state.timerId);
  state.running = false;
  state.counts[state.mode] += 1;
  saveSharedTimerState();
  playAlarmRef?.();

  if (state.mode === "pomodoro") {
    const nextMode = state.counts.pomodoro % 4 === 0 ? "long" : "rest";
    // setMode ต้องมาก่อน onPomodoroCompleteRef — หน้า General ไม่มี movementPopup เลยเรียก
    // onMovementDone แบบ synchronous ทันที ถ้า state.mode ยังเป็น "pomodoro" อยู่ตอนนั้น
    // เงื่อนไข mode === "rest" || "long" ใน main.js จะ false ทำให้ auto-start break ไม่ทำงานเลย
    setMode(nextMode);
    onPomodoroCompleteRef?.(state.counts.pomodoro);
    // หมายเหตุ: ไม่ auto-start break ตรงนี้ เพราะต้องรอ Movement popup ปิดก่อน
    // (ดู onMovementDone ใน main.js) ไม่งั้น break จะเริ่มนับตอน popup ยังเปิดอยู่
  } else if (state.mode === "long") {
    setMode("pomodoro");
    onLongCompleteRef?.();
    // ไม่ auto-start ตรงนี้ต่อให้ autoPomodoro เปิดอยู่ — onLongCompleteRef เปิด rating popup
    // ให้คะแนน ต้องรอปิด popup นั้นก่อน (ดู onRatingFlowDone ใน main.js) ไม่งั้น pomodoro
    // รอบใหม่จะเริ่มนับเงียบๆ อยู่หลัง modal ที่ผู้ใช้ยังไม่ทันได้ตอบ
  } else {
    if (state.mode === "rest") {
      // เดิมไม่มีการเรียก callback ตอน Short Break จบเลย ทั้งที่ pwa.js มีข้อความ
      // แจ้งเตือน "rest" เตรียมไว้แล้ว — เพิ่มให้ครบสมมาตรกับ pomodoro/long
      onRestCompleteRef?.();
    }
    setMode("pomodoro");
    if (state.autoPomodoro) toggleTimer(true, toggleDarkModeRef);
  }
}

// References injected from main.js to avoid circular imports with audio/darkmode modules
let playAlarmRef = null;
let toggleDarkModeRef = null;
let onLongCompleteRef = null;
let onRestCompleteRef = null;
let onPomodoroCompleteRef = null;
let onMilestoneRef = null;
export function setTimerRefs({ playAlarm, toggleDarkMode, onLongComplete, onRestComplete, onPomodoroComplete, onMilestone }) {
  playAlarmRef = playAlarm;
  toggleDarkModeRef = toggleDarkMode;
  onLongCompleteRef = onLongComplete;
  onRestCompleteRef = onRestComplete;
  onPomodoroCompleteRef = onPomodoroComplete;
  onMilestoneRef = onMilestone;
}

// Stops the timer then switches mode — used by mode tabs and skip buttons
export function switchModeManually(mode) {
  toggleTimer(false, toggleDarkModeRef);
  setMode(mode);
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
  saveSharedTimerState(); // ถ้าไม่เซฟตรงนี้ สลับ index.html <-> adhd.html ตอน timer ยังไม่รัน จะเห็น preset เก่ากลับมา
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
    saveSharedTimerState(); // ไม่งั้นสลับหน้าแล้ว remaining เก่ากลับมาแม้ label preset จะโชว์ค่าใหม่แล้วก็ตาม
    buildPresetList();
    onTickRender();
  }
}

export { formatTime };