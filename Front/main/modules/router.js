import { isLoggedIn } from './utils.js';
import { renderSleepPage } from './pages/sleep.js';
import { renderActivityPage } from './pages/activity.js';
import { renderNutritionPage } from './pages/nutrition.js';
import { renderBodyInfoPage } from './pages/bodyInfo.js';
import { renderWeightPage } from './pages/weight.js';
import { renderGoalPage } from './pages/goal.js';
import { renderSettingsPage } from './pages/settings.js';

export function loadPage(page) {
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

    if (page === 'sleep') { renderSleepPage(loadPage); return; }
    if (page === 'activity') { renderActivityPage(loadPage); return; }
    if (page === 'nutrition') { renderNutritionPage(loadPage); return; }
    if (page === 'body-info') { renderBodyInfoPage(loadPage); return; }
    if (page === 'weight') { renderWeightPage(loadPage); return; }
    if (page === 'goal') { renderGoalPage(loadPage); return; }
    if (page === 'settings') { renderSettingsPage(loadPage); return; }
}
