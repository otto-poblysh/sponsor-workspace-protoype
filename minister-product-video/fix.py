import os
import re
import glob

files = glob.glob('compositions/beat-*.html') + ['index.html']

fonts_css = """
        @font-face { font-family: 'Geist Sans'; src: url('capture/assets/fonts/Geist-Variable.woff2'); }
        @font-face { font-family: 'Geist Mono'; src: url('capture/assets/fonts/GeistMono-Variable.woff2'); }
"""

for fpath in files:
    if not os.path.isfile(fpath): continue
    with open(fpath, 'r') as f:
        content = f.read()

    # Add fonts if not already there
    if "@font-face" not in content and "<style>" in content:
        content = content.replace("<style>", "<style>\n" + fonts_css)

    # Fix gsap left/top
    content = content.replace("{ left:", "{ x:")
    content = content.replace(", left:", ", x:")
    content = content.replace("{ top:", "{ y:")
    content = content.replace(", top:", ", y:")

    # Remove inline left/top for cursor
    content = re.sub(r'style="left:\s*\d+px;\s*top:\s*\d+px;', 'style="', content)
    content = content.replace('style=" opacity: 0"', 'style="opacity: 0"')

    with open(fpath, 'w') as f:
        f.write(content)
