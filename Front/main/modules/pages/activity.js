import { INFO_URL } from '../../config.js';
import { dataStore, loadData } from '../dataManager.js';
import { updateDashboard } from '../uiManager.js';
import { formatDate } from '../utils.js';

export async function renderActivityPage(navigateTo) {
  const container = document.getElementById('content-container');
  await loadData('steps');
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
        
        <button id="save-activity-btn" style="padding:10px 20px;background:#0ea5e9;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">저장</button>
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

      alert('걸음 수가 저장되었습니다!');
      navigateTo('dashboard');

    } catch (err) {
      console.error('Activity 데이터 저장 실패:', err);
      alert('Activity 데이터 저장 실패');
    }
  });
}
