document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signup-form");
    const birthdateInput = document.getElementById("birthdate");
    const ageDisplay = document.getElementById("age-display");

    // 생년월일 입력 시 만 나이 계산
    birthdateInput.addEventListener("change", () => {
        const birthDate = new Date(birthdateInput.value);
        if (!isNaN(birthDate.getTime())) {
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            ageDisplay.textContent = `(만 ${age}세)`;
        } else {
            ageDisplay.textContent = "";
        }
    });

    signupForm.addEventListener("submit", (event) => {
        event.preventDefault(); // 폼의 기본 제출 동작을 막습니다.

        const nickname = event.target.nickname.value;
        const birthdate = event.target.birthdate.value;
        const gender = event.target.gender.value;
        const userid = event.target.userid.value;
        const password = event.target.password.value;
        const email = event.target.email.value;

        // 만 나이 다시 계산해서 함께 전송
        const birthDate = new Date(birthdate);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
        }

        console.log("회원가입 정보:", {
            nickname,
            birthdate,
            calculatedAge,
            gender,
            userid,
            password,
            email
        });

        // 여기에 실제 서버로 회원가입 요청을 보내는 코드를 추가합니다.

        alert("회원가입이 완료되었습니다.");
        window.location.href = "../body_info/body_info.html"; // 변경된 신체 정보 입력 페이지로 이동
    });
});