document.addEventListener("DOMContentLoaded", () => {
    const bodyInfoForm = document.getElementById("body-info-form");

    bodyInfoForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const weight = parseFloat(event.target.weight.value);
        const height = parseFloat(event.target.height.value);
        const bloodPressureStr = event.target.blood_pressure.value;
        const activity_factor = parseFloat(event.target.activity_factor.value);
        const recorded_at = new Date().toISOString(); // timestamp

        // ------------------------------------------
        // 🔥 혈압(120/80 형태)을 숫자 2개로 분리
        // ------------------------------------------
        let systolic = null;
        let diastolic = null;

        if (bloodPressureStr.includes("/")) {
            const bp = bloodPressureStr.split("/");
            systolic = parseInt(bp[0]);
            diastolic = parseInt(bp[1]);
        } else {
            alert("혈압은 120/80 형태로 입력해주세요.");
            return;
        }

        // ------------------------------------------
        // 🔥 BMI 자동 계산 (DB 컬럼에도 존재)
        // BMI = 체중(kg) / (신장(m)^2)
        // ------------------------------------------
        const bmi = weight / Math.pow(height / 100, 2);

        // ------------------------------------------
        // 🔥 DB 스키마에 맞춰 저장할 데이터 payload 구성
        // ------------------------------------------
        const bodyInfoData = {
            weight: weight,
            height: height,
            blood_pressure_systolic: systolic,
            blood_pressure_diastolic: diastolic,
            activity_factor: activity_factor,
            bmi: bmi.toFixed(1),
            recorded_at: recorded_at
        };

        console.log("📌 서버로 전송될 신체 정보:", bodyInfoData);

        // ------------------------------------------
        // 🔥 실제 서버로 전송 (예시: FastAPI 또는 Flask)
        // 팀원 서버 URL 맞춰서 변경
        // ------------------------------------------
        fetch("http://htaeky.iptime.org:7002/api/body-info", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyInfoData)
        })
        .then(res => res.json())
        .then(data => {
            console.log("서버 응답:", data);
            alert("정보가 성공적으로 저장되었습니다!");
            window.location.href = "../main/main.html";
        })
        .catch(err => {
            console.error("서버 오류:", err);
            alert("서버 연결 오류가 발생했습니다.");
        });
    });
});