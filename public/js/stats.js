import { db, auth } from "../firebase-config.js";
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const statusEl = document.getElementById("status");
const errorBox = document.getElementById("errorBox");
const statRow = document.getElementById("statRow");
const modeToggle = document.getElementById("modeToggle");
const refreshBtn = document.getElementById("refreshBtn");
const darkModeBtn = document.getElementById("darkModeBtn");
const ctx = document.getElementById("ratingPieChart");

let allDocs = []; // { rating, mode } ดิบจาก Firestore เก็บไว้ในหน่วยความจำ ไม่ต้อง query ซ้ำทุกครั้งที่สลับ filter
let chart = null;
let currentFilter = "all";
const visibleStars = new Set([1, 2, 3, 4, 5]); // ดาวที่แสดงอยู่ใน pie (ดาวที่ไม่อยู่ใน set = ถูกขีดฆ่า/ซ่อน)

function isDarkMode() {
  return document.documentElement.classList.contains("dark-mode");
}

function toggleDarkMode() {
  const willBeDark = !isDarkMode();
  document.documentElement.classList.toggle("dark-mode", willBeDark);
  localStorage.setItem("pomodoroDarkMode", String(willBeDark));

  if (chart && chart.options?.plugins?.legend?.labels) {
    chart.options.plugins.legend.labels.color = willBeDark ? "#cbd5e1" : "#4b5563";
    chart.update();
  }
}

if (darkModeBtn) {
  darkModeBtn.addEventListener("click", toggleDarkMode);
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}

function ensureAuthReady() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Auth timeout")), 8000);
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { clearTimeout(timer); unsub(); return resolve(user); }
      signInAnonymously(auth)
        .then((cred) => { clearTimeout(timer); unsub(); resolve(cred.user); })
        .catch((e) => { clearTimeout(timer); unsub(); reject(e); });
    });
  });
}

async function loadRatings() {
  statusEl.textContent = "กำลังโหลดข้อมูล...";
  errorBox.style.display = "none";
  if (typeof Chart === "undefined") {
    statusEl.textContent = "โหลด Chart.js ไม่สำเร็จ";
    showError(
      "ไม่พบไลบรารี Chart.js (js/chart.umd.js) — เช็คว่าไฟล์นี้อยู่ในโฟลเดอร์ js/ " +
      "ข้างๆ ไฟล์ stats.html จริงหรือไม่ และเปิดหน้านี้ผ่าน server (ไม่ใช่เปิดไฟล์ตรงๆ แบบ file://)"
    );
    return;
  }
  try {
    await ensureAuthReady();
    const snap = await getDocs(collection(db, "ratings"));
    allDocs = snap.docs.map((d) => d.data());
    statusEl.textContent = `โหลดสำเร็จ — ทั้งหมด ${allDocs.length} รายการ`;
    render();
  } catch (e) {
    console.error(e);
    statusEl.textContent = "โหลดข้อมูลไม่สำเร็จ";
    showError(
      "ดึงข้อมูลจาก Firestore ไม่สำเร็จ: " + (e?.message || e) +
      "\nถ้าเจอ permission-denied ให้เช็ค Firestore Security Rules ว่าอนุญาตให้ authenticated user อ่าน collection 'ratings' ได้"
    );
  }
}

function aggregate(docs) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  docs.forEach((d) => {
    const r = Number(d.rating);
    if (counts[r] !== undefined) counts[r]++;
  });
  return counts;
}

function render() {
  const filtered = currentFilter === "all"
    ? allDocs
    : allDocs.filter((d) => d.mode === currentFilter);

  const counts = aggregate(filtered);
  const total = filtered.length;
  const avg = total
    ? (Object.entries(counts).reduce((s, [star, n]) => s + Number(star) * n, 0) / total).toFixed(2)
    : "-";

  statRow.innerHTML = `
    <div class="stat-box"><div class="num">${total}</div><div class="label">รายการทั้งหมด</div></div>
    <div class="stat-box"><div class="num">${avg}</div><div class="label">คะแนนเฉลี่ย</div></div>
  `;

  // Star breakdown bars
  const starColors = ["#e5484d", "#f0a04b", "#f3c94c", "#8bc34a", "#2f9e44"];
  const starLabels = ["1 ดาว", "2 ดาว", "3 ดาว", "4 ดาว", "5 ดาว"];
  const starBreakdown = document.getElementById("starBreakdown");
  starBreakdown.innerHTML = `<h3>คะแนนแต่ละดาว</h3>` + [5,4,3,2,1].map((star) => {
    const count = counts[star];
    const pct = total ? ((count / total) * 100).toFixed(1) : 0;
    const pctNum = total ? (count / total) * 100 : 0;
    const color = starColors[star - 1];
    return `
      <div class="star-row">
        <div class="star-label"><span class="star-icon">⭐</span>${star} ดาว</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pctNum}%; background:${color};"></div>
        </div>
        <div class="bar-count">${count} (${pct}%)</div>
      </div>`;
  }).join("");

  // Custom legend (เรียงในแนวตั้งข้างๆ chart)
  const pieLegend = document.getElementById("pieLegend");
  pieLegend.innerHTML = [1,2,3,4,5].map((star) => {
    const color = starColors[star - 1];
    const count = counts[star];
    const sel = visibleStars.has(star);
    return `
      <div class="legend-item ${sel ? "" : "struck"}" data-star="${star}" role="button" tabindex="0" aria-pressed="${sel}">
        <div class="legend-dot" style="background:${color};"></div>
        <span class="legend-label">${starLabels[star-1]}</span>
        <span style="color:#9ca3af;font-size:0.8rem;margin-left:2px;">(${count})</span>
      </div>`;
  }).join("");

  const labels = ["1 ดาว", "2 ดาว", "3 ดาว", "4 ดาว", "5 ดาว"];
  const data = [1, 2, 3, 4, 5].map((n) => (visibleStars.has(n) ? counts[n] : 0));
  const visTotal = data.reduce((a, b) => a + b, 0);
  const colors = ["#e5484d", "#f0a04b", "#f3c94c", "#8bc34a", "#2f9e44"];

  if (chart) {
    chart.data.datasets[0].data = data;
    chart.update();
    return;
  }
  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors }],
    },
    options: {
      plugins: {
        legend: { display: false }, // ใช้ custom legend HTML แทน
        tooltip: {
          callbacks: {
            label: (item) => {
              const val = item.raw;
              const sum = item.dataset.data.reduce((a, b) => a + b, 0);
              const pct = sum ? ((val / sum) * 100).toFixed(1) : 0;
              return `${item.label}: ${val} รายการ (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

modeToggle.querySelectorAll("button[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    modeToggle.querySelectorAll("button[data-mode]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.mode;
    render();
  });
});

// กด legend เพื่อซ่อน/แสดงดาวใน pie (กดแล้วมีเส้นขีดฆ่า = ซ่อน, กดอีกครั้งเส้นหาย = แสดง)
const pieLegendEl = document.getElementById("pieLegend");
function toggleStar(el) {
  const item = el.closest(".legend-item");
  if (!item) return;
  const star = Number(item.dataset.star);
  if (visibleStars.has(star)) visibleStars.delete(star); else visibleStars.add(star);
  render();
}
pieLegendEl.addEventListener("click", (e) => toggleStar(e.target));
pieLegendEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleStar(e.target); }
});

refreshBtn.addEventListener("click", loadRatings);

loadRatings();
