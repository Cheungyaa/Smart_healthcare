import { dataStore } from './dataManager.js';

const PEER_DATA = [
    { age: 10, gender: 1, sleep: "08:37:00", steps: 10000, weight: 50.0, height: 155.0 },
    { age: 10, gender: 0, sleep: "08:37:00", steps: 10000, weight: 55.0, height: 165.0 },
    { age: 20, gender: 1, sleep: "08:26:00", steps: 9500, weight: 57.0, height: 159.6 },
    { age: 20, gender: 0, sleep: "08:26:00", steps: 11000, weight: 72.0, height: 172.5 },
    { age: 30, gender: 1, sleep: "08:06:00", steps: 9000, weight: 59.0, height: 159.6 },
    { age: 30, gender: 0, sleep: "08:06:00", steps: 10500, weight: 78.0, height: 172.5 },
    { age: 40, gender: 1, sleep: "07:52:00", steps: 8500, weight: 60.0, height: 159.6 },
    { age: 40, gender: 0, sleep: "07:52:00", steps: 10000, weight: 76.0, height: 172.5 },
    { age: 50, gender: 1, sleep: "07:40:00", steps: 8000, weight: 59.0, height: 159.6 },
    { age: 50, gender: 0, sleep: "07:40:00", steps: 9500, weight: 73.0, height: 172.5 },
    { age: 60, gender: 1, sleep: "07:45:00", steps: 7000, weight: 58.0, height: 159.6 },
    { age: 60, gender: 0, sleep: "07:45:00", steps: 8000, weight: 70.0, height: 172.5 },
    { age: 70, gender: 1, sleep: "07:50:00", steps: 6500, weight: 56.0, height: 159.6 },
    { age: 70, gender: 0, sleep: "07:50:00", steps: 7000, weight: 67.0, height: 172.5 },
    { age: 80, gender: 1, sleep: "08:00:00", steps: 6000, weight: 53.0, height: 159.6 },
    { age: 80, gender: 0, sleep: "08:00:00", steps: 6500, weight: 64.0, height: 172.5 }
];

// 차트
let sleepChart = null;
let weightChart = null;

