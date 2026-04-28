import os

target_dir = '/Users/donjordan/myfirst folder/streamlocal-site'
valid_extensions = {'.html', '.js', '.css', '.json', '.md'}

replacements = {
    'CTV BOSS': 'CTV HOMES',
    'CTV Boss': 'CTV Homes',
    'ctvboss.com': 'ctvhomes.com',
    'CTVBoss': 'CTVHomes'
}

files_changed = 0

for root, _, files in os.walk(target_dir):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if not any(file.endswith(ext) for ext in valid_extensions):
            continue
            
        filepath = os.path.join(root, file)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            new_content = content
            for old_str, new_str in replacements.items():
                new_content = new_content.replace(old_str, new_str)
                
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                files_changed += 1
                
        except Exception as e:
            pass

print(f"Branding updated in {files_changed} files.")
