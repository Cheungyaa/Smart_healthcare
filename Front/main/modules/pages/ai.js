import { INFO_URL } from '../../config.js';
import { get30daysData } from '../dataManager.js';

// AI Coach 페이지 렌더링
export function renderAIPage() {
    const userId = localStorage.getItem('username');

    if (!userId) {
        return `
            <div class="ai-container">
                <div class="ai-empty-state">
                    <div class="ai-empty-state-icon">🔒</div>
                    <div class="ai-empty-state-text">로그인이 필요합니다</div>
                    <div class="ai-empty-state-subtext">AI 건강 코치를 이용하려면 먼저 로그인해주세요.</div>
                </div>
            </div>
        `;
    }

    return `
        <div class="ai-container">
            <div class="ai-header">
                <div>
                    <h1 class="page-title">🤖 AI Health Coach</h1>
                    <p class="subtext">최근 30일간의 데이터를 분석하여 맞춤형 건강 조언을 제공합니다</p>
                </div>
                <button id="ai-analyze-btn" class="ai-analyze-btn">분석 시작</button>
            </div>

            <div id="ai-content">
                <div class="ai-empty-state">
                    <div class="ai-empty-state-icon">🧠</div>
                    <div class="ai-empty-state-text">AI 분석을 시작해보세요</div>
                    <div class="ai-empty-state-subtext">버튼을 클릭하면 최근 30일간의 건강 데이터를 분석합니다</div>
                </div>
            </div>
        </div>
    `;
}

// AI 페이지 초기화
export function initAIPage() {
    const analyzeBtn = document.getElementById('ai-analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', handleAnalyze);
    }
}

// 분석 시작
async function handleAnalyze() {
    const userId = localStorage.getItem('username');
    if (!userId) {
        alert('로그인이 필요합니다.');
        return;
    }

    const analyzeBtn = document.getElementById('ai-analyze-btn');
    const contentDiv = document.getElementById('ai-content');

    // 버튼 비활성화
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = '분석 중...';

    // 로딩 표시
    contentDiv.innerHTML = `
        <div class="ai-loading">
            <div class="ai-loading-spinner"></div>
            <div class="ai-loading-text">30일간의 데이터를 분석하고 있습니다...</div>
        </div>
    `;

    try {
        // 30일치 데이터 가져오기
        const userData = await get30daysData(userId);

        if (!userData) {
            throw new Error('데이터를 불러올 수 없습니다.');
        }

        // AI 분석 요청
        const analysis = await getAIAnalysis(userData);

        // 결과 표시
        displayAnalysisResults(analysis, userData);

    } catch (error) {
        console.error('AI 분석 실패:', error);
        contentDiv.innerHTML = `
            <div class="ai-empty-state">
                <div class="ai-empty-state-icon">⚠️</div>
                <div class="ai-empty-state-text">분석 중 오류가 발생했습니다</div>
                <div class="ai-empty-state-subtext">${error.message}</div>
            </div>
        `;
    } finally {
        // 버튼 다시 활성화
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = '다시 분석';
    }
}

