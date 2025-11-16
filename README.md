# 📊 Smart Health Log Project

건강 데이터를 기록하고 분석하는 **스마트 헬스케어 웹 프로젝트**입니다.

## 📁 프로젝트 구조

- **`HostServer/DB.py`**
  - 🗄️ `dsn`에 DB 주소 입력
- **`main/config.js`**
  - 🧪 테스트 시 로컬 주소 사용
  - 🌐 실제 서비스 시 API 서버 주소 입력
- ⚠️ **주의:** 테스트할 땐 주소 넣고, GitHub에 올릴 때 서버 주소는 제외하세요!

---

## 📋 데이터베이스 테이블 구조

### 👤 User

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `user_id` | VARCHAR2(255) | PK |
| `user_password` | VARCHAR2(255) | 🔐 암호화된 비밀번호 |
| `user_name` | VARCHAR2(255) | 사용자 이름 |
| `email` | VARCHAR2(255) | 이메일 |

---

### 🛌 Life_log

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `user_id` | VARCHAR2(255) | FK → User |
| `actual_start_sleep_time` | TIMESTAMP | 실제 수면 시작 |
| `actual_end_sleep_time` | TIMESTAMP | 실제 수면 종료 |
| `actual_sleep_time` | INTERVAL | 실제 수면 시간 |
| `target_sleep_time` | INTERVAL | 목표 수면 시간 |
| `steps` | NUMBER | 걸음 수 👣 |
| `heart_rate` | NUMBER | 심박수 ❤️ |
| `recorded_at` | TIMESTAMP | 기록 시간 |
| ⛳ PK | `(user_id, recorded_at)` |

---

### 🧍 Body_info

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `user_id` | VARCHAR2(255) | FK → User |
| `gender` | NUMBER(1) | 0: 여성 🚺 / 1: 남성 🚹 |
| `age` | NUMBER | 나이 |
| `birth` | TIMESTAMP | 생년월일 🎂 |
| `weight` | NUMBER | 체중 ⚖️ |
| `height` | NUMBER | 키 📏 |
| `bmi` | NUMBER | BMI |
| `blood_pressure` | NUMBER | 혈압 |
| `activity_factor` | NUMBER | 활동 지수 🏃 |
| `recorded_at` | TIMESTAMP | 기록 시간 |
| ⛳ PK | `(user_id, recorded_at)` |

---

### 🍽️ Food

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `food_name` | VARCHAR2(255) | PK - 음식 이름 |
| `calories_per_gram` | NUMBER | 1g당 칼로리 🔥 |

---

### 🗒️ Food_log

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `user_id` | VARCHAR2(255) | FK → User |
| `food_name` | VARCHAR2(255) | FK → Food |
| `food_weight` | NUMBER | 섭취량 (g) |
| `food_calories` | NUMBER | 칼로리 총량 |
| `recorded_at` | TIMESTAMP | 기록 시간 |
| ⛳ PK | `(user_id, recorded_at)` |

---

### 📈 Average_by_age_gender

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `age_group` | NUMBER | 연령대 |
| `gender` | NUMBER(1) | 0: 여성 🚺 / 1: 남성 🚹 |
| `avg_sleep_time` | INTERVAL | 평균 수면 시간 😴 |
| `avg_steps` | NUMBER | 평균 걸음 수 👟 |
| `avg_weight` | NUMBER | 평균 체중 ⚖️ |
| `avg_height` | NUMBER | 평균 키 📏 |
| ⛳ PK | `(age_group, gender)` |

---

## 📌 추가 안내

- 🔐 비밀번호는 반드시 **해시 처리** 후 저장해야 합니다.
- ⚠️ **개인정보 포함 데이터는 GitHub에 직접 업로드하지 마세요.**
- 💾 실제 서버 사용 시 `.gitignore`에 설정 파일 추가를 권장합니다.

---
