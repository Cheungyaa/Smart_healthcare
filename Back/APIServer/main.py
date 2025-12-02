import sys
import os
import importlib
from multiprocessing import Process

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

def run_server(app_module_str, port):
    """Flask 앱을 실행합니다."""
    try:
        module_name, app_name = app_module_str.split(":")
        module = importlib.import_module(module_name)
        app = getattr(module, app_name)
        print(f"Starting {app_module_str} on port {port}...")
        app.run(host="0.0.0.0", port=port, debug=False)
    except Exception as e:
        print(f"Error starting server {app_module_str}: {e}")

if __name__ == "__main__":
    print("Starting servers with multiprocessing...")
    
    # SignServer process
    p1 = Process(target=run_server, args=("Back.APIServer.SignServer:app", 7002))
    # InfoServer process
    p2 = Process(target=run_server, args=("Back.APIServer.InfoServer:app", 7003))
    
    p1.start()
    p2.start()
    
    try:
        p1.join()
        p2.join()
    except KeyboardInterrupt:
        print("Stopping servers...")
        p1.terminate()
        p2.terminate()
        print("Servers stopped.")