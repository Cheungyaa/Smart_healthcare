
// 날짜/시간 유틸
// YYYY-MM-DD HH:MM:SS 형식
export function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// YYYY-MM-DD 형식
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// interval 시간 계산
export function calcSleepDuration(startTime, endTime) {
    if (!startTime || !endTime) return { hours: 0, minutes: 0 };

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;

    if (endMin <= startMin) {
        endMin += 24 * 60;
    }

    const total = endMin - startMin;
    const hours = Math.floor(total / 60);
    const minutes = total % 60;

    return { hours, minutes };
}

// 로그인 체크 함수
export function isLoggedIn() {
    return !!localStorage.getItem('isLoggedIn');
}
