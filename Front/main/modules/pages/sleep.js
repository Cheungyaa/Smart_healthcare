import { INFO_URL } from '../../config.js';
import { dataStore, loadData } from '../dataManager.js';
import { updateDashboard } from '../uiManager.js';
import { formatDate, calcSleepDuration } from '../utils.js';

export function renderSleepPage(navigateTo) {
    const container = document.getElementById('content-container');
    loadData();
    const { start, end, hours, minutes } = dataStore.today.sleep;

    // 시간을 AM/PM, 시간, 분으로 파싱하는 헬퍼 함수
    const parseTime = (timeStr) => {
        if (!timeStr) return { ampm: 'AM', hour: '12', minute: '00' };
        const [h, m] = timeStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
        return {
            ampm,
            hour: String(hour12).padStart(2, '0'),
            minute: String(m).padStart(2, '0')
        };
    };

    const startParsed = parseTime(start);
    const endParsed = parseTime(end);

    // 날짜 기본값: 전날(시작), 오늘(종료)
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const defaultStartDate = formatDate(yesterday); // YYYY-MM-DD
    const defaultEndDate = formatDate(today);     // YYYY-MM-DD

    // 시간 옵션 생성 (1-12)
    const hourOptions = Array.from({ length: 12 }, (_, i) => {
        const h = String(i + 1).padStart(2, '0');
        return `<option value="${h}">${h}</option>`;
    }).join('');

    // 분 옵션 생성 (00-55, 5분 단위)
    const minuteOptions = Array.from({ length: 12 }, (_, i) => {
        const m = String(i * 5).padStart(2, '0');
        return `<option value="${m}">${m}</option>`;
    }).join('');

    const selectStyle = "padding:8px; border-radius:8px; border:1px solid #d1d5db; font-size:14px;";
    const dateInputStyle = "padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; font-size:14px;";
    container.innerHTML = `
    <section class="card">
      <div class="card-title">Sleep Data</div>
      <div style="padding:20px; display:flex; flex-direction:column; gap:16px; max-width:600px;">

        <!-- 수면 시작 -->
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:500;">수면 시작</label>
          <div style="display:flex; gap:8px;">
            <input type="date" id="sleep-start-date" style="${dateInputStyle}" value="${defaultStartDate}"/>
            <select id="sleep-start-ampm" style="${selectStyle}">
              <option value="AM" ${startParsed.ampm === 'AM' ? 'selected' : ''}>오전</option>
              <option value="PM" ${startParsed.ampm === 'PM' ? 'selected' : ''}>오후</option>
            </select>
            <select id="sleep-start-hour" style="${selectStyle}">
              ${hourOptions}
            </select>
            <span style="align-self:center;">:</span>
            <select id="sleep-start-minute" style="${selectStyle}">
              ${minuteOptions}
            </select>
          </div>
        </div>

        <!-- 수면 종료 -->
        <div>
          <label style="display:block; margin-bottom:8px; font-weight:500;">수면 종료</label>
          <div style="display:flex; gap:8px;">
            <input type="date" id="sleep-end-date" style="${dateInputStyle}" value="${defaultEndDate}" />
            <select id="sleep-end-ampm" style="${selectStyle}">
              <option value="AM" ${endParsed.ampm === 'AM' ? 'selected' : ''}>오전</option>
              <option value="PM" ${endParsed.ampm === 'PM' ? 'selected' : ''}>오후</option>
            </select>
            <select id="sleep-end-hour" style="${selectStyle}">
              ${hourOptions}
            </select>
            <span style="align-self:center;">:</span>
            <select id="sleep-end-minute" style="${selectStyle}">
              ${minuteOptions}
            </select>
          </div>
        </div>

        <div style="font-size:14px; color:#6b7280;">
          현재 저장된 수면 시간: 
          <strong>${hours}h ${minutes}m</strong>
        </div>

        <button id="save-sleep-btn"
          style="align-self:flex-start; padding:10px 20px; background:#2a9df4; color:white;
                 border:none; border-radius:8px; cursor:pointer; margin-top:4px;">
          저장
        </button>
      </div>
    </section>
  `;

    // 저장된 값으로 시간 select 설정
    document.getElementById('sleep-start-hour').value = startParsed.hour;
    document.getElementById('sleep-start-minute').value = startParsed.minute;
    document.getElementById('sleep-end-hour').value = endParsed.hour;
    document.getElementById('sleep-end-minute').value = endParsed.minute;

    // 저장 버튼 핸들러
    document.getElementById('save-sleep-btn').addEventListener('click', async () => {
        // 12시간 형식을 24시간 형식으로 변환
        const convertTo24Hour = (ampm, hour, minute) => {
            let h = parseInt(hour);
            if (ampm === 'AM' && h === 12) h = 0;
            else if (ampm === 'PM' && h !== 12) h += 12;
            return `${String(h).padStart(2, '0')}:${minute}`;
        };
        const startDate = document.getElementById('sleep-start-date').value; // YYYY-MM-DD
        const endDate = document.getElementById('sleep-end-date').value;

        if (!startDate || !endDate) {
            alert('수면 시작/종료 날짜를 모두 선택해주세요.');
            return;
        }

        const startAmpm = document.getElementById('sleep-start-ampm').value;
        const startHour = document.getElementById('sleep-start-hour').value;
        const startMinute = document.getElementById('sleep-start-minute').value;

        const endAmpm = document.getElementById('sleep-end-ampm').value;
        const endHour = document.getElementById('sleep-end-hour').value;
        const endMinute = document.getElementById('sleep-end-minute').value;

        const startTime = convertTo24Hour(startAmpm, startHour, startMinute);
        const endTime = convertTo24Hour(endAmpm, endHour, endMinute);

        // 총 수면시간 계산 (시/분)
        const { hours, minutes } = calcSleepDuration(startTime, endTime);

        try {
            const res = await fetch(`${INFO_URL}/addActualSleep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: localStorage.getItem('username'),
                    start_time: `${startDate} ${startTime}:00`,
                    end_time: `${endDate} ${endTime}:00`
                })
            });

            const data = await res.json();
            if (data.message === 'fail') {
                throw new Error('DB Error');
            }

            dataStore.today.sleep = { start: startTime, end: endTime, hours, minutes };
            updateDashboard();

            alert(`수면 시간이 저장되었습니다. (총 ${hours}시간 ${minutes}분)`);
            navigateTo('dashboard');

        } catch (err) {
            console.error('수면 데이터 저장 실패:', err);
            alert('수면 데이터 저장 실패');
        }
    });
}
