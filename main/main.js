

console.log("✅ Life Log Dashboard loaded.");

// 로그인 상태를 임시로 저장하는 변수 (실제 구현에서는 서버 세션이나 토큰 사용)
const isLoggedIn = false; 

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    // 로그인 상태가 아니고, 클릭한 메뉴가 'Dashboard'가 아닐 경우
    if (!isLoggedIn && item.textContent !== "Dashboard") {
      alert("로그인이 필요한 서비스입니다.");
      window.location.href = "../log_in/login.html";
      return; 
    }

    // 'Dashboard' 클릭 시 또는 로그인 상태일 때 메뉴 활성화 로직
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
  });
});

// 헤더의 로그인 버튼 클릭 시 로그인 페이지로 이동
const loginButton = document.getElementById("login-btn");
if (loginButton) {
  loginButton.addEventListener("click", () => {
    window.location.href = "../log_in/login.html";
  });
}

// 헤더의 회원가입 버튼 클릭 시 회원가입 페이지로 이동
const signupButton = document.getElementById("signup-btn");
if (signupButton) {
  signupButton.addEventListener("click", () => {
    window.location.href = "../Sign_in/Sign_in.html";
  });
}
