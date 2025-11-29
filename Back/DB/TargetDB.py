from .DBManager import DBManager

class TargetDB:
    def __init__(self):
        self.dbManager = DBManager()
        self.connect = self.dbManager.getConnection()
        self.cur = self.dbManager.getCursor()
    
    def getTarget(self, user_id):
        self.cur.execute("""
            SELECT * FROM target
            WHERE user_id = :user_id
            """, {"user_id": user_id})
        
        result = self.cur.fetchone()
        self.dbManager.close()
        return result
    
    def initTarget(self, user_id):
        self.cur.execute("""
            INSERT INTO target (user_id)
            VALUES (:user_id)
            """, {"user_id": user_id})
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def addTargetSleep(self, user_id, target_sleep_time):
        res = self.getTarget(user_id)
        if not res:
            self.initTarget(user_id)
        
        self.cur.execute("""
            UPDATE target
            SET sleep = :target_sleep_time
            WHERE user_id = :user_id
            """, {
                "user_id": user_id, 
                "target_sleep_time": target_sleep_time
            }
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def addTargetSteps(self, user_id, target_steps):
        res = self.getTarget(user_id)
        if not res:
            self.initTarget(user_id)
        
        self.cur.execute("""
            UPDATE target
            SET steps = :target_steps
            WHERE user_id = :user_id
            """, {
                "user_id": user_id, 
                "target_steps": target_steps
            }
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def addTargetWeight(self, user_id, target_weight):
        res = self.getTarget(user_id)
        if not res:
            self.initTarget(user_id)
        
        self.cur.execute("""
            UPDATE target
            SET weight = :target_weight
            WHERE user_id = :user_id
            """, {
                "user_id": user_id, 
                "target_weight": target_weight
            }
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def addTargetCalories(self, user_id, target_calories):
        res = self.getTarget(user_id)
        if not res:
            self.initTarget(user_id)
        
        self.cur.execute("""
            UPDATE target
            SET food = :target_calories
            WHERE user_id = :user_id
            """, {
                "user_id": user_id, 
                "target_calories": target_calories
            }
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
