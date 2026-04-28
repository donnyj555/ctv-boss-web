import re

with open('index.html', 'r') as f:
    html = f.read()

# Extract Unskippable section
unskippable_match = re.search(r'(        <!-- Unskippable Magazine Ad Section -->.*?</section>\n)', html, re.DOTALL)
if not unskippable_match:
    print("Could not find Unskippable section.")
    exit(1)
unskippable_html = unskippable_match.group(1)

# Remove Unskippable section from its original place
html = html.replace(unskippable_html, '')

# Modify Unskippable section to become the new Hero
# 1. Add REALTORS tag
realtors_tag = '''
                    <!-- Angled REALTORS Stamp -->
                    <div style="position: absolute; top: 10px; left: -30px; transform: rotate(-25deg); color: var(--accent-red); font-size: 2.5rem; font-weight: 900; letter-spacing: 4px; text-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 10; padding: 1rem; border: 3px solid var(--accent-red); background: rgba(20,20,25,0.9); border-radius: 8px;">
                        REALTORS
                    </div>'''

# We inject after 'position: relative;">\n                    <div style="max-width: 800px;'
unskippable_html = unskippable_html.replace(
    'position: relative;">\n                    <div style="max-width: 800px;',
    f'position: relative;">{realtors_tag}\n                    <div style="max-width: 800px;'
)

# 2. Add Purple Badge (cut it from old hero and add here)
badge_tag = '<span class="badge fade-in-up" style="margin-bottom: 1rem;">AI ad creation + CTV farming for real estate</span>\n                        '
unskippable_html = unskippable_html.replace(
    '<h2 style="font-size: 2.5rem; font-weight: 800;',
    badge_tag + '<h1 style="font-size: 3.5rem; font-weight: 800;' # Upgrade to h1
)
unskippable_html = unskippable_html.replace('biggest screen in the home</h2>', 'biggest screen in the home</h1>')

# Ensure section has correct padding for hero
unskippable_html = unskippable_html.replace('style="padding: 4rem 0;"', 'style="padding: 5rem 0;" class="hero"')
unskippable_html = unskippable_html.replace('<!-- Unskippable Magazine Ad Section -->', '<!-- Vision Hero Section -->')

# Now modify the old hero
old_hero_match = re.search(r'(        <!-- Hero Section -->.*?</section>\n)', html, re.DOTALL)
old_hero_html = old_hero_match.group(1)

# Remove badge from old hero
old_hero_modified = re.sub(r'\s*<span class="badge fade-in-up">AI ad creation \+ CTV farming for real estate</span>\n', '\n', old_hero_html)
# Downgrade old hero h1 to h2
old_hero_modified = old_hero_modified.replace('<h1 class="hero-title', '<h2 class="hero-title" style="font-size: 2.5rem;"')
old_hero_modified = old_hero_modified.replace('</h1>', '</h2>')
old_hero_modified = old_hero_modified.replace('<!-- Hero Section -->', '<!-- Product Creation Section -->')

html = html.replace(old_hero_html, unskippable_html + '\n' + old_hero_modified)

with open('index.html', 'w') as f:
    f.write(html)
print("Done.")
