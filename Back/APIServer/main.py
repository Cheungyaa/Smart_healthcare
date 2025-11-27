from threading import Thread
from .SignServer import SignServer
from .InfoServer import InfoServer

if __name__ == "__main__":
    # SignServer를 별도 쓰레드에서 실행
    sign_server_thread = Thread(target=lambda: SignServer())
    sign_server_thread.start()
    
    # InfoServer를 별도 쓰레드에서 실행
    info_server_thread = Thread(target=lambda: InfoServer())
    info_server_thread.start()
    
    # 두 서버 모두 종료될 때까지 대기
    sign_server_thread.join()
    info_server_thread.join()
    

