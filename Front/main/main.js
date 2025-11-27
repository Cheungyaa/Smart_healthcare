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
    sleep: { 
      hours: 0, 
      minutes: 0,
      start: "",     // 추가된 항목: 수면 시작 시간 (HH:MM)
      end: ""        // 추가된 항목: 수면 종료 시간 (HH:MM)
    },
    steps: 0,
    kcal: 0,
    bpm: 0,
    bmi: 0,
    foodLogs: []      // 음식: { food, weight, kcal }로 저장되는 리스트 (Nutrition 페이지에서 사용)
  },

  history: {
    labels: [],       // 날짜 라벨 (최근 7일)
    sleep: [],        // 수면 시간(시간 단위)
    steps: [],
    kcal: [],
    bpm: [],
    weight: []
  }
};

function loadTodayData() {
  const saved = localStorage.getItem('todayData');
  if (saved) {
    try { Object.assign(dataStore.today, JSON.parse(saved).today || {}); } catch(e) { console.warn('todayData parse error', e); }
  }
  // history 따로 로드
  const savedHist = localStorage.getItem('todayHistory');
  if (savedHist) {
    try { Object.assign(dataStore.history, JSON.parse(savedHist)); } catch(e){ console.warn('history parse error', e); }
  } else {
    // 빈 초기화: 최근 7일 라벨 만들기 (D-6 ~ Today)
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString());
    }
    dataStore.history.labels = labels;
    dataStore.history.sleep = Array(7).fill(0);
    dataStore.history.steps = Array(7).fill(0);
    dataStore.history.kcal = Array(7).fill(0);
    dataStore.history.bpm = Array(7).fill(0);
    dataStore.history.weight = Array(7).fill(0);
  }
}
function saveTodayData() {
  // today 데이터 저장
  localStorage.setItem('todayData', JSON.stringify({ today: dataStore.today }));
  // history 저장
  localStorage.setItem('todayHistory', JSON.stringify(dataStore.history));
}

// history에 오늘 값 push (최대 7개 유지)
function pushTodayToHistory() {
  const labels = dataStore.history.labels || [];
  const nowLabel = new Date().toLocaleDateString();
  // labels: 마지막이 오늘이면 덮어쓰기, 아니면 push shift
  if (labels.length === 0 || labels[labels.length-1] !== nowLabel) {
    labels.push(nowLabel);
    if (labels.length > 7) labels.shift();
    ['sleep','steps','kcal','bpm','weight'].forEach(key => {
      dataStore.history[key].push(getHistoryValueForToday(key));
      if (dataStore.history[key].length > 7) dataStore.history[key].shift();
    });
    dataStore.history.labels = labels;
  } else {
    // 덮어쓰기
    const lastIndex = labels.length - 1;
    ['sleep','steps','kcal','bpm','weight'].forEach(key => {
      dataStore.history[key][lastIndex] = getHistoryValueForToday(key);
    });
  }
  saveTodayData();
}

// key별 오늘값 매핑
function getHistoryValueForToday(key) {
  switch(key) {
    case 'sleep': return Number(dataStore.today.sleep.hours || 0) + Number((dataStore.today.sleep.minutes || 0)/60);
    case 'steps': return Number(dataStore.today.steps || 0);
    case 'kcal': return Number(dataStore.today.kcal || 0);
    case 'bpm': return Number(dataStore.today.bpm || 0);
    case 'weight': return Number(dataStore.today.bmi || 0); // 임시로 BMI 대신 weight 사용 가능
    default: return 0;
  }
}

// Chart 인스턴스 보관
let sleepActivityChart = null;
let weightChart = null;

function initCharts() {
  // sleepActivityChart (sleep hours + steps)
  const ctx1 = document.getElementById('sleepActivityChart');
  if (ctx1) {
    const labels = dataStore.history.labels;
    sleepActivityChart = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: '수면 시간(시간)',
            data: dataStore.history.sleep,
            yAxisID: 'y1',
            borderColor: '#2a9df4',
            backgroundColor: 'rgba(42,157,244,0.15)',
            tension: 0.3,
            pointRadius: 4
          },
          {
            type: 'bar',
            label: '걸음 수',
            data: dataStore.history.steps,
            yAxisID: 'y2',
            backgroundColor: 'rgba(42,157,244,0.35)'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y1: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: '시간(시간)' }
          },
          y2: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: '걸음 수' }
          }
        },
        plugins: { legend: { position: 'top' } }
      }
    });
  }

  // weightChart (BMI/체중)
  const ctx2 = document.getElementById('weightChart');
  if (ctx2) {
    weightChart = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: dataStore.history.labels,
        datasets: [{
          label: 'BMI/체중 (임시)',
          data: dataStore.history.weight,
          borderColor: '#1f7fd1',
          backgroundColor: 'rgba(31,127,209,0.15)',
          tension: 0.25,
          fill: true,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        scales: { y: { title: { display: true, text: 'BMI' } } },
        plugins: { legend: { display: false } }
      }
    });
  }
}

function updateCharts() {
  if (sleepActivityChart) {
    sleepActivityChart.data.labels = dataStore.history.labels;
    sleepActivityChart.data.datasets[0].data = dataStore.history.sleep;
    sleepActivityChart.data.datasets[1].data = dataStore.history.steps;
    sleepActivityChart.update();
  }
  if (weightChart) {
    weightChart.data.labels = dataStore.history.labels;
    weightChart.data.datasets[0].data = dataStore.history.weight;
    weightChart.update();
  }
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
    pushTodayToHistory();
    updateDashboard();
    updateCharts();
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
    pushTodayToHistory();
    saveTodayData();
    alert('Activity 데이터가 저장되었습니다.');
    updateDashboard();
    updateCharts();
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
    pushTodayToHistory();
    saveTodayData();
    alert('Nutrition 데이터가 저장되었습니다.');
    updateDashboard();
    updateCharts();
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
    pushTodayToHistory();
    saveTodayData();
    alert('Body Info 데이터가 저장되었습니다.');
    updateDashboard();
    updateCharts();
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
  initCharts();         // 차트 인스턴스 생성
  updateDashboard();
  updateCharts();       // 차트 데이터 그리기
});
