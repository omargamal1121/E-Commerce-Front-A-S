import os
import re

pages_dir = r"d:\projects\E-Commerce\Front\last-update-1\admin\src\pages"
subdirs = ["categories", "collections", "dashboard", "discounts", "orders", "products", "settings", "users"]

for subdir in subdirs:
    target_path = os.path.join(pages_dir, subdir)
    if not os.path.exists(target_path):
        continue
        
    for filename in os.listdir(target_path):
        if filename.endswith(".jsx") or filename.endswith(".js"):
            file_path = os.path.join(target_path, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace relative imports that start with ../ but should start with ../../
            # Specifically looking for imports from App, services, components, etc.
            # We look for patterns like: import ... from "../App" or import ... from "../components/..."
            new_content = re.sub(r'(from\s+["\'])\.\./(App|assets|services|components|App\.jsx|App\.js)', r'\1../../\2', content)
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {file_path}")
