import moviepy as mp
import sys

vid_path = sys.argv[1]
try:
    vid = mp.VideoFileClip(vid_path)
    print(f"File: {vid_path}")
    print(f"Duration: {vid.duration}s")
    if vid.audio:
        print(f"Audio duration: {vid.audio.duration}s")
    else:
        print("No audio channel")
    vid.close()
except Exception as e:
    print(f"Error reading {vid_path}: {e}")
