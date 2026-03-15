import os
import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load API keys from .env file
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CREATOMATE_API_KEY = os.getenv("CREATOMATE_API_KEY")

app = Flask(__name__)
# Enable CORS so our frontend can make requests to this backend
CORS(app)

@app.route('/api/generate-script', methods=['POST'])
def generate_script():
    """
    Takes voice direction and creates a 60 word script using OpenAI.
    """
    if not OPENAI_API_KEY or OPENAI_API_KEY == "PASTE_YOUR_OPENAI_KEY_HERE":
        return jsonify({"error": "OpenAI API key is missing or invalid in .env file."}), 500

    data = request.json
    topic = data.get('topic', 'promotional')
    voice_direction = data.get('voiceDirection', 'Professional and trustworthy')
    cta = data.get('cta', 'Visit us today!')

    prompt = f"""
    Write a 60-word video commercial script.
    Topic/Theme: {topic}
    Voice Direction/Tone: {voice_direction}
    Call to Action to include at the end: {cta}
    
    Make it punchy, engaging, and suitable for a 30-second broadcast. Do not include stage directions or formatting like [Music starts], just the spoken words.
    """

    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }
        
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are an expert commercial scriptwriter."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 150
        }
        
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        script_text = result['choices'][0]['message']['content'].strip()
        
        return jsonify({"script": script_text})
        
    except Exception as e:
        print(f"Error generating script: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate-video', methods=['POST'])
def generate_video():
    """
    Takes the script, synthesizes voice via OpenAI, and sends everything to Creatomate to render the MP4.
    """
    if not CREATOMATE_API_KEY or CREATOMATE_API_KEY == "PASTE_YOUR_CREATOMATE_KEY_HERE":
        return jsonify({"error": "Creatomate API key is missing or invalid in .env file."}), 500

    data = request.json
    script = data.get('script', '')
    template = data.get('template', 'modern')
    
    if not script:
         return jsonify({"error": "Script text is required"}), 400

    try:
        # Step 1: Synthesize Voiceover (OpenAI TTS)
        # Note: For this MVP, Creatomate can actually handle TTS directly if configured, 
        # but to keep it simple, we generate audio and pass the URL, or we use Creatomate's built in TTS.
        # We will use Creatomate's built in TTS for simplicity and speed here.

        print("Sending render request to Creatomate...")
        
        # Creatomate JSON structure for a dynamic video.
        # This is a generic blueprint that creates a simple slideshow with a voiceover and text overlay.
        creatomate_payload = {
            "output_format": "mp4",
            "frame_rate": 30,
            "width": 1920,
            "height": 1080,
            "elements": [
                {
                    "type": "video",
                    "source": "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4", # Placeholder background
                    "duration": 15
                },
                {
                    "type": "text",
                    "text": script,
                    "x": "50%",
                    "y": "80%",
                    "width": "80%",
                    "height": "20%",
                    "font_family": "Inter",
                    "font_weight": "700",
                    "fill_color": "#ffffff",
                    "shadow_color": "#000000",
                    "shadow_blur": "5 vmin"
                },
                {
                    "type": "audio",
                    # Creatomate supports passing text directly to their voice provider
                    "provider": "elevenlabs",
                    "voice": "rachel", # Default voice
                    "text": script
                }
            ]
        }

        # Send to Creatomate
        headers = {
            'Authorization': f'Bearer {CREATOMATE_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            'https://api.creatomate.com/v1/renders',
            headers=headers,
            json=creatomate_payload
        )
        response.raise_for_status()
        
        render_data = response.json()
        
        # Creatomate returns a render array. We need the ID.
        if isinstance(render_data, list) and len(render_data) > 0:
             render_id = render_data[0].get('id')
             status = render_data[0].get('status')
             url = render_data[0].get('url')
             
             return jsonify({
                 "render_id": render_id,
                 "status": status,
                 "url": url,
                 "message": "Render started. In a production app, we would poll this ID."
             })
        else:
             return jsonify({"error": "Unexpected API response from Creatomate", "data": render_data}), 500

    except Exception as e:
        print(f"Error generating video: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting CTV Boss Backend API on port 5001...")
    # Run on a different port than the frontend (8000)
    app.run(port=5001, debug=True)
