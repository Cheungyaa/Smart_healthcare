import { INFO_URL } from '../main/config.js';

document.addEventListener("DOMContentLoaded", () => {
    const bodyInfoForm = document.getElementById("body-info-form");

    bodyInfoForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const weight = parseFloat(event.target.weight.value);
        const height = parseFloat(event.target.height.value);
        const bloodPressureStr = event.target.blood_pressure.value;
        const activity_factor = parseFloat(event.target.activity_factor.value);
        const recorded_at = new Date().toISOString(); // timestamp

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


        const bodyInfoData = {
            user_id: localStorage.getItem("username"),
            weight: weight,
            height: height,
            blood_pressure_sys: systolic,
            blood_pressure_dia: diastolic,
            activity_factor: activity_factor
        };

        console.log("서버로 전송될 신체 정보:", bodyInfoData);

        const res = await fetch(`${INFO_URL}/addBodyInfo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyInfoData)
        })

        const data = await res.json();
        const msg = data.message;

        // 로그인 성공 시 대시보드 페이지로 이동
        if (msg == "success") {
            alert("정보가 성공적으로 저장되었습니다!");
            window.location.href = "../main/main.html"; // log_in -> main 폴더로 이동} // 다음 화면으로 변경
        }
        else {
            alert("정보 저장에 실패했습니다"); // 경고 메세지 출력
        }
    });
});