from .DBManager import DBManager
from .LifeLogDB import LifeLogDB
from datetime import timedelta, datetime, time

class AverageDB:
    def __init__(self):
        self.dbManager = DBManager()
        self.connect = self.dbManager.getConnection()
        self.cur = self.dbManager.getCursor()
        
    def selectGroup(self, age_group, gender):
        self.cur.execute("""
            SELECT user_id, gender, age, height
            FROM Body_info
            WHERE FLOOR(age / 10) = :age_group
            AND gender = :gender
        """, {"age_group": age_group, "gender": gender})
        
        result = self.cur.fetchall()
        return result
    
    def getYesterdayData(self, user_id):
        data = []
        
        stt = datetime.combine(datetime.today() - timedelta(days=1), time.min)
        end = datetime.combine(datetime.today() - timedelta(days=1), time.max)
        
        lifeLogDB = LifeLogDB()
        data.append(lifeLogDB.getActualSleep(user_id, stt, end))
        
        lifeLogDB = LifeLogDB()
        data.append(lifeLogDB.getSteps(user_id, stt, end))
        
        self.cur.execute("""
            SELECT weight
            FROM (
                SELECT t.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY user_id, TRUNC(time)
                        ORDER BY recorded_at DESC
                    ) AS rnF
                FROM weight_log t
                WHERE t.user_id = :user_id
            )
            WHERE rnF = 1
            ORDER BY time DESC
            FETCH FIRST 1 ROW ONLY;
        """, {"user_id": user_id})
        data.append(self.cur.fetchall())
        return data
        
    def calcAverage(self, age, gender):
        group = self.selectGroup(age, gender)
        
        total_sleep = timedelta()
        total_step = 0
        total_weight = 0
        total_height = 0
        
        sleep_cnt = 0
        step_cnt = 0
        weight_cnt = 0
        height_cnt = 0
        
        for user in group:
            user_id = user["user_id"]
            
            data = self.getYesterdayData(user_id)
            
            if (data[0] is not None and len(data[0]) > 0):
                if (data[0][0]["actual_sleep_time"] is not None and data[0][0]["actual_sleep_time"] != timedelta(0)):
                    total_sleep += data[0][0]["actual_sleep_time"]
                    sleep_cnt += 1
            if (data[1] is not None and len(data[1]) > 0):
                if (data[1][0]["steps"] is not None and data[1][0]["steps"] != 0):
                    total_step += data[1][0]["steps"]
                    step_cnt += 1
                    
            if (data[2] is not None and len(data[2]) > 0):
                if (data[2][0]["weight"] is not None and data[2][0]["weight"] != 0):
                    total_weight += data[2][0]["weight"]
                    weight_cnt += 1
                    
            if (user["height"] is not None and user["height"] != 0):
                total_height += user["height"]
                height_cnt += 1
            
        avg_sleep = total_sleep / sleep_cnt if sleep_cnt > 0 else timedelta()
        avg_step = total_step / step_cnt if step_cnt > 0 else 0
        avg_weight = total_weight / weight_cnt if weight_cnt > 0 else 0
        avg_height = total_height / height_cnt if height_cnt > 0 else 0
        
        print("sleep: ", avg_sleep, ", step: ", avg_step, ", weight: ", avg_weight, ", height: ", avg_height)
        return avg_sleep, avg_step, avg_weight, avg_height

    def updateAverage(self):
        for i in range(1, 9):
            for j in range(0, 2):
                avg_sleep, avg_step, avg_weight, avg_height = self.calcAverage(i, j)
                
                self.cur.execute("""
                    UPDATE Average_by_age_gender
                    SET avg_sleep_time = :avg_sleep,
                        avg_steps = :avg_step,
                        avg_weight = :avg_weight,
                        avg_height = :avg_height
                    WHERE age_group = :age_group AND gender = :gender
                    """, {
                        "age_group": i, 
                        "gender": j,
                        "avg_sleep": avg_sleep,
                        "avg_step": avg_step,
                        "avg_weight": avg_weight,
                        "avg_height": avg_height
                    }
                )
        
        self.connect.commit()
        self.dbManager.close()
        return True

    def getAverage(self):
        self.cur.execute("SELECT * FROM Average_by_age_gender")
        self.dbManager.close()
        return self.cur.fetchall()

averageDB = AverageDB()
for i in range(1, 9):
    for j in range(0, 2):
        averageDB.calcAverage(i, j)

averageDB.dbManager.close()