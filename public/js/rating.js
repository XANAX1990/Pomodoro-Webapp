// rating.js — Star Rating + FAB logic
//
// หมายเหตุ: ห้าม import firebase-config.js แบบ static ที่หัวไฟล์นี้ — ตัวมันเรียก
// initializeAppCheck() + ReCaptchaEnterpriseProvider ซึ่งเป็น network call ที่ล้มได้
// (wifi บล็อก gstatic, App Check/reCAPTCHA fail เช่นในห้องสอบ) ถ้า import แบบ static
// ทั้ง module graph ที่ main.js โหลดอยู่ (รวม timer.js) จะพังไปด้วย ทำให้นาฬิกา/เสียงเตือน
// ใช้ไม่ได้ทั้งหน้า ทั้งที่ไม่เกี่ยวกับ Firebase เลย — จึงโหลดแบบ dynamic import
// เฉพาะตอนผู้ใช้กดส่งคะแนนจริงๆ เท่านั้น

let els;
let selectedRating = 0;

let _authReady = null;
function ensureAuth() {
  if (!_authReady) {
    _authReady = (async () => {
      const { auth } = await import("../firebase-config.js");
      const { signInAnonymously, onAuthStateChanged } =
        await import("https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js");
      return new Promise((resolve, reject) => {
        // unsub ประกาศเป็น let + เช็ค optional-chain เผื่อ onAuthStateChanged throw
        // แบบ synchronous ก่อน assign เสร็จ — กัน ReferenceError ซ้อนตอน timeout ยิง
        let unsub = null;

        const updateDevStatus = (text) => {
          const el = document.getElementById("devAuthStatus");
          if (el) el.textContent = text;
        };

        // กันค้างรอตลอดไปถ้า App Check/reCAPTCHA เน็ตช้าหรือล้มเหลวเงียบๆ
        const timer = setTimeout(() => {
          unsub?.();
          updateDevStatus("Firebase Auth: Timeout");
          reject(new Error("Firebase Auth timeout"));
        }, 8000);

        unsub = onAuthStateChanged(auth, (user) => {
          if (user) {
            clearTimeout(timer); unsub?.();
            const msg = `Firebase Auth พร้อม uid: ${user.uid}`;
            console.log(msg);
            updateDevStatus(msg);
            return resolve(user);
          }
          signInAnonymously(auth)
            .then((cred) => {
              clearTimeout(timer); unsub?.();
              const msg = `Firebase Auth พร้อม uid: ${cred.user.uid}`;
              console.log(msg);
              updateDevStatus(msg);
              resolve(cred.user);
            })
            .catch((err) => {
              clearTimeout(timer); unsub?.();
              updateDevStatus("Firebase Auth: เชื่อมต่อไม่สำเร็จ");
              reject(err);
            });
        });
      });
    })();

    // ถ้ารอบนี้ล้มเหลว (timeout/App Check/reCAPTCHA พัง) ต้องเคลียร์ cache ทิ้ง
    // ไม่งั้นทุกครั้งถัดไปจะ reuse promise ที่ reject ไปแล้วทันที ไม่ได้ลอง signIn ใหม่เลย
    // จนกว่าจะ refresh หน้า — ผู้ใช้กดส่งซ้ำกี่ครั้งก็เจอ error เดิมค้างตลอด
    _authReady.catch(() => { _authReady = null; });
  }
  return _authReady;
}

// FAB elements
let fabBtn, fabIconStar, fabIconClose;

// true เฉพาะตอน rating_container ถูกเปิดเพราะ Long Break จบ (ไม่ใช่ผู้ใช้กด FAB เข้ามาเล่นๆ)
// ใช้บอก main.js ว่าเมื่อไหร่ "ปิดกล่องให้คะแนนแล้วจริงๆ" จะได้ auto-start pomodoro รอบถัดไปได้
// (ถ้าไม่กันไว้ เปิด autoPomodoro แล้ว timer รอบใหม่จะเริ่มนับเงียบๆ อยู่หลัง modal ที่ยังเปิดค้าง)
let awaitingLongBreakDecision = false;
let onRatingFlowDoneRef = null;
export function setRatingRefs({ onRatingFlowDone }) {
  onRatingFlowDoneRef = onRatingFlowDone;
}
export function markLongBreakRatingPending() {
  awaitingLongBreakDecision = true;
}

export function initRating(elements) {
  els = elements;

  fabBtn = document.getElementById("fabBtn");
  fabIconStar = fabBtn?.querySelector(".fab-icon-star");
  fabIconClose = fabBtn?.querySelector(".fab-icon-close");

  _bindStars();
  _bindModal();
  _bindFab();

  // warm-up: เช็คว่า App Check + Anonymous Auth ใช้งานได้จริงตั้งแต่เปิดหน้า
  // ไม่ await — ถ้าพังก็แค่ log ไม่กระทบ timer
  // หมายเหตุ: เรียก signInAnonymously ทันทีให้ผู้เข้าชมทุกคน (ไม่ใช่แค่คนที่กดให้คะแนนจริง)
  // ทำให้จำนวน user ใน Firebase Auth บวมกว่าจำนวนคนให้คะแนนจริง — ถ้าไม่ต้องการ ให้ตัด
  // signInAnonymously ออกจาก warm-up นี้ (เช็คแค่ว่า App Check ออก token ผ่านไหมพอ)
  const warm = () => ensureAuth().catch((e) => console.warn("Auth warm-up ล้มเหลว:", e));
  if ("requestIdleCallback" in window) requestIdleCallback(warm);
  else setTimeout(warm, 2000);
}

