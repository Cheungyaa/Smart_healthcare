import { INFO_URL } from '../config.js';
import { formatDateTime } from './utils.js';

// 데이터 저장/로드 (localStorage 사용)
export const dataStore = {
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

// 데이터 로드 / 저장
// 오늘 데이터 로드 (백엔드 우선)
export async function loadData() {
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
export function saveData() {
    localStorage.setItem('todayData', JSON.stringify({ today: dataStore.today }));
    localStorage.setItem('todayHistory', JSON.stringify(dataStore.history));
}

// key별 오늘값 매핑 (sleep은 숫자값이 필요할 때만 사용)
export function getHistoryValueForToday(key) {
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
