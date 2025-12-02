from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta

from ..DB.UserDB import UserDB
from ..DB.LifeLogDB import LifeLogDB
from ..DB.BodyInfoDB import BodyInfoDB
from ..DB.FoodDB import FoodDB
from ..DB.TargetDB import TargetDB

app = Flask(__name__)
CORS(app)

class InfoServer:
    def __init__(self):
        self.add_routes()

    def add_routes(self):
        @app.get("/")
        def index():
            return jsonify({"message": "Smart Healthcare InfoServer 정상 동작 중!"})

        @app.post("/getTarget")
        def getTarget():
            data = request.json
            user_id = data.get("user_id")
            
            targetDB = TargetDB()
            target = targetDB.getTargetClose(user_id)
            target["sleep"] = str(target["sleep"])
            return jsonify(target) #({user_id, sleep, steps, weight, food})
        
        # BodyInfo
        @app.post("/addBodyInfo")
        def addBodyInfo():
            data = request.json
            user_id, weight, height, activity_factor, blood_pressure_sys, blood_pressure_dia = (
                data.get("user_id"), data.get("weight"), data.get("height"), 
                data.get("activity_factor"), data.get("blood_pressure_sys"), data.get("blood_pressure_dia")
            )
            
            bodyInfoDB = BodyInfoDB()
            flag = bodyInfoDB.updateBodyInfo(user_id, height, activity_factor, blood_pressure_sys, blood_pressure_dia)
            print(flag)
            if not flag : return jsonify({"message": "fail"})
            
            bodyInfoDB = BodyInfoDB()
            time = datetime.now()
            flag = bodyInfoDB.addWeight(user_id, weight, time)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
        
        @app.post("/addHeight")
        def addHeight():
            data = request.json
            user_id, height = (data.get("user_id"), data.get("height"))
            
            bodyInfoDB = BodyInfoDB()
            flag = bodyInfoDB.updateHeight(user_id, height)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
        
        @app.post("/getBodyInfo")
        def getBodyInfo():
            data = request.json
            user_id = data.get("user_id")
            
            bodyInfoDB = BodyInfoDB()
            body_info = bodyInfoDB.getBodyInfo(user_id)
            return jsonify(body_info)

        # Weight
        @app.post("/addWeight")
        def addWeight():
            data = request.json
            user_id, weight, time = (data.get("user_id"), data.get("weight"), data.get("time"))
            time = datetime.strptime(time, "%Y-%m-%d %H:%M:%S")
            
            bodyInfoDB = BodyInfoDB()
            flag = bodyInfoDB.addWeight(user_id, weight, time)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
        
        @app.post("/getWeight")
        def getWeight():
            data = request.json
            user_id, start_time, end_time = (data.get("user_id"), data.get("start_time"), data.get("end_time"))
            start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
            end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
            
            bodyInfoDB = BodyInfoDB()
            weight = bodyInfoDB.getWeight(user_id, start_time, end_time)
            return jsonify(weight) # [{weight, bmi, time, recorded_at}]

        @app.post("/addTargetWeight")
        def addTargetWeight():
            data = request.json
            user_id, target_weight = (data.get("user_id"), data.get("target_weight"))
            
            targetDB = TargetDB()
            flag = targetDB.addTargetWeight(user_id, target_weight)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})

        # Sleep
        @app.post("/addActualSleep")
        def addActualSleep():
            data = request.json
            user_id, start_time, end_time = (data.get("user_id"), data.get("start_time"), data.get("end_time"))
            start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
            end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
            
            lifeLogDB = LifeLogDB()
            flag = lifeLogDB.addActualSleep(user_id, start_time, end_time)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
            
        @app.post("/getActualSleep")
        def getActualSleep():
            data = request.json
            user_id, start_time, end_time = (data.get("user_id"), data.get("start_time"), data.get("end_time"))
            start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
            end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
            
            lifeLogDB = LifeLogDB()
            actual_sleep = lifeLogDB.getActualSleep(user_id, start_time, end_time)
            for i in range(len(actual_sleep)):
                actual_sleep[i]["actual_sleep_time"] = str(actual_sleep[i]["actual_sleep_time"])
            return jsonify(actual_sleep)
            
        @app.post("/addTargetSleep")
        def addTargetSleep():
            data = request.json
            user_id, target_sleep_time = (data.get("user_id"), data.get("target_sleep_time"))
            h, m, s = target_sleep_time.split(":")
            target_sleep_time = timedelta(hours=int(h), minutes=int(m), seconds=int(s))
            
            targetDB = TargetDB()
            flag = targetDB.addTargetSleep(user_id, target_sleep_time)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})

        # Steps
        @app.post("/addSteps")
        def addSteps():
            data = request.json
            user_id, steps, time = (data.get("user_id"), data.get("steps"), data.get("time"))
            time = datetime.strptime(time, "%Y-%m-%d %H:%M:%S")
            
            lifeLogDB = LifeLogDB()
            flag = lifeLogDB.addSteps(user_id, steps, time)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
            
        @app.post("/getSteps")
        def getSteps():
            data = request.json
            user_id, start_time, end_time = (data.get("user_id"), data.get("start_time"), data.get("end_time"))
            start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
            end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
            
            lifeLogDB = LifeLogDB()
            steps = lifeLogDB.getSteps(user_id, start_time, end_time)
            return jsonify(steps)
        
        @app.post("/addTargetSteps")
        def addTargetSteps():
            data = request.json
            user_id, target_steps = (data.get("user_id"), data.get("target_steps"))
            
            targetDB = TargetDB()
            flag = targetDB.addTargetSteps(user_id, target_steps)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
            
        # HeartRate
        @app.post("/addHeartRate")
        def addHeartRate():
            data = request.json
            user_id, heart_rate, time = (data.get("user_id"), data.get("heart_rate"), data.get("time"))
            time = datetime.strptime(time, "%Y-%m-%d %H:%M:%S")
            
            lifeLogDB = LifeLogDB()
            flag = lifeLogDB.addHeartRate(user_id, heart_rate, time)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
        
        @app.post("/getHeartRate")
        def getHeartRate():
            data = request.json
            user_id, start_time, end_time = (data.get("user_id"), data.get("start_time"), data.get("end_time"))
            start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
            end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
            
            lifeLogDB = LifeLogDB()
            heart_rate = lifeLogDB.getHeartRate(user_id, start_time, end_time)
            return jsonify(heart_rate)
        
        # Food
        @app.post("/addFoodLog")
        def addFoodLog():
            data = request.json
            user_id, food_name, food_weight, time = (data.get("user_id"), data.get("food_name"), data.get("food_weight"), data.get("time"))
            time = datetime.strptime(time, "%Y-%m-%d %H:%M:%S")
            
            foodDB = FoodDB()
            flag = foodDB.addFoodLog(user_id, food_name, food_weight, time)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
        
        @app.post("/getFoodLog")
        def getFoodLog():
            data = request.json
            user_id, start_time, end_time = (data.get("user_id"), data.get("start_time"), data.get("end_time"))
            start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
            end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
            
            foodDB = FoodDB()
            food_log = foodDB.getFoodLog(user_id, start_time, end_time)
            return jsonify(food_log)
        
        @app.post("/addTargetCalories")
        def addTargetCalories():
            data = request.json
            user_id, target_calories = (data.get("user_id"), data.get("target_calories"))
            
            targetDB = TargetDB()
            flag = targetDB.addTargetCalories(user_id, target_calories)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
        
        # Delete
        @app.post("/deleteAllData")
        def deleteAllData():
            data = request.json
            user_id = data.get("user_id")
            
            userDB = UserDB()
            flag = userDB.deleteAllData(user_id)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})

        @app.post("/deleteAccount")
        def deleteAccount():
            data = request.json
            user_id = data.get("user_id")
            
            userDB = UserDB()
            flag = userDB.deleteAllData(user_id)
            if not flag: return jsonify({"message": "fail"})
            
            userDB = UserDB()
            flag = userDB.deleteAccount(user_id)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})


# Flask 앱이 임포트될 때 라우트가 등록되도록 클래스 인스턴스를 생성합니다.
InfoServer()
        