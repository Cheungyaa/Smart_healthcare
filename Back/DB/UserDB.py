from .DBManager import DBManager
from datetime import datetime

class UserDB:
    def __init__(self):
        self.connect = DBManager.getConnection()
        self.cur = DBManager.getCursor()
    
    def signUp(self, name, birth_str, age, gender, id, pw, email):
        self.cur.execute("""
            SELECT user_id
            FROM "User"
            WHERE user_id = :id
        """, {"id": id})
        temp = self.cur.fetchone()
        
        if temp :
            return False
        
        birth = datetime.strptime(birth_str, "%Y-%m-%d").date()
        
        self.cur.execute("""
            INSERT INTO "User" (user_id, user_password, user_name, email)
            VALUES (:id, :pw, :name, :email)
            """, {"id": id, "pw": pw, "name": name, "email": email}
        )
        
        self.cur.execute("""
            INSERT INTO Body_info (user_id, gender, age, birth)
            VALUES (:id, :gender, :age, :birth)
            """, {"id": id, "gender": gender, "age": age, "birth": birth}
        )
        
        self.connect.commit()
        DBManager.close()
        return True
    
    def logIn(self, id, pw) :
        self.cur.execute("""
            SELECT user_id, user_password
            FROM "User"
            WHERE user_id = :id
            """, {"id": id})
        status = self.cur.fetchone()
        
        DBManager.close()
        if not status : return False
        return True if status['USER_PASSWORD'] == pw else False