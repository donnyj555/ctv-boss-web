const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { script = '', cta = '', images = [], voice = 'rachel' } = data;

    if (!process.env.CREATOMATE_API_KEY || process.env.CREATOMATE_API_KEY === "PASTE_YOUR_CREATOMATE_KEY_HERE") {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Creatomate API key is missing or invalid in .env file." })
        };
    }

    if (!script) {
        return { statusCode: 400, body: JSON.stringify({ error: "Script text is required" }) };
    }

    console.log("Sending render request to Creatomate...");
    
    // Use the user's explicit custom template ID
    const templateId = "b573fbe0-e1f2-4edc-a7fb-f358ee95bb0a";
    
    // Fallback images if the user hasn't successfully scraped/uploaded any
    const defaultImages = [
      "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4",
      "https://creatomate-static.s3.amazonaws.com/demo/video2.mp4",
      "https://creatomate-static.s3.amazonaws.com/demo/video1.mp4",
      "https://creatomate-static.s3.amazonaws.com/demo/video2.mp4"
    ];
    
    // Safely assign the user's extracted images (or fallback to defaults)
    const img1 = images[0] || defaultImages[0];
    const img2 = images[1] || defaultImages[1];
    const img3 = images[2] || defaultImages[2];
    const img4 = images[3] || defaultImages[3];

    // Build the payload by matching the template's required modification keys
    const creatomatePayload = {
      template_id: templateId,
      modifications: {
        // Voiceover (The template likely needs an Audio element we can modify, assuming 'Voiceover.text' based on standard practices, but injecting the AI script and Call to Action into the visual text fields first)
        "Description.text": script,
        "Subtext.text": cta || "Contact Us Today!",
        // Connect the scraped brand assets
        "Video-1.source": img1,
        "Video-2.source": img2,
        "Video-3.source": img3,
        "Video-4.source": img4,
        "Picture.source": img1, // Assuming Picture is the logo placement based on the screenshot context
        "Brand-Name.text": "CTV Boss Client", // Placeholder for actual business name feature later
        "Name.text": "" // Clear placeholder
      }
    };

    const response = await fetch('https://api.creatomate.com/v1/renders', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source: creatomatePayload })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Creatomate API Error: ${response.status} ${errText}`);
    }

    const renderData = await response.json();
    
    // Creatomate returns a render array. We need the ID and status.
    if (Array.isArray(renderData) && renderData.length > 0) {
        const renderId = renderData[0].id;
        const status = renderData[0].status;
        const url = renderData[0].url;
         
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({
                render_id: renderId,
                status: status,
                url: url,
                message: "Render started. Production apps should poll URL with this render_id until status='succeeded'."
            })
        };
    } else {
        throw new Error("Unexpected API response from Creatomate");
    }

  } catch (error) {
    console.error("Video Generation Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate video via Cloud API. " + error.message }),
    };
  }
};
