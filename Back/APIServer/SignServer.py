from flask import Flask, request, jsonify
from flask_cors import CORS

from ..DB.UserDB import UserDB

class SignServer:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)
        self.add_routes()
        self.app.run(host="0.0.0.0", port=7002)

    def add_routes(self):
        @self.app.get("/test")
        def test():
            return jsonify({"message": "Server is connected"})

        @self.app.post("/SignUp")
        def signUp():
            data = request.json
            name, birth, age, gender_str, id, pw, email = (
                data.get("name"), data.get("birth"), data.get("age"), 
                data.get("gender"), data.get("id"), data.get("pw"), data.get("email")
            )
            
            gender = 1 if gender_str == "male" else 0
            
            userDB = UserDB()
            flag = userDB.signUp(name, birth, age, gender, id, pw, email)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})
            
        @self.app.post("/LogIn")
        def logIn():
            data = request.json
            id, pw = (data.get("id"), data.get("pw"))
            
            userDB = UserDB()
            flag = userDB.logIn(id, pw)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})

