console.log("✅ Life Log Dashboard loaded.");

/*
  변경 요약:
  - const isLoggedIn 중복 제거
  - 로그인 체크는 function isLoggedIn() 한 가지만 사용
  - nav 이벤트 바인딩은 DOMContentLoaded 내부에서 한 번만 처리 (위임)
  - login/signup 버튼도 DOMContentLoaded에서 안전하게 바인딩
*/

// 로그인 체크 함수 (한 곳만)
function isLoggedIn() {
  return !!localStorage.getItem('isLoggedIn');
}

// 데이터 저장/로드 (localStorage 사용)
const dataStore = {
  today: {
    sleep: { hours: 0, minutes: 0 },
    steps: 0,
    kcal: 0,
    bpm: 0,
    bmi: 0
  }
};

function loadTodayData() {
  const saved = localStorage.getItem('todayData');
  if (saved) {
    try { Object.assign(dataStore.today, JSON.parse(saved)); } catch(e) { console.warn('todayData parse error', e); }
  }
}
function saveTodayData() {
  localStorage.setItem('todayData', JSON.stringify(dataStore.today));
}

function updateDashboard() {
  loadTodayData();
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

  setText('today-sleep', `${dataStore.today.sleep.hours}h ${dataStore.today.sleep.minutes}m`);
  setText('today-steps', Number(dataStore.today.steps).toLocaleString());
  setText('today-kcal', `${dataStore.today.kcal} kcal`);
  setText('today-bpm', `${dataStore.today.bpm} bpm`);
  setText('peer-my-sleep', `${dataStore.today.sleep.hours}h`);
  setText('peer-my-steps', Number(dataStore.today.steps).toLocaleString());
  setText('peer-my-bmi', dataStore.today.bmi || '0');

  const elCalBar = document.getElementById('calorie-bar-fill');
  if (elCalBar) {
    const percent = Math.min(Math.round((dataStore.today.kcal / 2200) * 100), 100);
    elCalBar.style.width = percent + '%';
  }

  const insightEl = document.getElementById('insight-text');
  if (insightEl) {
    const insights = [];
    const sleepTotal = (Number(dataStore.today.sleep.hours)||0) + ((Number(dataStore.today.sleep.minutes)||0)/60);
    if (sleepTotal < 6.5) insights.push('수면 시간이 또래보다 부족합니다. 취침 시간을 20~30분 앞당기는 것을 권장합니다.');
    else if (sleepTotal < 7) insights.push('수면 시간이 약간 부족합니다. 수면 시간을 조금 늘려보세요.');
    else insights.push('수면 시간이 양호합니다. 충분한 수면을 유지하세요.');

    const steps = Number(dataStore.today.steps)||0;
    if (steps < 5000) insights.push('오늘 걸음 수가 낮습니다. 가벼운 산책을 권장합니다.');
    else if (steps < 10000) insights.push('활동량이 보통입니다. 목표 걸음 수 달성을 시도해 보세요.');
    else insights.push('목표 걸음 수 달성했습니다. 계속 유지하세요.');

    const kcal = Number(dataStore.today.kcal)||0;
    if (kcal > 2600) insights.push('칼로리 섭취가 권장량을 초과했습니다. 섭취량을 조절하세요.');
    else if (kcal > 2200) insights.push('칼로리 섭취가 권장량에 근접합니다. 균형 있게 유지하세요.');
    else insights.push('칼로리 섭취가 적절합니다.');

    const bpm = Number(dataStore.today.bpm)||0;
    if (bpm && (bpm < 50 || bpm > 100)) insights.push('심박수 범위가 평소와 다릅니다. 필요 시 전문가와 상담하세요.');
    else if (bpm) insights.push('심박수는 정상 범위 내에 있습니다.');

    insightEl.innerHTML = insights.map(s => `· ${s}`).join('<br>');
  }
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

// 안전한 초기 바인딩: DOMContentLoaded 안에서 한 번만 처리
document.addEventListener('DOMContentLoaded', () => {
  // 네비게이션 위임 바인딩
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
      try { loadPage(page); } catch(err) { console.error('loadPage 호출 실패', err); }
    }, { passive: true });
    console.log('[nav bind] 완료');
  }

  // header 버튼 안전 바인딩
  const loginButton = document.getElementById("login-btn");
  if (loginButton) loginButton.addEventListener("click", () => { window.location.href = "../log_in/login.html"; });

  const signupButton = document.getElementById("signup-btn");
  if (signupButton) signupButton.addEventListener("click", () => { window.location.href = "../Sign_in/Sign_in.html"; });

  // 초기 데이터 로드/렌더
  loadTodayData();
  updateDashboard();
});
