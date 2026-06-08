import glob, os
root = r"c:\Users\admin\.cursor\n8n-youtube-automation\workflows"
for path in glob.glob(os.path.join(root, "*.json")):
    text = open(path, encoding="utf-8").read()
    if not text.strip():
        print("EMPTY:", path)
        continue
    new = text.replace("$env.", "$vars.")
    if new != text:
        open(path, "w", encoding="utf-8").write(new)
        print("Fixed:", os.path.basename(path))
