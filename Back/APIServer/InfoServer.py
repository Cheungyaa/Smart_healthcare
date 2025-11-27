from flask import Flask, request, jsonify
from flask_cors import CORS

from DB.LifeLogDB import LifeLogDB
from DB.BodyInfoDB import BodyInfoDB

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
            user_id, weight, height, activity_factor, blood_pressure = (
                data.get("user_id"), data.get("weight"), data.get("height"), 
                data.get("activity_factor"), data.get("blood_pressure")
            )
            
            bodyInfoDB = BodyInfoDB()
            flag = bodyInfoDB.addBodyInfo(user_id, weight, height, activity_factor, blood_pressure)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
        
        @self.app.post("/getBodyInfo")
        def getBodyInfo():
            data = request.json
            user_id = data.get("user_id")
            
            bodyInfoDB = BodyInfoDB()
            body_info = bodyInfoDB.getBodyInfo(user_id)
            body_info.replace("\n", "").replace("\r", "")
            return jsonify(body_info)

        @self.app.post("/addActualSleep")
        def addActualSleep():
            data = request.json
            user_id, start, end = (
                data.get("user_id"), data.get("start"), data.get("end")
            )
            
            lifeLogDB = LifeLogDB()
            flag = lifeLogDB.addActualSleep(user_id, start, end)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
            
        @self.app.post("/getActualSleep")
        def getActualSleep():
            data = request.json
            user_id, start, end = (data.get("user_id"), data.get("start"), data.get("end"))
            
            lifeLogDB = LifeLogDB()
            actual_sleep = lifeLogDB.getActualSleep(user_id, start, end)
            actual_sleep.replace("\n", "").replace("\r", "")
            return jsonify(actual_sleep)
            
        @self.app.post("/addTargetSleep")
        def addTargetSleep():
            data = request.json
            user_id, interval = (data.get("user_id"), data.get("interval"))
            
            lifeLogDB = LifeLogDB()
            flag = lifeLogDB.addTargetSleep(user_id, interval)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
            
        @self.app.post("/getTargetSleep")
        def getTargetSleep():
            data = request.json
            user_id = data.get("user_id")
            
            lifeLogDB = LifeLogDB()
            target_sleep = lifeLogDB.getTargetSleep(user_id)
            target_sleep.replace("\n", "").replace("\r", "")
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
            user_id, start, end = (data.get("user_id"), data.get("start"), data.get("end"))
            
            lifeLogDB = LifeLogDB()
            steps = lifeLogDB.getSteps(user_id, start, end)
            steps.replace("\n", "").replace("\r", "")
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
            user_id, start, end = (data.get("user_id"), data.get("start"), data.get("end"))
            
            lifeLogDB = LifeLogDB()
            heart_rate = lifeLogDB.getHeartRate(user_id, start, end)
            heart_rate.replace("\n", "").replace("\r", "")
            return jsonify(heart_rate)
            
