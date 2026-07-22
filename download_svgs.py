import urllib.request
import json
import base64

urls = {
    "ibm": "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg"
}

req_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

for name, url in urls.items():
    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req) as response:
            svg = response.read()
            with open(f"public/logos/{name}.svg", "wb") as f:
                f.write(svg)
            print(f"Downloaded {name}.svg")
    except Exception as e:
        print(f"Failed {name}: {e}")
