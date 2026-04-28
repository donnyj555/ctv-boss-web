import urllib.request
import json
import time

API_KEY = "48220b718d524b97befff30114cf296ae367029fdcba6f993aa9916d95ec54607a23fc280170e4a1599fcd9217241ab2"

# Read real_estate.js
with open("netlify/functions/templates/real_estate.js", "r") as f:
    js_content = f.read()

json_str = js_content.replace("module.exports = ", "").strip()
if json_str.endswith(";"):
    json_str = json_str[:-1]

source_json = json.loads(json_str)

base_mods = {
    "Voiceover": "Welcome to our beautiful new properties.",
    "Subtext": "Contact Us Today!",
    "Video-1": "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4",
    "Brand-Name": "CTV Boss Client"
}

def test_mods(mods_to_test):
    payload = {
        "output_format": "mp4",
        "modifications": mods_to_test,
        "source": source_json
    }
    req = urllib.request.Request("https://api.creatomate.com/v1/renders", data=json.dumps(payload).encode('utf-8'), headers={
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
    }, method='POST')

    try:
        with urllib.request.urlopen(req) as response:
            render_id = json.loads(response.read().decode())[0]['id']
            while True:
                time.sleep(2)
                poll_req = urllib.request.Request(f"https://api.creatomate.com/v1/renders/{render_id}", headers={
                    'Authorization': f'Bearer {API_KEY}',
                    'User-Agent': 'Mozilla/5.0'
                })
                with urllib.request.urlopen(poll_req) as poll_res:
                    poll_data = json.loads(poll_res.read().decode())
                    if poll_data['status'] == 'failed':
                        return "FAIL", poll_data['error_message']
                    elif poll_data['status'] == 'succeeded':
                        return "SUCCESS", poll_data['url']
    except Exception as e:
        return "ERROR", str(e)

print("Testing empty mods:", test_mods({}))
for k, v in base_mods.items():
    print(f"Testing mod {k}:", test_mods({k: v}))
