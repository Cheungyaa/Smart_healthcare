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
        # 사용자의 모든 데이터를 삭제 (계정 정보 제외)
        tables = ["sleep_actual", "target", "steps", "heart_rate", "food_log", "weight_log", "Body_info"]
        
        for table in tables:
            try:
                self.cur.execute(f"""
                    DELETE FROM {table}
                    WHERE user_id = :user_id
                    """, {"user_id": user_id})
            except Exception as e:
                print(f"Error deleting from {table}: {e}")
                # 테이블이 없거나 에러가 발생해도 계속 진행
                continue
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def deleteAccount(self, user_id):
        # Body_info 테이블에서도 삭제 (User 테이블과 연결되어 있음)
        try:
            self.cur.execute("""
                DELETE FROM Body_info
                WHERE user_id = :user_id
                """, {"user_id": user_id})
        except Exception as e:
            print(f"Error deleting from Body_info: {e}")
        
        # User 테이블에서 삭제
        self.cur.execute("""
            DELETE FROM "User"
            WHERE user_id = :user_id
            """, {"user_id": user_id})
        
        self.connect.commit()
        self.dbManager.close()
        return True