import subprocess
import sys

vid_path = sys.argv[1]
result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", vid_path], capture_output=True, text=True)
print(result.stdout.strip())
