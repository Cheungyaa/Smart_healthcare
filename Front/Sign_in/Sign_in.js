const URL = "http://htaeky.iptime.org:7002";
// const URL = "http://localhost:7002";


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
    event.preventDefault();

    const nickname = event.target.nickname.value.trim();
    const birthdate = event.target.birthdate.value;
    const gender = event.target.gender.value; // "male" | "female"
    const userid = event.target.userid.value.trim();
    const password = event.target.password.value;
    const email = event.target.email.value.trim();

    if (!nickname || !birthdate || !gender || !userid || !password || !email) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    // 만 나이 다시 계산
    const birthDate = new Date(birthdate);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    // 성별 숫자 매핑 (백엔드 규칙에 맞게 조정)
    const genderValue = gender === "male" ? 1 : 2;

    console.log("회원가입 정보:", {
      nickname,
      birthdate,
      calculatedAge,
      genderValue,
      userid,
      password,
      email
    });

    try {
      const res = await fetch(URL + "/SignUp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nickname,
          birth: birthdate,
          age: calculatedAge,
          gender: genderValue,   // 숫자로 전송
          id: userid,
          pw: password,
          email: email
        })
      });

      if (!res.ok) {
        console.error("서버 응답 오류:", res.status);
        alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const data = await res.json();
      const msg = data.message;

      if (msg === "success") {
        // 🔥 가입 성공 → 로그인 상태처럼 처리
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", userid);
        if (data.user_id) {
          localStorage.setItem("user_id", data.user_id);
        }

        alert("회원가입이 완료되었습니다.");
        window.location.href = "../body_info/body_info.html";
      } else {
        alert("이미 존재하는 ID입니다.");
      }
    } catch (err) {
      console.error("회원가입 요청 에러:", err);
      alert("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
    }
  });
});