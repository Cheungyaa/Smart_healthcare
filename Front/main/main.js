import { INFO_URL } from './config.js';

console.log("✅ Life Log Dashboard loaded.");

/* ==== 수정사항 ====
Back:
  - DB 조회 로직 개선: 날짜 범위 중복 조회 문제 해결 (time <= end_time)
  - 데이터 저장 로직 고도화: 
    - 몸무게 저장 시 해당 날짜/시간 데이터 존재 여부 확인 후 INSERT/UPDATE 분기 처리
    - TargetDB 커서 관리 로직 수정 (Cursor not open 에러 해결)
  - Oracle 호환성 강화: INTERVAL 타입 처리를 위한 timedelta 파싱 로직 수정

Front:
  main.js:
    - 데이터 관리 구조 전면 개편 (Single Source of Truth):
      - 로컬 스토리지 의존성 제거 및 백엔드 중심 데이터 흐름 구축
      - loadData()를 통해 페이지 로드 시 서버에서 최신 데이터 동기화
    - UI/UX 개선:
      - 저장 버튼 클릭 시 즉각적인 UI 업데이트 (Optimistic UI) 적용으로 반응 속도 향상
    - 목표(Goal) 설정 기능 강화:
      - 로컬 저장소 대신 백엔드 API 연동하여 목표값 영구 저장
      - Oracle INTERVAL 포맷에 맞춘 데이터 전송 로직 구현
    - 차트 및 시각화:
      - 몸무게 추이 차트 날짜 계산 로직 수정 (Invalid Date 에러 해결)

to-do: 
  - ai 추천 기능 구현 (?)
  - 스마트 워치 연동 (?)
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
    weight: 0,        // 오늘 몸무게
    foodLogs: []      // 음식: { food, weight, kcal }
  },

  history: {
    labels: [],       // 날짜 라벨 (최근 7일)
    sleep: [],        // [{hours, minutes}, ...]
    steps: [],
    kcal: [],
    bpm: [],
    bmi: [],
    weight: []        // 추후 BMI/체중 값
  },

  // 목표값 (localStorage에 저장됨)
  goals: {
    sleep: { hours: 7, minutes: 0 },      // 수면 목표
    steps: 0,                          // 걸음 수 목표
    kcal: 0,                            // 칼로리 목표
    weight: 0                             // 몸무게 목표
  }
};

// 로그인 체크 함수
function isLoggedIn() {
  return !!localStorage.getItem('isLoggedIn');
}


// 데이터 로드 / 저장
// 오늘 데이터 로드 (백엔드 우선)
async function loadData() {
  const userId = localStorage.getItem('username');

  if (userId) {
    await loadTodayDataFromBackend(userId);
    await loadLast7DaysFromBackend(userId);
  } else {
    initializeEmptyHistory();
  }

  // 목표 값 불러오기
  try {
    const res = await fetch(INFO_URL + '/getTarget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    const data = await res.json();

    const target_sleep = data.sleep || "00:00:00";
    const [th, tm] = target_sleep.split(':').map(Number);
    dataStore.goals.sleep.hours = th || 0;
    dataStore.goals.sleep.minutes = tm || 0;

    dataStore.goals.steps = data.steps || 0;

    dataStore.goals.weight = data.weight || 0;

    dataStore.goals.kcal = data.food || 0;
  } catch (err) {
    console.error('목표값 로드 실패:', err);
    dataStore.goals.sleep.hours = 0;
    dataStore.goals.sleep.minutes = 0;
    dataStore.goals.steps = 0;
    dataStore.goals.weight = 0;
    dataStore.goals.kcal = 0;
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

    const [weight, sleep, steps, heartRate, foodLog] = await Promise.all([
      fetch(`${INFO_URL}/getWeight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
      }).then(res => res.json()).catch(() => []),

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

    //몸무게, bmi
    if (weight && weight.length > 0) {
      dataStore.today.weight = weight[0].weight;
      dataStore.today.bmi = weight[0].bmi;
    }
    // 수면 시간 (HH:MM:SS)
    if (sleep && sleep.length > 0) {
      const timeStr = sleep[0].actual_sleep_time || '00:00:00';
      const [hours, minutes] = timeStr.split(':').map(Number);
      dataStore.today.sleep.hours = hours || 0;
      dataStore.today.sleep.minutes = minutes || 0;
    }
    // 걸음 수
    if (steps && steps.length > 0) {
      dataStore.today.steps = steps[0].steps;
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
      dataStore.today.bpm = heartRate[0].heart_rate;
    }

    saveData();
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
    const bmiData = [];
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

      const [weight, sleep, steps, heartRate, foodLog] = await Promise.all([
        fetch(`${INFO_URL}/getWeight`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
        }).then(res => res.json()).catch(() => []),

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

      //몸무게, bmi
      if (weight && weight.length > 0) {
        const weightValue = weight[0].weight;
        const bmiValue = weight[0].bmi;
        weightData.push(weightValue);
        bmiData.push(bmiValue);
      } else {
        weightData.push(0);
        bmiData.push(0);
      }
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
        const stepsValue = steps[0].steps;
        stepsData.push(stepsValue);
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
      // 심박수
      if (heartRate && heartRate.length > 0) {
        const bpmValue = heartRate[0].heart_rate;
        bpmData.push(bpmValue);
      } else {
        bpmData.push(0);
      }
    }

    dataStore.history.labels = labels;
    dataStore.history.sleep = sleepData;
    dataStore.history.steps = stepsData;
    dataStore.history.kcal = kcalData;
    dataStore.history.bpm = bpmData;
    dataStore.history.weight = weightData;

    saveData();
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
function saveData() {
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
    case 'weight': return Number(dataStore.today.weight || 0);
    case 'bmi': return Number(dataStore.today.bmi || 0);
    default: return 0;
  }
}

// 날짜/시간 유틸
// YYYY-MM-DD HH:MM:SS 형식
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
// YYYY-MM-DD 형식
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
// interval 시간 계산
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

// 차트
let sleepChart = null;
let weightChart = null;
function drawCharts() {
  const ctx = document.getElementById("sleepChart");
  if (!ctx) return;
  if (sleepChart) sleepChart.destroy();

  const labels = dataStore.history.labels;
  const sleepData = dataStore.history.sleep.map(d => d.hours * 60 + d.minutes);
  const targetMinutes = dataStore.goals.sleep.hours * 60 + dataStore.goals.sleep.minutes;
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
        label: '체중',
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
        y: { title: { display: true, text: 'BMI' } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// DashBoard
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

  setText('goal-sleep-display', `목표 ${dataStore.goals.sleep.hours}h ${dataStore.goals.sleep.minutes}m`);
  setText('goal-steps-display', `목표 ${Number(dataStore.goals.steps).toLocaleString()}`);
  setText('goal-kcal-display', `목표 ${dataStore.goals.kcal} kcal`);


  const elCalBar = document.getElementById('calorie-bar-fill');
  if (elCalBar) {
    const percent = Math.min(Math.round((dataStore.today.kcal / dataStore.goals.kcal) * 100), 100);
    elCalBar.style.width = percent + '%';
  }


  drawCharts();

  // 오늘의 인사이트
  const insightEl = document.getElementById('insight-text');
  if (insightEl) {
    const insights = [];
    const sleepTotal = (Number(dataStore.today.sleep.hours) || 0) +
      ((Number(dataStore.today.sleep.minutes) || 0) / 60);
    const goalSleepTotal = dataStore.goals.sleep.hours + (dataStore.goals.sleep.minutes / 60);

    if (sleepTotal < goalSleepTotal - 1) insights.push('수면 시간이 목표보다 부족합니다. 취침 시간을 앞당기는 것을 권장합니다.');
    else if (sleepTotal < goalSleepTotal) insights.push('수면 시간이 약간 부족합니다. 수면 시간을 조금 늘려보세요.');
    else insights.push('수면 시간이 양호합니다. 충분한 수면을 유지하세요.');

    const steps = Number(dataStore.today.steps) || 0;
    if (steps < dataStore.goals.steps * 0.5) insights.push('오늘 걸음 수가 목표의 절반 이하입니다. 더 활동적으로 움직여 보세요.');
    else if (steps < dataStore.goals.steps) insights.push(`활동량이 보통입니다. 목표까지 약 ${(dataStore.goals.steps - steps).toLocaleString()}걸음 남았습니다.`);
    else insights.push('목표 걸음 수 달성했습니다. 계속 유지하세요.');

    const kcal = Number(dataStore.today.kcal) || 0;
    if (kcal > dataStore.goals.kcal * 1.2) insights.push('칼로리 섭취가 목표를 초과했습니다. 섭취량을 조절하세요.');
    else if (kcal > dataStore.goals.kcal) insights.push('칼로리 섭취가 목표에 근접합니다. 균형 있게 유지하세요.');
    else insights.push('칼로리 섭취가 적절합니다.');

    const bpm = Number(dataStore.today.bpm) || 0;
    if (bpm && (bpm < 50 || bpm > 100)) insights.push('심박수 범위가 평소와 다릅니다. 필요 시 전문가와 상담하세요.');
    else if (bpm) insights.push('심박수는 정상 범위 내에 있습니다.');

    insightEl.innerHTML = insights.map(s => `· ${s}`).join('<br>');
  }
}

// 페이지 전환
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
  if (page === 'weight') { renderWeightPage(); return; }
  if (page === 'goal') { renderGoalPage(); return; }
  if (page === 'settings') { renderSettingsPage(); return; }
}

// Sleep 페이지
function renderSleepPage() {
  const container = document.getElementById('content-container');
  loadData();
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
  const defaultEndDate = formatDate(today);     // YYYY-MM-DD

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

        <!-- 수면 시작 -->
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:500;">수면 시작</label>
          <div style="display:flex; gap:8px;">
            <input type="date" id="sleep-start-date" style="${dateInputStyle}" value="${defaultStartDate}"/>
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

        <!-- 수면 종료 -->
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:500;">수면 종료</label>
          <div style="display:flex; gap:8px;">
            <input type="date" id="sleep-end-date" style="${dateInputStyle}" value="${defaultEndDate}" />
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
    const endDate = document.getElementById('sleep-end-date').value;

    if (!startDate || !endDate) {
      alert('수면 시작/종료 날짜를 모두 선택해주세요.');
      return;
    }

    const startAmpm = document.getElementById('sleep-start-ampm').value;
    const startHour = document.getElementById('sleep-start-hour').value;
    const startMinute = document.getElementById('sleep-start-minute').value;

    const endAmpm = document.getElementById('sleep-end-ampm').value;
    const endHour = document.getElementById('sleep-end-hour').value;
    const endMinute = document.getElementById('sleep-end-minute').value;

    const startTime = convertTo24Hour(startAmpm, startHour, startMinute);
    const endTime = convertTo24Hour(endAmpm, endHour, endMinute);

    // 총 수면시간 계산 (시/분)
    const { hours, minutes } = calcSleepDuration(startTime, endTime);

    try {
      const res = await fetch(`${INFO_URL}/addActualSleep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: localStorage.getItem('username'),
          start_time: `${startDate} ${startTime}:00`,
          end_time: `${endDate} ${endTime}:00`
        })
      });

      const data = await res.json();
      if (data.message === 'fail') {
        throw new Error('DB Error');
      }

      dataStore.today.sleep = { start: startTime, end: endTime, hours, minutes };
      updateDashboard();

      alert(`수면 시간이 저장되었습니다. (총 ${hours}시간 ${minutes}분)`);
      loadPage('dashboard');

    } catch (err) {
      console.error('수면 데이터 저장 실패:', err);
      alert('수면 데이터 저장 실패');
    }
  });
}

// Activity 페이지
function renderActivityPage() {
  const container = document.getElementById('content-container');
  loadData();
  const { steps } = dataStore.today;

  const date = formatDate(new Date());

  container.innerHTML = `
    <section class="card">
      <div class="card-title">Activity Data</div>
      <div style="padding:20px;">

      <!-- 기록 날짜 입력 -->
        <div style="margin-bottom:12px;">
          <label style="display:block; margin-bottom:4px;">기록 날짜</label>
          <input type="date"
                 id="activity-date"
                 value="${date}"
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
    const date = document.getElementById('activity-date').value;

    try {
      const res = await fetch(`${INFO_URL}/addSteps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: localStorage.getItem('username'),
          steps: steps,
          time: `${date} 00:00:01`
        })
      });
      const data = await res.json();
      if (data.message === 'fail') {
        alert('걸음 수 저장에 실패했습니다.');
        return;
      }

      dataStore.today.steps = steps;
      updateDashboard();

      alert('걸음 수가 저장되었습니다!');
      loadPage('dashboard');

    } catch (err) {
      console.error('Activity 데이터 저장 실패:', err);
      alert('Activity 데이터 저장 실패');
    }
  });
}

// Nutrition 페이지
function renderNutritionPage() {
  const container = document.getElementById('content-container');
  loadData();
  const { foodLogs = [], kcal } = dataStore.today;

  const date = formatDate(new Date());

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
        
      <!-- 기록 날짜 입력 -->
        <div>
          <label style="font-size:14px;">기록 날짜</label>
          <input type="date"
                 id="nutrition-date"
                 value="${date}"
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
    const weight = Number(gramEl.value) || 0;
    const date = document.getElementById('nutrition-date').value;

    if (!foodName || !weight) {
      alert('음식과 섭취량(g)을 모두 입력해주세요.');
      return;
    }

    try {
      const userId = localStorage.getItem('username') || localStorage.getItem('user_id');

      const res = await fetch(`${INFO_URL}/addFoodLog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          food_name: foodName,
          food_weight: weight,
          time: `${date} 00:00:01`
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
      dataStore.today.foodLogs = foodLogData.map(item => ({
        food: item.food_name,
        weight: item.food_weight,
        kcal: item.food_calories
      }));
      updateDashboard();

      alert(`${foodName} ${weight}g 기록이 추가되었습니다.`);
      renderNutritionPage();
    } catch (err) {
      console.warn('Food_log 저장 실패', err);
      alert('Food_log 저장에 실패했습니다.');
    }
  });
}

// Body Info 페이지
function renderBodyInfoPage() {
  const container = document.getElementById('content-container');
  loadData();
  const { bpm } = dataStore.today;

  const date = formatDate(new Date());

  container.innerHTML = `
    <section class="card">
      <div class="card-title">Body Info Data</div>
      <div style="padding:20px;">

      <!-- 기록 날짜 입력 -->
        <div style="margin-bottom:12px;">
          <label style="display:block; margin-bottom:4px;">기록 날짜</label>
          <input type="date"
                 id="body-date"
                 value="${date}"
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
    const date = document.getElementById('body-date').value;

    try {
      const res = await fetch(`${INFO_URL}/addHeartRate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: localStorage.getItem('username'),
          heart_rate: bpm,
          time: `${date} 00:00:01`
        })
      });

      const data = await res.json();
      if (data.message === 'fail') {
        alert('심박수 저장에 실패했습니다.');
        return;
      }

      dataStore.today.bpm = bpm;
      updateDashboard();

      alert('심박수가 저장되었습니다!');
      loadPage('dashboard');

    } catch (err) {
      console.warn('Heart_rate 저장 실패:', err);
      alert('Heart_rate 저장 실패');
    }
  });
}

// Weight 페이지
function renderWeightPage() {
  const container = document.getElementById('content-container');
  loadData();

  const date = formatDate(new Date());
  const todayWeight = dataStore.today.weight;
  const weightLogs = dataStore.history.weight;
  const label = dataStore.history.labels;


  let htmlContent = `
    <section class="card">
      <div class="card-title">몸무게 관리</div>
      <div style="padding:20px; display:flex; flex-direction:column; gap:16px;">
        
        <!-- 몸무게 입력 -->
        <div>
          <div style="display:flex; gap:12px; align-items:flex-end;">
            <div>
              <label style="display:block; margin-bottom:8px; font-weight:500;">날짜</label>
              <input type="date" id="weight-date" value="${date}" 
                     style="padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; font-size:14px;" />
            </div>
            <div>
              <label style="display:block; margin-bottom:8px; font-weight:500;">몸무게 (kg)</label>
              <input type="number" id="weight-input" placeholder="70.5" step="0.1" min="0" 
                     value="${todayWeight ? todayWeight : ''}"
                     style="padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; font-size:14px; width:100px;" />
            </div>
            <button id="add-weight-btn" style="padding:10px 20px; background:#38bdf8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600;">
              추가
            </button>
          </div>
        </div>

        <!-- 최근 기록 -->
        <div>
          <h3 style="margin:0 0 12px 0; font-size:16px; font-weight:600;">최근 일주일 기록</h3>
          <div id="weight-list" style="display:flex; flex-direction:column; gap:8px; max-height:300px; overflow-y:auto;">
  `;
  if (weightLogs.length === 0) {
    htmlContent += '<p style="color:#9ca3af; font-size:14px;">등록된 몸무게 기록이 없습니다.</p>';
  } else {
    for (let i = 6; i >= 0; i--) {
      const w = weightLogs[i];
      if (w === 0) continue;
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() - (6 - i));
      const dateStr = dateObj.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
      htmlContent += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#f3f4f6; border-radius:8px;">
          <div style="font-weight:500;">${dateStr}</div>
          <div style="font-size:18px; font-weight:600; color:#38bdf8;">${w} kg</div>
        </div>
      `;
    }
  }
  htmlContent += `
            </div>
        </div>
      </div>
    </section>
  `;

  container.innerHTML = htmlContent;

  // 추가 버튼 이벤트
  document.getElementById('add-weight-btn').addEventListener('click', async () => {
    const date = document.getElementById('weight-date').value;
    const weight = parseFloat(document.getElementById('weight-input').value);

    if (!date || isNaN(weight) || weight <= 0) {
      alert('올바른 날짜와 몸무게를 입력해주세요.');
      return;
    }

    try {
      const res = await fetch(`${INFO_URL}/addWeight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: localStorage.getItem('username'),
          weight: weight,
          time: `${date} 00:00:01`
        })
      });
      const data = await res.json();
      if (data.message === 'fail') {
        throw new Error('DB Error');
      }

      dataStore.today.weight = weight;
      updateDashboard();

      alert('몸무게가 저장되었습니다!');
      renderWeightPage();
    } catch (err) {
      console.error('몸무게 저장에 실패했습니다:', err);
      alert('몸무게 저장에 실패했습니다.');
    }
  });
}

// Goal 페이지
function renderGoalPage() {
  const container = document.getElementById('content-container');
  loadData();
  const goals = dataStore.goals;

  container.innerHTML = `
    <div class="goal-container">
      <h1 class="page-title">목표 설정</h1>
      
      <div class="goal-cards">
        <!-- 수면 목표 -->
        <div class="goal-card">
          <div class="goal-header">
            <h2 class="goal-title">
              <span class="goal-icon">😴</span>
              수면 시간
            </h2>
          </div>
          <div class="goal-content">
            <div class="goal-input-group">
              <label for="sleep-hours">시간</label>
              <input type="number" id="sleep-hours" min="0" max="12" value="${goals.sleep.hours}" class="goal-input-number">
              <span class="goal-unit">시간</span>
            </div>
            <div class="goal-input-group">
              <label for="sleep-minutes">분</label>
              <input type="number" id="sleep-minutes" min="0" max="59" value="${goals.sleep.minutes}" class="goal-input-number">
              <span class="goal-unit">분</span>
            </div>
            <p class="goal-description">권장: 7시간</p>
          </div>
          <button class="goal-save-btn" data-goal="sleep">저장</button>
        </div>

        <!-- 걸음 수 목표 -->
        <div class="goal-card">
          <div class="goal-header">
            <h2 class="goal-title">
              <span class="goal-icon">👟</span>
              걸음 수
            </h2>
          </div>
          <div class="goal-content">
            <div class="goal-input-group">
              <input type="number" id="steps-target" min="0" value="${goals.steps}" class="goal-input-number">
              <span class="goal-unit">걸음</span>
            </div>
            <p class="goal-description">권장: 10,000걸음</p>
          </div>
          <button class="goal-save-btn" data-goal="steps">저장</button>
        </div>

        <!-- 칼로리 목표 -->
        <div class="goal-card">
          <div class="goal-header">
            <h2 class="goal-title">
              <span class="goal-icon">🍎</span>
              섭취 칼로리
            </h2>
          </div>
          <div class="goal-content">
            <div class="goal-input-group">
              <input type="number" id="kcal-target" min="0" value="${goals.kcal}" class="goal-input-number">
              <span class="goal-unit">kcal</span>
            </div>
            <p class="goal-description">권장: 2,200 kcal</p>
          </div>
          <button class="goal-save-btn" data-goal="kcal">저장</button>
        </div>

        <!-- 몸무게 목표 -->
        <div class="goal-card">
          <div class="goal-header">
            <h2 class="goal-title">
              <span class="goal-icon">⚖️</span>
              목표 몸무게
            </h2>
          </div>
          <div class="goal-content">
            <div class="goal-input-group">
              <input type="number" id="weight-target" min="0" step="0.1" value="${goals.weight}" class="goal-input-number">
              <span class="goal-unit">kg</span>
            </div>
            <p class="goal-description">현재 건강한 체중 설정</p>
          </div>
          <button class="goal-save-btn" data-goal="weight">저장</button>
        </div>
      </div>

      <div class="goal-info-box">
        <h3>📌 목표 설정 안내</h3>
        <ul>
          <li>설정한 목표는 대시보드에 실시간으로 반영됩니다.</li>
          <li>수면 시간, 걸음 수, 칼로리 목표를 원하는 대로 조정할 수 있습니다.</li>
          <li>목표를 달성하면 대시보드에서 진행률을 확인할 수 있습니다.</li>
        </ul>
      </div>
      <div class="goal-success-message" id="goal-success-message">목표가 저장되었습니다!</div>
    </div>
  `;

  // 저장 버튼 이벤트 핸들러
  document.querySelectorAll('.goal-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const goalType = btn.dataset.goal;

      try {
        if (goalType === 'sleep') {
          const hours = parseInt(document.getElementById('sleep-hours').value) || 0;
          const minutes = parseInt(document.getElementById('sleep-minutes').value) || 0;

          const res = await fetch(`${INFO_URL}/addTargetSleep`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({
              user_id: localStorage.getItem('username'),
              target_sleep_time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
            }),
          });
          const data = await res.json();
          if (data.message === 'fail') {
            throw new Error(goalType + 'DB Error');
          }

        }
        else if (goalType === 'steps') {
          const steps = parseInt(document.getElementById('steps-target').value) || 0;

          const res = await fetch(`${INFO_URL}/addTargetSteps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({
              user_id: localStorage.getItem('username'),
              target_steps: steps,
            }),
          });
          const data = await res.json();
          if (data.message === 'fail') {
            throw new Error(goalType + 'DB Error');
          }
        }
        else if (goalType === 'kcal') {
          const kcal = parseInt(document.getElementById('kcal-target').value) || 0;

          const res = await fetch(`${INFO_URL}/addTargetCalories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({
              user_id: localStorage.getItem('username'),
              target_calories: kcal,
            }),
          });
          const data = await res.json();
          if (data.message === 'fail') {
            throw new Error(goalType + 'DB Error');
          }
        }
        else if (goalType === 'weight') {
          const weight = parseFloat(document.getElementById('weight-target').value) || 0;

          const res = await fetch(`${INFO_URL}/addTargetWeight`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({
              user_id: localStorage.getItem('username'),
              target_weight: weight,
            }),
          });
          const data = await res.json();
          if (data.message === 'fail') {
            throw new Error(goalType + 'DB Error');
          }
        }
      } catch (error) {
        console.error(goalType + '목표 저장 실패 :', error);
        alert(goalType + ' 목표 저장에 실패했습니다.');
        return;
      }

      if (goalType === 'sleep') dataStore.goals.sleep = { hours, minutes };
      else if (goalType === 'steps') dataStore.goals.steps = steps;
      else if (goalType === 'kcal') dataStore.goals.kcal = kcal;
      else if (goalType === 'weight') dataStore.goals.weight = weight;

      updateDashboard();

      alert(goalType + " 목표가 저장되었습니다!");
      renderGoalPage();
    });
  });
}

// Settings 페이지
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

// DOMContentLoaded 초기화
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

  await loadData();
  updateDashboard();
});