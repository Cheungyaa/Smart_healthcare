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
                "interval_time": interval_time,
            }
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def getActualSleep(self, user_id, start_time, end_time):
        self.cur.execute("""
            SELECT *
            FROM (
                SELECT t.*,
                       ROW_NUMBER() OVER (
                           PARTITION BY user_id, TRUNC(actual_end_sleep_time)
                           ORDER BY recorded_at DESC                         
                       ) AS rn
                FROM sleep_actual t
                WHERE t.user_id = :user_id
                  AND actual_end_sleep_time >= :start_time
                  AND actual_end_sleep_time <= :end_time
            )
            WHERE rn = 1;
        """, {
            "user_id": user_id,
            "start_time": start_time,
            "end_time": end_time
        })
        
        result = self.cur.fetchall()
        self.dbManager.close()
        return result
    
    def addSteps(self, user_id, steps, time):
        self.cur.execute("""
            INSERT INTO steps (user_id, steps, time, recorded_at)
            VALUES (:user_id, :steps, :time, SYSDATE)
            """, {
                "user_id": user_id, 
                "steps": steps,
                "time": time
            }
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def getSteps(self, user_id, start_time, end_time):
        self.cur.execute("""
            SELECT * 
            FROM (
                SELECT t.*,
                       ROW_NUMBER() OVER (
                           PARTITION BY user_id, TRUNC(time)
                           ORDER BY recorded_at DESC                         
                       ) AS rn
                FROM steps t
                WHERE t.user_id = :user_id
                  AND time >= :start_time
                  AND time <= :end_time
            )
            WHERE rn = 1;
        """, {"user_id": user_id, "start_time": start_time, "end_time": end_time})
        
        result = self.cur.fetchall()
        self.dbManager.close()
        return result
    
    def addHeartRate(self, user_id, heart_rate, time):
        self.cur.execute("""
            INSERT INTO heart_rate (user_id, heart_rate, time, recorded_at)
            VALUES (:user_id, :heart_rate, :time, SYSDATE)
            """, {
                "user_id": user_id, 
                "heart_rate": heart_rate,
                "time": time
            }
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def getHeartRate(self, user_id, start_time, end_time):
        self.cur.execute("""
            SELECT * 
            FROM (
                SELECT t.*,
                       ROW_NUMBER() OVER (
                           PARTITION BY user_id, TRUNC(time)
                           ORDER BY recorded_at DESC                         
                       ) AS rn
                FROM heart_rate t
                WHERE t.user_id = :user_id
                  AND time >= :start_time
                  AND time <= :end_time
            )
            WHERE rn = 1;
        """, {"user_id": user_id, "start_time": start_time, "end_time": end_time})
        
        result = self.cur.fetchall()
        self.dbManager.close()
        return result
        