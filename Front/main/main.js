import { INFO_URL } from './config.js';

console.log("✅ Life Log Dashboard loaded.");

/* ==== 수정사항 ====
Back:
  - custom cursor 추가
  - 서버 버그 수정

Front:
  main.js:
    - 수면 활동 차트 구현
      - 기존 updateChart, initChart 없애고 drawChart 함수 하나로만 차트 그림
      - 수면 데이터는 분 단위로 그리고 표기는 시간:분 형식
    - 수면 데이터 입력받는 부분 시간 선택하는 걸로 바꿈
    - history 수면 데이터 today랑 동일하게 {hours, minutes} 객체 배열로 바꿈
    - 서버 데이터 중심으로 돌아가게 데이터 로드 시 서버에서 우선적으로 가져오게 바꿈

to-do (백엔드 작업 필요):
  - 몸무게, bmi 시간 별로 가져오게 DB 스키마 변경
  - 몸무게, bmi 가져오는 함수 구현
  - 몸무게, bmi 추이 차트 구현 (지금은 0으로만 그려짐)
  - 하루에 여러 값이 입력 됐을 때, 하루 마지막 값만 사용하는 로직 백엔드/쿼리에서 처리
*/

// 음식 이름 리스트
const FOOD_NAMES = [
  "김밥", "삼겹살", "불고기", "비빔밥", "된장찌개", "김치찌개", "라면", "칼국수", "떡볶이", "순대",
  "닭갈비", "삼계탕", "제육볶음", "갈비탕", "냉면", "쫄면", "짜장면", "짬뽕", "짬뽕밥", "볶음밥",
  "김치볶음밥", "새우볶음밥", "카레라이스", "토스트", "샌드위치", "햄버거", "치킨", "후라이드치킨",
  "양념치킨", "간장치킨", "감자튀김", "치즈피자", "페퍼로니피자", "불고기피자", "핫도그", "순살치킨",
  "돈까스", "카츠동", "규동", "라멘", "우동", "초밥", "연어초밥", "참치초밥", "광어초밥", "김치전",
  "파전", "부침개", "계란말이", "계란후라이", "감자탕", "돼지국밥", "순대국", "콩나물국밥", "설렁탕",
  "육개장", "갈비찜", "잡채", "닭강정", "족발", "보쌈", "오리고기", "편의점도시락", "김치", "깍두기",
  "백김치", "나물비빔밥", "해장국", "부대찌개", "감자조림", "고등어구이", "삼치구이", "갈치조림",
  "오징어볶음", "두부김치", "비빔국수", "콩국수", "고기만두", "김치만두", "찐만두", "군만두",
  "호떡", "붕어빵", "풀빵", "찹쌀떡", "인절미", "꿀떡", "아메리카노", "카페라떼", "초코우유",
  "딸기우유", "바나나우유", "식빵", "크로아상", "도넛", "초코파이", "라떼빙수"
];

// 데이터 저장/로드 (localStorage 사용)
const dataStore = {
  today: {
    sleep: {
      hours: 0,
      minutes: 0,
      start: "",     // 수면 시작 시간 (HH:MM)
      end: ""        // 수면 종료 시간 (HH:MM)
    },
    steps: 0,
    kcal: 0,
    bpm: 0,
    bmi: 0,
    foodLogs: []      // 음식: { food, weight, kcal }
  },

  history: {
    labels: [],       // 날짜 라벨 (최근 7일)
    sleep: [],        // [{hours, minutes}, ...]
    steps: [],
    kcal: [],
    bpm: [],
    weight: []        // 추후 BMI/체중 값
  },

  sleep_target: {
    hours: 0,
    minutes: 0
  },
};

// 로그인 체크 함수
function isLoggedIn() {
  return !!localStorage.getItem('isLoggedIn');
}

/* ==========================
   데이터 로드/저장
   ========================== */

