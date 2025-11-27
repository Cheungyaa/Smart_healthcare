from DBManager import DBManager

class BodyInfoDB:
    def __init__(self):
        self.connect = DBManager.getConnection()
        self.cur = DBManager.getCursor()
    
    def updateBodyInfo(self, user_id, weight, height, activity_factor, blood_pressure): 
        bmi = weight / (height * height)
        
        self.cur.execute("""
            UPDATE Body_info
            SET weight = :weight, height = :height, bmi = :bmi, activity_factor = :activity_factor, blood_pressure = :blood_pressure
            WHERE user_id = :user_id
            """, {"user_id": user_id, "weight": weight, "height": height, "bmi": bmi, "activity_factor": activity_factor, "blood_pressure": blood_pressure}
        )
        
        self.connect.commit()
        DBManager.close()
        return True
    
    def getBodyInfo(self, user_id):
        self.cur.execute("""
            SELECT * FROM Body_info
            WHERE user_id = :user_id
            """, {"user_id": user_id})
        
        DBManager.close()
        return self.cur.fetchone()
    
        