from .DBManager import DBManager

class LifeLogDB:
    def __init__(self):
        self.connect = DBManager.getConnection()
        self.cur = DBManager.getCursor()
    
    def addActualSleep(self, user_id, start, end):
        interval = end - start
        
        self.cur.execute("""
            INSERT INTO sleep_actual (user_id, actual_start_sleep, actual_end_sleep, actual_sleep_time, recorded_at)
            VALUES (:user_id, :start, :end, :interval, SYSDATE)
            """, {
                "user_id": user_id, 
                "start": start, 
                "end": end, 
                "interval": interval
            }
        )
        
        self.connect.commit()
        DBManager.close()
        return True
    
    def getActualSleep(self, user_id, start, end):
        self.cur.execute("""
            SELECT * FROM sleep_actual
            WHERE user_id = :user_id
            AND actual_start_sleep BETWEEN :start AND :end
            """, {"user_id": user_id, "start": start, "end": end})
        
        DBManager.close()
        return self.cur.fetchall()
    
    def addTargetSleep(self, user_id, interval):
        if self.getTargetSleep(user_id):
            self.cur.execute("""
                UPDATE sleep_target
                SET target_sleep_time = :interval
                WHERE user_id = :user_id
                """, {
                    "user_id": user_id, 
                    "interval": interval
                }
            )
        else :
            self.cur.execute("""
                INSERT INTO sleep_target (user_id, target_sleep_time)
                VALUES (:user_id, :interval)
                """, {
                    "user_id": user_id, 
                    "interval": interval
                }
            )
        
        self.connect.commit()
        DBManager.close()
        return True
    
    def getTargetSleep(self, user_id):
        self.cur.execute("""
            SELECT * FROM sleep_target
            WHERE user_id = :user_id
            """, {"user_id": user_id})
        
        DBManager.close()
        return self.cur.fetchone()
    
    def addSteps(self, user_id, steps):
        self.cur.execute("""
            INSERT INTO steps_actual (user_id, steps, recorded_at)
            VALUES (:user_id, :steps, SYSDATE)
            """, {
                "user_id": user_id, 
                "steps": steps
            }
        )
        
        self.connect.commit()
        DBManager.close()
        return True
    
    def getSteps(self, user_id, start, end):
        self.cur.execute("""
            SELECT * FROM steps WHERE user_id = :user_id
            AND recorded_at BETWEEN :start AND :end
            """, {"user_id": user_id, "start": start, "end": end})
        
        DBManager.close()
        return self.cur.fetchall()
    
    def addHeartRate(self, user_id, heart_rate):
        self.cur.execute("""
            INSERT INTO heart_rate_actual (user_id, heart_rate, recorded_at)
            VALUES (:user_id, :heart_rate, SYSDATE)
            """, {
                "user_id": user_id, 
                "heart_rate": heart_rate
            }
        )
        
        self.connect.commit()
        DBManager.close()
        return True
    
    def getHeartRate(self, user_id, start, end):
        self.cur.execute("""
            SELECT * FROM heart_rate WHERE user_id = :user_id
            AND recorded_at BETWEEN :start AND :end
            """, {"user_id": user_id, "start": start, "end": end})
        
        DBManager.close()
        return self.cur.fetchall()
        