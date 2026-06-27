// milestone.js — Micro-Reward toast ทุก 5 นาที ระหว่าง Pomodoro

const MESSAGES = [
  { emoji: "🔥", text: "ไฟแล่น! โฟกัสได้ดีมาก" },
  { emoji: "⚡", text: "สมองกำลังทำงานเต็มสูบ!" },
  { emoji: "💎", text: "เยี่ยมมาก! อีกนิดเดียว" },
  { emoji: "🚀", text: "พุ่งเต็มที่เลย!" },
  { emoji: "🧠", text: "สมาธิดีมาก ทำต่อเลย!" },
  { emoji: "✨", text: "ช่วงนี้ดีมาก อย่าหยุด!" },
  { emoji: "🎯", text: "โฟกัสได้เป๊ะ ทำต่อ!" },
  { emoji: "💪", text: "เข้มแข็งมากเลย!" },
  { emoji: "🌟", text: "ดาวเด่นแห่งวันนี้คือคุณ!" },
  { emoji: "🏆", text: "แชมป์โฟกัสประจำวัน!" },
];

let toastTimeout = null;

export function showMilestoneToast(minutesElapsed) {
  // ลบ toast เก่าก่อน (ถ้ามี)
  const existing = document.getElementById("milestoneToast");
  if (existing) existing.remove();
  clearTimeout(toastTimeout);

  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  const toast = document.createElement("div");
  toast.id = "milestoneToast";
  toast.className = "milestone-toast";
  toast.innerHTML = `
    <span class="milestone-emoji">${msg.emoji}</span>
    <div class="milestone-text">
      <strong>${minutesElapsed} นาทีผ่านไปแล้ว!</strong>
      <span>${msg.text}</span>
    </div>
  `;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => toast.classList.add("milestone-toast--show"));

  // Auto dismiss after 3.5s
  toastTimeout = setTimeout(() => dismissMilestoneToast(), 3500);

  // Click to dismiss
  toast.addEventListener("click", dismissMilestoneToast);
}

function dismissMilestoneToast() {
  const toast = document.getElementById("milestoneToast");
  if (!toast) return;
  toast.classList.remove("milestone-toast--show");
  toast.classList.add("milestone-toast--hide");
  setTimeout(() => toast.remove(), 300);
}
