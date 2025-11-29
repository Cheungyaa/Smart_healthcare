from .DBManager import DBManager

class LifeLogDB:
    def __init__(self):
        self.dbManager = DBManager()
        self.connect = self.dbManager.getConnection()
        self.cur = self.dbManager.getCursor()
    
    def addActualSleep(self, user_id, start_time, end_time, recorded_at):
        interval_time = end_time - start_time
        
        self.cur.execute("""
            INSERT INTO sleep_actual (user_id, actual_start_sleep_time, actual_end_sleep_time, actual_sleep_time, recorded_at)
            VALUES (:user_id, :start_time, :end_time, :interval_time, :recorded_at)
            """, {
                "user_id": user_id, 
                "start_time": start_time, 
                "end_time": end_time, 
                "interval_time": interval_time,
                "recorded_at": recorded_at
            }
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def getActualSleep(self, user_id, start_time, end_time):
        self.cur.execute("""
            SELECT * FROM sleep_actual
            WHERE user_id = :user_id
            AND actual_start_sleep_time BETWEEN :start_time AND :end_time
            """, {"user_id": user_id, "start_time": start_time, "end_time": end_time})
        
        result = self.cur.fetchall()
        self.dbManager.close()
        return result
    
    def addSteps(self, user_id, steps, recorded_at):
        self.cur.execute("""
            INSERT INTO steps (user_id, steps, recorded_at)
            VALUES (:user_id, :steps, :recorded_at)
            """, {
                "user_id": user_id, 
                "steps": steps,
                "recorded_at": recorded_at
            }
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def getSteps(self, user_id, start_time, end_time):
        self.cur.execute("""
            SELECT * FROM steps WHERE user_id = :user_id
            AND recorded_at BETWEEN :start_time AND :end_time
            """, {"user_id": user_id, "start_time": start_time, "end_time": end_time})
        
        result = self.cur.fetchall()
        self.dbManager.close()
        return result
    
    def addHeartRate(self, user_id, heart_rate, recorded_at):
        self.cur.execute("""
            INSERT INTO heart_rate (user_id, heart_rate, recorded_at)
            VALUES (:user_id, :heart_rate, :recorded_at)
            """, {
                "user_id": user_id, 
                "heart_rate": heart_rate,
                "recorded_at": recorded_at
            }
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def getHeartRate(self, user_id, start_time, end_time):
        self.cur.execute("""
            SELECT * FROM heart_rate WHERE user_id = :user_id
            AND recorded_at BETWEEN :start_time AND :end_time
            """, {"user_id": user_id, "start_time": start_time, "end_time": end_time})
        
        result = self.cur.fetchall()
        self.dbManager.close()
        return result
        