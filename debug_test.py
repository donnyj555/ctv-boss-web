import urllib.request
import json
import time

API_KEY = "48220b718d524b97befff30114cf296ae367029fdcba6f993aa9916d95ec54607a23fc280170e4a1599fcd9217241ab2"

# Read real_estate.js
with open("netlify/functions/templates/real_estate.js", "r") as f:
    js_content = f.read()

# Strip "module.exports = " and trailing semicolon to get pure JSON
json_str = js_content.replace("module.exports = ", "").strip()
if json_str.endswith(";"):
    json_str = json_str[:-1]

json_str = json_str.replace('"type": "text-to-speech"', '"type": "audio"')
try:
    source_json = json.loads(json_str)
except Exception as e:
    print("Failed to JSON decode real_estate.js:", e)
    exit(1)

payload = {
    "output_format": "mp4",
    "modifications": {
        "Voiceover": "Welcome to our beautiful new properties. We are here to help you find your dream home.",
        "Subtext": "Contact Us Today!",
        "Video-1": "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4",
        "Video-2": "https://loremflickr.com/1920/1080/kitchen,interior?random=2",
        "Video-3": "https://creatomate-static.s3.amazonaws.com/demo/video2.mp4",
        "Video-4": "https://loremflickr.com/1920/1080/livingroom,modern?random=3",
        "Video-5": "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4",
        "Video-6": "https://loremflickr.com/1920/1080/backyard,pool?random=4",
        "Picture": "https://loremflickr.com/1920/1080/kitchen,interior?random=2",
        "Brand-Name": "CTV Boss Client",
        "Phone-Number": "555-123-4567",
        "Email": "info@ctvbossclient.com",
        "Name": ""
    },
    "source": source_json
}

req_str = json.dumps(payload)

req = urllib.request.Request("https://api.creatomate.com/v1/renders", data=req_str.encode('utf-8'), headers={
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0'
}, method='POST')

print("Starting render...")
try:
    with urllib.request.urlopen(req) as response:
        render_data = json.loads(response.read().decode())
        render_id = render_data[0]['id']
        print(f"Render ID: {render_id}")
        
        while True:
            time.sleep(3)
            poll_req = urllib.request.Request(f"https://api.creatomate.com/v1/renders/{render_id}", headers={
                'Authorization': f'Bearer {API_KEY}',
                'User-Agent': 'Mozilla/5.0'
            })
            with urllib.request.urlopen(poll_req) as poll_res:
                poll_data = json.loads(poll_res.read().decode())
                status = poll_data['status']
                print(f"Status: {status}")
                if status == 'succeeded':
                    print("URL:", poll_data['url'])
                    break
                elif status == 'failed':
                    print("Failed details:", json.dumps(poll_data, indent=2))
                    break
except Exception as e:
    print("API Exception:")
    print(e)
    if hasattr(e, 'read'):
        print(e.read().decode())
