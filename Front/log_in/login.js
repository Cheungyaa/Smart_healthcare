import { SIGN_URL } from '../main/config.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // 폼의 기본 제출 동작을 막습니다.

      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');

      const id = usernameInput.value;
      const pw = passwordInput.value;

      try {
        const response = await fetch(`${SIGN_URL}/LogIn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, pw }),
        });

        const result = await response.json();

        if (result.message === 'success') {
          alert('로그인 성공!');
          // localStorage에 로그인 상태와 사용자 ID 저장
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('username', id);
          window.location.href = '../main/main.html'; // 메인 페이지로 이동
        } else {
          alert('아이디 또는 비밀번호가 일치하지 않습니다.');
        }
      } catch (error) {
        console.error('로그인 요청 중 오류 발생:', error);
        alert('로그인 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
      }
    });
  }
});