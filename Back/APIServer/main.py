import sys
import os
import subprocess

# Add project root to sys.path to allow running this script directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

def run_server(app_module, port, new_window=False):
    """Flask 앱을 서브프로세스로 실행합니다."""
    # sys.executable은 현재 실행 중인 파이썬 인터프리터를 가리킵니다.
    cmd = [sys.executable, "-m", "flask", "run", "--host=0.0.0.0", f"--port={port}"]
    env = os.environ.copy()
    env["FLASK_APP"] = app_module
    
    flags = subprocess.CREATE_NEW_CONSOLE if new_window and os.name == 'nt' else 0
    process = subprocess.Popen(cmd, env=env, creationflags=flags)
    return process

if __name__ == "__main__":
    print("Starting servers...")
    
    # SignServer는 현재 창에서 실행 (로그가 여기에 표시됨)
    sign_server_process = run_server("Back.APIServer.SignServer:app", 7002, new_window=False)
    # InfoServer는 새로운 창에서 실행
    info_server_process = run_server("Back.APIServer.InfoServer:app", 7003, new_window=True)
    
    print(f"SignServer (PID: {sign_server_process.pid}) and InfoServer (PID: {info_server_process.pid}) are running.")
    print("Press CTRL+C in this window to stop the servers.")
    
    try:
        # 자식 프로세스들이 종료될 때까지 대기합니다.
        # 사용자가 CTRL+C를 누르면 KeyboardInterrupt가 발생합니다.
        sign_server_process.wait()
        info_server_process.wait()
    except KeyboardInterrupt:
        print("Stopping servers...")
        sign_server_process.terminate()
        info_server_process.terminate()
        print("Servers stopped.")