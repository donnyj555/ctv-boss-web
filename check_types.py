import json

# Read real_estate.js
with open("netlify/functions/templates/real_estate.js", "r") as f:
    js_content = f.read()

# Strip "module.exports = " and trailing semicolon to get pure JSON
json_str = js_content.replace("module.exports = ", "").strip()
if json_str.endswith(";"):
    json_str = json_str[:-1]

source_json = json.loads(json_str)

types_found = set()
def find_types(obj):
    if isinstance(obj, dict):
        if 'type' in obj:
            types_found.add(obj['type'])
        for k, v in obj.items():
            if k == 'type': continue
            find_types(v)
    elif isinstance(obj, list):
        for item in obj:
            find_types(item)

find_types(source_json)
print("Types found:", types_found)
