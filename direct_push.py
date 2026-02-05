#!/usr/bin/env python3
"""
Direct git push script - bypasses terminal issues
"""
import subprocess
import os

os.chdir('/Users/prince/Documents/augment-projects/major project')

# Step 1: Remove empty directories
print("Step 1: Removing empty directories...")
for d in ['backend/data', 'backend/models']:
    try:
        if os.path.exists(d) and not os.listdir(d):
            os.rmdir(d)
            print(f"  Removed: {d}")
    except:
        pass

# Step 2: Git add
print("\nStep 2: Git add...")
subprocess.call(['git', 'add', '-A'])

# Step 3: Git commit
print("\nStep 3: Git commit...")
msg = "Clean up project and add Risk Analysis functionality"
subprocess.call(['git', 'commit', '-m', msg])

# Step 4: Git push
print("\nStep 4: Git push...")
subprocess.call(['git', 'push', 'origin', 'main'])

print("\n✅ Done!")

