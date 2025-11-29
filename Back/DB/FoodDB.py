from .DBManager import DBManager

class FoodDB:
    def __init__(self):
        self.dbManager = DBManager()
        self.connect = self.dbManager.getConnection()
        self.cur = self.dbManager.getCursor()
    
    def getFoodList(self, user_id):
        self.cur.execute("""
            SELECT * FROM food
            WHERE user_id = :user_id
            """, {"user_id": user_id})
        
        result = self.cur.fetchall()
        self.dbManager.close()
        return result
    
    def addFoodLog(self, user_id, food_name, food_weight, recorded_at):
        self.cur.execute("""
            SELECT calories_per_gram
            FROM food
            WHERE food_name = :food_name
            """, {"food_name": food_name})
        
        food_g_calories = self.cur.fetchone()
        if (not food_g_calories):
            return False
        
        food_calories = food_g_calories["calories_per_gram"] * food_weight
        
        self.cur.execute("""
            INSERT INTO food_log (user_id, food_name, food_weight, food_calories, recorded_at)
            VALUES (:user_id, :food_name, :food_weight, :food_calories, :recorded_at)
            """, {
                "user_id": user_id, 
                "food_name": food_name, 
                "food_weight": food_weight, 
                "food_calories": food_calories,
                "recorded_at": recorded_at
            }
        )
        
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def getFoodLog(self, user_id, start_time, end_time):
        self.cur.execute("""
            SELECT * FROM food_log
            WHERE user_id = :user_id
            AND recorded_at BETWEEN :start_time AND :end_time
            """, {"user_id": user_id, "start_time": start_time, "end_time": end_time})
        
        result = self.cur.fetchall()
        self.dbManager.close()
        return result