export function drawCharts() {
    const ctx = document.getElementById("sleepChart");
    if (!ctx) return;
    if (sleepChart) sleepChart.destroy();

    const labels = dataStore.history.labels;
    const sleepData = dataStore.history.sleep.map(d => d.hours * 60 + d.minutes);
    const targetMinutes = dataStore.goals.sleep.hours * 60 + dataStore.goals.sleep.minutes;
    const targetData = Array(7).fill(targetMinutes);

    // eslint-disable-next-line no-undef
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

    // eslint-disable-next-line no-undef
    weightChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: dataStore.history.labels,
            datasets: [{
                label: '체중',
                data: dataStore.history.weight,
                borderColor: '#1f7fd1',
                backgroundColor: 'rgba(31,127,209,0.15)',
                tension: 0,
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
                y: { title: { display: true, text: 'Weight' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// DashBoard
export function updateDashboard() {
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('today-sleep', `${dataStore.today.sleep.hours}h ${dataStore.today.sleep.minutes}m`);
    setText('today-steps', Number(dataStore.today.steps).toLocaleString());
    setText('today-kcal', `${dataStore.today.kcal} kcal`);
    setText('calorie-display', `${dataStore.today.kcal} kcal`);
    setText('today-bpm', `${dataStore.today.bpm} bpm`);

    setText('goal-sleep-display', `목표 ${dataStore.goals.sleep.hours}h ${dataStore.goals.sleep.minutes}m`);
    setText('goal-steps-display', `목표 ${Number(dataStore.goals.steps).toLocaleString()}`);
    setText('goal-kcal-display', `목표 ${dataStore.goals.kcal} kcal`);


    const elCalBar = document.getElementById('calorie-bar-fill');
    if (elCalBar) {
        const percent = Math.min(Math.round((dataStore.today.kcal / dataStore.goals.kcal) * 100), 100);
        elCalBar.style.width = percent + '%';
    }


    drawCharts();

    // 1. 또래 평균 비교 로직
    const myAge = dataStore.today.age || 20;
    const myGenderStr = dataStore.today.gender || '남성';
    // 0: Female, 1: Male (Table standard)
    // App: '남성' -> 1, '여성' -> 0
    const myGenderKey = (myGenderStr === '남성') ? 0 : 1;

    // 나이대 계산 (10, 20, 30...)
    const ageGroup = Math.floor(myAge / 10) * 10;

    // 해당 그룹 찾기
    const peer = PEER_DATA.find(p => p.age === ageGroup && p.gender === myGenderKey);

    if (peer) {
        // Tag 업데이트
        const tagEl = document.getElementById('peer-comparison-tag');
        if (tagEl) {
            const genderText = (myGenderKey === 0) ? 'Male' : 'Female';
            tagEl.textContent = `Age ${ageGroup}s · ${genderText}`;
        }

        // 수면
        const [ph, pm] = peer.sleep.split(':').map(Number);
        const peerSleepVal = ph + (pm / 60);
        setText('peer-avg-sleep', `${ph}h ${pm}m`); // 또는 소수점: ${peerSleepVal.toFixed(1)}h

        // 내 수면
        const mySleepVal = (Number(dataStore.today.sleep.hours) || 0) + ((Number(dataStore.today.sleep.minutes) || 0) / 60);
        setText('peer-my-sleep', `${dataStore.today.sleep.hours}h ${dataStore.today.sleep.minutes}m`);

        // 걸음
        setText('peer-avg-steps', peer.steps.toLocaleString());
        setText('peer-my-steps', Number(dataStore.today.steps).toLocaleString());

        // BMI
        // peer BMI 계산: weight / (height/100)^2
        const peerBmi = peer.weight / Math.pow(peer.height / 100, 2);
        setText('peer-avg-bmi', peerBmi.toFixed(1));
        setText('peer-my-bmi', (dataStore.today.bmi || 0).toFixed(1));
    }


    // 2. 오늘의 인사이트 (동적 생성)
    const insightEl = document.getElementById('insight-text');
    if (insightEl) {
        const insights = [];

        // 수면 비교
        const mySleepTotal = (Number(dataStore.today.sleep.hours) || 0) + ((Number(dataStore.today.sleep.minutes) || 0) / 60);
        const goalSleepTotal = (Number(dataStore.goals.sleep.hours) || 0) + ((Number(dataStore.goals.sleep.minutes) || 0) / 60);

        if (mySleepTotal < goalSleepTotal - 1) {
            insights.push(`수면이 목표보다 1시간 이상 부족합니다. (${(goalSleepTotal - mySleepTotal).toFixed(1)}시간 부족)`);
        } else if (mySleepTotal < goalSleepTotal) {
            insights.push('수면 목표에 거의 도달했습니다. 조금 더 주무세요.');
        } else {
            insights.push('수면 목표를 달성했습니다! 개운한 하루 되세요.');
        }

        // 걸음 수 비교
        const mySteps = Number(dataStore.today.steps) || 0;
        const goalSteps = Number(dataStore.goals.steps) || 10000;

        if (mySteps < goalSteps * 0.5) {
            insights.push(`활동량이 부족합니다. 목표의 ${(mySteps / goalSteps * 100).toFixed(0)}%만 달성했습니다.`);
        } else if (mySteps < goalSteps) {
            insights.push(`목표까지 ${(goalSteps - mySteps).toLocaleString()}걸음 남았습니다. 힘내세요!`);
        } else {
            insights.push('오늘의 걸음 목표를 달성했습니다. 훌륭합니다!');
        }

        // 칼로리 비교
        const myKcal = Number(dataStore.today.kcal) || 0;
        const goalKcal = Number(dataStore.goals.kcal) || 2000;

        if (myKcal > goalKcal * 1.1) {
            insights.push(`칼로리 섭취가 목표를 초과했습니다. (${(myKcal - goalKcal).toLocaleString()} kcal 초과)`);
        } else if (myKcal > goalKcal * 0.9) {
            insights.push('칼로리 섭취가 목표에 적절하게 맞추어졌습니다.');
        } else {
            insights.push(`칼로리 섭취가 목표보다 적습니다. (${(goalKcal - myKcal).toLocaleString()} kcal 여유)`);
        }

        insightEl.innerHTML = insights.map(s => `· ${s}`).join('<br>');
    }
}