// AI 분석 요청 (OpenAI API)
async function getAIAnalysis(userData) {
    // 데이터 요약 생성
    const dataSummary = generateDataSummary(userData);

    // 프롬프트 생성
    const prompt = `
당신은 전문 건강 코치입니다. 다음 사용자의 최근 30일간 건강 데이터를 분석하여:
1. 전반적인 건강 상태 평가
2. 스트레스 지수 (0-100 사이의 숫자로, 숫자만 반환)
3. 구체적인 생활습관 개선 추천 (최소 3가지)

사용자 정보:
- 나이: ${userData.age}세
- 성별: ${userData.gender}
- 키: ${userData.height}cm

데이터 요약:
${dataSummary}

다음 JSON 형식으로 응답해주세요:
{
  "healthStatus": "전반적인 건강 상태 평가 (2-3문장)",
  "stressLevel": 스트레스지수숫자 (0-100),
  "recommendations": [
    "추천사항1",
    "추천사항2",
    "추천사항3"
  ]
}
`;

    const APIKEY = ""; // 여기에 OpenAI API 키를 입력하세요

    // API 키가 없으면 더미 데이터 반환
    if (!APIKEY) {
        console.warn('OpenAI API 키가 설정되지 않았습니다. 더미 데이터를 사용합니다.');
        return generateDummyAnalysis(userData);
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${APIKEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "당신은 전문 건강 코치입니다. 항상 JSON 형식으로 응답합니다."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API 오류: ${response.status}`);
        }

        const result = await response.json();
        const content = result.choices[0].message.content;

        // JSON 파싱
        const analysis = JSON.parse(content);
        return analysis;

    } catch (error) {
        console.error('OpenAI API 호출 실패:', error);
        // 실패 시 더미 데이터 반환
        return generateDummyAnalysis(userData);
    }
}

// 데이터 요약 생성
function generateDataSummary(userData) {
    const { weight, sleep, steps, kcal } = userData;

    let summary = '';

    // 체중 데이터
    if (weight && weight.length > 0) {
        const avgWeight = (weight.reduce((sum, w) => sum + w.weight, 0) / weight.length).toFixed(1);
        summary += `평균 체중: ${avgWeight}kg\n`;
    }

    // 수면 데이터
    if (sleep && sleep.length > 0) {
        const avgSleepMinutes = sleep.reduce((sum, s) => {
            const [h, m] = s.sleep_time.split(':').map(Number);
            return sum + (h * 60 + m);
        }, 0) / sleep.length;
        const avgSleepHours = (avgSleepMinutes / 60).toFixed(1);
        summary += `평균 수면 시간: ${avgSleepHours}시간\n`;
    }

    // 걸음 수 데이터
    if (steps && steps.length > 0) {
        const avgSteps = Math.round(steps.reduce((sum, s) => sum + s.steps, 0) / steps.length);
        summary += `평균 걸음 수: ${avgSteps.toLocaleString()}보\n`;
    }

    // 칼로리 데이터
    if (kcal && kcal.length > 0) {
        summary += `식사 기록: ${kcal.length}건\n`;
    }

    return summary;
}

// 더미 분석 결과 생성 (API 키가 없을 때)
function generateDummyAnalysis(userData) {
    const { weight, sleep, steps } = userData;

    // 간단한 스트레스 지수 계산
    let stressLevel = 50; // 기본값

    // 수면 부족 체크
    if (sleep && sleep.length > 0) {
        const avgSleepMinutes = sleep.reduce((sum, s) => {
            const [h, m] = s.sleep_time.split(':').map(Number);
            return sum + (h * 60 + m);
        }, 0) / sleep.length;
        const avgSleepHours = avgSleepMinutes / 60;

        if (avgSleepHours < 6) {
            stressLevel += 20;
        } else if (avgSleepHours < 7) {
            stressLevel += 10;
        }
    }

    // 활동량 체크
    if (steps && steps.length > 0) {
        const avgSteps = steps.reduce((sum, s) => sum + s.steps, 0) / steps.length;

        if (avgSteps < 5000) {
            stressLevel += 15;
        } else if (avgSteps > 10000) {
            stressLevel -= 10;
        }
    }

    stressLevel = Math.max(0, Math.min(100, stressLevel));

    return {
        healthStatus: "최근 30일간의 데이터를 분석한 결과, 전반적으로 양호한 건강 상태를 유지하고 계십니다. 다만 일부 개선이 필요한 부분이 있어 맞춤형 조언을 드립니다.",
        stressLevel: Math.round(stressLevel),
        recommendations: [
            "규칙적인 수면 패턴을 유지하세요. 매일 같은 시간에 잠들고 일어나는 것이 중요합니다.",
            "하루 10,000보 이상 걷기를 목표로 하세요. 점심시간이나 저녁 시간을 활용한 산책을 추천합니다.",
            "균형 잡힌 식사를 하세요. 단백질, 탄수화물, 지방을 적절히 섭취하고 충분한 수분 섭취를 권장합니다.",
            "스트레스 관리를 위해 명상이나 요가 같은 이완 활동을 일주일에 2-3회 실천해보세요."
        ]
    };
}

// 분석 결과 표시
function displayAnalysisResults(analysis, userData) {
    const contentDiv = document.getElementById('ai-content');

    const { healthStatus, stressLevel, recommendations } = analysis;

    // 스트레스 레벨에 따른 클래스
    let stressClass = 'low';
    let stressText = '낮음';
    if (stressLevel > 70) {
        stressClass = 'high';
        stressText = '높음';
    } else if (stressLevel > 40) {
        stressClass = 'medium';
        stressText = '보통';
    }

    // 데이터 요약
    const dataSummaryHTML = generateDataSummaryHTML(userData);

    contentDiv.innerHTML = `
        <div class="ai-cards">
            <!-- 데이터 요약 카드 -->
            <div class="ai-card">
                <div class="ai-card-header">
                    <span class="ai-card-icon">📊</span>
                    <h3 class="ai-card-title">30일 데이터 요약</h3>
                </div>
                <div class="ai-card-content">
                    ${dataSummaryHTML}
                </div>
            </div>

            <!-- 스트레스 지수 카드 -->
            <div class="ai-card">
                <div class="ai-card-header">
                    <span class="ai-card-icon">💆</span>
                    <h3 class="ai-card-title">스트레스 지수</h3>
                </div>
                <div class="ai-card-content">
                    <div class="stress-level-container">
                        <div class="stress-level-bar">
                            <div class="stress-level-fill ${stressClass}" style="width: ${stressLevel}%"></div>
                        </div>
                        <div class="stress-level-text">
                            <span>스트레스 레벨: <span class="stress-level-value">${stressText}</span></span>
                            <span class="stress-level-value">${stressLevel}/100</span>
                        </div>
                    </div>
                    <p class="subtext" style="margin-top: 12px;">
                        ${stressLevel < 40 ? '건강한 스트레스 수준을 유지하고 계십니다.' :
            stressLevel < 70 ? '적절한 스트레스 관리가 필요합니다.' :
                '스트레스 수준이 높습니다. 휴식과 이완이 필요합니다.'}
                    </p>
                </div>
            </div>

            <!-- 건강 상태 평가 카드 -->
            <div class="ai-card" style="grid-column: 1 / -1;">
                <div class="ai-card-header">
                    <span class="ai-card-icon">🏥</span>
                    <h3 class="ai-card-title">건강 상태 평가</h3>
                </div>
                <div class="ai-card-content">
                    <p style="line-height: 1.6; color: #374151;">${healthStatus}</p>
                </div>
            </div>

            <!-- 생활습관 추천 카드 -->
            <div class="ai-card" style="grid-column: 1 / -1;">
                <div class="ai-card-header">
                    <span class="ai-card-icon">✨</span>
                    <h3 class="ai-card-title">맞춤형 생활습관 추천</h3>
                </div>
                <div class="ai-card-content">
                    <ul class="recommendation-list">
                        ${recommendations.map(rec => `
                            <li class="recommendation-item">${rec}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// 데이터 요약 HTML 생성
function generateDataSummaryHTML(userData) {
    const { weight, sleep, steps, kcal, age, gender, height } = userData;

    let summaryItems = [];

    // 기본 정보
    summaryItems.push(`
        <div class="data-summary-item">
            <div class="data-summary-label">나이 / 성별</div>
            <div class="data-summary-value">${age}세 / ${gender === 'male' ? '남성' : '여성'}</div>
        </div>
    `);

    summaryItems.push(`
        <div class="data-summary-item">
            <div class="data-summary-label">키</div>
            <div class="data-summary-value">${height}cm</div>
        </div>
    `);

    // 평균 체중
    if (weight && weight.length > 0) {
        const avgWeight = (weight.reduce((sum, w) => sum + w.weight, 0) / weight.length).toFixed(1);
        summaryItems.push(`
            <div class="data-summary-item">
                <div class="data-summary-label">평균 체중</div>
                <div class="data-summary-value">${avgWeight}kg</div>
            </div>
        `);
    }

    // 평균 수면 시간
    if (sleep && sleep.length > 0) {
        const avgSleepMinutes = sleep.reduce((sum, s) => {
            const [h, m] = s.sleep_time.split(':').map(Number);
            return sum + (h * 60 + m);
        }, 0) / sleep.length;
        const avgSleepHours = Math.floor(avgSleepMinutes / 60);
        const avgSleepMins = Math.round(avgSleepMinutes % 60);
        summaryItems.push(`
            <div class="data-summary-item">
                <div class="data-summary-label">평균 수면</div>
                <div class="data-summary-value">${avgSleepHours}h ${avgSleepMins}m</div>
            </div>
        `);
    }

    // 평균 걸음 수
    if (steps && steps.length > 0) {
        const avgSteps = Math.round(steps.reduce((sum, s) => sum + s.steps, 0) / steps.length);
        summaryItems.push(`
            <div class="data-summary-item">
                <div class="data-summary-label">평균 걸음 수</div>
                <div class="data-summary-value">${avgSteps.toLocaleString()}</div>
            </div>
        `);
    }

    // 식사 기록
    if (kcal && kcal.length > 0) {
        summaryItems.push(`
            <div class="data-summary-item">
                <div class="data-summary-label">식사 기록</div>
                <div class="data-summary-value">${kcal.length}건</div>
            </div>
        `);
    }

    return `<div class="data-summary">${summaryItems.join('')}</div>`;
}
