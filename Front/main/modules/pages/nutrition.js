import { INFO_URL } from '../../config.js';
import { dataStore, loadData } from '../dataManager.js';
import { updateDashboard } from '../uiManager.js';
import { formatDate, formatDateTime } from '../utils.js';

// 음식 이름 리스트
const FOOD_NAMES = [
    "김밥", "삼겹살", "불고기", "비빔밥", "된장찌개", "김치찌개", "라면", "칼국수", "떡볶이", "순대",
    "닭갈비", "삼계탕", "제육볶음", "갈비탕", "냉면", "쫄면", "짜장면", "짬뽕", "짬뽕밥", "볶음밥",
    "김치볶음밥", "새우볶음밥", "카레라이스", "토스트", "샌드위치", "햄버거", "치킨", "후라이드치킨",
    "양념치킨", "간장치킨", "감자튀김", "치즈피자", "페퍼로니피자", "불고기피자", "핫도그", "순살치킨",
    "돈까스", "카츠동", "규동", "라멘", "우동", "초밥", "연어초밥", "참치초밥", "광어초밥", "김치전",
    "파전", "부침개", "계란말이", "계란후라이", "감자탕", "돼지국밥", "순대국", "콩나물국밥", "설렁탕",
    "육개장", "갈비찜", "잡채", "닭강정", "족발", "보쌈", "오리고기", "편의점도시락", "김치", "깍두기",
    "백김치", "나물비빔밥", "해장국", "부대찌개", "감자조림", "고등어구이", "삼치구이", "갈치조림",
    "오징어볶음", "두부김치", "비빔국수", "콩국수", "고기만두", "김치만두", "찐만두", "군만두",
    "호떡", "붕어빵", "풀빵", "찹쌀떡", "인절미", "꿀떡", "아메리카노", "카페라떼", "초코우유",
    "딸기우유", "바나나우유", "식빵", "크로아상", "도넛", "초코파이", "라떼빙수"
];

export function renderNutritionPage(navigateTo) {
    const container = document.getElementById('content-container');
    loadData();
    const { foodLogs = [], kcal } = dataStore.today;

    const date = formatDate(new Date());

    const optionsHtml = FOOD_NAMES
        .map(name => `<option value="${name}">${name}</option>`)
        .join("");

    const logsHtml = foodLogs.length === 0
        ? `<p class="subtext" style="margin-top:8px;">아직 등록된 음식 기록이 없습니다.</p>`
        : `
      <ul style="margin-top:8px; font-size:13px; color:#4b5563; padding-left:18px;">
        ${foodLogs.map(log => `<li>${log.food} ${log.weight}g</li>`).join("")}
      </ul>
    `;

    container.innerHTML = `
    <section class="card">
      <div class="card-title">Nutrition Data</div>
      <div style="padding:20px; display:flex; flex-direction:column; gap:14px; max-width:420px;">
        
      <!-- 기록 날짜 입력 -->
        <div>
          <label style="font-size:14px;">기록 날짜</label>
          <input type="date"
                 id="nutrition-date"
                 value="${date}"
                 style="width:100%; padding:8px 10px; border-radius:8px;
                        border:1px solid #d1d5db; margin-top:4px;" />
        </div>
        
        <div>
          <label style="font-size:14px;">오늘까지 섭취한 총 칼로리</label>
          <div id="nutrition-total"
               style="margin-top:4px; font-size:18px; font-weight:600;">
            ${kcal || 0} kcal
          </div>
          <p class="subtext" style="margin-top:4px;">
            총 칼로리 값은 백엔드에서 계산된 값을 가져와 today.kcal에 반영하면 됩니다.
          </p>
        </div>

        <div>
          <label for="food-select" style="font-size:14px;">음식 선택</label>
          <select id="food-select"
                  style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; margin-top:4px;">
            <option value="" disabled selected>음식을 선택하세요</option>
            ${optionsHtml}
          </select>
        </div>

        <div>
          <label for="food-gram" style="font-size:14px;">섭취량 (g)</label>
          <input type="number"
                 id="food-gram"
                 min="1"
                 step="1"
                 placeholder="예: 150"
                 style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #d1d5db; margin-top:4px;" />
          <p class="subtext" style="margin-top:4px;">
            음식 이름과 그램(g)만 보내면, 칼로리 계산은 백엔드에서 처리합니다.
          </p>
        </div>

        <button id="save-nutrition-btn"
                style="align-self:flex-start; padding:10px 20px; background:#0ea5e9; color:white; border:none; border-radius:8px; cursor:pointer; margin-top:4px;">
          추가하기
        </button>

        <div style="margin-top:10px;">
          <label style="font-size:14px;">오늘 기록된 음식</label>
          ${logsHtml}
        </div>
      </div>
    </section>
  `;

    const selectEl = document.getElementById('food-select');
    const gramEl = document.getElementById('food-gram');

    document.getElementById('save-nutrition-btn').addEventListener('click', async () => {
        const foodName = selectEl.value;
        const weight = Number(gramEl.value) || 0;
        const date = document.getElementById('nutrition-date').value;

        if (!foodName || !weight) {
            alert('음식과 섭취량(g)을 모두 입력해주세요.');
            return;
        }

        try {
            const userId = localStorage.getItem('username') || localStorage.getItem('user_id');

            const res = await fetch(`${INFO_URL}/addFoodLog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    food_name: foodName,
                    food_weight: weight,
                    time: `${date} 00:00:01`
                })
            });
            const data = await res.json();
            if (data.message === 'fail') {
                throw new Error('DB Error');
            }

            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date();
            endDate.setHours(23, 59, 59, 999);

            const foodLogRes = await fetch(`${INFO_URL}/getFoodLog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    start_time: formatDateTime(startDate),
                    end_time: formatDateTime(endDate)
                })
            });

            const foodLogData = await foodLogRes.json();
            let totCalories = 0;
            for (const cal of foodLogData) {
                totCalories += cal.food_calories;
            }
            dataStore.today.kcal = totCalories;
            dataStore.today.foodLogs = foodLogData.map(item => ({
                food: item.food_name,
                weight: item.food_weight,
                kcal: item.food_calories
            }));
            updateDashboard();

            alert(`${foodName} ${weight}g 기록이 추가되었습니다.`);
            renderNutritionPage(navigateTo);
        } catch (err) {
            console.warn('Food_log 저장 실패', err);
            alert('Food_log 저장에 실패했습니다.');
        }
    });
}
