from .DBManager import DBManager

class BodyInfoDB:
    def __init__(self):
        self.dbManager = DBManager()
        self.connect = self.dbManager.getConnection()
        self.cur = self.dbManager.getCursor()
    
    def updateBodyInfo(self, user_id, height, activity_factor, blood_pressure_sys, blood_pressure_dia): 
        self.cur.execute("""
            UPDATE Body_info
            SET height = :height, activity_factor = :activity_factor, blood_pressure_systolic = :blood_pressure_sys, blood_pressure_diastolic = :blood_pressure_dia
            WHERE user_id = :user_id
            """, {"user_id": user_id, "height": height, "activity_factor": activity_factor, "blood_pressure_sys": blood_pressure_sys, "blood_pressure_dia": blood_pressure_dia}
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def getBodyInfo(self, user_id):
        self.cur.execute("""
            SELECT * FROM Body_info
            WHERE user_id = :user_id
            """, {"user_id": user_id})
        
        result = self.cur.fetchone()
        self.dbManager.close()
        return result
    
    def addWeight(self, user_id, weight, time):
        self.cur.execute("""
            SELECT height FROM Body_info
            WHERE user_id = :user_id
            """, {"user_id": user_id})        
        result = self.cur.fetchone()
        height = result["height"]
        bmi = weight / (height * height) if height != None else 0
        
        self.cur.execute("""
            SELECT * FROM weight_log
            WHERE user_id = :user_id AND time = :time
            """, {"user_id": user_id, "time": time})
        result = self.cur.fetchone()
        
        if result:    
            self.cur.execute("""
                UPDATE weight_log
                SET weight = :weight, bmi = :bmi, time = :time, recorded_at = SYSDATE
                WHERE user_id = :user_id AND time = :time
                """, {"user_id": user_id, "weight": weight, "bmi": bmi, "time": time})
        else:
            self.cur.execute("""
                INSERT INTO weight_log (user_id, weight, bmi, time, recorded_at)
                VALUES (:user_id, :weight, :bmi, :time, SYSDATE)
                """, {"user_id": user_id, "weight": weight, "bmi": bmi, "time": time})
        
        self.connect.commit()
        self.dbManager.close()
        return True
        
    def getWeight(self, user_id, start_time, end_time):
        self.cur.execute("""
            SELECT * 
            FROM (
                SELECT t.*,
                       ROW_NUMBER() OVER (
                           PARTITION BY user_id, TRUNC(recorded_at)
                           ORDER BY recorded_at DESC                         
                       ) AS rn
                FROM weight_log t
                WHERE t.user_id = :user_id
                  AND recorded_at >= :start_time
                  AND recorded_at <= :end_time
            )
            WHERE rn = 1;
        """, {"user_id": user_id, "start_time": start_time, "end_time": end_time})
        
        result = self.cur.fetchall()
        self.dbManager.close()
        return result
    
    
    def deleteAllData(self, user_id):
        life_log = ["sleep_actual", "target", "steps", "heart_rate", "food_log"]
        
        for table in life_log:
            self.cur.execute(f"""
                DELETE FROM {table}
                WHERE user_id = :user_id
                """, {"user_id": user_id})
        
        self.connect.commit()
        self.dbManager.close()
        return True