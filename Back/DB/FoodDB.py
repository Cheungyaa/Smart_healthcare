from DBManager import DBManager

class FoodDB:
    def __init__(self):
        self.connect = DBManager.getConnection()
        self.cur = DBManager.getCursor()
    
    def getFoodList(self, user_id):
        self.cur.execute("""
            SELECT * FROM food
            WHERE user_id = :user_id
            """, {"user_id": user_id})
        
        DBManager.close()
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
        DBManager.close()
        return True
    
    def getFoodLog(self, user_id, start, end):
        self.cur.execute("""
            SELECT * FROM food
            WHERE user_id = :user_id
            AND recorded_at BETWEEN :start AND :end
            """, {"user_id": user_id, "start": start, "end": end})
        
        DBManager.close()
        return self.cur.fetchall()