HostServer/DB.py <- dsn에 db 주소 입력
main/config.js <- 로컬 주소로 테스트하거나, api서버 주소 입력
** 테스트 할 땐 주소 쓰고, 깃허브에 업로드할 땐 서버 주소 올리지 마셈 **


====== 테이블 구조 ======
CREATE TABLE "User" (
    user_id VARCHAR2(255) PRIMARY KEY,
    user_password VARCHAR2(255),
    user_name VARCHAR2(255),
    email VARCHAR2(255)
);

CREATE TABLE Life_log (
    user_id VARCHAR2(255),
    actual_start_sleep_time TIMESTAMP,
    actual_end_sleep_time TIMESTAMP,
    actual_sleep_time INTERVAL DAY TO SECOND,
    target_sleep_time INTERVAL DAY TO SECOND,
    steps NUMBER,
    heart_rate NUMBER,
    recorded_at TIMESTAMP,
    CONSTRAINT pk_life_log PRIMARY KEY (user_id, recorded_at),
    CONSTRAINT fk_life_user FOREIGN KEY (user_id) REFERENCES "User"(user_id)
);

CREATE TABLE Body_info (
    user_id VARCHAR2(255),
    gender NUMBER(1),  -- 0: female, 1: male
    age NUMBER,
    birth TIMESTAMP,
    weight NUMBER,
    height NUMBER,
    bmi NUMBER,
    blood_pressure NUMBER,
    activity_factor NUMBER,
    recorded_at TIMESTAMP,
    CONSTRAINT pk_body_info PRIMARY KEY (user_id, recorded_at),
    CONSTRAINT fk_body_user FOREIGN KEY (user_id) REFERENCES "User"(user_id)
);

CREATE TABLE Food (
    food_name VARCHAR2(255) PRIMARY KEY,
    calories_per_gram NUMBER
);

CREATE TABLE Food_log (
    user_id VARCHAR2(255),
    food_name VARCHAR2(255),
    food_weight NUMBER,
    food_calories NUMBER,
    recorded_at TIMESTAMP,
    CONSTRAINT pk_food_log PRIMARY KEY (user_id, recorded_at),
    CONSTRAINT fk_foodlog_user FOREIGN KEY (user_id) REFERENCES "User"(user_id),
    CONSTRAINT fk_foodlog_food FOREIGN KEY (food_name) REFERENCES Food(food_name)
);

CREATE TABLE Average_by_age_gender (
    age_group NUMBER,
    gender NUMBER(1),  -- 0: female, 1: male
    avg_sleep_time INTERVAL DAY TO SECOND,
    avg_steps NUMBER,
    avg_weight NUMBER,
    avg_height NUMBER,
    CONSTRAINT pk_avg_age_gender PRIMARY KEY (age_group, gender)
);
