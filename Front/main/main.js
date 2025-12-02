import { loadData } from './modules/dataManager.js';
import { updateDashboard } from './modules/uiManager.js';
import { loadPage } from './modules/router.js';

console.log("✅ Life Log Dashboard loaded.");

// DOMContentLoaded 초기화
document.addEventListener('DOMContentLoaded', async () => {
  // Auth Check & UI Update
  if (!localStorage.getItem("isLoggedIn")) {
    alert("로그인 후 이용해주세요.");
    window.location.href = "../log_in/login.html";
    return; // 리다이렉트 후 함수 종료
  } else {
    const username = localStorage.getItem("username") || '사용자';
    const usernameEl = document.getElementById("username");
    if (usernameEl) usernameEl.textContent = username;

    const authBtns = document.querySelector(".auth-buttons");
    if (authBtns) authBtns.classList.add("hidden");

    const userInfo = document.querySelector(".user-info");
    if (userInfo) userInfo.classList.remove("hidden");
  }

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("username");
      alert("로그아웃되었습니다.");
      window.location.href = "../log_in/login.html";
    });
  }

  const nav = document.querySelector('.nav');
  if (nav && nav.dataset._bound !== '1') {
    nav.dataset._bound = '1';
    nav.addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (!item) return;
      console.log('NAV CLICK ->', item.dataset.page || item.textContent.trim());
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const page = item.dataset.page || item.textContent.trim().toLowerCase();
      try { loadPage(page); } catch (err) { console.error('loadPage 호출 실패', err); }
    }, { passive: true });
    console.log('[nav bind] 완료');
  }

  const loginButton = document.getElementById("login-btn");
  if (loginButton) loginButton.addEventListener("click", () => { window.location.href = "../log_in/login.html"; });

  const signupButton = document.getElementById("signup-btn");
  if (signupButton) signupButton.addEventListener("click", () => { window.location.href = "../Sign_in/Sign_in.html"; });

  await loadData('all');
  updateDashboard();
});