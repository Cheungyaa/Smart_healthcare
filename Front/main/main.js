console.log("✅ Life Log Dashboard loaded.");

// 로그인 상태를 임시로 저장하는 변수 (실제 구현에서는 서버 세션이나 토큰 사용)
const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    // 로그인 상태가 아니고, 클릭한 메뉴가 'Dashboard'가 아닐 경우
    if (!isLoggedIn && item.textContent !== "Dashboard") {
      alert("로그인이 필요한 서비스입니다.");
      window.location.href = "../log_in/login.html";
      return; 
    }

    // 'Dashboard' 클릭 시 또는 로그인 상태일 때 메뉴 활성화 로직
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
  });
});

// 헤더의 로그인 버튼 클릭 시 로그인 페이지로 이동
const loginButton = document.getElementById("login-btn");
if (loginButton) {
  loginButton.addEventListener("click", () => {
    window.location.href = "../log_in/login.html";
  });
}

// 헤더의 회원가입 버튼 클릭 시 회원가입 페이지로 이동
const signupButton = document.getElementById("signup-btn");
if (signupButton) {
  signupButton.addEventListener("click", () => {
    window.location.href = "../Sign_in/Sign_in.html";
  });
}

// 간단 로그인 체크
function isLoggedIn() {
  return !!localStorage.getItem('isLoggedIn');
}

// 데이터 저장/로드 (localStorage 사용)
const dataStore = {
  today: {
    sleep: { hours: 0, minutes: 0 }, // hours + minutes
    steps: 0,
    kcal: 0,
    bpm: 0
  }
};

// localStorage에서 데이터 로드
function loadTodayData() {
  const saved = localStorage.getItem('todayData');
  if (saved) {
    Object.assign(dataStore.today, JSON.parse(saved));
  }
}

// localStorage에 데이터 저장
function saveTodayData() {
  localStorage.setItem('todayData', JSON.stringify(dataStore.today));
}

// Dashboard 업데이트
function updateDashboard() {
  loadTodayData();
  document.getElementById('today-sleep').textContent = 
    `${dataStore.today.sleep.hours}h ${dataStore.today.sleep.minutes}m`;
  document.getElementById('today-steps').textContent = dataStore.today.steps.toLocaleString();
  document.getElementById('today-kcal').textContent = `${dataStore.today.kcal} kcal`;
  document.getElementById('today-bpm').textContent = `${dataStore.today.bpm} bpm`;
  
  // 칼로리 바 업데이트
  const calPercent = Math.min((dataStore.today.kcal / 2200) * 100, 100);
  document.getElementById('calorie-bar-fill').style.width = calPercent + '%';
  document.getElementById('calorie-display').textContent = `${dataStore.today.kcal} kcal`;
}

// 사이드바 클릭 핸들러
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", (e) => {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    const page = item.dataset.page || item.textContent.trim().toLowerCase();
    loadPage(page);
  });
});

function loadPage(page) {
  const container = document.getElementById('content-container');
  if(!container) return;

  const protectedPages = ['sleep', 'activity', 'nutrition', 'body-info'];
  if (protectedPages.includes(page) && !isLoggedIn()) {
    container.innerHTML = '<div class="need-login" style="padding:40px;">데이터를 보려면 로그인이 필요합니다.</div>';
    return;
  }

  if (page === 'dashboard' || page === undefined) {
    location.reload(); // Dashboard로 돌아가기
    return;
  }

  if (page === 'sleep') {
    renderSleepPage();
    return;
  }

  if (page === 'activity') {
    renderActivityPage();
    return;
  }

  if (page === 'nutrition') {
    renderNutritionPage();
    return;
  }

  if (page === 'body-info') {
    renderBodyInfoPage();
    return;
  }

  if (page === 'settings') {
    renderSettingsPage();
    return;
  }
}