/* ── FAB ── */
export function setFabOpen(open) {
  if (!fabBtn) return;
  if (open) {
    els.rating_container?.classList.add("show");
    if (fabIconStar) fabIconStar.style.display = "none";
    if (fabIconClose) fabIconClose.style.display = "";
    fabBtn.classList.add("fab-open");
  } else {
    els.rating_container?.classList.remove("show");
    if (fabIconStar) fabIconStar.style.display = "";
    if (fabIconClose) fabIconClose.style.display = "none";
    fabBtn.classList.remove("fab-open");
    if (awaitingLongBreakDecision) {
      awaitingLongBreakDecision = false;
      onRatingFlowDoneRef?.();
    }
  }
}

function _bindFab() {
  if (!fabBtn) return;
  fabBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = els.rating_container?.classList.contains("show");
    setFabOpen(!isOpen);
  });
}

/* ── Stars ── */
function highlightStars(count) {
  els.stars?.forEach((star) => {
    star.classList.toggle("filled", Number(star.dataset.value) <= count);
  });
}

function _bindStars() {
  els.stars?.forEach((star) => {
    star.addEventListener("mouseenter", () => highlightStars(Number(star.dataset.value)));
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedRating = Number(star.dataset.value);
      highlightStars(selectedRating);
      if (els.submitRatingBtn) els.submitRatingBtn.disabled = false;
    });
  });
  els.starRating?.addEventListener("mouseleave", () => highlightStars(selectedRating));
}

/* ── Modal (Yes/No → Rating → Success) ── */
function _resetSuccessAnim() {
  const circle = document.querySelector(".check-circle");
  const check = document.querySelector(".check-mark");
  if (!circle || !check) return;
  [circle, check].forEach((el) => {
    el.style.animation = "none";
    el.getBoundingClientRect();
    el.style.animation = "";
  });
}

async function _saveScore(scoreValue) {
  if (!scoreValue || scoreValue <= 0) return false;

  // แยก try/catch ของ ensureAuth() กับ addDoc() ออกจากกัน — เดิมรวมก้อนเดียวทำให้ error จาก
  // App Check/reCAPTCHA (แก้สิทธิ์เข้าไม่ได้เลย) กับ error จาก Firestore Security Rules
  // (เข้าได้แต่เขียนไม่ผ่าน) ขึ้น log เดียวกันหมด แยกไว้จะรู้ทันทีว่าปัญหาอยู่ฝั่งไหนตอนสอบ
  try {
    await ensureAuth();
  } catch (e) {
    console.error("Auth ไม่พร้อม (App Check/reCAPTCHA มีปัญหา):", e);
    return false;
  }

  try {
    const { db } = await import("../firebase-config.js");
    const { collection, addDoc, serverTimestamp } =
      await import("https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js");
    const docRef = await addDoc(collection(db, "ratings"), {
      rating: scoreValue,
      mode: document.body.classList.contains("page-adhd") ? "adhd" : "general",
      timestamp: serverTimestamp(),
    });
    console.log("บันทึกคะแนนลง Firebase เรียบร้อย! ID:", docRef.id);
    return true;
  } catch (e) {
    console.error("บันทึกคะแนนไม่สำเร็จ (Firestore/Security Rules):", e);
    return false;
  }
}

function _bindModal() {
  els.noBtn?.addEventListener("click", () => {
    els.modal_container?.classList.remove("show");
  });

  els.yesBtn?.addEventListener("click", () => {
    els.modal_container?.classList.remove("show");
    els.rating_container?.classList.add("show");
  });

  els.submitRatingBtn?.addEventListener("click", async () => {
    const ratingToSave = selectedRating;
    if (els.submitRatingBtn) els.submitRatingBtn.disabled = true;
    els.submitRatingBtn?.classList.add("is-saving"); // เผื่อมี CSS spinner/loading state

    const saved = await _saveScore(ratingToSave);

    els.submitRatingBtn?.classList.remove("is-saving");

    if (!saved) {
      // บันทึกไม่สำเร็จ — เปิดปุ่มกลับมาให้กดใหม่ ไม่โชว์ success
      if (els.submitRatingBtn) els.submitRatingBtn.disabled = false;
      alert("บันทึกคะแนนไม่สำเร็จ ลองใหม่อีกครั้งนะ");
      return;
    }

    setFabOpen(false);
    els.rating_container?.classList.remove("show");
    selectedRating = 0;
    highlightStars(0);
    _resetSuccessAnim();
    setTimeout(() => els.success_container?.classList.add("show"), 50);
  });

  els.okBtn?.addEventListener("click", () => {
    els.success_container?.classList.remove("show");
  });
}