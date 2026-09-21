let els;

// Injected from main.js (audio.js) เพื่อดับเสียง alarm ที่กำลังเล่นทดสอบอยู่
// ตอนปิดแผง Customize — กันเสียงเล่นค้างหลังออกจากหน้า Customize ไปแล้ว
let stopAlarmRef = null;

export function initUI(elements) {
  els = elements;
}

export function setUIRefs({ stopAlarm }) {
  stopAlarmRef = stopAlarm;
}

export function openCustomizerPanel(name = "home") {
  // เดิมดับ alarm เฉพาะตอนปิดทั้งแผง Customizer (closeDropdowns) — แต่กด "กลับ" ออกจาก
  // หน้า Alarm ไปหน้าอื่นในแผงเดียวกัน (ยังไม่ได้ปิด Customizer) เสียงทดสอบยังเล่นค้างอยู่
  // เพราะ path นี้ไม่เคยเรียก stopAlarm เลย — ดับทุกครั้งที่สลับหน้าย่อย ไม่ใช่แค่ตอนปิดทั้งแผง
  stopAlarmRef?.();
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== name;
  });
}

export function toggleDropdown(button, dropdown) {
  if (dropdown === els.playlistMenu) {
    const willOpen = !dropdown.classList.contains("open");
    closeDropdowns();
    if (willOpen) dropdown.classList.add("open");
    if (button) button.setAttribute("aria-expanded", String(willOpen));
    return;
  }
  const willOpen = dropdown.hidden;
  closeDropdowns();
  dropdown.hidden = !willOpen;
  if (button) button.setAttribute("aria-expanded", String(willOpen));
}

export function closeDropdowns() {
  // ต้องเช็คว่า customizer เปิดอยู่จริงก่อนค่อยดับ alarm (ฟังก์ชันนี้ถูกเรียกทุกครั้งที่
  // เปิด dropdown อื่นด้วย เช่น playlist — ไม่อยากดับเสียงที่ไม่ได้เกี่ยวกับ Customize)
  if (els.customizer && !els.customizer.hidden) stopAlarmRef?.();
  if (els.customizer) els.customizer.hidden = true;
  if (els.taskMenu) els.taskMenu.hidden = true;
  if (els.playlistMenu) els.playlistMenu.classList.remove("open");
  if (els.customizeBtn) els.customizeBtn.setAttribute("aria-expanded", "false");
  if (els.playlistBtn) els.playlistBtn.setAttribute("aria-expanded", "false");
}

export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

export function toggleMobileMenu() {
  els.topActions.classList.toggle("open");
}