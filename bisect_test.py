import urllib.request
import json
import time

API_KEY = "48220b718d524b97befff30114cf296ae367029fdcba6f993aa9916d95ec54607a23fc280170e4a1599fcd9217241ab2"

with open("netlify/functions/templates/real_estate.js", "r") as f:
    js_content = f.read()

json_str = js_content.replace("module.exports = ", "").strip()
if json_str.endswith(";"):
    json_str = json_str[:-1]

source_json = json.loads(json_str)

def test_payload(elements_to_test):
    test_source = {
        "name": "Test",
        "format": "16:9",
        "frame_rate": 30,
        "duration": 30,
        "elements": elements_to_test
    }
    payload = {
        "output_format": "mp4",
        "source": test_source
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
                poll_req = urllib.request.Request(f"https://api.creatomate.com/v1/renders/{render_id}", headers={'Authorization': f'Bearer {API_KEY}', 'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(poll_req) as poll_res:
                    poll_data = json.loads(poll_res.read().decode())
                    if poll_data['status'] == 'succeeded': return "SUCCESS", render_id
                    if poll_data['status'] == 'failed': return "FAIL", poll_data.get('error_message')
    except Exception as e:
        if hasattr(e, 'read'):
            err = json.loads(e.read().decode())
            return "FAIL", err.get('message', str(err))
        return "FAIL", str(e)

# 1. Test empty elements
print("Testing empty elements:", test_payload([]))

# 2. Test audio element
elements = source_json['elements']
print("Testing audio element:", test_payload([elements[0]]))

# 3. Test Voiceover element
print("Testing voiceover element:", test_payload([elements[1]]))

# 4. Test composition track
comp_track = elements[2]
print("Testing entire composition wrapper:", test_payload([comp_track]))

# 5. Bisect scenes
scenes = comp_track['elements']
for i, scene in enumerate(scenes):
    print(f"Testing Scene-{i+1}:", test_payload([scene]))
    if test_payload([scene])[0] == "FAIL":
        # deeply bisect scene
        print(f"  -> Scene-{i+1} FAILED. Bisecting children...")
        for child in scene['elements']:
            child_status = test_payload([child])
            print(f"    Testing child {child.get('name', 'unnamed')}:", child_status)
            if child_status[0] == "FAIL":
                print("      FAILED CHILD JSON:", json.dumps(child))
