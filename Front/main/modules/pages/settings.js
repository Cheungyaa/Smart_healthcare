import { INFO_URL } from '../../config.js';
import { dataStore } from '../dataManager.js';
import { updateDashboard } from '../uiManager.js';

export function renderSettingsPage(navigateTo) {
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
                navigateTo('dashboard');

            } catch (err) {
                console.error('데이터 삭제 실패:', err);
                alert('데이터 삭제에 실패했습니다.');
            }
        }
    });
}