// 오늘 데이터 로드 (백엔드 우선)
async function loadTodayData() {
  const userId = localStorage.getItem('username');

  if (userId) {
    await loadTodayDataFromBackend(userId);
    await loadLast7DaysFromBackend(userId);
  } else {
    initializeEmptyHistory();
  }

  // 수면 목표 시간 불러오기
  try {
    const res = await fetch(INFO_URL + '/getSleepTarget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    const data = await res.json();
    const target = data.target_sleep_time || "00:00:00";
    if (target) {
      const [th, tm] = target.split(':').map(Number);
      dataStore.sleep_target.hours = th || 0;
      dataStore.sleep_target.minutes = tm || 0;
    }
  } catch (err) {
    console.error('수면 목표 시간 로드 실패:', err);
    dataStore.sleep_target.hours = 0;
    dataStore.sleep_target.minutes = 0;
  }
}
// 백엔드에서 오늘 데이터 가져오기
async function loadTodayDataFromBackend(userId) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const start = formatDateTime(todayStart);
    const end = formatDateTime(todayEnd);

    const [sleep, steps, heartRate, foodLog] = await Promise.all([
      fetch(`${INFO_URL}/getActualSleep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
      }).then(res => res.json()).catch(() => []),

      fetch(`${INFO_URL}/getSteps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
      }).then(res => res.json()).catch(() => []),

      fetch(`${INFO_URL}/getHeartRate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
      }).then(res => res.json()).catch(() => []),

      fetch(`${INFO_URL}/getFoodLog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
      }).then(res => res.json()).catch(() => [])
    ]);

    // 수면 시간 (HH:MM:SS)
    if (sleep && sleep.length > 0) {
      const timeStr = sleep[0].actual_sleep_time || '00:00:00';
      const [hours, minutes] = timeStr.split(':').map(Number);
      dataStore.today.sleep.hours = hours || 0;
      dataStore.today.sleep.minutes = minutes || 0;
    }

    // 걸음 수
    if (steps && steps.length > 0) {
      dataStore.today.steps = steps.reduce((sum, item) => sum + (item.steps || 0), 0);
    }

    // 칼로리
    if (foodLog && foodLog.length > 0) {
      dataStore.today.kcal = foodLog.reduce((sum, item) => sum + (item.food_calories || 0), 0);
      dataStore.today.foodLogs = foodLog.map(item => ({
        food: item.food_name,
        weight: item.food_weight,
        kcal: item.food_calories
      }));
    }

    // 심박수
    if (heartRate && heartRate.length > 0) {
      const avgBpm = heartRate.reduce((sum, item) => sum + (item.heart_rate || 0), 0) / heartRate.length;
      dataStore.today.bpm = Math.round(avgBpm);
    }

    saveTodayData();
    console.log('DB|today data load complete', dataStore.today);
  } catch (err) {
    console.error('DB|today data load failed:', err);
  }
}
// 백엔드에서 최근 7일 데이터 가져오기
async function loadLast7DaysFromBackend(userId) {
  try {
    const labels = [];
    const sleepData = [];
    const stepsData = [];
    const kcalData = [];
    const bpmData = [];
    const weightData = []; // 추후 BMI/체중 값 채울 예정

    // 최근 7일 날짜 생성
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString());

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const start = formatDateTime(dayStart);
      const end = formatDateTime(dayEnd);

      const [sleep, steps, heartRate, foodLog] = await Promise.all([
        fetch(`${INFO_URL}/getActualSleep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
        }).then(res => res.json()).catch(() => []),

        fetch(`${INFO_URL}/getSteps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
        }).then(res => res.json()).catch(() => []),

        fetch(`${INFO_URL}/getHeartRate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
        }).then(res => res.json()).catch(() => []),

        fetch(`${INFO_URL}/getFoodLog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
        }).then(res => res.json()).catch(() => [])
      ]);

      // 수면 시간 -> {hours, minutes}
      if (sleep && sleep.length > 0) {
        const timeStr = sleep[0].actual_sleep_time || '00:00:00';
        const [hours, minutes] = timeStr.split(':').map(Number);
        sleepData.push({ hours: hours || 0, minutes: minutes || 0 });
      } else {
        sleepData.push({ hours: 0, minutes: 0 });
      }

      // 걸음 수
      if (steps && steps.length > 0) {
        const totalSteps = steps.reduce((sum, item) => sum + (item.steps || 0), 0);
        stepsData.push(totalSteps);
      } else {
        stepsData.push(0);
      }

      // 칼로리
      if (foodLog && foodLog.length > 0) {
        const totalKcal = foodLog.reduce((sum, item) => sum + (item.food_calories || 0), 0);
        kcalData.push(totalKcal);
      } else {
        kcalData.push(0);
      }

      // 심박수 (평균)
      if (heartRate && heartRate.length > 0) {
        const avgBpm = heartRate.reduce((sum, item) => sum + (item.heart_rate || 0), 0) / heartRate.length;
        bpmData.push(Math.round(avgBpm));
      } else {
        bpmData.push(0);
      }

      // 체중/BMI (지금은 0, 백엔드 완성되면 여기 채우면 됨)
      weightData.push(0);
    }

    dataStore.history.labels = labels;
    dataStore.history.sleep = sleepData;
    dataStore.history.steps = stepsData;
    dataStore.history.kcal = kcalData;
    dataStore.history.bpm = bpmData;
    dataStore.history.weight = weightData;

    saveTodayData();
    console.log('DB|last7days data load complete', dataStore.history);
  } catch (err) {
    console.error('DB|last7days data load failed:', err);
    initializeEmptyHistory();
  }
}
// 히스토리 비어있을 때 기본값
function initializeEmptyHistory() {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString());
  }
  dataStore.history.labels = labels;
  dataStore.history.sleep = Array.from({ length: 7 }, () => ({ hours: 0, minutes: 0 }));
  dataStore.history.steps = Array(7).fill(0);
  dataStore.history.kcal = Array(7).fill(0);
  dataStore.history.bpm = Array(7).fill(0);
  dataStore.history.weight = Array(7).fill(0);
}

