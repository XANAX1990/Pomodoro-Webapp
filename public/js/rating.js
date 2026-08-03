// rating.js — Star Rating + FAB logic
import { db, auth } from "../firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

let els;
let selectedRating = 0;

let _authReady = null;
function ensureAuth() {
  if (!_authReady) {
    _authReady = new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        if (user) return resolve(user);
        signInAnonymously(auth).then(resolve).catch(resolve);
      });
    });
  }
  return _authReady;
}

// FAB elements
let fabBtn, fabIconStar, fabIconClose;

export function initRating(elements) {
  els = elements;

  fabBtn = document.getElementById("fabBtn");
  fabIconStar = fabBtn?.querySelector(".fab-icon-star");
  fabIconClose = fabBtn?.querySelector(".fab-icon-close");

  _bindStars();
  _bindModal();
  _bindFab();
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
  try {
    await ensureAuth();
    const docRef = await addDoc(collection(db, "ratings"), {
      rating: scoreValue,
      timestamp: new Date(),
    });
    console.log("บันทึกคะแนนลง Firebase เรียบร้อย! ID:", docRef.id);
    return true;
  } catch (e) {
    console.error("เกิดข้อผิดพลาดในการบันทึก:", e);
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