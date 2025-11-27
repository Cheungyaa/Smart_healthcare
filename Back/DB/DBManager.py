import oracledb

class DBManager :
    id = "user1"
    pw = "00000000"
    dsn = "htaeky.iptime.org:7000/FREEPDB1"
    
    def __init__(self):
        self.connect = oracledb.connect(user = DBManager.id, password = DBManager.pw, dsn = DBManager.dsn)
        self.cur = self.connect.cursor()
        self.cur.rowfactory = lambda *args: dict(zip([d[0] for d in self.cur.description], args))
        
    def close(self):
        self.cur.close()
        self.connect.close()
        
    def getConnection(self):
        return self.connect        
    
    def getCursor(self):
        return self.cur