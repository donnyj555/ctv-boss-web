import os
import glob
import re

# 1. Update app.js
with open('app.js', 'r') as f:
    app_js = f.read()

if 'hamburger' not in app_js:
    menu_logic = """
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
"""
    app_js = app_js.replace("document.addEventListener('DOMContentLoaded', () => {", "document.addEventListener('DOMContentLoaded', () => {" + menu_logic)
    with open('app.js', 'w') as f:
        f.write(app_js)
    print("Updated app.js")

# 2. Update styles.css
with open('styles.css', 'r') as f:
    styles = f.read()

if '.hamburger' not in styles:
    hamburger_css = """
/* Hamburger Menu */
.hamburger {
    display: none;
    flex-direction: column;
    gap: 6px;
    cursor: pointer;
    z-index: 1000;
}
.hamburger span {
    width: 30px;
    height: 3px;
    background-color: white;
    transition: all 0.3s ease;
    border-radius: 3px;
}
.hamburger.active span:nth-child(1) {
    transform: rotate(45deg) translate(6px, 6px);
}
.hamburger.active span:nth-child(2) {
    opacity: 0;
}
.hamburger.active span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -6px);
}
"""
    
    mobile_css = """
    .hamburger {
        display: flex;
    }
    .nav-links {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(15, 15, 20, 0.98);
        flex-direction: column;
        padding: 2rem;
        gap: 1.5rem;
        text-align: center;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .nav-links.active {
        display: flex;
    }
"""

    styles = styles.replace(".nav-links {\n    display: flex;", hamburger_css + "\n.nav-links {\n    display: flex;")
    
    # Use regex to replace the media query nav-links
    styles = re.sub(r'@media \(max-width: 768px\) {\n\s*\.nav-links {\n\s*display: none;\n\s*}', '@media (max-width: 768px) {' + mobile_css, styles)
    
    with open('styles.css', 'w') as f:
        f.write(styles)
    print("Updated styles.css")

# 3. Update HTML files
html_files = glob.glob('**/*.html', recursive=True)
count = 0
for file in html_files:
    if 'node_modules' in file: continue
    
    with open(file, 'r') as f:
        content = f.read()
        
    if '<nav class="nav-links">' in content and 'class="hamburger"' not in content:
        content = content.replace('<nav class="nav-links">', '<div class="hamburger"><span></span><span></span><span></span></div>\\n            <nav class="nav-links">')
        with open(file, 'w') as f:
            f.write(content)
            count += 1

print(f"Updated {count} HTML files.")
