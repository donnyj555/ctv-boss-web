import json
import re

file_path = "netlify/functions/templates/real_estate.js"

with open(file_path, "r") as f:
    js_content = f.read()

json_str = js_content.replace("module.exports = ", "").strip()
if json_str.endswith(";"):
    json_str = json_str[:-1]

data = json.loads(json_str)

# The scenes are under data['elements'][2]['elements']
track_elements = data['elements'][2]['elements']

for scene in track_elements:
    if 'elements' in scene:
        # filter out any element whose name contains 'Kinetic-Sweep'
        filtered = [el for el in scene['elements'] if 'Kinetic-Sweep' not in el.get('name', '')]
        scene['elements'] = filtered

# Write the file back with module.exports
new_js_content = "module.exports = " + json.dumps(data, indent=2) + ";\n"

with open(file_path, "w") as f:
    f.write(new_js_content)

print("Removed Kinetic-Sweep elements successfully.")
