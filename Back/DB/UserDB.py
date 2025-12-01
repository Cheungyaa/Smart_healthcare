from .DBManager import DBManager
from datetime import datetime

class UserDB:
    def __init__(self):
        self.dbManager = DBManager()
        self.connect = self.dbManager.getConnection()
        self.cur = self.dbManager.getCursor()
    
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
        self.dbManager.close()
        return True
    
    def logIn(self, id, pw) :
        self.cur.execute("""
            SELECT user_id, user_password
            FROM "User"
            WHERE user_id = :id
            """, {"id": id})
        status = self.cur.fetchone()
        print(status)
        
        self.dbManager.close()
        if not status : return False
        return True if status["user_password"] == pw else False
    
    def deleteAllData(self, user_id):
        tables = ["sleep_actual", "target", "steps", "heart_rate", "food_log"]
        
        for table in tables:
            self.cur.execute(f"""
                DELETE FROM {table}
                WHERE user_id = :user_id
                """, {"user_id": user_id})
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def deleteAccount(self, user_id):
        self.cur.execute("""
            DELETE FROM "User"
            WHERE user_id = :user_id
            """, {"user_id": user_id})
        
        self.connect.commit()
        self.dbManager.close()
        return True