// today + history localStorage 저장
function saveTodayData() {
  localStorage.setItem('todayData', JSON.stringify({ today: dataStore.today }));
  localStorage.setItem('todayHistory', JSON.stringify(dataStore.history));
}
// key별 오늘값 매핑 (sleep은 숫자값이 필요할 때만 사용)
function getHistoryValueForToday(key) {
  switch (key) {
    case 'sleep':
      return Number(dataStore.today.sleep.hours || 0) +
        Number((dataStore.today.sleep.minutes || 0) / 60);
    case 'steps': return Number(dataStore.today.steps || 0);
    case 'kcal': return Number(dataStore.today.kcal || 0);
    case 'bpm': return Number(dataStore.today.bpm || 0);
    case 'weight': return Number(dataStore.today.bmi || 0);
    default: return 0;
  }
}
// history에 오늘 값 push (최대 7개 유지)
// ✅ sleep은 {hours, minutes}, 나머지는 숫자로 관리
function pushTodayToHistory() {
  const labels = dataStore.history.labels || [];
  const nowLabel = new Date().toLocaleDateString();

  const pushOrOverwrite = (key, valueObj, isSleep, lastIndex) => {
    if (lastIndex === null) {
      // push
      if (isSleep) dataStore.history.sleep.push(valueObj);
      else dataStore.history[key].push(valueObj);
      if (dataStore.history[key].length > 7) dataStore.history[key].shift();
    } else {
      // overwrite
      if (isSleep) dataStore.history.sleep[lastIndex] = valueObj;
      else dataStore.history[key][lastIndex] = valueObj;
    }
  };

  if (labels.length === 0 || labels[labels.length - 1] !== nowLabel) {
    labels.push(nowLabel);
    if (labels.length > 7) labels.shift();

    // sleep: 객체로 push
    pushOrOverwrite(
      'sleep',
      { hours: dataStore.today.sleep.hours || 0, minutes: dataStore.today.sleep.minutes || 0 },
      true,
      null
    );

    ['steps', 'kcal', 'bpm', 'weight'].forEach(key => {
      pushOrOverwrite(key, getHistoryValueForToday(key), false, null);
    });

    dataStore.history.labels = labels;
  } else {
    const lastIndex = labels.length - 1;

    pushOrOverwrite(
      'sleep',
      { hours: dataStore.today.sleep.hours || 0, minutes: dataStore.today.sleep.minutes || 0 },
      true,
      lastIndex
    );

    ['steps', 'kcal', 'bpm', 'weight'].forEach(key => {
      pushOrOverwrite(key, getHistoryValueForToday(key), false, lastIndex);
    });
  }

  saveTodayData();
}

/* ==========================
   날짜/시간 유틸
   ========================== */

function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
// HH:MM 형식 시작/종료 시각으로 전체 수면 시간 계산
function calcSleepDuration(startTime, endTime) {
  if (!startTime || !endTime) return { hours: 0, minutes: 0 };

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;

  if (endMin <= startMin) {
    endMin += 24 * 60;
  }

  const total = endMin - startMin;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  return { hours, minutes };
}

