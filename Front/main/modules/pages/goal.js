import { INFO_URL } from '../../config.js';
import { dataStore, loadData } from '../dataManager.js';
import { updateDashboard } from '../uiManager.js';

export async function renderGoalPage(navigateTo) {
  const container = document.getElementById('content-container');
  await loadData('goals');
  const goals = dataStore.goals;

  container.innerHTML = `
    <div class="goal-container">
      <h1 class="page-title">목표 설정</h1>
      
      <div class="goal-cards">
        <!-- 수면 목표 -->
        <div class="goal-card">
          <div class="goal-header">
            <h2 class="goal-title">
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
          <button class="goal-save-btn" data-goal="sleep" style="margin-top:auto;">저장</button>
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
          <button class="goal-save-btn" data-goal="steps" style="margin-top:auto;">저장</button>
        </div>

        <!-- 칼로리 목표 -->
        <div class="goal-card">
          <div class="goal-header">
            <h2 class="goal-title">
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
          <button class="goal-save-btn" data-goal="kcal" style="margin-top:auto;">저장</button>
        </div>

        <!-- 몸무게 목표 -->
        <div class="goal-card">
          <div class="goal-header">
            <h2 class="goal-title">
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
          <button class="goal-save-btn" data-goal="weight" style="margin-top:auto;">저장</button>
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

      alert(goalType + " 목표가 저장되었습니다!");
      renderGoalPage(navigateTo);
    });
  });
}
