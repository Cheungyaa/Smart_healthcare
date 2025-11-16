const URL = "http://localhost:7002";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // 폼의 기본 제출 동작을 막습니다.

        const username = event.target.username.value;
        const password = event.target.password.value;

        console.log("로그인 시도:", { username, password });

        // 서버에 로그인 요청
        // 성공 시 {"message": "success"} json 객체 전송
        // 실패 시 {"message": "fail"} json 객체 전송 : id가 없거나 pw 불일치
        const res = await fetch(URL+"/LogIn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({id: username, pw: password})
        });

        // 응답 JSON 파싱
        const data = await res.json();
        const msg = data.message;

        // 로그인 성공 시 대시보드 페이지로 이동
        if (msg == "success") {
            alert("로그인에 성공했습니다!");
            window.location.href = "../main/main.html"; // log_in -> main 폴더로 이동} // 다음 화면으로 변경
        }
        else {
            alert("ID 또는 비밀번호가 일치하지 않습니다"); // 경고 메세지 출력
        }
    });
});
