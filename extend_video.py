import os
import moviepy as mp

def extend_video(input_path, target_duration=30.0):
    try:
        # Load the original video
        print(f"Loading video: {input_path}")
        video = mp.VideoFileClip(input_path)
        original_duration = video.duration
        
        print(f"Original duration: {original_duration} seconds")
        
        # Calculate how much time we need to add
        time_to_add = target_duration - original_duration
        
        if time_to_add <= 0:
            print("Video is already 30 seconds or longer.")
            return

        print(f"Adding {time_to_add} seconds of freeze frame...")

        # Get the last frame of the video
        last_frame = video.get_frame(original_duration - 0.05) # Just before the very end to be safe

        # Create a new clip from just this frame, with the duration we need to reach 30s
        freeze_clip = mp.ImageClip(last_frame).with_duration(time_to_add)

        # Ensure the freeze clip has the same fps
        freeze_clip.fps = video.fps

        # Concatenate the original video with the freeze frame
        final_video = mp.concatenate_videoclips([video, freeze_clip])
        
        # Handle the audio (by setting the start audio, the rest will be silent)
        final_video = final_video.with_audio(video.audio)
        
        # Enforce exactly 30.0 seconds to prevent frame rounding overage
        final_video = final_video.subclipped(0, 30.0)

        # Create output path
        output_filename = "extended_30s_" + os.path.basename(input_path)
        
        print(f"Writing to: {output_filename}")
        
        # Write the result to a file
        final_video.write_videofile(
            output_filename, 
            fps=video.fps,
            codec="libx264", 
            audio_codec="aac",
            preset="ultrafast" 
        )
        
        # Close the clips to free memory
        video.close()
        freeze_clip.close()
        final_video.close()
        
        print(f"Success! Video extended to {target_duration} seconds.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    extend_video("Smart Way America Realty -30 second adv.mp4")