/* ==========================
   Chart.js
   ========================== */

let sleepChart = null;
let weightChart = null;

function drawCharts() {
  const ctx = document.getElementById("sleepChart");
  if (!ctx) return;

  if (sleepChart) sleepChart.destroy();

  const labels = dataStore.history.labels;
  const sleepData = dataStore.history.sleep.map(d => d.hours * 60 + d.minutes);
  const targetMinutes = dataStore.sleep_target.hours * 60 + dataStore.sleep_target.minutes;
  const targetData = Array(7).fill(targetMinutes);

  sleepChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "수면 시간",
          data: sleepData,
          yAxisID: "y1",
          borderColor: "#4A90E2",
          backgroundColor: "rgba(74, 144, 226, 0.2)",
          tension: 0
        },
        {
          label: "목표 수면 시간",
          data: targetData,
          yAxisID: "y1",
          borderColor: "#E24A4A",
          backgroundColor: "rgba(226, 74, 74, 0.2)",
          borderDash: [5, 5],
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            callback: function (value) {
              const label = this.getLabelForValue(value);
              const parts = label.split(".");
              const mm = parts[1].trim().padStart(2, "0");
              const dd = parts[2].trim().padStart(2, "0");
              return `${mm}.${dd}`;
            }
          }
        },
        y1: {
          beginAtZero: true,
          ticks: {
            stepSize: 60,
            callback: (value) => {
              const hours = value / 60;
              return `${hours}시간`;
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.parsed.y;
              const h = Math.floor(value / 60);
              const m = value % 60;
              const formatted =
                value === 0 ? "0분" :
                  m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
              return `${ctx.dataset.label}: ${formatted}`;
            }
          }
        }
      }
    }
  });

  // 체중/BMI 차트
  const ctx2 = document.getElementById('weightChart');
  if (!ctx2) return;

  if (weightChart) weightChart.destroy();

  weightChart = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: dataStore.history.labels,
      datasets: [{
        label: 'BMI/체중',
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
      maintainAspectRatio: false,
      scales: { 
        x: {
          ticks: {
            callback: function (value) {
              const label = this.getLabelForValue(value);
              const parts = label.split(".");
              const mm = parts[1].trim().padStart(2, "0");
              const dd = parts[2].trim().padStart(2, "0");
              return `${mm}.${dd}`;
            }
          }
        },
        y: { title: { display: true, text: 'BMI' } } },
      plugins: { legend: { display: false } }
    }
  });
}

/* ==========================
   Dashboard UI 업데이트
   ========================== */

function updateDashboard() {
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('today-sleep', `${dataStore.today.sleep.hours}h ${dataStore.today.sleep.minutes}m`);
  setText('today-steps', Number(dataStore.today.steps).toLocaleString());
  setText('today-kcal', `${dataStore.today.kcal} kcal`);
  setText('calorie-display', `${dataStore.today.kcal} kcal`);
  setText('today-bpm', `${dataStore.today.bpm} bpm`);
  setText('peer-my-sleep', `${dataStore.today.sleep.hours}h`);
  setText('peer-my-steps', Number(dataStore.today.steps).toLocaleString());
  setText('peer-my-bmi', dataStore.today.bmi || '0');

  const elCalBar = document.getElementById('calorie-bar-fill');
  if (elCalBar) {
    const percent = Math.min(Math.round((dataStore.today.kcal / 2200) * 100), 100);
    elCalBar.style.width = percent + '%';
  }

  drawCharts();

  // 오늘의 인사이트
  const insightEl = document.getElementById('insight-text');
  if (insightEl) {
    const insights = [];
    const sleepTotal = (Number(dataStore.today.sleep.hours) || 0) +
      ((Number(dataStore.today.sleep.minutes) || 0) / 60);

    if (sleepTotal < 6.5) insights.push('수면 시간이 또래보다 부족합니다. 취침 시간을 20~30분 앞당기는 것을 권장합니다.');
    else if (sleepTotal < 7) insights.push('수면 시간이 약간 부족합니다. 수면 시간을 조금 늘려보세요.');
    else insights.push('수면 시간이 양호합니다. 충분한 수면을 유지하세요.');

    const steps = Number(dataStore.today.steps) || 0;
    if (steps < 5000) insights.push('오늘 걸음 수가 낮습니다. 가벼운 산책을 권장합니다.');
    else if (steps < 10000) insights.push('활동량이 보통입니다. 목표 걸음 수 달성을 시도해 보세요.');
    else insights.push('목표 걸음 수 달성했습니다. 계속 유지하세요.');

    const kcal = Number(dataStore.today.kcal) || 0;
    if (kcal > 2600) insights.push('칼로리 섭취가 권장량을 초과했습니다. 섭취량을 조절하세요.');
    else if (kcal > 2200) insights.push('칼로리 섭취가 권장량에 근접합니다. 균형 있게 유지하세요.');
    else insights.push('칼로리 섭취가 적절합니다.');

    const bpm = Number(dataStore.today.bpm) || 0;
    if (bpm && (bpm < 50 || bpm > 100)) insights.push('심박수 범위가 평소와 다릅니다. 필요 시 전문가와 상담하세요.');
    else if (bpm) insights.push('심박수는 정상 범위 내에 있습니다.');

    insightEl.innerHTML = insights.map(s => `· ${s}`).join('<br>');
  }
}

