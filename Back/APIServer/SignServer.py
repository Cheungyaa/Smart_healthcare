from flask import Flask, request, jsonify
from flask_cors import CORS

from ..DB.UserDB import UserDB

app = Flask(__name__)
CORS(app)

class SignServer:
    def __init__(self):
        self.add_routes()

    def add_routes(self):
        @app.get("/")
        def index():
            return jsonify({"message": "Smart Healthcare SignServer 정상 동작 중!"})
        
        @app.get("/test")
        def test():
            return jsonify({"message": "Server is connected"})

        @app.post("/SignUp")
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
            
        @app.post("/LogIn")
        def logIn():
            data = request.json
            id, pw = (data.get("id"), data.get("pw"))
            
            userDB = UserDB()
            flag = userDB.logIn(id, pw)
            return jsonify({"message": "success"}) if flag else jsonify({"message": "fail"})

# Flask 앱이 임포트될 때 라우트가 등록되도록 클래스 인스턴스를 생성합니다.
SignServer()
