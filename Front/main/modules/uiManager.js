import { dataStore } from './dataManager.js';

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
                y: { title: { display: true, text: 'BMI' } }
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
