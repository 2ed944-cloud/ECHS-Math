#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
print("ECHS Question Bank v0.3: http://localhost:8000")
ThreadingHTTPServer(("0.0.0.0",8000),SimpleHTTPRequestHandler).serve_forever()
