const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { businessName = '', script = '', cta = '', images = [], voice = 'rachel', template = 'real_estate', duration = '30' } = data;

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
    
    // Map industry selections + duration to specific Creatomate template UUIDs
    // The keys are structured as: {templateName}_{duration}
    const templateMap = {
      'real_estate_30': '687822e4-5b8c-421e-a073-a23995ac2b9c',
      'real_estate_15': '687822e4-5b8c-421e-a073-a23995ac2b9c', // Pending user 15s template ID
      'restaurant_30': '11a7819a-1c77-4741-a39e-b8f3e26959ec', 
      'restaurant_15': '11a7819a-1c77-4741-a39e-b8f3e26959ec', // Pending user 15s template ID
      'home_services_30': 'd003b551-8628-42f8-a9ee-ea94e608208d',
      'home_services_15': 'd003b551-8628-42f8-a9ee-ea94e608208d' // Pending user 15s template ID
    };
    
    // Construct the lookup key, e.g. "real_estate_30"
    const mapKey = `${template}_${duration}`;
    const templateId = templateMap[mapKey] || templateMap['real_estate_30'];
    
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
        "Description": script,
        "Subtext": cta || "Contact Us Today!",
        "Video-1": img1,
        "Video-2": img2,
        "Video-3": img3,
        "Video-4": img4,
        "Picture": img1,
        "Brand-Name": businessName || "CTV Boss Client",
        "Phone-Number": "555-123-4567",
        "Email": "info@ctvbossclient.com",
        "Name": "" // Clear placeholder
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
        let status = renderData[0].status;
        let url = renderData[0].url;
        
        // Poll Creatomate until the video finishes rendering
        let attempts = 0;
        const maxAttempts = 30; // Max 60 seconds (2s * 30)
        
        while (status !== 'succeeded' && status !== 'failed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds
            
            const pollRes = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}`
                }
            });
            
            if (pollRes.ok) {
                const pollData = await pollRes.json();
                status = pollData.status;
                
                // Force .mp4 extension on the returned URL to prevent frontend player failure 
                // if Creatomate tries to return the thumbnail preview URL string.
                if (pollData.url) {
                    url = pollData.url.replace('.png', '.mp4').replace('.jpg', '.mp4');
                }
            }
            attempts++;
        }
        
        if (status === 'failed') {
             throw new Error("Creatomate render failed.");
        }
         
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
                message: "Render complete."
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
