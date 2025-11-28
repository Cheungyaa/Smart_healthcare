import oracledb

class CustomCursor:
    def __init__(self, cursor):
        self._cursor = cursor
    
    def __getattr__(self, name):
        return getattr(self._cursor, name)

    def execute(self, *args, **kwargs):
        result = self._cursor.execute(*args, **kwargs)
        self._cursor.rowfactory = self._row_factory
        return result

    def _row_factory(self, *args):
        return dict(zip([d[0].lower() for d in self._cursor.description], args))

class DBManager :
    id = "user1"
    pw = "00000000"
    dsn = "htaeky.iptime.org:7000/FREEPDB1"
    
    def __init__(self):
        self.connect = oracledb.connect(user = DBManager.id, password = DBManager.pw, dsn = DBManager.dsn)
        self.cur = CustomCursor(self.connect.cursor())
        
    def close(self):
        self.cur.close()
        self.connect.close()
        
    def getConnection(self):
        return self.connect        
    
    def getCursor(self):
        return self.cur