import moviepy as mp
import math

try:
    print("Loading video...")
    vid_path = "/Users/donjordan/Desktop/DON/SWAR with Music V3.mp4"
    vid = mp.VideoFileClip(vid_path)
    
    # Original duration is exactly 28.69. We want 30.0 total
    time_to_add = 30.0 - vid.duration
    
    print(f"Original duration: {vid.duration}s. Adding: {time_to_add}s to meet 30.0s")

    # Get the very last frame exactly at 28.69 (just short of it to avoid out of bounds)
    last_frame = vid.get_frame(vid.duration - 0.05)
    
    # Create the freeze frame clip
    freeze_clip = mp.ImageClip(last_frame).with_duration(time_to_add)
    freeze_clip.fps = vid.fps
    
    # Concatenate without cutting
    final_video = mp.concatenate_videoclips([vid, freeze_clip])
    
    # Enforce exact length explicitly just to be certain
    final_video = final_video.subclip(0, 30.0)
    
    print("Writing result...")
    output_path = "/Users/donjordan/Desktop/DON/SWAR with Music V3 - FullAudio - 30s.mp4"
    final_video.write_videofile(
        output_path,
        fps=vid.fps,
        codec="libx264",
        audio_codec="aac",
        preset="ultrafast",
        logger=None # Suppress noise
    )
    
    vid.close()
    freeze_clip.close()
    final_video.close()
    
    print("MoviePy rendering completed successfully.")
    
except Exception as e:
    print(f"Error: {e}")
