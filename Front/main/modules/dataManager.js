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
export async function loadData(key) {
    const userId = localStorage.getItem('username');

    if (userId) {
        await loadTodayDataFromBackend(userId, key);
        await loadLast7DaysFromBackend(userId, key);
    } else {
        initializeEmptyHistory();
    }

    // 목표 값 불러오기
    if (key === 'goals' || key === 'all')
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
async function loadTodayDataFromBackend(userId, key) {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const start = formatDateTime(todayStart);
        const end = formatDateTime(todayEnd);

        if (key === 'all' || key === 'weight') {
            const weight = await fetch(`${INFO_URL}/getWeight`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
            }).then(res => res.json()).catch(() => []);

            //몸무게, bmi
            if (weight && weight.length > 0) {
                dataStore.today.weight = weight[0].weight;
                dataStore.today.bmi = weight[0].bmi;
            }
        }

        if (key === 'all' || key === 'sleep') {
            const sleep = await fetch(`${INFO_URL}/getActualSleep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
            }).then(res => res.json()).catch(() => []);

            // 수면 시간 (HH:MM:SS)
            if (sleep && sleep.length > 0) {
                const timeStr = sleep[0].actual_sleep_time || '00:00:00';
                const [hours, minutes] = timeStr.split(':').map(Number);
                dataStore.today.sleep.hours = hours || 0;
                dataStore.today.sleep.minutes = minutes || 0;
            }
        }

        if (key === 'all' || key === 'steps') {
            const steps = await fetch(`${INFO_URL}/getSteps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
            }).then(res => res.json()).catch(() => []);

            // 걸음 수
            if (steps && steps.length > 0) {
                dataStore.today.steps = steps[0].steps;
            }
        }

        if (key === 'all' || key === 'heartRate') {
            const heartRate = await fetch(`${INFO_URL}/getHeartRate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
            }).then(res => res.json()).catch(() => []);

            // 심박수
            if (heartRate && heartRate.length > 0) {
                dataStore.today.bpm = heartRate[0].heart_rate;
            }
        }

        if (key === 'all' || key === 'food') {
            const foodLog = await fetch(`${INFO_URL}/getFoodLog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
            }).then(res => res.json()).catch(() => []);

            // 식사 로그
            if (foodLog && foodLog.length > 0) {
                dataStore.today.foodLogs = foodLog.map(item => ({
                    food: item.food_name,
                    weight: item.food_weight,
                    kcal: item.food_calories
                }));
            }
        }

        saveData();
        console.log('DB|today data load complete', dataStore.today);
    } catch (err) {
        console.error('DB|today data load failed:', err);
    }
}

// 백엔드에서 최근 7일 데이터 가져오기
async function loadLast7DaysFromBackend(userId, key) {
    try {
        const start_date = new Date();
        start_date.setDate(start_date.getDate() - 6);
        start_date.setHours(0, 0, 0, 0);
        const start = formatDateTime(start_date);

        const end_date = new Date();
        end_date.setDate(end_date.getDate());
        end_date.setHours(23, 59, 59, 999);
        const end = formatDateTime(end_date);

        const date = [];
        const now = new Date();
        now.setUTCHours(0, 0, 1, 0);
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setUTCDate(now.getUTCDate() - i);
            date.push(d.toUTCString().split(' ').splice(0, 4).join(' '));
        }
        console.log('DB|date', date);

        // labels
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString());
        }
        dataStore.history.labels = labels;


        //몸무게, bmi
        if (key === 'all' || key === 'weight') {
            const weightData = [];
            const bmiData = [];
            let latest_weight = 0; let latest_bmi = 0;

            const weight = await fetch(`${INFO_URL}/getWeight`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
            }).then(res => res.json()).catch(() => []);
            console.log('DB|weight', weight);

            if (weight.length != 0) {
                let j = 0;
                for (let i = 0; i <= 6; i++) {
                    if (weight[j].time.includes(date[i])) {
                        weightData.push(weight[j].weight);
                        bmiData.push(weight[j].bmi);
                        latest_weight = weight[j].weight;
                        latest_bmi = weight[j].bmi;
                        if (weight.length > j + 1) { j++; }
                    }
                    else {
                        weightData.push(latest_weight);
                        bmiData.push(latest_bmi);
                    }
                }
            }
            dataStore.history.weight = weightData;
        }

        // 수면 시간 -> {hours, minutes}
        if (key === 'all' || key === 'sleep') {
            const sleepData = [];

            const sleep = await fetch(`${INFO_URL}/getActualSleep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
            }).then(res => res.json()).catch(() => []);
            console.log('DB|sleep', sleep);

            if (sleep.length != 0) {
                let j = 0;
                for (let i = 0; i <= 6; i++) {
                    if (sleep[j] && sleep[j].actual_end_sleep_time.includes(date[i])) {
                        const timeStr = sleep[j].actual_sleep_time || '00:00:00';
                        const [hours, minutes] = timeStr.split(':').map(Number);
                        sleepData.push({ hours: hours || 0, minutes: minutes || 0 });
                        if (sleep.length > j + 1) { j++; }
                    }
                    else {
                        sleepData.push({ hours: 0, minutes: 0 });
                    }
                }
            } else {
                for (let i = 0; i <= 6; i++) {
                    sleepData.push({ hours: 0, minutes: 0 });
                }
            }
            dataStore.history.sleep = sleepData;
        }

        // 걸음 수
        if (key === 'all' || key === 'steps') {
            const stepsData = [];

            const steps = await fetch(`${INFO_URL}/getSteps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
            }).then(res => res.json()).catch(() => []);

            if (steps.length != 0) {
                let j = 0;
                for (let i = 0; i <= 6; i++) {
                    if (steps[j] && steps[j].time.includes(date[i])) {
                        stepsData.push(steps[j].steps);
                        if (steps.length > j + 1) { j++; }
                    }
                    else {
                        stepsData.push(0);
                    }
                }
            } else {
                for (let i = 0; i <= 6; i++) {
                    stepsData.push(0);
                }
            }
            dataStore.history.steps = stepsData;
        }

        // 칼로리
        if (key === 'all' || key === 'food') {
            const kcalData = [];

            const foodLog = await fetch(`${INFO_URL}/getFoodLog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
            }).then(res => res.json()).catch(() => []);

            if (foodLog.length != 0) {
                let j = 0;
                for (let i = 0; i <= 6; i++) {
                    if (foodLog[j] && foodLog[j].time.includes(date[i])) {
                        const totalKcal = foodLog[j].food_calories || 0;
                        kcalData.push(totalKcal);
                        if (foodLog.length > j + 1) { j++; }
                    }
                    else {
                        kcalData.push(0);
                    }
                }
            } else {
                for (let i = 0; i <= 6; i++) {
                    kcalData.push(0);
                }
            }
            dataStore.history.kcal = kcalData;
        }

        // 심박수
        if (key === 'all' || key === 'bpm') {
            const bpmData = [];

            const heartRate = await fetch(`${INFO_URL}/getHeartRate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, start_time: start, end_time: end })
            }).then(res => res.json()).catch(() => []);

            if (heartRate.length != 0) {
                let j = 0;
                for (let i = 0; i <= 6; i++) {
                    if (heartRate[j] && heartRate[j].time.includes(date[i])) {
                        bpmData.push(heartRate[j].heart_rate);
                        if (heartRate.length > j + 1) { j++; }
                    }
                    else {
                        bpmData.push(0);
                    }
                }
            } else {
                for (let i = 0; i <= 6; i++) {
                    bpmData.push(0);
                }
            }
            dataStore.history.bpm = bpmData;
        }

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
