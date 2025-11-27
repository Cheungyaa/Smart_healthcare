from DBManager import DBManager

DBManager = DBManager()
connect = DBManager.getConnection()
cursor = DBManager.getCursor()

foods = [
    {"food_name": "김밥", "calories_per_gram": 1.6},
    {"food_name": "삼겹살", "calories_per_gram": 3.5},
    {"food_name": "불고기", "calories_per_gram": 2.0},
    {"food_name": "비빔밥", "calories_per_gram": 1.2},
    {"food_name": "된장찌개", "calories_per_gram": 0.5},
    {"food_name": "김치찌개", "calories_per_gram": 0.6},
    {"food_name": "라면", "calories_per_gram": 4.5},
    {"food_name": "칼국수", "calories_per_gram": 1.1},
    {"food_name": "떡볶이", "calories_per_gram": 1.8},
    {"food_name": "순대", "calories_per_gram": 1.5},
    {"food_name": "닭갈비", "calories_per_gram": 1.7},
    {"food_name": "삼계탕", "calories_per_gram": 1.0},
    {"food_name": "제육볶음", "calories_per_gram": 2.2},
    {"food_name": "갈비탕", "calories_per_gram": 0.9},
    {"food_name": "냉면", "calories_per_gram": 1.0},
    {"food_name": "쫄면", "calories_per_gram": 1.3},
    {"food_name": "짜장면", "calories_per_gram": 1.8},
    {"food_name": "짬뽕", "calories_per_gram": 0.9},
    {"food_name": "짬뽕밥", "calories_per_gram": 0.9},
    {"food_name": "볶음밥", "calories_per_gram": 1.6},
    {"food_name": "김치볶음밥", "calories_per_gram": 1.5},
    {"food_name": "새우볶음밥", "calories_per_gram": 1.5},
    {"food_name": "카레라이스", "calories_per_gram": 1.4},
    {"food_name": "토스트", "calories_per_gram": 2.5},
    {"food_name": "샌드위치", "calories_per_gram": 2.0},
    {"food_name": "햄버거", "calories_per_gram": 2.5},
    {"food_name": "치킨", "calories_per_gram": 2.3},
    {"food_name": "후라이드치킨", "calories_per_gram": 2.5},
    {"food_name": "양념치킨", "calories_per_gram": 2.4},
    {"food_name": "간장치킨", "calories_per_gram": 2.3},
    {"food_name": "감자튀김", "calories_per_gram": 3.0},
    {"food_name": "치즈피자", "calories_per_gram": 2.6},
    {"food_name": "페퍼로니피자", "calories_per_gram": 3.0},
    {"food_name": "불고기피자", "calories_per_gram": 2.8},
    {"food_name": "핫도그", "calories_per_gram": 2.4},
    {"food_name": "순살치킨", "calories_per_gram": 2.3},
    {"food_name": "돈까스", "calories_per_gram": 2.3},
    {"food_name": "카츠동", "calories_per_gram": 1.8},
    {"food_name": "규동", "calories_per_gram": 1.7},
    {"food_name": "라멘", "calories_per_gram": 1.3},
    {"food_name": "우동", "calories_per_gram": 0.8},
    {"food_name": "초밥", "calories_per_gram": 1.2},
    {"food_name": "연어초밥", "calories_per_gram": 1.5},
    {"food_name": "참치초밥", "calories_per_gram": 1.4},
    {"food_name": "광어초밥", "calories_per_gram": 1.0},
    {"food_name": "김치전", "calories_per_gram": 2.0},
    {"food_name": "파전", "calories_per_gram": 1.8},
    {"food_name": "부침개", "calories_per_gram": 1.7},
    {"food_name": "계란말이", "calories_per_gram": 1.8},
    {"food_name": "계란후라이", "calories_per_gram": 2.0},
    {"food_name": "감자탕", "calories_per_gram": 0.9},
    {"food_name": "돼지국밥", "calories_per_gram": 1.0},
    {"food_name": "순대국", "calories_per_gram": 0.9},
    {"food_name": "콩나물국밥", "calories_per_gram": 0.5},
    {"food_name": "설렁탕", "calories_per_gram": 0.7},
    {"food_name": "육개장", "calories_per_gram": 0.9},
    {"food_name": "갈비찜", "calories_per_gram": 2.2},
    {"food_name": "잡채", "calories_per_gram": 1.5},
    {"food_name": "닭강정", "calories_per_gram": 2.4},
    {"food_name": "족발", "calories_per_gram": 2.0},
    {"food_name": "보쌈", "calories_per_gram": 1.8},
    {"food_name": "오리고기", "calories_per_gram": 2.4},
    {"food_name": "편의점도시락", "calories_per_gram": 1.6},
    {"food_name": "김치", "calories_per_gram": 0.2},
    {"food_name": "깍두기", "calories_per_gram": 0.3},
    {"food_name": "백김치", "calories_per_gram": 0.1},
    {"food_name": "나물비빔밥", "calories_per_gram": 1.0},
    {"food_name": "해장국", "calories_per_gram": 0.7},
    {"food_name": "부대찌개", "calories_per_gram": 1.2},
    {"food_name": "감자조림", "calories_per_gram": 1.1},
    {"food_name": "고등어구이", "calories_per_gram": 2.0},
    {"food_name": "삼치구이", "calories_per_gram": 2.1},
    {"food_name": "갈치조림", "calories_per_gram": 1.4},
    {"food_name": "오징어볶음", "calories_per_gram": 1.2},
    {"food_name": "두부김치", "calories_per_gram": 1.0},
    {"food_name": "비빔국수", "calories_per_gram": 1.3},
    {"food_name": "콩국수", "calories_per_gram": 1.0},
    {"food_name": "고기만두", "calories_per_gram": 2.3},
    {"food_name": "김치만두", "calories_per_gram": 2.0},
    {"food_name": "찐만두", "calories_per_gram": 1.5},
    {"food_name": "군만두", "calories_per_gram": 2.5},
    {"food_name": "호떡", "calories_per_gram": 3.0},
    {"food_name": "붕어빵", "calories_per_gram": 2.0},
    {"food_name": "풀빵", "calories_per_gram": 2.1},
    {"food_name": "찹쌀떡", "calories_per_gram": 2.0},
    {"food_name": "인절미", "calories_per_gram": 1.7},
    {"food_name": "꿀떡", "calories_per_gram": 2.0},
    {"food_name": "아메리카노", "calories_per_gram": 0.0},
    {"food_name": "카페라떼", "calories_per_gram": 0.6},
    {"food_name": "초코우유", "calories_per_gram": 0.9},
    {"food_name": "딸기우유", "calories_per_gram": 0.9},
    {"food_name": "바나나우유", "calories_per_gram": 1.0},
    {"food_name": "식빵", "calories_per_gram": 2.6},
    {"food_name": "크로아상", "calories_per_gram": 4.0},
    {"food_name": "도넛", "calories_per_gram": 4.3},
    {"food_name": "초코파이", "calories_per_gram": 4.2},
    {"food_name": "라떼빙수", "calories_per_gram": 1.0}
]

