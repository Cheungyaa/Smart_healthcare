import { isLoggedIn } from './utils.js';
import { renderSleepPage } from './pages/sleep.js';
import { renderActivityPage } from './pages/activity.js';
import { renderNutritionPage } from './pages/nutrition.js';
import { renderBodyInfoPage } from './pages/heartRate.js';
import { renderWeightPage } from './pages/weight.js';
import { renderGoalPage } from './pages/goal.js';
import { renderSettingsPage } from './pages/settings.js';
import { renderAIPage, initAIPage } from './pages/ai.js';

export async function loadPage(page) {
    const container = document.getElementById('content-container');
    if (!container) return;

    const protectedPages = ['sleep', 'activity', 'nutrition', 'body-info'];
    if (protectedPages.includes(page) && !isLoggedIn()) {
        container.innerHTML = '<div class="need-login" style="padding:40px;">데이터를 보려면 로그인이 필요합니다.</div>';
        return;
    }

    if (page === 'dashboard' || page === undefined) {
        location.reload();
        return;
    }

    if (page === 'ai') {
        container.innerHTML = renderAIPage();
        initAIPage();
        return;
    }
    if (page === 'sleep') { await renderSleepPage(loadPage); return; }
    if (page === 'activity') { await renderActivityPage(loadPage); return; }
    if (page === 'nutrition') { await renderNutritionPage(loadPage); return; }
    if (page === 'body-info') { await renderBodyInfoPage(loadPage); return; }
    if (page === 'weight') { await renderWeightPage(loadPage); return; }
    if (page === 'goal') { await renderGoalPage(loadPage); return; }
    if (page === 'settings') { renderSettingsPage(loadPage); return; }
}
