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
        
        self.dbManager.close()
        return self.cur.fetchall()
    
    def addFoodLog(self, user_id, food_name, food_weight):
        self.cur.execute("""
            SELECT food_calories
            FROM food
            WHERE food_name = :food_name
            """, {"food_name": food_name})
        
        food_g_calories = self.cur.fetchone()
        if (not food_g_calories):
            return False
        
        food_calories = food_g_calories["food_calories"] * food_weight
        
        self.cur.execute("""
            INSERT INTO food (user_id, food_name, food_weight, food_calories, recorded_at)
            VALUES (:user_id, :food_name, :food_weight, :food_calories, SYSDATE)
            """, {
                "user_id": user_id, 
                "food_name": food_name, 
                "food_weight": food_weight, 
                "food_calories": food_calories
            }
        )
        
        self.connect.commit()
        self.dbManager.close()
        return True
    
    def getFoodLog(self, user_id, start, end):
        self.cur.execute("""
            SELECT * FROM food
            WHERE user_id = :user_id
            AND recorded_at BETWEEN :start AND :end
            """, {"user_id": user_id, "start": start, "end": end})
        
        self.dbManager.close()
        return self.cur.fetchall()