import datetime
average_by_age_gender = [
    {"age_group": 10, "gender": 0, "avg_sleep_time": datetime.timedelta(hours=8, minutes=37), "avg_steps": 10000, "avg_weight": 50.0, "avg_height": 155.0},
    {"age_group": 10, "gender": 1, "avg_sleep_time": datetime.timedelta(hours=8, minutes=37), "avg_steps": 10000, "avg_weight": 55.0, "avg_height": 165.0},
    {"age_group": 20, "gender": 0, "avg_sleep_time": datetime.timedelta(hours=8, minutes=26), "avg_steps": 9500, "avg_weight": 57.0, "avg_height": 159.6},
    {"age_group": 20, "gender": 1, "avg_sleep_time": datetime.timedelta(hours=8, minutes=26), "avg_steps": 11000, "avg_weight": 72.0, "avg_height": 172.5},
    {"age_group": 30, "gender": 0, "avg_sleep_time": datetime.timedelta(hours=8, minutes=6), "avg_steps": 9000, "avg_weight": 59.0, "avg_height": 159.6},
    {"age_group": 30, "gender": 1, "avg_sleep_time": datetime.timedelta(hours=8, minutes=6), "avg_steps": 10500, "avg_weight": 78.0, "avg_height": 172.5},
    {"age_group": 40, "gender": 0, "avg_sleep_time": datetime.timedelta(hours=7, minutes=52), "avg_steps": 8500, "avg_weight": 60.0, "avg_height": 159.6},
    {"age_group": 40, "gender": 1, "avg_sleep_time": datetime.timedelta(hours=7, minutes=52), "avg_steps": 10000, "avg_weight": 76.0, "avg_height": 172.5},
    {"age_group": 50, "gender": 0, "avg_sleep_time": datetime.timedelta(hours=7, minutes=40), "avg_steps": 8000, "avg_weight": 59.0, "avg_height": 159.6},
    {"age_group": 50, "gender": 1, "avg_sleep_time": datetime.timedelta(hours=7, minutes=40), "avg_steps": 9500, "avg_weight": 73.0, "avg_height": 172.5},
    {"age_group": 60, "gender": 0, "avg_sleep_time": datetime.timedelta(hours=7, minutes=45), "avg_steps": 7000, "avg_weight": 58.0, "avg_height": 159.6},
    {"age_group": 60, "gender": 1, "avg_sleep_time": datetime.timedelta(hours=7, minutes=45), "avg_steps": 8000, "avg_weight": 70.0, "avg_height": 172.5},
    {"age_group": 70, "gender": 0, "avg_sleep_time": datetime.timedelta(hours=7, minutes=50), "avg_steps": 6500, "avg_weight": 56.0, "avg_height": 159.6},
    {"age_group": 70, "gender": 1, "avg_sleep_time": datetime.timedelta(hours=7, minutes=50), "avg_steps": 7000, "avg_weight": 67.0, "avg_height": 172.5},
    {"age_group": 80, "gender": 0, "avg_sleep_time": datetime.timedelta(hours=8, minutes=0), "avg_steps": 6000, "avg_weight": 53.0, "avg_height": 159.6},
    {"age_group": 80, "gender": 1, "avg_sleep_time": datetime.timedelta(hours=8, minutes=0), "avg_steps": 6500, "avg_weight": 64.0, "avg_height": 172.5},
]

# for food in foods:
#     cursor.execute("DELETE FROM food")
#     connect.commit()
#     cursor.execute("INSERT INTO food (food_name, calories_per_gram) VALUES (:food_name, :calories_per_gram)", food)
#     print("success : ", food)
#     connect.commit()

for average in average_by_age_gender:
    cursor.execute("DELETE FROM Average_by_age_gender")
    connect.commit()
    cursor.execute("INSERT INTO Average_by_age_gender (age_group, gender, avg_sleep_time, avg_steps, avg_weight, avg_height) VALUES (:age_group, :gender, :avg_sleep_time, :avg_steps, :avg_weight, :avg_height)", average)
    print("success : ", average)
    connect.commit()
    
cursor.close()
connect.close()