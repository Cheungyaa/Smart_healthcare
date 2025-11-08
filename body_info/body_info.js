document.addEventListener("DOMContentLoaded", () => {
    const bodyInfoForm = document.getElementById("body-info-form");

    bodyInfoForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const weight = event.target.weight.value;
        const height = event.target.height.value;
        const blood_pressure = event.target.blood_pressure.value;
        const activity_factor = event.target.activity_factor.value;
        const recorded_at = new Date().toISOString(); // 현재 시간을 ISO 형식의 타임스탬프로 자동 생성

        console.log("추가 정보:", {
            weight,
            height,
            blood_pressure,
            activity_factor,
            recorded_at
        });

        // 여기에 실제 서버로 신체 정보 저장 요청을 보내는 코드를 추가합니다.

        alert("모든 정보가 저장되었습니다. Life Log 대시보드를 시작합니다!");
        window.location.href = "../main/main.html";
    });
});