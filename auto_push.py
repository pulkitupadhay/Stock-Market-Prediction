#!/usr/bin/env python3
import subprocess
import os
import sys
import shutil

# Change to project directory
project_dir = '/Users/prince/Documents/augment-projects/major project'
os.chdir(project_dir)

# Output file
output_file = '/tmp/auto_push_output.txt'
log = open(output_file, 'w')

def write(msg):
    print(msg)
    log.write(msg + '\n')
    log.flush()

write("=" * 60)
write("AUTOMATED GIT PUSH SCRIPT")
write("=" * 60)

# Remove empty directories
write("\n[1/5] Removing empty directories...")
for dir_path in ['backend/data', 'backend/models']:
    full_path = os.path.join(project_dir, dir_path)
    if os.path.exists(full_path) and os.path.isdir(full_path):
        try:
            if not os.listdir(full_path):  # Check if empty
                os.rmdir(full_path)
                write(f"  ✓ Removed: {dir_path}")
            else:
                write(f"  ⊘ Skipped (not empty): {dir_path}")
        except Exception as e:
            write(f"  ✗ Error removing {dir_path}: {e}")

# Git add
write("\n[2/5] Adding all changes to git...")
result = subprocess.run(['git', 'add', '-A'], capture_output=True, text=True)
if result.returncode == 0:
    write("  ✓ Files added successfully")
else:
    write(f"  ✗ Error: {result.stderr}")
    log.close()
    sys.exit(1)

# Git status
write("\n[3/5] Checking git status...")
result = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True)
write(result.stdout)

# Git commit
write("\n[4/5] Committing changes...")
commit_message = """🧹 Clean up project and add Risk Analysis

- Remove unnecessary temporary scripts
- Keep only essential project files
- Add Risk Analysis functionality with comprehensive metrics
- Add /api/risk/:symbol endpoint
- Implement volatility, drawdown, VaR, Sharpe ratio calculations
- Create Risk Analysis dashboard with professional UI
- Add color-coded risk levels and recommendations"""

result = subprocess.run(['git', 'commit', '-m', commit_message], capture_output=True, text=True)
if result.returncode == 0:
    write("  ✓ Commit successful")
    write(result.stdout)
else:
    if "nothing to commit" in result.stdout:
        write("  ⊘ Nothing to commit, working tree clean")
    else:
        write(f"  ✗ Error: {result.stderr}")

# Git push
write("\n[5/5] Pushing to GitHub...")
result = subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True, text=True)
if result.returncode == 0:
    write("  ✓ Push successful!")
    write(result.stdout)
    write(result.stderr)
else:
    write(f"  ✗ Error: {result.stderr}")
    log.close()
    sys.exit(1)

write("\n" + "=" * 60)
write("✅ ALL DONE!")
write("=" * 60)
write("\nYour changes are now live at:")
write("https://github.com/pulkitupadhay/Stock-Market-Prediction")
write("=" * 60)

log.close()
write(f"\n📄 Full log saved to: {output_file}")

