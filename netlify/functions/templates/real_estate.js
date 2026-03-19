module.exports = {
  "name": "Ad Creator - Built-in Real Estate Dynamic 6-Scene",
  "format": "16:9",
  "frame_rate": 30,
  "duration": 30,
  "elements": [
    {
      "type": "audio",
      "source": "https://creatomate-static.s3.amazonaws.com/demo/music1.wav",
      "audio_fade_out": 2
    },
    {
      "name": "Voiceover",
      "type": "text-to-speech",
      "text": "Welcome to our beautiful new properties. We are here to help you find your dream home.",
      "voice": "en-US-JennyNeural"
    },
    {
      "type": "composition",
      "elements": [
        {
          "name": "Scene-1",
          "type": "composition",
          "track": 1,
          "duration": 6,
          "elements": [
            {
              "name": "Video-1",
              "type": "video",
              "duration": "100%",
              "source": "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4",
              "animations": [
                { "type": "pan", "start": "0%", "end": "100%", "scale": "110%" }
              ]
            },
            {
              "name": "Kinetic-Sweep-1",
              "type": "rectangle",
              "fill_color": "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
              "width": "50%",
              "blend_mode": "overlay",
              "animations": [
                { "type": "pan", "start": "-200%", "end": "200%", "duration": 5 }
              ]
            },
            {
              "name": "Brand-Name",
              "type": "text",
              "text": "CTV Boss Real Estate",
              "font_family": "Montserrat",
              "font_weight": "800",
              "font_size": "6vmax",
              "fill_color": "#ffffff",
              "shadow_color": "rgba(0,0,0,0.8)",
              "y": "80%",
              "enter": [{ "type": "slide-up" }],
              "exit": [{ "type": "fade-out" }]
            }
          ]
        },
        {
          "name": "Scene-2",
          "type": "composition",
          "track": 1,
          "duration": 6,
          "transition": { "type": "wipe", "direction": "right", "duration": 1.0 },
          "elements": [
            {
              "name": "Video-2",
              "type": "video",
              "duration": "100%",
              "source": "https://creatomate-static.s3.amazonaws.com/demo/video2.mp4",
              "animations": [
                { "type": "pan", "start": "0%", "end": "100%", "scale": "115%" }
              ]
            },
            {
              "name": "Kinetic-Sweep-2",
              "type": "rectangle",
              "fill_color": "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
              "width": "50%",
              "blend_mode": "overlay",
              "animations": [
                { "type": "pan", "start": "200%", "end": "-200%", "duration": 5 }
              ]
            }
          ]
        },
        {
          "name": "Scene-3",
          "type": "composition",
          "track": 1,
          "duration": 6,
          "transition": { "type": "cross-zoom", "duration": 1.0 },
          "elements": [
            {
              "name": "Video-3",
              "type": "video",
              "duration": "100%",
              "source": "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4",
              "animations": [
                { "type": "pan", "start": "0%", "end": "100%", "scale": "115%" }
              ]
            },
            {
              "name": "Kinetic-Sweep-3",
              "type": "rectangle",
              "fill_color": "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
              "width": "50%",
              "blend_mode": "overlay",
              "animations": [
                { "type": "pan", "start": "-200%", "end": "200%", "duration": 5 }
              ]
            }
          ]
        },
        {
          "name": "Scene-4",
          "type": "composition",
          "track": 1,
          "duration": 6,
          "transition": { "type": "fade", "duration": 1.0 },
          "elements": [
            {
              "name": "Video-4",
              "type": "video",
              "duration": "100%",
              "animations": [
                 { "type": "pan", "start": "0%", "end": "100%", "scale": "110%" }
              ],
              "source": "https://creatomate-static.s3.amazonaws.com/demo/video2.mp4"
            },
            {
              "name": "Kinetic-Sweep-4",
              "type": "rectangle",
              "fill_color": "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
              "width": "50%",
              "blend_mode": "overlay",
              "animations": [
                { "type": "pan", "start": "200%", "end": "-200%", "duration": 5 }
              ]
            }
          ]
        },
        {
          "name": "Scene-5",
          "type": "composition",
          "track": 1,
          "duration": 6,
          "transition": { "type": "wipe", "direction": "left", "duration": 1.0 },
          "elements": [
            {
              "name": "Video-5",
              "type": "video",
              "duration": "100%",
              "animations": [
                 { "type": "pan", "start": "0%", "end": "100%", "scale": "110%" }
              ],
              "source": "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4"
            },
            {
              "name": "Kinetic-Sweep-5",
              "type": "rectangle",
              "fill_color": "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
              "width": "50%",
              "blend_mode": "overlay",
              "animations": [
                { "type": "pan", "start": "-200%", "end": "200%", "duration": 5 }
              ]
            }
          ]
        },
        {
          "name": "Scene-6",
          "type": "composition",
          "track": 1,
          "duration": 5,
          "transition": { "type": "fade", "duration": 1.0 },
          "elements": [
            {
              "name": "Video-6",
              "type": "video",
              "duration": "100%",
              "animations": [
                 { "type": "pan", "start": "0%", "end": "100%", "scale": "115%" }
              ],
              "source": "https://creatomate-static.s3.amazonaws.com/demo/video2.mp4"
            },
            {
              "name": "Kinetic-Sweep-6",
              "type": "rectangle",
              "fill_color": "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
              "width": "50%",
              "blend_mode": "overlay",
              "animations": [
                { "type": "pan", "start": "200%", "end": "-200%", "duration": 5 }
              ]
            },
            {
              "name": "Subtext",
              "type": "text",
              "text": "Call us today to schedule a viewing!",
              "font_family": "Montserrat",
              "font_weight": "900",
              "font_size": "5vmax",
              "fill_color": "#ffffff",
              "background_color": "#dc143c",
              "background_x_padding": "5%",
              "background_y_padding": "3%",
              "y": "45%",
              "enter": [{ "type": "scale-up" }]
            },
            {
              "name": "Phone-Number",
              "type": "text",
              "text": "555-123-4567",
              "font_family": "Montserrat",
              "font_weight": "700",
              "font_size": "4vmax",
              "fill_color": "#ffffff",
              "shadow_color": "rgba(0,0,0,0.8)",
              "y": "65%",
              "enter": [{ "type": "slide-up" }]
            },
            {
              "name": "Email",
              "type": "text",
              "text": "info@ctvboss.com",
              "font_family": "Montserrat",
              "font_weight": "600",
              "font_size": "3vmax",
              "fill_color": "#ffffff",
              "shadow_color": "rgba(0,0,0,0.8)",
              "y": "75%",
              "enter": [{ "type": "slide-up" }]
            }
          ]
        }
      ]
    }
  ]
};