// Sleep 페이지 렌더
function renderSleepPage() {
  const container = document.getElementById('content-container');
  loadTodayData();
  const { hours, minutes } = dataStore.today.sleep;
  
  container.innerHTML = `
    <section class="card">
      <div class="card-title">Sleep Data</div>
      <div style="padding:20px;">
        <label>수면 시간 (시간):</label>
        <input type="number" id="sleep-hours" value="${hours}" min="0" max="24" style="width:100px;padding:8px;margin:10px 0;" />
        
        <label>수면 시간 (분):</label>
        <input type="number" id="sleep-minutes" value="${minutes}" min="0" max="59" style="width:100px;padding:8px;margin:10px 0;" />
        
        <button id="save-sleep-btn" style="padding:10px 20px;background:#2a9df4;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">저장</button>
      </div>
    </section>
  `;
  
  document.getElementById('save-sleep-btn').addEventListener('click', () => {
    dataStore.today.sleep.hours = parseInt(document.getElementById('sleep-hours').value) || 0;
    dataStore.today.sleep.minutes = parseInt(document.getElementById('sleep-minutes').value) || 0;
    saveTodayData();
    alert('Sleep 데이터가 저장되었습니다.');
    updateDashboard();
    loadPage('dashboard');
  });
}

// Activity 페이지 렌더
function renderActivityPage() {
  const container = document.getElementById('content-container');
  loadTodayData();
  const { steps } = dataStore.today;
  
  container.innerHTML = `
    <section class="card">
      <div class="card-title">Activity Data</div>
      <div style="padding:20px;">
        <label>걸음 수:</label>
        <input type="number" id="activity-steps" value="${steps}" min="0" style="width:200px;padding:8px;margin:10px 0;" />
        
        <button id="save-activity-btn" style="padding:10px 20px;background:#ff7a59;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">저장</button>
      </div>
    </section>
  `;
  
  document.getElementById('save-activity-btn').addEventListener('click', () => {
    dataStore.today.steps = parseInt(document.getElementById('activity-steps').value) || 0;
    saveTodayData();
    alert('Activity 데이터가 저장되었습니다.');
    updateDashboard();
    loadPage('dashboard');
  });
}

// Nutrition 페이지 렌더
function renderNutritionPage() {
  const container = document.getElementById('content-container');
  loadTodayData();
  const { kcal } = dataStore.today;
  
  container.innerHTML = `
    <section class="card">
      <div class="card-title">Nutrition Data</div>
      <div style="padding:20px;">
        <label>칼로리 섭취 (kcal):</label>
        <input type="number" id="nutrition-kcal" value="${kcal}" min="0" style="width:200px;padding:8px;margin:10px 0;" />
        
        <button id="save-nutrition-btn" style="padding:10px 20px;background:#f0b500;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">저장</button>
      </div>
    </section>
  `;
  
  document.getElementById('save-nutrition-btn').addEventListener('click', () => {
    dataStore.today.kcal = parseInt(document.getElementById('nutrition-kcal').value) || 0;
    saveTodayData();
    alert('Nutrition 데이터가 저장되었습니다.');
    updateDashboard();
    loadPage('dashboard');
  });
}

// Body Info 페이지 렌더
function renderBodyInfoPage() {
  const container = document.getElementById('content-container');
  loadTodayData();
  const { bpm } = dataStore.today;
  
  container.innerHTML = `
    <section class="card">
      <div class="card-title">Body Info Data</div>
      <div style="padding:20px;">
        <label>평균 심박수 (bpm):</label>
        <input type="number" id="body-bpm" value="${bpm}" min="0" style="width:200px;padding:8px;margin:10px 0;" />
        
        <button id="save-body-btn" style="padding:10px 20px;background:#7c3aed;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">저장</button>
      </div>
    </section>
  `;
  
  document.getElementById('save-body-btn').addEventListener('click', () => {
    dataStore.today.bpm = parseInt(document.getElementById('body-bpm').value) || 0;
    saveTodayData();
    alert('Body Info 데이터가 저장되었습니다.');
    updateDashboard();
    loadPage('dashboard');
  });
}

// Settings 페이지 렌더
function renderSettingsPage() {
  const container = document.getElementById('content-container');
  container.innerHTML = `
    <section class="card">
      <div class="card-title">Settings</div>
      <div style="padding:20px;">
        <button id="clear-data-btn" style="padding:10px 20px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;">전체 데이터 삭제</button>
      </div>
    </section>
  `;
  
  document.getElementById('clear-data-btn').addEventListener('click', () => {
    if (confirm('모든 데이터를 삭제하시겠습니까?')) {
      localStorage.removeItem('todayData');
      dataStore.today = { sleep: { hours: 0, minutes: 0 }, steps: 0, kcal: 0, bpm: 0 };
      alert('데이터가 삭제되었습니다.');
      updateDashboard();
      loadPage('dashboard');
    }
  });
}

