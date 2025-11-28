from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

from ..DB.LifeLogDB import LifeLogDB
from ..DB.BodyInfoDB import BodyInfoDB
from ..DB.FoodDB import FoodDB

class InfoServer:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)
        self.add_routes()
        self.app.run(host="0.0.0.0", port=7003)

    def add_routes(self):
        @self.app.get("/test")
        def test():
            return jsonify({"message": "Server is connected"})
        
        @self.app.post("/addBodyInfo")
        def addBodyInfo():
            data = request.json
            user_id, weight, height, activity_factor, blood_pressure_sys, blood_pressure_dia = (
                data.get("user_id"), data.get("weight"), data.get("height"), 
                data.get("activity_factor"), data.get("blood_pressure_sys"), data.get("blood_pressure_dia")
            )
            
            bodyInfoDB = BodyInfoDB()
            flag = bodyInfoDB.addBodyInfo(user_id, weight, height, activity_factor, blood_pressure_sys, blood_pressure_dia)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
        
        @self.app.post("/getBodyInfo")
        def getBodyInfo():
            data = request.json
            user_id = data.get("user_id")
            
            bodyInfoDB = BodyInfoDB()
            body_info = bodyInfoDB.getBodyInfo(user_id)
            return jsonify(body_info)

        @self.app.post("/addActualSleep")
        def addActualSleep():
            data = request.json
            user_id, start_time, end_time = (data.get("user_id"), data.get("start_time"), data.get("end_time"))
            start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
            end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
            
            lifeLogDB = LifeLogDB()
            flag = lifeLogDB.addActualSleep(user_id, start_time, end_time)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
            
        @self.app.post("/getActualSleep")
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
            
        @self.app.post("/addTargetSleep")
        def addTargetSleep():
            data = request.json
            user_id, interval_time = (data.get("user_id"), data.get("interval_time"))
            
            lifeLogDB = LifeLogDB()
            flag = lifeLogDB.addTargetSleep(user_id, interval_time)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
            
        @self.app.post("/getTargetSleep")
        def getTargetSleep():
            data = request.json
            user_id = data.get("user_id")
            
            lifeLogDB = LifeLogDB()
            target_sleep = lifeLogDB.getTargetSleep(user_id)
            return jsonify(target_sleep)
            
        @self.app.post("/addSteps")
        def addSteps():
            data = request.json
            user_id, steps = (data.get("user_id"), data.get("steps"))
            
            lifeLogDB = LifeLogDB()
            flag = lifeLogDB.addSteps(user_id, steps)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
            
        @self.app.post("/getSteps")
        def getSteps():
            data = request.json
            user_id, start_time, end_time = (data.get("user_id"), data.get("start_time"), data.get("end_time"))
            start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
            end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
            
            lifeLogDB = LifeLogDB()
            steps = lifeLogDB.getSteps(user_id, start_time, end_time)
            return jsonify(steps)
            
        @self.app.post("/addHeartRate")
        def addHeartRate():
            data = request.json
            user_id, heart_rate = (data.get("user_id"), data.get("heart_rate"))
            
            lifeLogDB = LifeLogDB()
            flag = lifeLogDB.addHeartRate(user_id, heart_rate)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
        
        @self.app.post("/getHeartRate")
        def getHeartRate():
            data = request.json
            user_id, start_time, end_time = (data.get("user_id"), data.get("start_time"), data.get("end_time"))
            start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
            end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
            
            lifeLogDB = LifeLogDB()
            heart_rate = lifeLogDB.getHeartRate(user_id, start_time, end_time)
            return jsonify(heart_rate)
        
        @self.app.post("/addFoodLog")
        def addFoodLog():
            data = request.json
            user_id, food_name, food_weight = (data.get("user_id"), data.get("food_name"), data.get("food_weight"))
            
            foodDB = FoodDB()
            flag = foodDB.addFoodLog(user_id, food_name, food_weight)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
        
        @self.app.post("/getFoodLog")
        def getFoodLog():
            data = request.json
            user_id, start_time, end_time = (data.get("user_id"), data.get("start_time"), data.get("end_time"))
            start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
            end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
            
            foodDB = FoodDB()
            food_log = foodDB.getFoodLog(user_id, start_time, end_time)
            return jsonify(food_log)
        
        @self.app.post("/deleteAllData")
        def deleteAllData():
            data = request.json
            user_id = data.get("user_id")
            
            bodyInfoDB = BodyInfoDB()
            flag = bodyInfoDB.deleteAllData(user_id)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
        