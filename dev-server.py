import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys
import os

class DualStackServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()

class FastHTTPRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    # Avoid blocking reverse DNS lookups on Windows
    def address_string(self):
        return self.client_address[0]

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    try:
        server = DualStackServer(("::", port), FastHTTPRequestHandler)
    except Exception as e:
        server = ThreadingHTTPServer(("0.0.0.0", port), FastHTTPRequestHandler)
    print(f"Dual-Stack High-Speed HTTP Server active on port {port}")
    server.serve_forever()

if __name__ == "__main__":
    main()
