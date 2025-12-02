import { INFO_URL } from '../../config.js';
import { dataStore, loadData } from '../dataManager.js';
import { updateDashboard } from '../uiManager.js';
import { formatDate } from '../utils.js';

export async function renderWeightPage(navigateTo) {
  const container = document.getElementById('content-container');
  await loadData('body_info');

  const date = formatDate(new Date());
  const todayWeight = dataStore.today.weight;
  const weightLogs = dataStore.history.weight;
  // eslint-disable-next-line no-unused-vars
  const label = dataStore.history.labels;
  const height = dataStore.today.height;


  let htmlContent = `
    <section class="card">
      <div class="card-title">몸무게, 키 관리</div>
      <div style="padding:20px; display:flex; flex-direction:column; gap:16px;">
        
        <!-- 몸무게 입력 -->
        <div>
          <div style="display:flex; gap:12px; align-items:flex-end;">
            <div>
              <label style="display:block; margin-bottom:8px; font-weight:500;">날짜</label>
              <input type="date" id="weight-date" value="${date}" 
                     style="padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; font-size:14px; height:35px;" />
            </div>
            <div>
              <label style="display:block; gap:12px; margin-bottom:8px; font-weight:500;">몸무게 (kg)</label>
              <input type="number" id="weight-input" placeholder="70.5" step="0.1" min="0" 
                     value="${todayWeight ? todayWeight : ''}"
                     style="padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; font-size:14px; width:100px;" />
            </div>
            <button id="add-weight-btn" style="padding:10px 20px; background:#38bdf8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600;">
              추가
            </button>
          </div>
        </div>

        <!-- 키 입력 -->
        <div>
          <div style="display:flex; gap:12px; align-items:flex-end;">

            <div>
              <label style="display:block; margin-bottom:8px; font-weight:500;">키 (cm)</label>
              <input type="number" id="height-input" placeholder="170" step="0.1" min="0" 
                     value="${height ? height : ''}"
                     style="padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; font-size:14px; width:100px;" />
            </div>
            <button id="add-height-btn" style="padding:10px 20px; background:#38bdf8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600;">
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
    let latestWeight = 0;
    for (let i = 6; i >= 0; i--) {
      const w = weightLogs[i];
      if (w === 0 || latestWeight === w) continue;
      latestWeight = w;
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

      alert('몸무게가 저장되었습니다!');
      renderWeightPage(navigateTo);
    } catch (err) {
      console.error('몸무게 저장에 실패했습니다:', err);
      alert('몸무게 저장에 실패했습니다.');
    }
  });

  // 키 추가 버튼 이벤트
  document.getElementById('add-height-btn').addEventListener('click', async () => {
    const height = parseFloat(document.getElementById('height-input').value);

    if (isNaN(height) || height <= 0) {
      alert('올바른 키를 입력해주세요.');
      return;
    }

    try {
      const res = await fetch(`${INFO_URL}/addHeight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: localStorage.getItem('username'),
          height: height
        })
      });
      const data = await res.json();
      if (data.message === 'fail') {
        throw new Error('DB Error');
      }

      alert('키가 저장되었습니다!');
      renderWeightPage(navigateTo);
    } catch (err) {
      console.error('키 저장에 실패했습니다:', err);
      alert('키 저장에 실패했습니다.');
    }
  });
}
