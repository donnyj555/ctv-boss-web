import json

file_path = "netlify/functions/templates/real_estate.js"

with open(file_path, "r") as f:
    js_content = f.read()

json_str = js_content.replace("module.exports = ", "").strip()
if json_str.endswith(";"):
    json_str = json_str[:-1]

data = json.loads(json_str)

# The background music is the first element
data['elements'] = [el for el in data['elements'] if el.get('type') != 'audio' or el.get('name') == 'Voiceover']

# Ensure video1/video2 are gone from elements too (optional, but good practice)
def remove_sources(el):
    if 'source' in el and 'creatomate-static' in el['source']:
        # fallback is now dummy loremflickr
        el['source'] = 'https://loremflickr.com/1920/1080/office,business?random=1'
    if 'elements' in el:
        for child in el['elements']:
            remove_sources(child)

remove_sources(data)

# Write the file back with module.exports
new_js_content = "module.exports = " + json.dumps(data, indent=2) + ";\n"

with open(file_path, "w") as f:
    f.write(new_js_content)

print("Cleaned up broken demo assets successfully.")