/* ==========================
   페이지 전환
   ========================== */

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
  if (!container) return;

  const protectedPages = ['sleep', 'activity', 'nutrition', 'body-info'];
  if (protectedPages.includes(page) && !isLoggedIn()) {
    container.innerHTML = '<div class="need-login" style="padding:40px;">데이터를 보려면 로그인이 필요합니다.</div>';
    return;
  }

  if (page === 'dashboard' || page === undefined) {
    location.reload();
    return;
  }

  if (page === 'sleep') { renderSleepPage(); return; }
  if (page === 'activity') { renderActivityPage(); return; }
  if (page === 'nutrition') { renderNutritionPage(); return; }
  if (page === 'body-info') { renderBodyInfoPage(); return; }
  if (page === 'settings') { renderSettingsPage(); return; }
}

/* ==========================
   Sleep 페이지
   ========================== */

function renderSleepPage() {
  const container = document.getElementById('content-container');
  loadTodayData();
  const { start, end, hours, minutes } = dataStore.today.sleep;

  // 시간을 AM/PM, 시간, 분으로 파싱하는 헬퍼 함수
  const parseTime = (timeStr) => {
    if (!timeStr) return { ampm: 'AM', hour: '12', minute: '00' };
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
    return {
      ampm,
      hour: String(hour12).padStart(2, '0'),
      minute: String(m).padStart(2, '0')
    };
  };

  const startParsed = parseTime(start);
  const endParsed = parseTime(end);

  // 날짜 기본값: 전날(시작), 오늘(종료)
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const defaultStartDate = formatDate(yesterday); // YYYY-MM-DD
  const defaultEndDate   = formatDate(today);     // YYYY-MM-DD

  // 시간 옵션 생성 (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const h = String(i + 1).padStart(2, '0');
    return `<option value="${h}">${h}</option>`;
  }).join('');

  // 분 옵션 생성 (00-55, 5분 단위)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const m = String(i * 5).padStart(2, '0');
    return `<option value="${m}">${m}</option>`;
  }).join('');

  const selectStyle = "padding:8px; border-radius:8px; border:1px solid #d1d5db; font-size:14px;";
  const dateInputStyle = "padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; font-size:14px;";

  container.innerHTML = `
    <section class="card">
      <div class="card-title">Sleep Data</div>
      <div style="padding:20px; display:flex; flex-direction:column; gap:16px; max-width:600px;">

        <!-- 수면 시작 날짜 -->
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:500;">수면 시작 날짜</label>
          <input
            type="date"
            id="sleep-start-date"
            style="${dateInputStyle}"
            value="${defaultStartDate}"
          />
        </div>

        <!-- 수면 시작 시간 -->
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:500;">수면 시작 시간</label>
          <div style="display:flex; gap:8px;">
            <select id="sleep-start-ampm" style="${selectStyle}">
              <option value="AM" ${startParsed.ampm === 'AM' ? 'selected' : ''}>오전</option>
              <option value="PM" ${startParsed.ampm === 'PM' ? 'selected' : ''}>오후</option>
            </select>
            <select id="sleep-start-hour" style="${selectStyle}">
              ${hourOptions}
            </select>
            <span style="align-self:center;">:</span>
            <select id="sleep-start-minute" style="${selectStyle}">
              ${minuteOptions}
            </select>
          </div>
        </div>

        <!-- 수면 종료 날짜 -->
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:500;">수면 종료 날짜</label>
          <input
            type="date"
            id="sleep-end-date"
            style="${dateInputStyle}"
            value="${defaultEndDate}"
          />
        </div>

        <!-- 수면 종료 시간 -->
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:500;">수면 종료 시간</label>
          <div style="display:flex; gap:8px;">
            <select id="sleep-end-ampm" style="${selectStyle}">
              <option value="AM" ${endParsed.ampm === 'AM' ? 'selected' : ''}>오전</option>
              <option value="PM" ${endParsed.ampm === 'PM' ? 'selected' : ''}>오후</option>
            </select>
            <select id="sleep-end-hour" style="${selectStyle}">
              ${hourOptions}
            </select>
            <span style="align-self:center;">:</span>
            <select id="sleep-end-minute" style="${selectStyle}">
              ${minuteOptions}
            </select>
          </div>
        </div>

        <div style="font-size:14px; color:#6b7280;">
          현재 저장된 수면 시간: 
          <strong>${hours}h ${minutes}m</strong>
        </div>

        <button id="save-sleep-btn"
          style="align-self:flex-start; padding:10px 20px; background:#2a9df4; color:white;
                 border:none; border-radius:8px; cursor:pointer; margin-top:4px;">
          저장
        </button>
      </div>
    </section>
  `;

  // 저장된 값으로 시간 select 설정
  document.getElementById('sleep-start-hour').value = startParsed.hour;
  document.getElementById('sleep-start-minute').value = startParsed.minute;
  document.getElementById('sleep-end-hour').value = endParsed.hour;
  document.getElementById('sleep-end-minute').value = endParsed.minute;

  // 저장 버튼 핸들러
  document.getElementById('save-sleep-btn').addEventListener('click', async () => {
    // 12시간 형식을 24시간 형식으로 변환
    const convertTo24Hour = (ampm, hour, minute) => {
      let h = parseInt(hour);
      if (ampm === 'AM' && h === 12) h = 0;
      else if (ampm === 'PM' && h !== 12) h += 12;
      return `${String(h).padStart(2, '0')}:${minute}`;
    };

    const startDate = document.getElementById('sleep-start-date').value; // YYYY-MM-DD
    const endDate   = document.getElementById('sleep-end-date').value;

    if (!startDate || !endDate) {
      alert('수면 시작/종료 날짜를 모두 선택해주세요.');
      return;
    }

    const startAmpm   = document.getElementById('sleep-start-ampm').value;
    const startHour   = document.getElementById('sleep-start-hour').value;
    const startMinute = document.getElementById('sleep-start-minute').value;

    const endAmpm   = document.getElementById('sleep-end-ampm').value;
    const endHour   = document.getElementById('sleep-end-hour').value;
    const endMinute = document.getElementById('sleep-end-minute').value;

    const startTime = convertTo24Hour(startAmpm, startHour, startMinute);
    const endTime   = convertTo24Hour(endAmpm, endHour, endMinute);

    // 총 수면시간 계산 (시/분)
    const { hours, minutes } = calcSleepDuration(startTime, endTime);

    try {
      const res = await fetch(`${INFO_URL}/addActualSleep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: localStorage.getItem('username'),
          start_time: `${startDate} ${startTime}:00`,
          end_time:   `${endDate} ${endTime}:00`
        })
      });

      const data = await res.json();
      if (data.message === 'fail') {
        throw new Error('DB Error');
      }

      dataStore.today.sleep.start   = startTime;
      dataStore.today.sleep.end     = endTime;
      dataStore.today.sleep.hours   = hours;
      dataStore.today.sleep.minutes = minutes;

      pushTodayToHistory();
      saveTodayData();
      updateDashboard();

      alert(`수면 시간이 저장되었습니다. (총 ${hours}시간 ${minutes}분)`);
      loadPage('dashboard');

    } catch (err) {
      console.error('수면 데이터 저장 실패:', err);
      alert('수면 데이터 저장 실패');
    }
  });
}

/* ==========================
   Activity 페이지
   ========================== */

function renderActivityPage() {
  const container = document.getElementById('content-container');
  loadTodayData();
  const { steps } = dataStore.today;

  const todayStr = formatDate(new Date());   // ✅ 오늘 날짜

  container.innerHTML = `
    <section class="card">
      <div class="card-title">Activity Data</div>
      <div style="padding:20px;">

      <!-- ✅ 기록 날짜 입력 -->
        <div style="margin-bottom:12px;">
          <label style="display:block; margin-bottom:4px;">기록 날짜</label>
          <input type="date"
                 id="activity-date"
                 value="${todayStr}"
                 style="padding:8px; border-radius:8px; border:1px solid #d1d5db;" />
        </div>

        <label>걸음 수:</label>
        <input type="number" id="activity-steps" value="${steps}" min="0" style="width:200px;padding:8px;margin:10px 0;" />
        
        <button id="save-activity-btn" style="padding:10px 20px;background:#ff7a59;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">저장</button>
      </div>
    </section>
  `;

  document.getElementById('save-activity-btn').addEventListener('click', async () => {
    const steps = parseInt(document.getElementById('activity-steps').value) || 0;

    try {
      const res = await fetch(`${INFO_URL}/addSteps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: localStorage.getItem('username'),
          steps: steps
        })
      });
      const data = await res.json();
      if (data.message === 'fail') {
        throw new Error('DB Error');
      }

      dataStore.today.steps = steps;

      pushTodayToHistory();
      saveTodayData();
      updateDashboard();

      alert('Activity 데이터가 저장되었습니다.');
      loadPage('dashboard');

    } catch (err) {
      console.error('Activity 데이터 저장 실패:', err);
      alert('Activity 데이터 저장 실패');
    }
  });
}

