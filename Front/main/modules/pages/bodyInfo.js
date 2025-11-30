import { INFO_URL } from '../../config.js';
import { dataStore, loadData } from '../dataManager.js';
import { updateDashboard } from '../uiManager.js';
import { formatDate } from '../utils.js';

export function renderBodyInfoPage(navigateTo) {
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
            navigateTo('dashboard');

        } catch (err) {
            console.warn('Heart_rate 저장 실패:', err);
            alert('Heart_rate 저장 실패');
        }
    });
}
