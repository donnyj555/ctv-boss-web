import glob
import re

html_files = glob.glob('**/*.html', recursive=True)
count = 0
for file in html_files:
    if 'node_modules' in file: continue
    
    with open(file, 'r') as f:
        content = f.read()
        
    # Replace app.js and any version parameter with app.js?v=13
    new_content = re.sub(r'app\.js(\?v=\d+)?', 'app.js?v=13', content)
    
    # Also bump styles.css version just in case
    new_content = re.sub(r'styles\.css(\?v=\d+)?', 'styles.css?v=13', new_content)
    
    if new_content != content:
        with open(file, 'w') as f:
            f.write(new_content)
            count += 1

print(f"Updated {count} HTML files to v13.")
