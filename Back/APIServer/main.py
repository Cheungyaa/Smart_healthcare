from threading import Thread
from SignServer import SignServer  # SignServer 클래스 import

if __name__ == "__main__":
    # SignServer를 별도 쓰레드에서 실행
    server_thread = Thread(target=lambda: SignServer())
    server_thread.start()
    server_thread.join()

