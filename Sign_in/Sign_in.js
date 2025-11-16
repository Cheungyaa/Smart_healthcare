import URL from "./main/config.js"

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

    signupForm.addEventListener("submit", async (event) => {
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

        // 서버에 회원가입 요청
        // 성공 시 {"message": "success"} json 객체 전송
        // 실패 시 {"message": "fail"} json 객체 전송 : 이미 id가 존재할 경우 실패
        const res = await fetch(URL+"/SignUp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: nickname, birth: birthdate, age: calculatedAge, 
                gender: gender, id: userid, pw: password, email: email
            })
        })
        const msg = await res.JSON().get("message");

        // 다음 화면으로 변경
        if (msg == "success") {
            alert("회원가입이 완료되었습니다.");
            window.location.href = "../body_info/body_info.html"; // 변경된 신체 정보 입력 페이지로 이동 
        }
        else {
            alert("이미 존재하는 ID입니다.");
        } // 경고 메세지. 이미 존재하는 id일 경우 실패 반환

        
    });
});