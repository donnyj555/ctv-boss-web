import glob
import re

# 1. Fix app.js duplicate event listener
with open('app.js', 'r') as f:
    app_js = f.read()

# We need to remove the SECOND instance of the Mobile Menu Toggle in app.js
# The second instance is inside "Interactive ROI Tools Logic"
# Let's just remove the first instance since it's easier to find exactly.
menu_logic_to_remove = """    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

"""
# Remove all instances, then add exactly ONE back at the top.
# This ensures it only fires once.
app_js = app_js.replace("    // Mobile Menu Toggle\n    const hamburger = document.querySelector('.hamburger');\n    const navLinks = document.querySelector('.nav-links');\n    if (hamburger && navLinks) {\n        hamburger.addEventListener('click', () => {\n            hamburger.classList.toggle('active');\n            navLinks.classList.toggle('active');\n        });\n    }\n", "")

# Now add it exactly once at the top
app_js = app_js.replace("document.addEventListener('DOMContentLoaded', () => {", "document.addEventListener('DOMContentLoaded', () => {\n" + menu_logic_to_remove, 1)

with open('app.js', 'w') as f:
    f.write(app_js)
print("Fixed app.js")

# 2. Fix the literal \\n in HTML files and bump cache to v=14
html_files = glob.glob('**/*.html', recursive=True)
count = 0
for file in html_files:
    if 'node_modules' in file: continue
    
    with open(file, 'r') as f:
        content = f.read()
        
    # Replace literal \n with an actual newline
    new_content = content.replace('</div>\\n            <nav class="nav-links">', '</div>\n            <nav class="nav-links">')
    
    # Bump cache to v=14
    new_content = re.sub(r'app\.js\?v=\d+', 'app.js?v=14', new_content)
    new_content = re.sub(r'styles\.css\?v=\d+', 'styles.css?v=14', new_content)
    
    if new_content != content:
        with open(file, 'w') as f:
            f.write(new_content)
            count += 1

print(f"Fixed \\n and bumped v=14 in {count} HTML files.")