// 초기 로드
loadTodayData();
updateDashboard();

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  const container = document.getElementById('content-container');
  if (!container) {
    console.error('content-container 요소를 찾을 수 없습니다.');
    return;
  }

  // 초기 dashboard HTML을 보관(되돌릴 때 사용)
  const originalDashboardHTML = container.innerHTML;

  // 데이터 스토어 (localStorage 기반)
  const dataStore = {
    today: {
      sleep: { hours: 0, minutes: 0 },
      steps: 0,
      kcal: 0,
      bpm: 0
    }
  };

  // 로그인 확인 함수 (main.html 내 로그인 로직과 동일 기준)
  function isLoggedIn() {
    return !!localStorage.getItem('isLoggedIn');
  }

  // load/save
  function loadTodayData() {
    const saved = localStorage.getItem('todayData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 병합(안정성)
        dataStore.today = Object.assign(dataStore.today, parsed);
      } catch (e) {
        console.warn('todayData 파싱 실패', e);
      }
    }
  }

  function saveTodayData() {
    localStorage.setItem('todayData', JSON.stringify(dataStore.today));
  }

  // Dashboard 업데이트 (현재 container의 DOM에 id가 있어야 동작)
  function updateDashboard() {
    loadTodayData();
    const elSleep = document.getElementById('today-sleep');
    const elSteps = document.getElementById('today-steps');
    const elKcal = document.getElementById('today-kcal');
    const elBpm = document.getElementById('today-bpm');
    const elCalDisplay = document.getElementById('calorie-display');
    const elCalBarFill = document.getElementById('calorie-bar-fill');

    if (elSleep) {
      elSleep.textContent = `${dataStore.today.sleep.hours}h ${dataStore.today.sleep.minutes}m`;
    }
    if (elSteps) {
      elSteps.textContent = Number(dataStore.today.steps).toLocaleString();
    }
    if (elKcal) {
      elKcal.textContent = `${dataStore.today.kcal} kcal`;
    }
    if (elBpm) {
      elBpm.textContent = `${dataStore.today.bpm} bpm`;
    }
    if (elCalDisplay) {
      elCalDisplay.textContent = `${dataStore.today.kcal} kcal`;
    }
    if (elCalBarFill) {
      const percent = Math.min(Math.round((dataStore.today.kcal / 2200) * 100), 100);
      elCalBarFill.style.width = percent + '%';
    }
  }

  // 페이지 로드 관리
  function loadPage(page) {
    const protectedPages = ['sleep','activity','nutrition','body-info'];
    if (protectedPages.includes(page) && !isLoggedIn()) {
      container.innerHTML = '<div class="need-login" style="padding:40px;border-radius:8px;background:#fff;">데이터를 보려면 로그인 필요합니다.</div>';
      return;
    }

    if (!page || page === 'dashboard') {
      container.innerHTML = originalDashboardHTML;
      // 대시보드에 있는 요소를 업데이트
      updateDashboard();
      return;
    }

    if (page === 'sleep') {
      renderSleepPage();
      return;
    }
    if (page === 'activity') {
      renderActivityPage();
      return;
    }
    if (page === 'nutrition') {
      renderNutritionPage();
      return;
    }
    if (page === 'body-info') {
      renderBodyInfoPage();
      return;
    }
    if (page === 'settings') {
      renderSettingsPage();
      return;
    }

    // 기본
    container.innerHTML = `<section class="card"><div class="card-title">${page}</div><div style="padding:20px;">준비중입니다.</div></section>`;
  }

  // 렌더 함수들
  function renderSleepPage() {
    loadTodayData();
    const { hours, minutes } = dataStore.today.sleep;
    container.innerHTML = `
      <section class="card">
        <div class="card-title">Sleep Data</div>
        <div style="padding:20px;">
          <label>수면 시간 (시간):</label><br/>
          <input type="number" id="sleep-hours" value="${hours}" min="0" max="24" style="width:100px;padding:8px;margin:6px 0;" />
          <br/>
          <label>수면 시간 (분):</label><br/>
          <input type="number" id="sleep-minutes" value="${minutes}" min="0" max="59" style="width:100px;padding:8px;margin:6px 0;" />
          <br/>
          <button id="save-sleep-btn" style="padding:10px 20px;background:#2a9df4;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">저장</button>
        </div>
      </section>
    `;
    document.getElementById('save-sleep-btn').addEventListener('click', () => {
      dataStore.today.sleep.hours = parseInt(document.getElementById('sleep-hours').value) || 0;
      dataStore.today.sleep.minutes = parseInt(document.getElementById('sleep-minutes').value) || 0;
      saveTodayData();
      updateDashboard();
      loadPage('dashboard');
    });
  }

  function renderActivityPage() {
    loadTodayData();
    const steps = dataStore.today.steps || 0;
    container.innerHTML = `
      <section class="card">
        <div class="card-title">Activity Data</div>
        <div style="padding:20px;">
          <label>걸음 수:</label><br/>
          <input type="number" id="activity-steps" value="${steps}" min="0" style="width:200px;padding:8px;margin:6px 0;" />
          <br/>
          <button id="save-activity-btn" style="padding:10px 20px;background:#ff7a59;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">저장</button>
        </div>
      </section>
    `;
    document.getElementById('save-activity-btn').addEventListener('click', () => {
      dataStore.today.steps = parseInt(document.getElementById('activity-steps').value) || 0;
      saveTodayData();
      updateDashboard();
      loadPage('dashboard');
    });
  }

  function renderNutritionPage() {
    loadTodayData();
    const kcal = dataStore.today.kcal || 0;
    container.innerHTML = `
      <section class="card">
        <div class="card-title">Nutrition Data</div>
        <div style="padding:20px;">
          <label>칼로리 섭취 (kcal):</label><br/>
          <input type="number" id="nutrition-kcal" value="${kcal}" min="0" style="width:200px;padding:8px;margin:6px 0;" />
          <br/>
          <button id="save-nutrition-btn" style="padding:10px 20px;background:#f0b500;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">저장</button>
        </div>
      </section>
    `;
    document.getElementById('save-nutrition-btn').addEventListener('click', () => {
      dataStore.today.kcal = parseInt(document.getElementById('nutrition-kcal').value) || 0;
      saveTodayData();
      updateDashboard();
      loadPage('dashboard');
    });
  }

  function renderBodyInfoPage() {
    loadTodayData();
    const bpm = dataStore.today.bpm || 0;
    container.innerHTML = `
      <section class="card">
        <div class="card-title">Body Info Data</div>
        <div style="padding:20px;">
          <label>평균 심박수 (bpm):</label><br/>
          <input type="number" id="body-bpm" value="${bpm}" min="0" style="width:200px;padding:8px;margin:6px 0;" />
          <br/>
          <button id="save-body-btn" style="padding:10px 20px;background:#7c3aed;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">저장</button>
        </div>
      </section>
    `;
    document.getElementById('save-body-btn').addEventListener('click', () => {
      dataStore.today.bpm = parseInt(document.getElementById('body-bpm').value) || 0;
      saveTodayData();
      updateDashboard();
      loadPage('dashboard');
    });
  }

  function renderSettingsPage() {
    container.innerHTML = `
      <section class="card">
        <div class="card-title">Settings</div>
        <div style="padding:20px;">
          <button id="clear-data-btn" style="padding:10px 20px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;">전체 데이터 삭제</button>
        </div>
      </section>
    `;
    document.getElementById('clear-data-btn').addEventListener('click', () => {
      if (confirm('모든 데이터를 삭제하시겠습니까?')) {
        localStorage.removeItem('todayData');
        dataStore.today = { sleep: { hours: 0, minutes: 0 }, steps: 0, kcal: 0, bpm: 0 };
        updateDashboard();
        loadPage('dashboard');
      }
    });
  }

  // 이벤트 위임으로 nav 클릭 처리
  if (nav) {
    nav.addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (!item) return;
      // active 토글
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const page = (item.dataset && item.dataset.page) ? item.dataset.page : item.textContent.trim().toLowerCase();
      loadPage(page);
    }, false);
  } else {
    console.warn('.nav 요소를 찾을 수 없습니다.');
  }

  // 초기 로드
  loadTodayData();
  updateDashboard();

  // 디버그: 네비게이션 항목 수 출력
  console.log('mounted main.js, nav-count =', document.querySelectorAll('.nav-item').length);
});
