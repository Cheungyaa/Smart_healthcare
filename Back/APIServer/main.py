import sys
import os
from threading import Thread

# Add project root to sys.path to allow running this script directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from Back.APIServer.SignServer import SignServer
from Back.APIServer.InfoServer import InfoServer

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