
import http.server, socketserver
from functools import partial
root = r"D:\web\agicoin\downloads\thornstavern\models"
class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=root, **kwargs)
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
with socketserver.TCPServer(("127.0.0.1", 8944), CORSRequestHandler) as httpd:
    print("serving", root, flush=True)
    httpd.serve_forever()