/* ==========================
   Nutrition 페이지
   ========================== */

function renderNutritionPage() {
  const container = document.getElementById('content-container');
  loadTodayData();
  const { foodLogs = [], kcal } = dataStore.today;

  const todayStr = formatDate(new Date());   // ✅ 오늘 날짜

  const optionsHtml = FOOD_NAMES
    .map(name => `<option value="${name}">${name}</option>`)
    .join("");

  const logsHtml = foodLogs.length === 0
    ? `<p class="subtext" style="margin-top:8px;">아직 등록된 음식 기록이 없습니다.</p>`
    : `
      <ul style="margin-top:8px; font-size:13px; color:#4b5563; padding-left:18px;">
        ${foodLogs.map(log => `<li>${log.food} ${log.weight}g</li>`).join("")}
      </ul>
    `;

  container.innerHTML = `
    <section class="card">
      <div class="card-title">Nutrition Data</div>
      <div style="padding:20px; display:flex; flex-direction:column; gap:14px; max-width:420px;">
        
      <!-- ✅ 기록 날짜 입력 -->
        <div>
          <label style="font-size:14px;">기록 날짜</label>
          <input type="date"
                 id="nutrition-date"
                 value="${todayStr}"
                 style="width:100%; padding:8px 10px; border-radius:8px;
                        border:1px solid #d1d5db; margin-top:4px;" />
        </div>
        
        <div>
          <label style="font-size:14px;">오늘까지 섭취한 총 칼로리</label>
          <div id="nutrition-total"
               style="margin-top:4px; font-size:18px; font-weight:600;">
            ${kcal || 0} kcal
          </div>
          <p class="subtext" style="margin-top:4px;">
            총 칼로리 값은 백엔드에서 계산된 값을 가져와 today.kcal에 반영하면 됩니다.
          </p>
        </div>

        <div>
          <label for="food-select" style="font-size:14px;">음식 선택</label>
          <select id="food-select"
                  style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; margin-top:4px;">
            <option value="" disabled selected>음식을 선택하세요</option>
            ${optionsHtml}
          </select>
        </div>

        <div>
          <label for="food-gram" style="font-size:14px;">섭취량 (g)</label>
          <input type="number"
                 id="food-gram"
                 min="1"
                 step="1"
                 placeholder="예: 150"
                 style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; margin-top:4px;" />
          <p class="subtext" style="margin-top:4px;">
            음식 이름과 그램(g)만 보내면, 칼로리 계산은 백엔드에서 처리합니다.
          </p>
        </div>

        <button id="save-nutrition-btn"
                style="align-self:flex-start; padding:10px 20px; background:#0ea5e9; color:white; border:none; border-radius:8px; cursor:pointer; margin-top:4px;">
          추가하기
        </button>

        <div style="margin-top:10px;">
          <label style="font-size:14px;">오늘 기록된 음식</label>
          ${logsHtml}
        </div>
      </div>
    </section>
  `;

  const selectEl = document.getElementById('food-select');
  const gramEl = document.getElementById('food-gram');

  document.getElementById('save-nutrition-btn').addEventListener('click', async () => {
    const foodName = selectEl.value;
    const weight = Number(gramEl.value);

    if (!foodName || !weight) {
      alert('음식과 섭취량(g)을 모두 입력해주세요.');
      return;
    }

    // 프론트 기록
    dataStore.today.foodLogs = [
      ...(dataStore.today.foodLogs || []),
      { food: foodName, weight }
    ];
    saveTodayData();

    try {
      const userId = localStorage.getItem('username') || localStorage.getItem('user_id');

      const res = await fetch(`${INFO_URL}/addFoodLog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          food_name: foodName,
          food_weight: weight
        })
      });
      const data = await res.json();
      if (data.message === 'fail') {
        throw new Error('DB Error');
      }

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const foodLogRes = await fetch(`${INFO_URL}/getFoodLog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          start_time: formatDateTime(startDate),
          end_time: formatDateTime(endDate)
        })
      });

      const foodLogData = await foodLogRes.json();

      let totCalories = 0;
      for (const cal of foodLogData) {
        totCalories += cal.food_calories;
      }
      dataStore.today.kcal = totCalories;

      pushTodayToHistory();
      saveTodayData();
      updateDashboard();

      alert(`${foodName} ${weight}g 기록이 추가되었습니다.`);
    } catch (err) {
      console.warn('Food_log 저장 실패', err);
    }

    renderNutritionPage();
  });
}

