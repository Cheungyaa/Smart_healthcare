from .DBManager import DBManager

class BodyInfoDB:
    def __init__(self):
        self.dbManager = DBManager()
        self.connect = self.dbManager.getConnection()
        self.cur = self.dbManager.getCursor()
    
    def updateBodyInfo(self, user_id, weight, height, activity_factor, blood_pressure_sys, blood_pressure_dia): 
        bmi = weight / (height * height)
        
        self.cur.execute("""
            UPDATE Body_info
            SET weight = :weight, height = :height, bmi = :bmi, activity_factor = :activity_factor, blood_pressure_systolic = :blood_pressure_sys, blood_pressure_diastolic = :blood_pressure_dia
            WHERE user_id = :user_id
            """, {"user_id": user_id, "weight": weight, "height": height, "bmi": bmi, "activity_factor": activity_factor, "blood_pressure_sys": blood_pressure_sys, "blood_pressure_dia": blood_pressure_dia}
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
    
    def deleteAllData(self, user_id):
        life_log = ["sleep_actual", "sleep_target", "steps", "heart_rate", "food_log"]
        
        for table in life_log:
            self.cur.execute(f"""
                DELETE FROM {table}
                WHERE user_id = :user_id
                """, {"user_id": user_id})
        
        self.connect.commit()
        self.dbManager.close()
        return True