from .DBManager import DBManager

class LifeLogDB:
    def __init__(self):
        self.dbManager = DBManager()
        self.connect = self.dbManager.getConnection()
        self.cur = self.dbManager.getCursor()
    
    def addActualSleep(self, user_id, start_time, end_time):
        interval_time = end_time - start_time
        
        self.cur.execute("""
            INSERT INTO sleep_actual (user_id, actual_start_sleep_time, actual_end_sleep_time, actual_sleep_time, recorded_at)
            VALUES (:user_id, :start_time, :end_time, :interval_time, SYSDATE)
            """, {
                "user_id": user_id, 
                "start_time": start_time, 
                "end_time": end_time, 
                "interval_time": interval_time
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
    
    def addTargetSleep(self, user_id, interval_time):
        if self.getTargetSleep(user_id):
            self.cur.execute("""
                UPDATE sleep_target
                SET target_sleep_time = :interval_time
                WHERE user_id = :user_id
                """, {
                    "user_id": user_id, 
                    "interval_time": interval_time
                }
            )
        else :
            self.cur.execute("""
                INSERT INTO sleep_target (user_id, target_sleep_time)
                VALUES (:user_id, :interval_time)
                """, {
                    "user_id": user_id, 
                    "interval_time": interval_time
                }
            )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def getTargetSleep(self, user_id):
        self.cur.execute("""
            SELECT * FROM sleep_target
            WHERE user_id = :user_id
            """, {"user_id": user_id})
        
        result = self.cur.fetchone()
        self.dbManager.close()
        return result
    
    def addSteps(self, user_id, steps):
        self.cur.execute("""
            INSERT INTO steps (user_id, steps, recorded_at)
            VALUES (:user_id, :steps, SYSDATE)
            """, {
                "user_id": user_id, 
                "steps": steps
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
    
    def addHeartRate(self, user_id, heart_rate):
        self.cur.execute("""
            INSERT INTO heart_rate (user_id, heart_rate, recorded_at)
            VALUES (:user_id, :heart_rate, SYSDATE)
            """, {
                "user_id": user_id, 
                "heart_rate": heart_rate
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
        