/* ==========================
   Body Info 페이지
   ========================== */

function renderBodyInfoPage() {
  const container = document.getElementById('content-container');
  loadTodayData();
  const { bpm } = dataStore.today;

   const todayStr = formatDate(new Date());   // ✅ 오늘 날짜

  container.innerHTML = `
    <section class="card">
      <div class="card-title">Body Info Data</div>
      <div style="padding:20px;">

      <!-- ✅ 기록 날짜 입력 -->
        <div style="margin-bottom:12px;">
          <label style="display:block; margin-bottom:4px;">기록 날짜</label>
          <input type="date"
                 id="body-date"
                 value="${todayStr}"
                 style="padding:8px; border-radius:8px; border:1px solid #d1d5db;" />
        </div>

        <label>평균 심박수 (bpm):</label>
        <input type="number" id="body-bpm" value="${bpm}" min="0" style="width:200px;padding:8px;margin:10px 0;" />
        
        <button id="save-body-btn" style="padding:10px 20px;background:#7c3aed;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">저장</button>
      </div>
    </section>
  `;

  document.getElementById('save-body-btn').addEventListener('click', async () => {
    const bpm = parseInt(document.getElementById('body-bpm').value) || 0;

    try {
      const res = await fetch(`${INFO_URL}/addHeartRate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: localStorage.getItem('username'),
          heart_rate: bpm
        })
      });

      const data = await res.json();
      if (data.message === 'fail') {
        throw new Error('DB Error');
      }

      dataStore.today.bpm = bpm;

      pushTodayToHistory();
      saveTodayData();
      updateDashboard();

      alert('Body Info 데이터가 저장되었습니다.');
      loadPage('dashboard');

    } catch (err) {
      console.warn('Heart_rate 저장 실패:', err);
      alert('Heart_rate 저장 실패');
    }
  });
}

/* ==========================
   Settings 페이지
   ========================== */

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

  document.getElementById('clear-data-btn').addEventListener('click', async () => {
    if (confirm('모든 데이터를 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`${INFO_URL}/deleteAllData`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: localStorage.getItem('username'),
          })
        });

        const data = await res.json();
        if (data.message === 'fail') {
          throw new Error('DB Error');
        }

        localStorage.removeItem('todayData');
        dataStore.today = { sleep: { hours: 0, minutes: 0 }, steps: 0, kcal: 0, bpm: 0 };
        alert('데이터가 삭제되었습니다.');
        updateDashboard();
        loadPage('dashboard');

      } catch (err) {
        console.error('데이터 삭제 실패:', err);
        alert('데이터 삭제에 실패했습니다.');
      }
    }
  });
}

/* ==========================
   DOMContentLoaded 초기화
   ========================== */

document.addEventListener('DOMContentLoaded', async () => {
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

  await loadTodayData();
  updateDashboard();
});