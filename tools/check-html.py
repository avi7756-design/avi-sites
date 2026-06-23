"""
check-html.py - בודק שלמות של קבצי HTML בריפו avi-sites.

הרצה ידנית:
    python tools/check-html.py

מוודא ש:
- כל קובץ HTML עם <html> סגור עם </html>
- כל קובץ עם <body> סגור עם </body>
- כל <script> סגור עם </script>
- כל <textarea> סגור עם </textarea>
- כל <style> סגור עם </style>
- אין onclick שקורא לפונקציה לא מוגדרת

יוצא עם exit code 0 אם הכל תקין, 1 אם יש בעיה.
"""

import os
import re
import sys
import glob

sys.stdout.reconfigure(encoding='utf-8')

BUILTINS = {
    "history", "window", "alert", "confirm", "print", "location",
    "console", "Math", "Number", "String", "Array", "Object", "Date",
    "JSON", "parseInt", "parseFloat", "this", "document", "event",
    "return", "setTimeout", "setInterval", "Promise", "fetch",
}


def check_file(path: str) -> list:
    """בודק קובץ HTML יחיד, מחזיר רשימת בעיות (ריקה אם תקין)."""
    s = open(path, encoding="utf-8", errors="replace").read()
    issues = []

    has_html_open = bool(re.search(r"<html\b", s, re.I))
    has_html_close = "</html>" in s.lower()
    has_body_open = bool(re.search(r"<body\b", s, re.I))
    has_body_close = "</body>" in s.lower()

    if has_html_open and not has_html_close:
        issues.append("missing </html>")
    if has_body_open and not has_body_close:
        issues.append("missing </body>")

    for tag in ("script", "textarea", "style"):
        opens = len(re.findall(rf"<{tag}\b[^>]*>", s, re.I))
        closes = len(re.findall(rf"</{tag}>", s, re.I))
        if opens > closes:
            issues.append(f"missing </{tag}> ({opens} open, {closes} closed)")

    fns_called = set()
    for attr in ("onclick", "onload", "onchange", "onsubmit", "oninput"):
        fns_called |= set(re.findall(
            rf'{attr}="([a-zA-Z_][a-zA-Z0-9_]*)\s*\(', s))

    fns_defined = set(re.findall(
        r'function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(', s))
    fns_defined |= set(re.findall(
        r'(?:var|let|const)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:function|\([^)]*\)\s*=>)',
        s,
    ))
    fns_defined |= set(re.findall(
        r'window\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=', s))

    missing_fns = (fns_called - fns_defined) - BUILTINS
    if missing_fns:
        issues.append(f"undefined JS functions: {','.join(sorted(missing_fns))}")

    return issues


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    files = sorted(glob.glob("*.html"))
    print(f"Scanning {len(files)} HTML files in {root}\n")

    broken = []
    for f in files:
        issues = check_file(f)
        if issues:
            broken.append((f, issues))

    if not broken:
        print(f"OK - all {len(files)} files are well-formed")
        return 0

    print(f"FAIL - {len(broken)}/{len(files)} files have issues:\n")
    for f, iss in broken:
        print(f"  [{f}]")
        for i in iss:
            print(f"     - {i}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
