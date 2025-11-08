document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault(); // 폼의 기본 제출 동작을 막습니다.

        const username = event.target.username.value;
        const password = event.target.password.value;

        console.log("로그인 시도:", { username, password });

        // 여기에 실제 서버로 로그인 요청을 보내는 코드를 추가합니다.
        // 예: fetch('/api/login', { method: 'POST', ... })

        // 로그인 성공 시 대시보드 페이지로 이동
        alert("로그인에 성공했습니다!");
        window.location.href = "../main/main.html"; // log_in -> main 폴더로 이동
    });
});