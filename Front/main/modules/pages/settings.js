import { INFO_URL } from '../../config.js';
import { dataStore } from '../dataManager.js';
import { updateDashboard } from '../uiManager.js';

export function renderSettingsPage(navigateTo) {
    const container = document.getElementById('content-container');
    container.innerHTML = `
    <section class="card">
      <div class="card-title">Delete Data</div>
      <div style="padding:10px;">
        <button id="clear-data-btn" style="padding:10px 20px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;">전체 데이터 삭제</button>
      </div>
      <div class="card-title" style="margin-top: 30px;">Delete Account</div>
      <div style="padding:10px;">
        <button id="delete-account-btn" style="padding:10px 20px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;">계정 탈퇴</button>
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
                console.log('deleteAllData response:', data);

                if (!data || data.message !== 'success') {
                    throw new Error('서버에서 데이터 삭제에 실패했습니다.');
                }

                localStorage.removeItem('todayData');
                localStorage.removeItem('todayHistory');
                dataStore.today = { sleep: { hours: 0, minutes: 0 }, steps: 0, kcal: 0, bpm: 0 };
                alert('데이터가 삭제되었습니다.');
                updateDashboard();
                navigateTo('dashboard');

            } catch (err) {
                console.error('데이터 삭제 실패:', err);
                alert(`데이터 삭제에 실패했습니다.\n오류: ${err.message}`);
            }
        }
    });

    document.getElementById('delete-account-btn').addEventListener('click', async () => {
        if (confirm('정말 계정을 탈퇴하시겠습니까?')) {
            try {
                const res = await fetch(`${INFO_URL}/deleteAccount`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: localStorage.getItem('username'),
                    })
                });
                const data = await res.json();
                console.log('deleteAccount response:', data);

                if (!data || data.message !== 'success') {
                    throw new Error('서버에서 계정 삭제에 실패했습니다.');
                }

                localStorage.removeItem('todayData');
                localStorage.removeItem('todayHistory');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('username');
                localStorage.removeItem('user_id');

                dataStore.today = { sleep: { hours: 0, minutes: 0 }, steps: 0, kcal: 0, bpm: 0 };
                alert('계정이 삭제되었습니다.');
                window.location.href = '../log_in/login.html';

            } catch (err) {
                console.error('계정 삭제 실패:', err);
                alert(`계정 삭제에 실패했습니다.\n오류: ${err.message}`);
            }
        }
    });
}
